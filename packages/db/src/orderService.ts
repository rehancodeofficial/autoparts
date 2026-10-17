/**
 * Order lifecycle: creation, payment confirmation, status transitions,
 * inventory movement, refunds and the admin read models.
 *
 * Rules enforced here rather than in route handlers:
 *  - Amounts are always recomputed by the pricing engine; the client's numbers
 *    are never stored.
 *  - An order becomes PAID exactly once. Repeated callbacks, webhook retries
 *    and double-submits are absorbed.
 *  - Stock is committed when payment is confirmed and released when the order
 *    is cancelled, rejected, returned or refunded — never twice either way.
 *  - Line items and amounts of a paid order are immutable.
 *  - Every change writes an "OrderEvent" row, so the admin history is complete.
 */
import crypto from 'crypto';
import type { PoolClient } from 'pg';
import { query, runTransaction } from './db';
import { buildQuote, quoteToClient, PricingError, CURRENCY } from './pricingService';
import type { PaymentVerification } from './paymentProviders';

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'PAID'
  | 'APPROVED'
  | 'REJECTED'
  | 'PROCESSING'
  | 'DISPATCHED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'PAYMENT_FAILED'
  | 'EXPIRED'
  | 'RETURN_REQUESTED'
  | 'RETURNED'
  | 'REFUNDED';

export const ORDER_STATUSES: OrderStatus[] = [
  'PENDING_PAYMENT', 'PAID', 'APPROVED', 'REJECTED', 'PROCESSING', 'DISPATCHED',
  'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED', 'EXPIRED',
  'RETURN_REQUESTED', 'RETURNED', 'REFUNDED',
];

/** Allowed status moves. Anything absent here is rejected with a 409. */
export const ALLOWED_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING_PAYMENT: ['PAID', 'PAYMENT_FAILED', 'CANCELLED', 'EXPIRED'],
  PAID: ['APPROVED', 'REJECTED', 'PROCESSING', 'CANCELLED', 'REFUNDED'],
  APPROVED: ['PROCESSING', 'CANCELLED', 'REFUNDED'],
  PROCESSING: ['DISPATCHED', 'CANCELLED', 'REFUNDED'],
  DISPATCHED: ['SHIPPED', 'CANCELLED'],
  SHIPPED: ['DELIVERED', 'RETURN_REQUESTED'],
  DELIVERED: ['RETURN_REQUESTED', 'REFUNDED'],
  REJECTED: ['REFUNDED', 'CANCELLED'],
  CANCELLED: ['REFUNDED'],
  PAYMENT_FAILED: ['PENDING_PAYMENT', 'CANCELLED'],
  EXPIRED: ['CANCELLED'],
  RETURN_REQUESTED: ['RETURNED', 'SHIPPED'],
  RETURNED: ['REFUNDED'],
  REFUNDED: [],
};

/** Statuses after which the goods are no longer owed to the customer. */
const STOCK_RELEASING_STATUSES: OrderStatus[] = [
  'CANCELLED', 'REJECTED', 'RETURNED', 'REFUNDED', 'EXPIRED',
];

/** Customer-facing delivery label derived from the order status. */
const DELIVERY_STATUS_FOR: Partial<Record<OrderStatus, string>> = {
  PENDING_PAYMENT: 'Awaiting Payment',
  PAID: 'Processing',
  APPROVED: 'Processing',
  PROCESSING: 'Packed',
  DISPATCHED: 'Dispatched',
  SHIPPED: 'Shipped',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  REJECTED: 'Cancelled',
  REFUNDED: 'Refunded',
  RETURNED: 'Returned',
  RETURN_REQUESTED: 'Return Requested',
  PAYMENT_FAILED: 'Payment Failed',
  EXPIRED: 'Expired',
};

export class OrderError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, code = 'ORDER_ERROR', statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

export interface Actor {
  id?: string | null;
  name?: string | null;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function cleanString(value: any, max: number): string {
  return String(value ?? '').trim().slice(0, max);
}

export interface CustomerDetails {
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  address: string;
  city: string;
  district: string | null;
  postalCode: string | null;
  country: string;
  addressNotes: string | null;
}

/**
 * Validates the checkout form server-side. The browser's own validation is a
 * convenience; this is the gate.
 */
export function validateCustomerDetails(body: any): CustomerDetails {
  const customerName = cleanString(body.customerName, 255);
  if (customerName.length < 2) {
    throw new OrderError('Please enter the full name for delivery.', 'INVALID_NAME');
  }

  const customerEmail = cleanString(body.customerEmail, 255).toLowerCase();
  if (!EMAIL_RE.test(customerEmail)) {
    throw new OrderError('Please enter a valid email address.', 'INVALID_EMAIL');
  }

  const rawPhone = cleanString(body.customerPhone, 50);
  const digits = rawPhone.replace(/[\s\-()]/g, '');
  // Saudi mobile: +9665XXXXXXXX, 009665XXXXXXXX, 05XXXXXXXX or 5XXXXXXXX.
  if (!/^(\+9665\d{8}|009665\d{8}|9665\d{8}|05\d{8}|5\d{8})$/.test(digits)) {
    throw new OrderError(
      'Please enter a valid Saudi mobile number (for example 05XXXXXXXX).',
      'INVALID_PHONE'
    );
  }
  // Store one canonical form so admin search and per-customer discount limits
  // match regardless of how the shopper typed it.
  const national = digits.replace(/^(\+966|00966|966)/, '').replace(/^0/, '');
  const customerPhone = `+966${national}`;

  const address = cleanString(body.address, 500);
  if (address.length < 5) {
    throw new OrderError('Please enter the street address for delivery.', 'INVALID_ADDRESS');
  }

  const city = cleanString(body.city, 100);
  if (city.length < 2) {
    throw new OrderError('Please enter the delivery city.', 'INVALID_CITY');
  }

  const postalCode = cleanString(body.postalCode, 20) || null;
  if (postalCode && !/^\d{5}$/.test(postalCode)) {
    throw new OrderError('Saudi postal codes are 5 digits.', 'INVALID_POSTAL_CODE');
  }

  return {
    customerName,
    customerEmail,
    customerPhone,
    address,
    city,
    district: cleanString(body.district, 100) || null,
    postalCode,
    country: cleanString(body.country, 100) || 'Saudi Arabia',
    addressNotes: cleanString(body.addressNotes ?? body.notes, 1000) || null,
  };
}

// ---------------------------------------------------------------------------
// Order numbers and tokens
// ---------------------------------------------------------------------------

/**
 * Human-readable, sequential-ish and collision-resistant:
 *   KSA-YYMMDD-XXXXX  (XXXXX from a crypto random pool)
 * Uniqueness is guaranteed by the UNIQUE index; we retry on conflict.
 */
function generateOrderNumber(): string {
  const d = new Date();
  const stamp =
    String(d.getUTCFullYear()).slice(2) +
    String(d.getUTCMonth() + 1).padStart(2, '0') +
    String(d.getUTCDate()).padStart(2, '0');
  const rand = crypto.randomInt(0, 100000).toString().padStart(5, '0');
  return `KSA-${stamp}-${rand}`;
}

/** 32 bytes of entropy: unguessable, so it can act as the tracking credential. */
function generateTrackingToken(): string {
  return crypto.randomBytes(24).toString('base64url');
}

async function logEvent(
  client: PoolClient,
  orderId: string,
  eventType: string,
  opts: {
    fromValue?: string | null;
    toValue?: string | null;
    message?: string | null;
    isInternal?: boolean;
    actor?: Actor;
    metadata?: any;
  } = {}
): Promise<void> {
  await client.query(
    `INSERT INTO "OrderEvent"
       ("id","orderId","eventType","fromValue","toValue","message","isInternal",
        "actorId","actorName","metadata")
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
    [
      crypto.randomUUID(),
      orderId,
      eventType,
      opts.fromValue ?? null,
      opts.toValue ?? null,
      opts.message ?? null,
      opts.isInternal !== false,
      opts.actor?.id ?? null,
      opts.actor?.name ?? null,
      opts.metadata ? JSON.stringify(opts.metadata) : null,
    ]
  );
}

// ---------------------------------------------------------------------------
// Creation
// ---------------------------------------------------------------------------

export interface CreateOrderInput {
  items: any;
  discountCode?: string | null;
  paymentMethod?: string;
  userId?: string | null;
  idempotencyKey?: string | null;
  [key: string]: any;
}

/**
 * Creates an order in PENDING_PAYMENT. No stock is taken and no money has
 * moved yet — that happens only once the provider confirms the payment.
 */
export async function createPendingOrder(input: CreateOrderInput) {
  const customer = validateCustomerDetails(input);
  const paymentMethod = cleanString(input.paymentMethod, 50) || 'mada';
  const idempotencyKey = cleanString(input.idempotencyKey, 128) || null;

  // Replay protection: the same submit twice returns the first order.
  if (idempotencyKey) {
    const existing = await query(
      `SELECT "id" FROM "Order" WHERE "idempotencyKey" = $1 LIMIT 1`,
      [idempotencyKey]
    );
    if (existing.rows[0]) {
      const order = await getOrderById(existing.rows[0].id);
      return { order, reused: true };
    }
  }

  const created = await runTransaction(async client => {
    // requireStock: false — availability is enforced when stock is actually
    // committed at payment confirmation. Blocking here would let an abandoned
    // checkout hold inventory it never pays for.
    const quote = await buildQuote(input.items, {
      discountCode: input.discountCode,
      customer: { email: customer.customerEmail, phone: customer.customerPhone },
      client,
      requireStock: true,
    });

    if (input.discountCode && !quote.discount) {
      throw new OrderError(
        quote.discountError || 'That discount code is not valid.',
        'INVALID_DISCOUNT'
      );
    }

    const orderId = crypto.randomUUID();
    const trackingToken = generateTrackingToken();

    let orderNumber = generateOrderNumber();
    for (let attempt = 0; attempt < 5; attempt++) {
      const clash = await client.query(
        `SELECT 1 FROM "Order" WHERE "orderNumber" = $1`,
        [orderNumber]
      );
      if (clash.rowCount === 0) break;
      orderNumber = generateOrderNumber();
      if (attempt === 4) {
        throw new OrderError(
          'Could not allocate an order number. Please try again.',
          'ORDER_NUMBER_COLLISION',
          503
        );
      }
    }

    await client.query(
      `INSERT INTO "Order" (
         "id","orderNumber","userId","isGuest","status",
         "customerName","customerPhone","customerEmail",
         "city","district","address","postalCode","country","addressNotes",
         "subtotalHalalas","discountHalalas","discountCode","discountId",
         "vatHalalas","vatPercent","shippingHalalas","totalHalalas","currency",
         "paymentMethod","paymentStatus","deliveryStatus",
         "trackingToken","idempotencyKey","stockCommitted","createdAt","updatedAt"
       ) VALUES (
         $1,$2,$3,$4,'PENDING_PAYMENT',
         $5,$6,$7,
         $8,$9,$10,$11,$12,$13,
         $14,$15,$16,$17,
         $18,$19,$20,$21,$22,
         $23,'Pending','Awaiting Payment',
         $24,$25,false,NOW(),NOW()
       )`,
      [
        orderId, orderNumber, input.userId ?? null, !input.userId,
        customer.customerName, customer.customerPhone, customer.customerEmail,
        customer.city, customer.district, customer.address, customer.postalCode,
        customer.country, customer.addressNotes,
        quote.subtotalHalalas, quote.discountHalalas,
        quote.discount?.code ?? null, quote.discount?.id ?? null,
        quote.vatHalalas, quote.vatPercent, quote.shippingHalalas,
        quote.totalHalalas, quote.currency,
        paymentMethod,
        trackingToken, idempotencyKey,
      ]
    );

    for (const item of quote.items) {
      await client.query(
        `INSERT INTO "OrderItem"
           ("id","orderId","productId","sku","productNameEn","productNameAr",
            "brandName","imageUrl","unitPriceHalalas","quantity","totalHalalas")
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
        [
          crypto.randomUUID(), orderId, item.productId, item.sku,
          item.nameEn, item.nameAr, item.brandName, item.imageUrl,
          item.unitPriceHalalas, item.quantity, item.totalHalalas,
        ]
      );
    }

    await logEvent(client, orderId, 'ORDER_CREATED', {
      toValue: 'PENDING_PAYMENT',
      message: `Order placed by ${input.userId ? 'customer account' : 'guest'} for ${(quote.totalHalalas / 100).toFixed(2)} ${quote.currency}.`,
      isInternal: false,
      metadata: { itemCount: quote.items.length, paymentMethod },
    });

    return { orderId, trackingToken, quote };
  });

  const order = await getOrderById(created.orderId);
  return { order, reused: false, quote: quoteToClient(created.quote) };
}

// ---------------------------------------------------------------------------
// Inventory
// ---------------------------------------------------------------------------

async function commitStock(
  client: PoolClient,
  orderId: string,
  actor?: Actor
): Promise<void> {
  const items = await client.query(
    `SELECT "productId","quantity","productNameEn" FROM "OrderItem" WHERE "orderId" = $1`,
    [orderId]
  );

  for (const item of items.rows) {
    // Conditional decrement: the WHERE clause is the oversell guard, so two
    // concurrent confirmations cannot both take the last unit.
    const upd = await client.query(
      `UPDATE "Product"
          SET "stockQuantity" = "stockQuantity" - $2, "updatedAt" = NOW()
        WHERE "id" = $1 AND "stockQuantity" >= $2
        RETURNING "stockQuantity"`,
      [item.productId, item.quantity]
    );

    if (upd.rowCount === 0) {
      // Payment has already been captured, so refusing the order outright
      // would lose the customer's money. Record an oversell for the warehouse
      // to resolve and let the order proceed.
      const current = await client.query(
        `SELECT "stockQuantity" FROM "Product" WHERE "id" = $1`,
        [item.productId]
      );
      const have = current.rows[0]?.stockQuantity ?? 0;
      await logEvent(client, orderId, 'STOCK_SHORTFALL', {
        message: `Paid order exceeds available stock for "${item.productNameEn}": ordered ${item.quantity}, available ${have}. Stock left unchanged — resolve manually or refund.`,
        actor,
        metadata: { productId: item.productId, ordered: item.quantity, available: have },
      });
      continue;
    }

    await client.query(
      `INSERT INTO "InventoryMovement"
         ("id","productId","orderId","changeQty","quantityAfter","reason","note","actorId")
       VALUES ($1,$2,$3,$4,$5,'ORDER_PAID',$6,$7)`,
      [
        crypto.randomUUID(), item.productId, orderId,
        -item.quantity, upd.rows[0].stockQuantity,
        `Committed for paid order`, actor?.id ?? null,
      ]
    );
  }

  await client.query(
    `UPDATE "Order" SET "stockCommitted" = true, "updatedAt" = NOW() WHERE "id" = $1`,
    [orderId]
  );
}

async function releaseStock(
  client: PoolClient,
  orderId: string,
  reason: string,
  actor?: Actor
): Promise<void> {
  // Only release what was actually taken. The flag is flipped inside the same
  // transaction, so a double cancel cannot return stock twice.
  const ord = await client.query(
    `UPDATE "Order" SET "stockCommitted" = false, "updatedAt" = NOW()
      WHERE "id" = $1 AND "stockCommitted" = true
      RETURNING "id"`,
    [orderId]
  );
  if (ord.rowCount === 0) return;

  const items = await client.query(
    `SELECT "productId","quantity" FROM "OrderItem" WHERE "orderId" = $1`,
    [orderId]
  );

  for (const item of items.rows) {
    const upd = await client.query(
      `UPDATE "Product"
          SET "stockQuantity" = "stockQuantity" + $2, "updatedAt" = NOW()
        WHERE "id" = $1
        RETURNING "stockQuantity"`,
      [item.productId, item.quantity]
    );
    if (upd.rowCount === 0) continue; // product deleted since

    await client.query(
      `INSERT INTO "InventoryMovement"
         ("id","productId","orderId","changeQty","quantityAfter","reason","note","actorId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [
        crypto.randomUUID(), item.productId, orderId,
        item.quantity, upd.rows[0].stockQuantity, reason,
        `Returned to stock (${reason})`, actor?.id ?? null,
      ]
    );
  }
}

/** Manual stock adjustment from the admin panel. */
export async function adjustProductStock(
  productId: string,
  newQuantity: number,
  actor: Actor,
  note?: string
) {
  if (!Number.isInteger(newQuantity) || newQuantity < 0) {
    throw new OrderError('Stock quantity must be a whole number of 0 or more.', 'INVALID_STOCK');
  }

  return runTransaction(async client => {
    const before = await client.query(
      `SELECT "stockQuantity","nameEn" FROM "Product" WHERE "id" = $1 FOR UPDATE`,
      [productId]
    );
    if (!before.rows[0]) {
      throw new OrderError('Product not found.', 'PRODUCT_NOT_FOUND', 404);
    }

    const previous = Number(before.rows[0].stockQuantity);
    await client.query(
      `UPDATE "Product" SET "stockQuantity" = $2, "updatedAt" = NOW() WHERE "id" = $1`,
      [productId, newQuantity]
    );
    await client.query(
      `INSERT INTO "InventoryMovement"
         ("id","productId","changeQty","quantityAfter","reason","note","actorId")
       VALUES ($1,$2,$3,$4,'MANUAL_ADJUSTMENT',$5,$6)`,
      [
        crypto.randomUUID(), productId, newQuantity - previous, newQuantity,
        note || `Adjusted by ${actor.name || 'admin'}`, actor.id ?? null,
      ]
    );

    return { productId, previous, current: newQuantity };
  });
}

// ---------------------------------------------------------------------------
// Payment confirmation
// ---------------------------------------------------------------------------

export interface ConfirmResult {
  changed: boolean;
  status: OrderStatus;
  paymentStatus: string;
  reason?: string;
}

/**
 * Applies a verified provider result to an order. Idempotent in both
 * directions: confirming an already-paid order, or failing one, is a no-op.
 *
 * `verification` must come from the provider (verifyPayment or an
 * authenticated webhook), never from the browser.
 */
export async function applyPaymentVerification(
  orderId: string,
  paymentRowId: string | null,
  verification: PaymentVerification,
  actor?: Actor
): Promise<ConfirmResult> {
  return runTransaction(async client => {
    const ordRes = await client.query(
      `SELECT * FROM "Order" WHERE "id" = $1 FOR UPDATE`,
      [orderId]
    );
    const order = ordRes.rows[0];
    if (!order) {
      throw new OrderError('Order not found.', 'ORDER_NOT_FOUND', 404);
    }

    // Resolve (or create) the Payment row for this provider reference.
    let payment: any = null;
    if (paymentRowId) {
      const p = await client.query(`SELECT * FROM "Payment" WHERE "id" = $1 FOR UPDATE`, [paymentRowId]);
      payment = p.rows[0] || null;
    }
    if (!payment) {
      const p = await client.query(
        `SELECT * FROM "Payment"
          WHERE "orderId" = $1 AND "providerPaymentId" = $2
          ORDER BY "createdAt" DESC LIMIT 1 FOR UPDATE`,
        [orderId, verification.providerPaymentId]
      );
      payment = p.rows[0] || null;
    }

    // Already settled — absorb the duplicate.
    if (order.paymentStatus === 'Paid' && verification.status === 'PAID') {
      await logEvent(client, orderId, 'PAYMENT_CALLBACK_DUPLICATE', {
        message: `Duplicate paid callback for ${verification.providerPaymentId} ignored.`,
        actor,
      });
      return {
        changed: false,
        status: order.status as OrderStatus,
        paymentStatus: order.paymentStatus,
        reason: 'ALREADY_PAID',
      };
    }

    // A late failure must never undo a captured payment.
    if (order.paymentStatus === 'Paid' && verification.status !== 'PAID') {
      await logEvent(client, orderId, 'PAYMENT_CALLBACK_IGNORED', {
        message: `Ignored "${verification.status}" callback: order is already paid.`,
        actor,
      });
      return {
        changed: false,
        status: order.status as OrderStatus,
        paymentStatus: order.paymentStatus,
        reason: 'ALREADY_PAID',
      };
    }

    const nowPaid = verification.status === 'PAID';

    // Amount tamper check: the provider must have captured the order total.
    //
    // This refusal is *recorded*, not thrown: throwing from inside the
    // transaction would roll back the very audit trail that explains why the
    // payment was rejected. The caller turns the AMOUNT_MISMATCH reason into
    // an HTTP 409.
    if (nowPaid && verification.amountHalalas !== Number(order.totalHalalas)) {
      if (payment?.id) {
        await client.query(
          `UPDATE "Payment" SET "status" = 'FAILED',
               "failureReason" = $2, "rawResponse" = $3, "updatedAt" = NOW()
            WHERE "id" = $1`,
          [
            payment.id,
            `Amount mismatch: provider captured ${verification.amountHalalas}, order total is ${order.totalHalalas}`,
            JSON.stringify(verification.raw ?? {}),
          ]
        );
      }
      await logEvent(client, orderId, 'PAYMENT_AMOUNT_MISMATCH', {
        message: `Refused to mark paid: provider captured ${(verification.amountHalalas / 100).toFixed(2)} but the order total is ${(Number(order.totalHalalas) / 100).toFixed(2)}.`,
        actor,
        metadata: {
          providerAmountHalalas: verification.amountHalalas,
          orderTotalHalalas: Number(order.totalHalalas),
        },
      });
      return {
        changed: false,
        status: order.status as OrderStatus,
        paymentStatus: order.paymentStatus,
        reason: 'AMOUNT_MISMATCH',
      };
    }

    if (payment) {
      await client.query(
        `UPDATE "Payment"
            SET "status" = $2, "providerPaymentId" = COALESCE("providerPaymentId", $3),
                "method" = COALESCE($4, "method"), "failureReason" = $5,
                "rawResponse" = $6, "verifiedAt" = NOW(), "updatedAt" = NOW()
          WHERE "id" = $1`,
        [
          payment.id, verification.status, verification.providerPaymentId,
          verification.method, verification.failureReason,
          JSON.stringify(verification.raw ?? {}),
        ]
      );
    }

    if (!nowPaid) {
      const failedStatus: OrderStatus =
        verification.status === 'CANCELLED' ? 'CANCELLED' : 'PAYMENT_FAILED';

      // `wasCancelled` is passed as its own parameter: reusing $2 inside a
      // CASE comparison made PostgreSQL infer text and character varying for
      // the same placeholder, which it rejects (42P08).
      const wasCancelled = verification.status === 'CANCELLED';
      await client.query(
        `UPDATE "Order"
            SET "status" = $2, "paymentStatus" = $3, "deliveryStatus" = $4,
                "cancelledAt" = CASE WHEN $5 THEN NOW() ELSE "cancelledAt" END,
                "updatedAt" = NOW()
          WHERE "id" = $1`,
        [
          orderId, failedStatus,
          wasCancelled ? 'Cancelled' : 'Failed',
          DELIVERY_STATUS_FOR[failedStatus] ?? 'Payment Failed',
          wasCancelled,
        ]
      );

      await logEvent(client, orderId, 'PAYMENT_FAILED', {
        fromValue: order.status,
        toValue: failedStatus,
        message: verification.failureReason
          || `Payment ${verification.status.toLowerCase()} at the provider.`,
        isInternal: false,
        actor,
        metadata: { providerPaymentId: verification.providerPaymentId },
      });

      return { changed: true, status: failedStatus, paymentStatus: verification.status === 'CANCELLED' ? 'Cancelled' : 'Failed' };
    }

    // ---- Confirmed paid ----
    await client.query(
      `UPDATE "Order"
          SET "status" = 'PAID', "paymentStatus" = 'Paid',
              "deliveryStatus" = 'Processing', "paidAt" = NOW(), "updatedAt" = NOW()
        WHERE "id" = $1`,
      [orderId]
    );

    await commitStock(client, orderId, actor);
    await redeemDiscount(client, order);

    await logEvent(client, orderId, 'PAYMENT_CONFIRMED', {
      fromValue: order.status,
      toValue: 'PAID',
      message: `Payment of ${(verification.amountHalalas / 100).toFixed(2)} ${verification.currency} confirmed server-side.`,
      isInternal: false,
      actor,
      metadata: {
        providerPaymentId: verification.providerPaymentId,
        method: verification.method,
      },
    });

    return { changed: true, status: 'PAID', paymentStatus: 'Paid' };
  });
}

/** Records the redemption and bumps the usage counter, exactly once. */
async function redeemDiscount(client: PoolClient, order: any): Promise<void> {
  if (!order.discountId) return;

  const ins = await client.query(
    `INSERT INTO "DiscountRedemption"
       ("id","discountId","orderId","customerEmail","customerPhone","amountHalalas")
     VALUES ($1,$2,$3,$4,$5,$6)
     ON CONFLICT ("orderId") DO NOTHING
     RETURNING "id"`,
    [
      crypto.randomUUID(), order.discountId, order.id,
      order.customerEmail, order.customerPhone, Number(order.discountHalalas),
    ]
  );

  if (ins.rowCount && ins.rowCount > 0) {
    await client.query(
      `UPDATE "Discount" SET "usageCount" = "usageCount" + 1, "updatedAt" = NOW()
        WHERE "id" = $1`,
      [order.discountId]
    );
  }
}

// ---------------------------------------------------------------------------
// Admin status transitions
// ---------------------------------------------------------------------------

export async function transitionOrderStatus(
  orderId: string,
  toStatus: OrderStatus,
  actor: Actor,
  opts: { note?: string | null; reason?: string | null } = {}
) {
  if (!ORDER_STATUSES.includes(toStatus)) {
    throw new OrderError(`Unknown order status "${toStatus}".`, 'INVALID_STATUS');
  }

  return runTransaction(async client => {
    const res = await client.query(`SELECT * FROM "Order" WHERE "id" = $1 FOR UPDATE`, [orderId]);
    const order = res.rows[0];
    if (!order) throw new OrderError('Order not found.', 'ORDER_NOT_FOUND', 404);

    const from = order.status as OrderStatus;
    if (from === toStatus) {
      return { order: await loadOrder(client, orderId), changed: false };
    }

    const allowed = ALLOWED_TRANSITIONS[from] ?? [];
    if (!allowed.includes(toStatus)) {
      throw new OrderError(
        `An order that is ${from} cannot move to ${toStatus}. Allowed: ${allowed.join(', ') || 'none'}.`,
        'INVALID_TRANSITION',
        409
      );
    }

    // Never fulfil an unpaid order.
    if (['APPROVED', 'PROCESSING', 'DISPATCHED', 'SHIPPED', 'DELIVERED'].includes(toStatus)
        && order.paymentStatus !== 'Paid') {
      throw new OrderError(
        'This order has not been paid, so it cannot be approved or dispatched.',
        'ORDER_NOT_PAID',
        409
      );
    }

    const timestampColumn: Partial<Record<OrderStatus, string>> = {
      DISPATCHED: 'dispatchedAt',
      SHIPPED: 'shippedAt',
      DELIVERED: 'deliveredAt',
      CANCELLED: 'cancelledAt',
    };
    const tsCol = timestampColumn[toStatus];

    await client.query(
      `UPDATE "Order"
          SET "status" = $2,
              "deliveryStatus" = $3,
              ${tsCol ? `"${tsCol}" = NOW(),` : ''}
              "cancellationReason" = COALESCE($4, "cancellationReason"),
              "updatedAt" = NOW()
        WHERE "id" = $1`,
      [orderId, toStatus, DELIVERY_STATUS_FOR[toStatus] ?? order.deliveryStatus, opts.reason ?? null]
    );

    if (STOCK_RELEASING_STATUSES.includes(toStatus)) {
      await releaseStock(client, orderId, `ORDER_${toStatus}`, actor);
    }

    await logEvent(client, orderId, 'STATUS_CHANGED', {
      fromValue: from,
      toValue: toStatus,
      message: opts.note || opts.reason || `Status changed from ${from} to ${toStatus}.`,
      isInternal: false,
      actor,
    });

    return { order: await loadOrder(client, orderId), changed: true };
  });
}

export async function updateOrderFulfilment(
  orderId: string,
  changes: {
    trackingNumber?: string | null;
    carrier?: string | null;
    deliveryStatus?: string | null;
    address?: string | null;
    city?: string | null;
    district?: string | null;
    postalCode?: string | null;
    customerPhone?: string | null;
    addressNotes?: string | null;
  },
  actor: Actor
) {
  return runTransaction(async client => {
    const res = await client.query(`SELECT * FROM "Order" WHERE "id" = $1 FOR UPDATE`, [orderId]);
    const order = res.rows[0];
    if (!order) throw new OrderError('Order not found.', 'ORDER_NOT_FOUND', 404);

    // Shipping details stay editable (couriers change), but money and line
    // items of a paid order are immutable and are not accepted here at all.
    const fields: Record<string, any> = {};
    const assign = (key: string, max: number) => {
      if (changes[key as keyof typeof changes] === undefined) return;
      const raw = changes[key as keyof typeof changes];
      fields[key] = raw === null ? null : cleanString(raw, max) || null;
    };

    assign('trackingNumber', 100);
    assign('carrier', 100);
    assign('deliveryStatus', 50);
    assign('address', 500);
    assign('city', 100);
    assign('district', 100);
    assign('postalCode', 20);
    assign('addressNotes', 1000);

    if (changes.customerPhone !== undefined && changes.customerPhone !== null) {
      const digits = cleanString(changes.customerPhone, 50).replace(/[\s\-()]/g, '');
      if (!/^(\+9665\d{8}|009665\d{8}|9665\d{8}|05\d{8}|5\d{8})$/.test(digits)) {
        throw new OrderError('Please enter a valid Saudi mobile number.', 'INVALID_PHONE');
      }
      fields.customerPhone = `+966${digits.replace(/^(\+966|00966|966)/, '').replace(/^0/, '')}`;
    }

    if (fields.postalCode && !/^\d{5}$/.test(fields.postalCode)) {
      throw new OrderError('Saudi postal codes are 5 digits.', 'INVALID_POSTAL_CODE');
    }

    const keys = Object.keys(fields);
    if (keys.length === 0) {
      return { order: await loadOrder(client, orderId), changed: false };
    }

    const setSql = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    await client.query(
      `UPDATE "Order" SET ${setSql}, "updatedAt" = NOW() WHERE "id" = $1`,
      [orderId, ...keys.map(k => fields[k])]
    );

    const changedSummary = keys
      .filter(k => String(order[k] ?? '') !== String(fields[k] ?? ''))
      .map(k => `${k}: "${order[k] ?? ''}" → "${fields[k] ?? ''}"`);

    await logEvent(client, orderId, 'FULFILMENT_UPDATED', {
      message: changedSummary.length
        ? `Updated ${changedSummary.join('; ')}`
        : 'Fulfilment details saved with no effective change.',
      actor,
      metadata: fields,
    });

    return { order: await loadOrder(client, orderId), changed: changedSummary.length > 0 };
  });
}

export async function addOrderNote(
  orderId: string,
  note: string,
  actor: Actor,
  isInternal = true
) {
  const text = cleanString(note, 4000);
  if (text.length < 1) {
    throw new OrderError('The note is empty.', 'EMPTY_NOTE');
  }

  return runTransaction(async client => {
    const res = await client.query(`SELECT "id" FROM "Order" WHERE "id" = $1`, [orderId]);
    if (!res.rows[0]) throw new OrderError('Order not found.', 'ORDER_NOT_FOUND', 404);

    await logEvent(client, orderId, 'NOTE_ADDED', {
      message: text,
      isInternal,
      actor,
    });

    if (isInternal) {
      await client.query(
        `UPDATE "Order"
            SET "internalNotes" = COALESCE("internalNotes" || E'\n', '') || $2,
                "updatedAt" = NOW()
          WHERE "id" = $1`,
        [orderId, `[${new Date().toISOString()}] ${actor.name || 'admin'}: ${text}`]
      );
    }

    return { order: await loadOrder(client, orderId) };
  });
}

// ---------------------------------------------------------------------------
// Refunds
// ---------------------------------------------------------------------------

/**
 * Records a refund against a captured payment and releases stock when the
 * whole order has been refunded. The provider call happens in the route so
 * this function stays usable for externally-initiated refunds too.
 */
export async function recordRefund(
  orderId: string,
  args: {
    paymentId: string;
    amountHalalas: number;
    reason?: string | null;
    providerRefundId?: string | null;
    status?: 'PENDING' | 'SUCCEEDED' | 'FAILED';
    raw?: any;
  },
  actor: Actor
) {
  return runTransaction(async client => {
    const ordRes = await client.query(`SELECT * FROM "Order" WHERE "id" = $1 FOR UPDATE`, [orderId]);
    const order = ordRes.rows[0];
    if (!order) throw new OrderError('Order not found.', 'ORDER_NOT_FOUND', 404);

    const payRes = await client.query(
      `SELECT * FROM "Payment" WHERE "id" = $1 AND "orderId" = $2 FOR UPDATE`,
      [args.paymentId, orderId]
    );
    const payment = payRes.rows[0];
    if (!payment) throw new OrderError('Payment not found for this order.', 'PAYMENT_NOT_FOUND', 404);
    if (payment.status !== 'PAID' && payment.status !== 'PARTIALLY_REFUNDED') {
      throw new OrderError('Only a captured payment can be refunded.', 'PAYMENT_NOT_CAPTURED', 409);
    }

    const alreadyRefunded = Number(payment.refundedHalalas);
    const capturable = Number(payment.amountHalalas) - alreadyRefunded;
    if (!Number.isInteger(args.amountHalalas) || args.amountHalalas <= 0) {
      throw new OrderError('The refund amount must be greater than zero.', 'INVALID_REFUND_AMOUNT');
    }
    if (args.amountHalalas > capturable) {
      throw new OrderError(
        `Refund exceeds the refundable balance of ${(capturable / 100).toFixed(2)} ${payment.currency}.`,
        'REFUND_EXCEEDS_BALANCE',
        409
      );
    }

    const refundId = crypto.randomUUID();
    await client.query(
      `INSERT INTO "Refund"
         ("id","paymentId","orderId","amountHalalas","currency","status","reason",
          "providerRefundId","rawResponse","createdByUserId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
      [
        refundId, payment.id, orderId, args.amountHalalas, payment.currency,
        args.status || 'SUCCEEDED', args.reason ?? null,
        args.providerRefundId ?? null,
        args.raw ? JSON.stringify(args.raw) : null,
        actor.id ?? null,
      ]
    );

    const newRefunded = alreadyRefunded + args.amountHalalas;
    const fullyRefunded = newRefunded >= Number(payment.amountHalalas);

    await client.query(
      `UPDATE "Payment"
          SET "refundedHalalas" = $2,
              "status" = $3,
              "updatedAt" = NOW()
        WHERE "id" = $1`,
      [payment.id, newRefunded, fullyRefunded ? 'REFUNDED' : 'PARTIALLY_REFUNDED']
    );

    const orderRefunded = Number(order.refundedHalalas) + args.amountHalalas;
    const orderFullyRefunded = orderRefunded >= Number(order.totalHalalas);

    await client.query(
      `UPDATE "Order"
          SET "refundedHalalas" = $2,
              "paymentStatus" = $3,
              "status" = CASE WHEN $4 THEN 'REFUNDED' ELSE "status" END,
              "deliveryStatus" = CASE WHEN $4 THEN 'Refunded' ELSE "deliveryStatus" END,
              "updatedAt" = NOW()
        WHERE "id" = $1`,
      [
        orderId, orderRefunded,
        orderFullyRefunded ? 'Refunded' : 'Partially Refunded',
        orderFullyRefunded,
      ]
    );

    if (orderFullyRefunded) {
      await releaseStock(client, orderId, 'ORDER_REFUNDED', actor);
    }

    await logEvent(client, orderId, 'REFUND_RECORDED', {
      fromValue: order.paymentStatus,
      toValue: orderFullyRefunded ? 'Refunded' : 'Partially Refunded',
      message: `Refunded ${(args.amountHalalas / 100).toFixed(2)} ${payment.currency}${args.reason ? ` — ${args.reason}` : ''}.`,
      isInternal: false,
      actor,
      metadata: { refundId, providerRefundId: args.providerRefundId ?? null },
    });

    return { refundId, order: await loadOrder(client, orderId) };
  });
}

// ---------------------------------------------------------------------------
// Read models
// ---------------------------------------------------------------------------

const ORDER_SELECT = `
  SELECT o.*,
         (SELECT COUNT(*)::int FROM "OrderItem" oi WHERE oi."orderId" = o."id") AS "itemCount",
         (SELECT COALESCE(SUM(oi."quantity"),0)::int FROM "OrderItem" oi WHERE oi."orderId" = o."id") AS "unitCount"
    FROM "Order" o`;

async function loadOrder(client: PoolClient, orderId: string) {
  const res = await client.query(`${ORDER_SELECT} WHERE o."id" = $1`, [orderId]);
  if (!res.rows[0]) return null;
  return hydrateOrder(res.rows[0]);
}

export async function getOrderById(orderId: string) {
  const res = await query(`${ORDER_SELECT} WHERE o."id" = $1`, [orderId]);
  if (!res.rows[0]) return null;
  return hydrateOrder(res.rows[0]);
}

function toSar(halalas: any): number {
  return Number(halalas || 0) / 100;
}

/** Converts a database row into the API shape (money in SAR). */
function hydrateOrder(row: any) {
  return {
    id: row.id,
    orderNumber: row.orderNumber,
    status: row.status,
    paymentStatus: row.paymentStatus,
    deliveryStatus: row.deliveryStatus,
    isGuest: row.isGuest,
    userId: row.userId,

    customerName: row.customerName,
    customerEmail: row.customerEmail,
    customerPhone: row.customerPhone,
    address: row.address,
    district: row.district,
    city: row.city,
    postalCode: row.postalCode,
    country: row.country,
    addressNotes: row.addressNotes,

    subtotal: toSar(row.subtotalHalalas),
    discount: toSar(row.discountHalalas),
    discountCode: row.discountCode,
    vat: toSar(row.vatHalalas),
    vatPercent: Number(row.vatPercent),
    shipping: toSar(row.shippingHalalas),
    total: toSar(row.totalHalalas),
    refunded: toSar(row.refundedHalalas),
    currency: row.currency || CURRENCY,

    paymentMethod: row.paymentMethod,
    trackingNumber: row.trackingNumber,
    carrier: row.carrier,
    trackingToken: row.trackingToken,
    zatcaQrString: row.zatcaQrString,
    internalNotes: row.internalNotes,
    cancellationReason: row.cancellationReason,
    stockCommitted: row.stockCommitted,

    itemCount: row.itemCount ?? 0,
    unitCount: row.unitCount ?? 0,

    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    paidAt: row.paidAt,
    dispatchedAt: row.dispatchedAt,
    shippedAt: row.shippedAt,
    deliveredAt: row.deliveredAt,
    cancelledAt: row.cancelledAt,

    allowedTransitions: ALLOWED_TRANSITIONS[row.status as OrderStatus] ?? [],
  };
}

export async function getOrderItems(orderId: string) {
  const res = await query(
    `SELECT oi.*, p."slug" AS "productSlug", p."stockQuantity" AS "currentStock"
       FROM "OrderItem" oi
       LEFT JOIN "Product" p ON p."id" = oi."productId"
      WHERE oi."orderId" = $1
      ORDER BY oi."createdAt" ASC, oi."id" ASC`,
    [orderId]
  );
  return res.rows.map((r: any) => ({
    id: r.id,
    productId: r.productId,
    productSlug: r.productSlug,
    sku: r.sku,
    nameEn: r.productNameEn,
    nameAr: r.productNameAr,
    brandName: r.brandName,
    imageUrl: r.imageUrl,
    unitPrice: toSar(r.unitPriceHalalas),
    quantity: r.quantity,
    lineTotal: toSar(r.totalHalalas),
    currentStock: r.currentStock,
  }));
}

export async function getOrderPayments(orderId: string) {
  const payments = await query(
    `SELECT * FROM "Payment" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
    [orderId]
  );
  const refunds = await query(
    `SELECT * FROM "Refund" WHERE "orderId" = $1 ORDER BY "createdAt" ASC`,
    [orderId]
  );

  return {
    payments: payments.rows.map((p: any) => ({
      id: p.id,
      provider: p.provider,
      providerPaymentId: p.providerPaymentId,
      method: p.method,
      status: p.status,
      amount: toSar(p.amountHalalas),
      refunded: toSar(p.refundedHalalas),
      currency: p.currency,
      isTestMode: p.isTestMode,
      failureReason: p.failureReason,
      verifiedAt: p.verifiedAt,
      createdAt: p.createdAt,
    })),
    refunds: refunds.rows.map((r: any) => ({
      id: r.id,
      paymentId: r.paymentId,
      amount: toSar(r.amountHalalas),
      currency: r.currency,
      status: r.status,
      reason: r.reason,
      providerRefundId: r.providerRefundId,
      createdAt: r.createdAt,
    })),
  };
}

export async function getOrderEvents(orderId: string, includeInternal = true) {
  const res = await query(
    `SELECT * FROM "OrderEvent"
      WHERE "orderId" = $1 ${includeInternal ? '' : 'AND "isInternal" = false'}
      ORDER BY "createdAt" ASC, "id" ASC`,
    [orderId]
  );
  return res.rows.map((e: any) => ({
    id: e.id,
    eventType: e.eventType,
    from: e.fromValue,
    to: e.toValue,
    message: e.message,
    isInternal: e.isInternal,
    actorName: e.actorName,
    metadata: e.metadata,
    createdAt: e.createdAt,
  }));
}

export interface OrderListFilters {
  search?: string;
  status?: string;
  paymentStatus?: string;
  deliveryStatus?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

const SORTABLE: Record<string, string> = {
  createdAt: 'o."createdAt"',
  updatedAt: 'o."updatedAt"',
  orderNumber: 'o."orderNumber"',
  total: 'o."totalHalalas"',
  status: 'o."status"',
  customerName: 'o."customerName"',
  paidAt: 'o."paidAt"',
};

export async function listOrders(filters: OrderListFilters = {}) {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.search) {
    const term = `%${String(filters.search).trim().toLowerCase()}%`;
    params.push(term);
    const i = params.length;
    conditions.push(`(
      LOWER(o."orderNumber") LIKE $${i} OR
      LOWER(o."customerName") LIKE $${i} OR
      LOWER(COALESCE(o."customerEmail",'')) LIKE $${i} OR
      LOWER(COALESCE(o."customerPhone",'')) LIKE $${i} OR
      LOWER(COALESCE(o."trackingNumber",'')) LIKE $${i} OR
      LOWER(COALESCE(o."city",'')) LIKE $${i} OR
      EXISTS (SELECT 1 FROM "OrderItem" oi
               WHERE oi."orderId" = o."id"
                 AND (LOWER(COALESCE(oi."sku",'')) LIKE $${i}
                   OR LOWER(oi."productNameEn") LIKE $${i}))
    )`);
  }

  // Comma-separated lists are supported so the UI can offer multi-select.
  const inFilter = (column: string, value?: string) => {
    if (!value) return;
    const values = String(value).split(',').map(s => s.trim()).filter(Boolean);
    if (values.length === 0) return;
    params.push(values);
    conditions.push(`${column} = ANY($${params.length}::text[])`);
  };
  inFilter('o."status"', filters.status);
  inFilter('o."paymentStatus"', filters.paymentStatus);
  inFilter('o."deliveryStatus"', filters.deliveryStatus);

  if (filters.dateFrom) {
    params.push(filters.dateFrom);
    conditions.push(`o."createdAt" >= $${params.length}::timestamptz`);
  }
  if (filters.dateTo) {
    params.push(filters.dateTo);
    conditions.push(`o."createdAt" <= $${params.length}::timestamptz`);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const sortCol = SORTABLE[filters.sortBy || 'createdAt'] || SORTABLE.createdAt;
  const sortDir = filters.sortDir === 'asc' ? 'ASC' : 'DESC';

  const limit = Math.min(Math.max(Number(filters.limit) || 50, 1), 200);
  const offset = Math.max(Number(filters.offset) || 0, 0);

  const countRes = await query(
    `SELECT COUNT(*)::int AS n FROM "Order" o ${where}`,
    params
  );

  params.push(limit, offset);
  const rows = await query(
    `${ORDER_SELECT} ${where}
      ORDER BY ${sortCol} ${sortDir}, o."id" DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}`,
    params
  );

  return {
    orders: rows.rows.map(hydrateOrder),
    total: Number(countRes.rows[0].n),
    limit,
    offset,
  };
}

/** Aggregate figures for the admin overview — real numbers, not estimates. */
export async function getOrderStats() {
  const res = await query(`
    SELECT
      COUNT(*)::int AS "totalOrders",
      COUNT(*) FILTER (WHERE "paymentStatus" = 'Paid')::int AS "paidOrders",
      COUNT(*) FILTER (WHERE "status" = 'PENDING_PAYMENT')::int AS "pendingPayment",
      COUNT(*) FILTER (WHERE "status" = 'PAYMENT_FAILED')::int AS "failedPayment",
      COUNT(*) FILTER (WHERE "status" = 'PAID')::int AS "awaitingApproval",
      COUNT(*) FILTER (WHERE "status" IN ('APPROVED','PROCESSING'))::int AS "inFulfilment",
      COUNT(*) FILTER (WHERE "status" IN ('DISPATCHED','SHIPPED'))::int AS "inTransit",
      COUNT(*) FILTER (WHERE "status" = 'DELIVERED')::int AS "delivered",
      COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS "cancelled",
      COUNT(*) FILTER (WHERE "paymentStatus" IN ('Refunded','Partially Refunded'))::int AS "refunded",
      COALESCE(SUM("totalHalalas") FILTER (WHERE "paymentStatus" = 'Paid'),0)::bigint AS "grossPaidHalalas",
      COALESCE(SUM("refundedHalalas"),0)::bigint AS "refundedHalalas"
    FROM "Order"
  `);
  const r = res.rows[0];
  return {
    totalOrders: Number(r.totalOrders),
    paidOrders: Number(r.paidOrders),
    pendingPayment: Number(r.pendingPayment),
    failedPayment: Number(r.failedPayment),
    awaitingApproval: Number(r.awaitingApproval),
    inFulfilment: Number(r.inFulfilment),
    inTransit: Number(r.inTransit),
    delivered: Number(r.delivered),
    cancelled: Number(r.cancelled),
    refunded: Number(r.refunded),
    grossPaidRevenue: Number(r.grossPaidHalalas) / 100,
    refundedAmount: Number(r.refundedHalalas) / 100,
    netRevenue: (Number(r.grossPaidHalalas) - Number(r.refundedHalalas)) / 100,
  };
}

/**
 * Public order lookup by tracking token. Deliberately narrow: no internal
 * notes, no payment references, no tracking token echo.
 */
export async function getOrderByTrackingToken(token: string) {
  const clean = String(token || '').trim();
  if (clean.length < 20) return null;

  const res = await query(`${ORDER_SELECT} WHERE o."trackingToken" = $1`, [clean]);
  if (!res.rows[0]) return null;

  const order = hydrateOrder(res.rows[0]);
  const items = await getOrderItems(order.id);
  const events = await getOrderEvents(order.id, false);

  return {
    orderNumber: order.orderNumber,
    status: order.status,
    paymentStatus: order.paymentStatus,
    deliveryStatus: order.deliveryStatus,
    createdAt: order.createdAt,
    paidAt: order.paidAt,
    shippedAt: order.shippedAt,
    deliveredAt: order.deliveredAt,
    customerName: order.customerName,
    city: order.city,
    district: order.district,
    address: order.address,
    postalCode: order.postalCode,
    country: order.country,
    subtotal: order.subtotal,
    discount: order.discount,
    discountCode: order.discountCode,
    vat: order.vat,
    shipping: order.shipping,
    total: order.total,
    refunded: order.refunded,
    currency: order.currency,
    paymentMethod: order.paymentMethod,
    trackingNumber: order.trackingNumber,
    carrier: order.carrier,
    items: items.map(i => ({
      sku: i.sku,
      nameEn: i.nameEn,
      nameAr: i.nameAr,
      brandName: i.brandName,
      imageUrl: i.imageUrl,
      unitPrice: i.unitPrice,
      quantity: i.quantity,
      lineTotal: i.lineTotal,
    })),
    timeline: events.map(e => ({
      message: e.message,
      status: e.to,
      at: e.createdAt,
    })),
  };
}

/** Full admin view of one order. */
export async function getOrderDetail(orderId: string) {
  const order = await getOrderById(orderId);
  if (!order) return null;
  const [items, payments, events] = await Promise.all([
    getOrderItems(orderId),
    getOrderPayments(orderId),
    getOrderEvents(orderId, true),
  ]);
  return { order, items, ...payments, events };
}

export { PricingError };
