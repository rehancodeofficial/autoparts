/**
 * Checkout, payment and admin order-management routes.
 *
 * Trust boundary: nothing in `req.body` is believed about money. The pricing
 * engine re-reads every price from "Product" and every discount from
 * "Discount"; a payment is only ever confirmed from a provider verification or
 * an authenticated webhook.
 */
import express, { Request, Response } from 'express';
import crypto from 'crypto';
import { query } from './db';
import {
  buildQuote, quoteToClient, evaluateDiscount, PricingError,
} from './pricingService';
import {
  createPendingOrder, applyPaymentVerification, transitionOrderStatus,
  updateOrderFulfilment, addOrderNote, recordRefund, adjustProductStock,
  listOrders, getOrderDetail, getOrderById, getOrderStats,
  getOrderByTrackingToken, getOrderEvents,
  OrderError, ORDER_STATUSES, ALLOWED_TRANSITIONS,
  type OrderStatus, type Actor,
} from './orderService';
import {
  getPaymentDriver, PaymentProviderError, type PaymentDriver,
} from './paymentProviders';
import type { AuthenticatedRequest } from './apiRoutes';

export const publicCommerceRouter = express.Router();
export const adminCommerceRouter = express.Router();

/** Maps a thrown error onto an HTTP response without leaking internals. */
function sendError(res: Response, err: any, fallback = 'Request failed.') {
  if (err instanceof PricingError || err instanceof OrderError) {
    return res.status(err.statusCode).json({ error: err.message, code: err.code });
  }
  if (err instanceof PaymentProviderError) {
    return res.status(err.statusCode).json({ error: err.message, code: 'PAYMENT_PROVIDER_ERROR' });
  }
  console.error('[commerce]', err);
  return res.status(500).json({ error: fallback, code: 'INTERNAL_ERROR' });
}

function actorFrom(req: AuthenticatedRequest): Actor {
  return { id: req.user?.id ?? null, name: req.user?.name ?? req.user?.email ?? 'admin' };
}

function paramStr(value: any): string {
  return Array.isArray(value) ? String(value[0] ?? '') : String(value ?? '');
}

// ===========================================================================
// Public: pricing
// ===========================================================================

/**
 * POST /api/checkout/quote
 * Authoritative pricing for a cart. The checkout screen renders these numbers
 * so what the shopper sees is always what the server will charge.
 */
publicCommerceRouter.post('/checkout/quote', async (req: Request, res: Response) => {
  try {
    const quote = await buildQuote(req.body?.items, {
      discountCode: req.body?.discountCode,
      customer: { email: req.body?.customerEmail, phone: req.body?.customerPhone },
      requireStock: false,
    });
    return res.json(quoteToClient(quote));
  } catch (err) {
    return sendError(res, err, 'Could not price your cart.');
  }
});

/**
 * POST /api/checkout/discount
 * Validates a code against the cart without creating anything.
 */
publicCommerceRouter.post('/checkout/discount', async (req: Request, res: Response) => {
  try {
    const quote = await buildQuote(req.body?.items, { requireStock: false });
    const { discount, error } = await evaluateDiscount(
      req.body?.code,
      quote.subtotalHalalas,
      { email: req.body?.customerEmail, phone: req.body?.customerPhone }
    );

    if (!discount) {
      return res.status(422).json({
        valid: false,
        error: error || 'That discount code is not valid.',
      });
    }

    // Re-price with the code applied so the client can show final figures.
    const applied = await buildQuote(req.body?.items, {
      discountCode: req.body?.code,
      customer: { email: req.body?.customerEmail, phone: req.body?.customerPhone },
      requireStock: false,
    });

    return res.json({
      valid: true,
      code: discount.code,
      type: discount.type,
      value: discount.value,
      amount: discount.amountHalalas / 100,
      quote: quoteToClient(applied),
    });
  } catch (err) {
    return sendError(res, err, 'Could not validate that discount code.');
  }
});

// ===========================================================================
// Public: guest checkout
// ===========================================================================

function resolveOrigin(req: Request): string {
  const configured = process.env.PUBLIC_BASE_URL;
  if (configured) return configured.replace(/\/$/, '');
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'http';
  const host = (req.headers['x-forwarded-host'] as string) || req.get('host') || 'localhost:4000';
  return `${proto.split(',')[0]}://${host}`;
}

async function openPaymentForOrder(
  req: Request,
  order: any,
  method: string,
  testOutcome?: string
) {
  const driver: PaymentDriver = getPaymentDriver();
  const amountHalalas = Math.round(order.total * 100);

  const returnUrl =
    `${resolveOrigin(req)}/order/confirmation` +
    `?order=${encodeURIComponent(order.orderNumber)}` +
    `&t=${encodeURIComponent(order.trackingToken)}`;

  const paymentRowId = crypto.randomUUID();

  // The row exists before the provider is called, so a provider response that
  // never reaches us still leaves an auditable attempt behind.
  await query(
    `INSERT INTO "Payment"
       ("id","orderId","provider","method","status","amountHalalas","currency","isTestMode")
     VALUES ($1,$2,$3,$4,'INITIATED',$5,$6,$7)`,
    [paymentRowId, order.id, driver.name, method, amountHalalas, order.currency, driver.isTestMode]
  );

  try {
    const intent = await driver.createPayment({
      orderId: order.id,
      orderNumber: order.orderNumber,
      amountHalalas,
      currency: order.currency,
      method,
      description: `AutoParts KSA order ${order.orderNumber}`,
      customer: {
        name: order.customerName,
        email: order.customerEmail,
        phone: order.customerPhone,
      },
      returnUrl,
      testOutcome: (testOutcome as any) || undefined,
    });

    await query(
      `UPDATE "Payment"
          SET "providerPaymentId" = $2, "status" = $3, "redirectUrl" = $4,
              "rawResponse" = $5, "updatedAt" = NOW()
        WHERE "id" = $1`,
      [
        paymentRowId, intent.providerPaymentId, intent.status,
        intent.redirectUrl, JSON.stringify(intent.raw ?? {}),
      ]
    );

    return {
      paymentId: paymentRowId,
      provider: driver.name,
      providerPaymentId: intent.providerPaymentId,
      status: intent.status,
      redirectUrl: intent.redirectUrl,
      isTestMode: driver.isTestMode,
      amount: amountHalalas / 100,
      currency: order.currency,
    };
  } catch (err: any) {
    await query(
      `UPDATE "Payment"
          SET "status" = 'FAILED', "failureReason" = $2, "updatedAt" = NOW()
        WHERE "id" = $1`,
      [paymentRowId, String(err?.message || 'Could not open the payment session.')]
    );
    throw err;
  }
}

/**
 * POST /api/checkout
 * Guest checkout. Creates the order in PENDING_PAYMENT and opens a payment
 * session. No account is required or created.
 */
publicCommerceRouter.post('/checkout', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { order, reused } = await createPendingOrder({
      ...req.body,
      // An authenticated shopper's order is linked to them, but authentication
      // is never required.
      userId: req.user?.id ?? null,
    });

    if (!order) {
      return res.status(500).json({ error: 'Order could not be created.' });
    }

    if (reused && order.paymentStatus === 'Paid') {
      return res.status(200).json({
        order,
        payment: null,
        reused: true,
        message: 'This order has already been paid.',
      });
    }

    const payment = await openPaymentForOrder(
      req,
      order,
      String(req.body?.paymentMethod || 'mada'),
      req.body?.testOutcome
    );

    return res.status(201).json({ order, payment, reused });
  } catch (err) {
    return sendError(res, err, 'Checkout failed.');
  }
});

/**
 * POST /api/payments/retry
 * Opens a fresh payment session for an order whose payment failed.
 */
publicCommerceRouter.post('/payments/retry', async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.trackingToken || '');
    const ord = await query(
      `SELECT "id" FROM "Order" WHERE "trackingToken" = $1`,
      [token]
    );
    if (!ord.rows[0]) return res.status(404).json({ error: 'Order not found.' });

    const order = await getOrderById(ord.rows[0].id);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    if (order.paymentStatus === 'Paid') {
      return res.status(409).json({ error: 'This order has already been paid.' });
    }
    if (!['PENDING_PAYMENT', 'PAYMENT_FAILED'].includes(order.status)) {
      return res.status(409).json({
        error: `An order that is ${order.status} cannot be paid again.`,
      });
    }

    // Re-open for payment so the status reflects a live attempt.
    if (order.status === 'PAYMENT_FAILED') {
      await transitionOrderStatus(order.id, 'PENDING_PAYMENT', { name: 'customer' }, {
        note: 'Customer started a new payment attempt.',
      });
    }

    const payment = await openPaymentForOrder(
      req,
      order,
      String(req.body?.paymentMethod || order.paymentMethod || 'mada'),
      req.body?.testOutcome
    );

    return res.json({ order: await getOrderById(order.id), payment });
  } catch (err) {
    return sendError(res, err, 'Could not restart the payment.');
  }
});

/**
 * POST /api/payments/confirm
 * Called by the confirmation page after the provider redirects the shopper
 * back. The redirect itself is not evidence — the provider is re-queried
 * server to server and only that answer is acted on.
 */
publicCommerceRouter.post('/payments/confirm', async (req: Request, res: Response) => {
  try {
    const token = String(req.body?.trackingToken || '');
    const ord = await query(
      `SELECT "id","totalHalalas" FROM "Order" WHERE "trackingToken" = $1`,
      [token]
    );
    if (!ord.rows[0]) {
      return res.status(404).json({ error: 'Order not found.' });
    }
    const orderId = ord.rows[0].id;

    const providerPaymentId = String(req.body?.providerPaymentId || '');
    const paymentRes = await query(
      providerPaymentId
        ? `SELECT * FROM "Payment"
            WHERE "orderId" = $1 AND "providerPaymentId" = $2
            ORDER BY "createdAt" DESC LIMIT 1`
        : `SELECT * FROM "Payment"
            WHERE "orderId" = $1 ORDER BY "createdAt" DESC LIMIT 1`,
      providerPaymentId ? [orderId, providerPaymentId] : [orderId]
    );
    const payment = paymentRes.rows[0];

    if (!payment) {
      return res.status(404).json({ error: 'No payment attempt found for this order.' });
    }

    // Terminal already: just report, do not re-query the provider.
    if (['PAID', 'REFUNDED', 'PARTIALLY_REFUNDED'].includes(payment.status)) {
      return res.json({
        order: await getOrderById(orderId),
        tracking: await getOrderByTrackingToken(token),
        paymentStatus: payment.status,
        changed: false,
      });
    }

    const driver = getPaymentDriver();
    const verification = await driver.verifyPayment(payment.providerPaymentId);
    const result = await applyPaymentVerification(orderId, payment.id, verification, {
      name: 'payment-callback',
    });

    if (result.reason === 'AMOUNT_MISMATCH') {
      return res.status(409).json({
        error: 'The amount captured does not match the order total. ' +
               'The order has not been marked as paid — please contact support.',
        code: 'AMOUNT_MISMATCH',
      });
    }

    return res.json({
      order: await getOrderById(orderId),
      tracking: await getOrderByTrackingToken(token),
      paymentStatus: verification.status,
      failureReason: verification.failureReason,
      changed: result.changed,
    });
  } catch (err) {
    return sendError(res, err, 'Could not confirm the payment.');
  }
});

/**
 * POST /api/payments/webhook/:provider
 * Provider-to-provider notification. Signature-checked, then deduplicated by
 * a UNIQUE (provider, eventKey) insert so retries are processed exactly once.
 */
publicCommerceRouter.post('/payments/webhook/:provider', async (req: Request, res: Response) => {
  const providerName = paramStr(req.params.provider).toUpperCase();

  try {
    const driver = getPaymentDriver();
    if (driver.name !== providerName) {
      return res.status(400).json({ error: `Provider ${providerName} is not active.` });
    }

    // express.json's `verify` hook stashes the untouched bytes; signatures are
    // computed over those, never over a re-serialised object.
    const rawBody: string =
      (req as any).rawBody ?? JSON.stringify(req.body ?? {});

    const parsed = driver.parseWebhook(
      req.headers as Record<string, any>,
      rawBody
    );

    if (!parsed.ok) {
      console.warn('[webhook] rejected:', parsed.error);
      return res.status(401).json({ error: 'Webhook rejected.' });
    }

    // Dedupe gate.
    const eventId = crypto.randomUUID();
    const claim = await query(
      `INSERT INTO "WebhookEvent"
         ("id","provider","eventKey","eventType","payload")
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT ("provider","eventKey") DO NOTHING
       RETURNING "id"`,
      [
        eventId, driver.name, parsed.eventKey!, parsed.eventType ?? null,
        JSON.stringify(parsed.raw ?? {}),
      ]
    );

    if (claim.rowCount === 0) {
      // Already handled. Acknowledge so the provider stops retrying.
      return res.json({ received: true, duplicate: true });
    }

    // Resolve the order from our own records rather than the payload.
    const payRes = await query(
      `SELECT * FROM "Payment"
        WHERE "provider" = $1 AND "providerPaymentId" = $2
        ORDER BY "createdAt" DESC LIMIT 1`,
      [driver.name, parsed.providerPaymentId]
    );
    const payment = payRes.rows[0];

    if (!payment) {
      await query(
        `UPDATE "WebhookEvent" SET "processedAt" = NOW(), "resultNote" = $2 WHERE "id" = $1`,
        [eventId, 'No matching payment record.']
      );
      return res.json({ received: true, matched: false });
    }

    // Always re-verify with the provider; the payload is only a nudge.
    const verification = await driver.verifyPayment(payment.providerPaymentId);
    const result = await applyPaymentVerification(
      payment.orderId, payment.id, verification, { name: `webhook:${driver.name}` }
    );

    await query(
      `UPDATE "WebhookEvent"
          SET "processedAt" = NOW(), "orderId" = $2, "resultNote" = $3
        WHERE "id" = $1`,
      [
        eventId, payment.orderId,
        `status=${verification.status} changed=${result.changed} reason=${result.reason ?? ''}`,
      ]
    );

    return res.json({ received: true, matched: true, changed: result.changed });
  } catch (err: any) {
    console.error('[webhook] error:', err);
    // 500 invites the provider to retry, which the dedupe gate makes safe.
    return res.status(500).json({ error: 'Webhook processing failed.' });
  }
});

/**
 * GET /api/orders/track/:token
 * Login-free order tracking. The token carries 192 bits of entropy and is the
 * only credential; the response omits internal notes and payment references.
 */
publicCommerceRouter.get('/orders/track/:token', async (req: Request, res: Response) => {
  try {
    const tracking = await getOrderByTrackingToken(paramStr(req.params.token));
    if (!tracking) {
      return res.status(404).json({ error: 'No order matches that tracking reference.' });
    }
    return res.json(tracking);
  } catch (err) {
    return sendError(res, err, 'Could not load that order.');
  }
});

/** GET /api/payments/methods — which methods the active provider supports. */
publicCommerceRouter.get('/payments/methods', (_req: Request, res: Response) => {
  try {
    const driver = getPaymentDriver();
    return res.json({
      provider: driver.name,
      isTestMode: driver.isTestMode,
      methods: driver.supportedMethods,
    });
  } catch (err) {
    return sendError(res, err, 'Could not read the payment configuration.');
  }
});

// ===========================================================================
// Admin: orders
// ===========================================================================

adminCommerceRouter.get('/orders', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await listOrders({
      search: req.query.search as string,
      status: req.query.status as string,
      paymentStatus: req.query.paymentStatus as string,
      deliveryStatus: req.query.deliveryStatus as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      sortBy: req.query.sortBy as string,
      sortDir: (req.query.sortDir as any) === 'asc' ? 'asc' : 'desc',
      limit: req.query.limit ? parseInt(req.query.limit as string, 10) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string, 10) : undefined,
    });
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Could not load orders.');
  }
});

adminCommerceRouter.get('/orders/stats', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json(await getOrderStats());
  } catch (err) {
    return sendError(res, err, 'Could not load order statistics.');
  }
});

/** The status graph, so the UI offers only legal transitions. */
adminCommerceRouter.get('/orders/statuses', (_req: AuthenticatedRequest, res: Response) => {
  return res.json({ statuses: ORDER_STATUSES, transitions: ALLOWED_TRANSITIONS });
});

adminCommerceRouter.get('/orders/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const detail = await getOrderDetail(paramStr(req.params.id));
    if (!detail) return res.status(404).json({ error: 'Order not found.' });
    return res.json(detail);
  } catch (err) {
    return sendError(res, err, 'Could not load that order.');
  }
});

adminCommerceRouter.get('/orders/:id/events', async (req: AuthenticatedRequest, res: Response) => {
  try {
    return res.json({ events: await getOrderEvents(paramStr(req.params.id), true) });
  } catch (err) {
    return sendError(res, err, 'Could not load the order history.');
  }
});

/** PATCH /api/admin/orders/:id/status — approve, reject, dispatch, cancel… */
adminCommerceRouter.patch('/orders/:id/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const toStatus = String(req.body?.status || '').toUpperCase() as OrderStatus;
    const result = await transitionOrderStatus(
      paramStr(req.params.id),
      toStatus,
      actorFrom(req),
      { note: req.body?.note, reason: req.body?.reason }
    );
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Could not update the order status.');
  }
});

/** PATCH /api/admin/orders/:id/fulfilment — tracking, carrier, address. */
adminCommerceRouter.patch('/orders/:id/fulfilment', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await updateOrderFulfilment(
      paramStr(req.params.id),
      {
        trackingNumber: req.body?.trackingNumber,
        carrier: req.body?.carrier,
        deliveryStatus: req.body?.deliveryStatus,
        address: req.body?.address,
        city: req.body?.city,
        district: req.body?.district,
        postalCode: req.body?.postalCode,
        customerPhone: req.body?.customerPhone,
        addressNotes: req.body?.addressNotes,
      },
      actorFrom(req)
    );
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Could not update the shipping details.');
  }
});

adminCommerceRouter.post('/orders/:id/notes', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await addOrderNote(
      paramStr(req.params.id),
      String(req.body?.note || ''),
      actorFrom(req),
      req.body?.isInternal !== false
    );
    return res.status(201).json(result);
  } catch (err) {
    return sendError(res, err, 'Could not save the note.');
  }
});

/**
 * POST /api/admin/orders/:id/refund
 * Calls the provider first, and only records the refund if the provider
 * accepted it, so our books cannot claim a refund that never happened.
 */
adminCommerceRouter.post('/orders/:id/refund', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const orderId = paramStr(req.params.id);
    const order = await getOrderById(orderId);
    if (!order) return res.status(404).json({ error: 'Order not found.' });

    const payRes = await query(
      `SELECT * FROM "Payment"
        WHERE "orderId" = $1 AND "status" IN ('PAID','PARTIALLY_REFUNDED')
        ORDER BY "createdAt" DESC LIMIT 1`,
      [orderId]
    );
    const payment = payRes.rows[0];
    if (!payment) {
      return res.status(409).json({ error: 'This order has no captured payment to refund.' });
    }

    const refundable = Number(payment.amountHalalas) - Number(payment.refundedHalalas);
    const requested = req.body?.amount === undefined || req.body?.amount === null
      ? refundable
      : Math.round(Number(req.body.amount) * 100);

    if (!Number.isFinite(requested) || requested <= 0) {
      return res.status(400).json({ error: 'The refund amount must be greater than zero.' });
    }
    if (requested > refundable) {
      return res.status(409).json({
        error: `Refund exceeds the refundable balance of ${(refundable / 100).toFixed(2)} ${payment.currency}.`,
      });
    }

    const driver = getPaymentDriver();
    const providerResult = await driver.refund(
      payment.providerPaymentId,
      requested,
      req.body?.reason
    );

    if (providerResult.status === 'FAILED') {
      return res.status(502).json({ error: 'The payment provider refused the refund.' });
    }

    const result = await recordRefund(
      orderId,
      {
        paymentId: payment.id,
        amountHalalas: requested,
        reason: req.body?.reason ?? null,
        providerRefundId: providerResult.providerRefundId,
        status: providerResult.status,
        raw: providerResult.raw,
      },
      actorFrom(req)
    );

    return res.json({ ...result, provider: driver.name, isTestMode: driver.isTestMode });
  } catch (err) {
    return sendError(res, err, 'Could not process the refund.');
  }
});

// ===========================================================================
// Admin: inventory
// ===========================================================================

adminCommerceRouter.patch('/products/:id/stock', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await adjustProductStock(
      paramStr(req.params.id),
      Number(req.body?.stockQuantity),
      actorFrom(req),
      req.body?.note
    );
    return res.json(result);
  } catch (err) {
    return sendError(res, err, 'Could not adjust the stock level.');
  }
});

adminCommerceRouter.get('/inventory/movements', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const limit = Math.min(Math.max(parseInt(req.query.limit as string, 10) || 100, 1), 500);
    const conditions: string[] = [];
    const params: any[] = [];

    if (req.query.productId) {
      params.push(req.query.productId);
      conditions.push(`m."productId" = $${params.length}`);
    }
    if (req.query.orderId) {
      params.push(req.query.orderId);
      conditions.push(`m."orderId" = $${params.length}`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    params.push(limit);
    const rows = await query(
      `SELECT m.*, p."nameEn" AS "productName", p."sku", o."orderNumber"
         FROM "InventoryMovement" m
         LEFT JOIN "Product" p ON p."id" = m."productId"
         LEFT JOIN "Order" o   ON o."id" = m."orderId"
         ${where}
        ORDER BY m."createdAt" DESC
        LIMIT $${params.length}`,
      params
    );
    return res.json({ movements: rows.rows });
  } catch (err) {
    return sendError(res, err, 'Could not load inventory movements.');
  }
});

// ===========================================================================
// Admin: discounts
// ===========================================================================

function parseDiscountBody(body: any, isCreate: boolean) {
  const out: Record<string, any> = {};

  if (isCreate || body.code !== undefined) {
    const code = String(body.code ?? '').trim().toUpperCase();
    if (!/^[A-Z0-9_-]{3,64}$/.test(code)) {
      throw new OrderError(
        'A discount code must be 3–64 characters using letters, numbers, hyphen or underscore.',
        'INVALID_CODE'
      );
    }
    out.code = code;
  }

  if (isCreate || body.type !== undefined) {
    const type = String(body.type ?? 'PERCENT').toUpperCase();
    if (!['PERCENT', 'FIXED'].includes(type)) {
      throw new OrderError('Discount type must be PERCENT or FIXED.', 'INVALID_TYPE');
    }
    out.type = type;
  }

  if (isCreate || body.value !== undefined) {
    const value = Number(body.value);
    if (!Number.isFinite(value) || value <= 0) {
      throw new OrderError('The discount value must be greater than zero.', 'INVALID_VALUE');
    }
    const type = out.type ?? String(body.type ?? 'PERCENT').toUpperCase();
    if (type === 'PERCENT' && value > 100) {
      throw new OrderError('A percentage discount cannot exceed 100%.', 'INVALID_VALUE');
    }
    out.value = value;
  }

  const intField = (key: string, target: string, scaleToHalalas = false) => {
    if (body[key] === undefined) return;
    if (body[key] === null || body[key] === '') { out[target] = null; return; }
    const n = Number(body[key]);
    if (!Number.isFinite(n) || n < 0) {
      throw new OrderError(`"${key}" must be zero or more.`, 'INVALID_NUMBER');
    }
    out[target] = scaleToHalalas ? Math.round(n * 100) : Math.floor(n);
  };

  intField('minOrderAmount', 'minOrderHalalas', true);
  intField('maxDiscountAmount', 'maxDiscountHalalas', true);
  intField('usageLimit', 'usageLimit');
  intField('perCustomerLimit', 'perCustomerLimit');

  const dateField = (key: string) => {
    if (body[key] === undefined) return;
    if (!body[key]) { out[key] = null; return; }
    const d = new Date(body[key]);
    if (Number.isNaN(d.getTime())) {
      throw new OrderError(`"${key}" is not a valid date.`, 'INVALID_DATE');
    }
    out[key] = d.toISOString();
  };
  dateField('startsAt');
  dateField('endsAt');

  if (out.startsAt && out.endsAt && new Date(out.startsAt) > new Date(out.endsAt)) {
    throw new OrderError('The start date must come before the end date.', 'INVALID_DATE_RANGE');
  }

  if (body.descriptionEn !== undefined) out.descriptionEn = String(body.descriptionEn ?? '').slice(0, 1000) || null;
  if (body.descriptionAr !== undefined) out.descriptionAr = String(body.descriptionAr ?? '').slice(0, 1000) || null;
  if (body.isActive !== undefined) out.isActive = Boolean(body.isActive);

  if (out.minOrderHalalas === null) out.minOrderHalalas = 0;

  return out;
}

function hydrateDiscount(row: any) {
  return {
    id: row.id,
    code: row.code,
    descriptionEn: row.descriptionEn,
    descriptionAr: row.descriptionAr,
    type: row.type,
    value: Number(row.value),
    minOrderAmount: Number(row.minOrderHalalas || 0) / 100,
    maxDiscountAmount: row.maxDiscountHalalas === null ? null : Number(row.maxDiscountHalalas) / 100,
    startsAt: row.startsAt,
    endsAt: row.endsAt,
    usageLimit: row.usageLimit,
    usageCount: Number(row.usageCount || 0),
    perCustomerLimit: row.perCustomerLimit,
    isActive: row.isActive,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

adminCommerceRouter.get('/discounts', async (_req: AuthenticatedRequest, res: Response) => {
  try {
    const rows = await query(`SELECT * FROM "Discount" ORDER BY "createdAt" DESC`);
    return res.json({ discounts: rows.rows.map(hydrateDiscount) });
  } catch (err) {
    return sendError(res, err, 'Could not load discounts.');
  }
});

adminCommerceRouter.post('/discounts', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const data = parseDiscountBody(req.body, true);
    const existing = await query(
      `SELECT "id" FROM "Discount" WHERE UPPER("code") = $1`,
      [data.code]
    );
    if (existing.rows[0]) {
      return res.status(409).json({ error: `Discount code "${data.code}" already exists.` });
    }

    const id = crypto.randomUUID();
    const inserted = await query(
      `INSERT INTO "Discount"
         ("id","code","descriptionEn","descriptionAr","type","value",
          "minOrderHalalas","maxDiscountHalalas","startsAt","endsAt",
          "usageLimit","perCustomerLimit","isActive","createdByUserId")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [
        id, data.code, data.descriptionEn ?? null, data.descriptionAr ?? null,
        data.type, data.value, data.minOrderHalalas ?? 0,
        data.maxDiscountHalalas ?? null, data.startsAt ?? null, data.endsAt ?? null,
        data.usageLimit ?? null, data.perCustomerLimit ?? null,
        data.isActive ?? true, req.user?.id ?? null,
      ]
    );
    return res.status(201).json(hydrateDiscount(inserted.rows[0]));
  } catch (err) {
    return sendError(res, err, 'Could not create that discount.');
  }
});

adminCommerceRouter.put('/discounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = paramStr(req.params.id);
    const data = parseDiscountBody(req.body, false);
    const keys = Object.keys(data);
    if (keys.length === 0) {
      return res.status(400).json({ error: 'Nothing to update.' });
    }

    if (data.code) {
      const clash = await query(
        `SELECT "id" FROM "Discount" WHERE UPPER("code") = $1 AND "id" <> $2`,
        [data.code, id]
      );
      if (clash.rows[0]) {
        return res.status(409).json({ error: `Discount code "${data.code}" already exists.` });
      }
    }

    const setSql = keys.map((k, i) => `"${k}" = $${i + 2}`).join(', ');
    const updated = await query(
      `UPDATE "Discount" SET ${setSql}, "updatedAt" = NOW() WHERE "id" = $1 RETURNING *`,
      [id, ...keys.map(k => data[k])]
    );
    if (!updated.rows[0]) return res.status(404).json({ error: 'Discount not found.' });
    return res.json(hydrateDiscount(updated.rows[0]));
  } catch (err) {
    return sendError(res, err, 'Could not update that discount.');
  }
});

adminCommerceRouter.delete('/discounts/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const id = paramStr(req.params.id);
    const used = await query(
      `SELECT COUNT(*)::int AS n FROM "DiscountRedemption" WHERE "discountId" = $1`,
      [id]
    );
    // A redeemed code is part of the order record, so deactivate rather than
    // delete and break historical orders.
    if (Number(used.rows[0].n) > 0) {
      const updated = await query(
        `UPDATE "Discount" SET "isActive" = false, "updatedAt" = NOW()
          WHERE "id" = $1 RETURNING *`,
        [id]
      );
      if (!updated.rows[0]) return res.status(404).json({ error: 'Discount not found.' });
      return res.json({
        message: `This code has been used on ${used.rows[0].n} order(s), so it was deactivated instead of deleted.`,
        discount: hydrateDiscount(updated.rows[0]),
        deactivated: true,
      });
    }

    const del = await query(`DELETE FROM "Discount" WHERE "id" = $1 RETURNING "id"`, [id]);
    if (!del.rows[0]) return res.status(404).json({ error: 'Discount not found.' });
    return res.json({ message: 'Discount deleted.', deactivated: false });
  } catch (err) {
    return sendError(res, err, 'Could not delete that discount.');
  }
});
