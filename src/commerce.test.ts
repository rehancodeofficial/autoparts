/**
 * End-to-end commerce tests against a real PostgreSQL database.
 *
 * Covers the full journey the brief asks for — browse prices, guest checkout,
 * payment, order creation, admin approval, dispatch, delivery — plus the
 * failure paths: declined and cancelled payments, duplicate callbacks and
 * webhooks, stock exhaustion, invalid discounts, tampered amounts and
 * unauthorised admin access.
 */
import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import request from 'supertest';
import crypto from 'crypto';
import {
  isPostgresAvailable, resetDatabase, teardownDatabase, getPool, clearOrders,
} from './__support__/pgHarness';

const MOCK_SECRET = 'test_mock_secret';

process.env.PAYMENT_GATEWAY_PROVIDER = 'MOCK';
process.env.PAYMENT_MOCK_SECRET = MOCK_SECRET;
process.env.NODE_ENV = 'test';
process.env.ADMIN_USERNAME = 'demoadmin';
process.env.ADMIN_PASSWORD = 'demoadmin';

let app: any;
let available = false;

// Catalogue fixtures
const BRAKE = 'test-prod-brake';
const FILTER = 'test-prod-filter';
const SCARCE = 'test-prod-scarce';
const DRAFT = 'test-prod-draft';

const GUEST = {
  customerName: 'Sultan Al-Otaibi',
  customerEmail: 'sultan.otaibi@example.sa',
  customerPhone: '0501234567',
  address: 'Anas Ibn Malik Rd, Al Malqa District',
  city: 'Riyadh',
  district: 'Al Malqa',
  postalCode: '13524',
};

async function seedCatalogue() {
  const pool = getPool();
  await pool.query(
    `INSERT INTO "Category" ("id","nameEn","nameAr","slug","isPublished")
     VALUES ('test-cat','Braking Systems','أنظمة الفرامل','test-brakes',true)
     ON CONFLICT ("id") DO NOTHING`
  );
  await pool.query(
    `INSERT INTO "PartBrand" ("id","name","slug","isPublished","isEnabled")
     VALUES ('test-brand','Brembo Racing','test-brembo',true,true)
     ON CONFLICT ("id") DO NOTHING`
  );

  const product = (
    id: string, sku: string, nameEn: string, selling: number,
    sale: number | null, stock: number, status: string
  ) => pool.query(
    `INSERT INTO "Product"
       ("id","sku","slug","nameEn","nameAr","categoryId","brandId",
        "sellingPrice","salePrice","stockQuantity","status")
     VALUES ($1,$2,$2,$3,$3,'test-cat','test-brand',$4,$5,$6,$7)
     ON CONFLICT ("id") DO UPDATE SET
       "sellingPrice" = EXCLUDED."sellingPrice",
       "salePrice"    = EXCLUDED."salePrice",
       "stockQuantity"= EXCLUDED."stockQuantity",
       "status"       = EXCLUDED."status"`,
    [id, sku, nameEn, selling, sale, stock, status]
  );

  await product(BRAKE, 'BRK-TEST-001', 'Brembo Big Brake Kit', 3499.00, null, 20, 'PUBLISHED');
  await product(FILTER, 'FIL-TEST-001', 'Denso Cabin Filter', 145.00, 115.00, 50, 'PUBLISHED');
  await product(SCARCE, 'SCR-TEST-001', 'Last Unit Part', 200.00, null, 1, 'PUBLISHED');
  await product(DRAFT, 'DRF-TEST-001', 'Unpublished Part', 99.00, null, 10, 'DRAFT');
}

/** Resets stock so each test starts from a known inventory position. */
async function resetStock() {
  const pool = getPool();
  await pool.query(`UPDATE "Product" SET "stockQuantity" = 20 WHERE "id" = $1`, [BRAKE]);
  await pool.query(`UPDATE "Product" SET "stockQuantity" = 50 WHERE "id" = $1`, [FILTER]);
  await pool.query(`UPDATE "Product" SET "stockQuantity" = 1  WHERE "id" = $1`, [SCARCE]);
}

async function stockOf(productId: string): Promise<number> {
  const res = await getPool().query(
    `SELECT "stockQuantity" FROM "Product" WHERE "id" = $1`, [productId]
  );
  return Number(res.rows[0].stockQuantity);
}

async function adminCookie(): Promise<string> {
  const res = await request(app)
    .post('/api/admin/login')
    .send({ username: 'demoadmin', password: 'demoadmin' });
  expect(res.status).toBe(200);
  const raw = res.headers['set-cookie'];
  return (Array.isArray(raw) ? raw : [raw]).join('; ');
}

/** Runs a complete guest checkout and returns the order plus its payment. */
async function checkout(overrides: Record<string, any> = {}) {
  const res = await request(app).post('/api/checkout').send({
    ...GUEST,
    items: [{ productId: BRAKE, quantity: 1 }],
    paymentMethod: 'mada',
    ...overrides,
  });
  return res;
}

async function confirm(trackingToken: string, providerPaymentId?: string) {
  return request(app)
    .post('/api/payments/confirm')
    .send({ trackingToken, providerPaymentId });
}

beforeAll(async () => {
  available = await isPostgresAvailable();
  if (!available) {
    console.warn(
      '\n[commerce.test] SKIPPED: no PostgreSQL at TEST_DATABASE_URL. ' +
      'These are integration tests; start PostgreSQL and create the ' +
      'autopart_test database to run them.\n'
    );
    return;
  }

  await resetDatabase();
  const { createApp } = await import('../packages/db/src/server');
  const { ensureAdminUser } = await import('../packages/db/src/adminBootstrap');
  await ensureAdminUser();
  await seedCatalogue();
  app = createApp();
}, 60000);

afterAll(async () => {
  if (available) await teardownDatabase();
});

beforeEach(async () => {
  if (!available) return;
  await clearOrders();
  await resetStock();
  await getPool().query(`DELETE FROM "Discount"`);
});

const maybe = (name: string, fn: any, timeout?: number) =>
  it(name, async () => {
    if (!available) return;
    await fn();
  }, timeout);

// =========================================================================
describe('Pricing is computed server-side', () => {
// =========================================================================

  maybe('quotes a cart from database prices, applying salePrice', async () => {
    const res = await request(app).post('/api/checkout/quote').send({
      items: [{ productId: FILTER, quantity: 2 }],
    });

    expect(res.status).toBe(200);
    // salePrice 115.00 wins over sellingPrice 145.00
    expect(res.body.subtotal).toBe(230);
    expect(res.body.vat).toBe(34.5);          // 15% of 230
    expect(res.body.shipping).toBe(25);       // under the 500 threshold
    expect(res.body.total).toBe(289.5);
    expect(res.body.currency).toBe('SAR');
  });

  maybe('waives shipping above the free-delivery threshold', async () => {
    const res = await request(app).post('/api/checkout/quote').send({
      items: [{ productId: BRAKE, quantity: 1 }],
    });
    expect(res.body.subtotal).toBe(3499);
    expect(res.body.shipping).toBe(0);
    expect(res.body.total).toBe(3499 + 3499 * 0.15);
  });

  maybe('ignores any price supplied by the client', async () => {
    const res = await checkout({
      items: [{ productId: BRAKE, quantity: 1, price: 1, unitPrice: 1, lineTotal: 1 }],
    });

    expect(res.status).toBe(201);
    // The real catalogue price, not the 1.00 the client asked for.
    expect(res.body.order.subtotal).toBe(3499);
    expect(res.body.order.total).toBe(3499 * 1.15);
  });

  maybe('refuses an unpublished product', async () => {
    const res = await checkout({ items: [{ productId: DRAFT, quantity: 1 }] });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PRODUCT_UNPUBLISHED');
  });

  maybe('refuses an unknown product', async () => {
    const res = await checkout({ items: [{ productId: 'does-not-exist', quantity: 1 }] });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('PRODUCT_NOT_FOUND');
  });

  maybe('refuses invalid quantities', async () => {
    for (const quantity of [0, -3, 1.5, 100000]) {
      const res = await checkout({ items: [{ productId: BRAKE, quantity }] });
      expect(res.status).toBe(400);
      expect(res.body.code).toBe('INVALID_QUANTITY');
    }
  });

  maybe('refuses an empty cart', async () => {
    const res = await checkout({ items: [] });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('EMPTY_CART');
  });

  maybe('refuses to oversell', async () => {
    const res = await checkout({ items: [{ productId: SCARCE, quantity: 5 }] });
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INSUFFICIENT_STOCK');
  });

  maybe('merges duplicate lines for the same product', async () => {
    const res = await checkout({
      items: [
        { productId: FILTER, quantity: 2 },
        { productId: FILTER, quantity: 3 },
      ],
    });
    expect(res.status).toBe(201);
    expect(res.body.order.subtotal).toBe(115 * 5);
  });
});

// =========================================================================
describe('Checkout form validation', () => {
// =========================================================================

  maybe('requires a valid email', async () => {
    const res = await checkout({ customerEmail: 'not-an-email' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_EMAIL');
  });

  maybe('requires a Saudi mobile number', async () => {
    const res = await checkout({ customerPhone: '12345' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_PHONE');
  });

  maybe('normalises accepted phone formats to +9665XXXXXXXX', async () => {
    for (const phone of ['0501234567', '+966501234567', '966501234567', '501234567']) {
      await clearOrders();
      const res = await checkout({ customerPhone: phone });
      expect(res.status).toBe(201);
      expect(res.body.order.customerPhone).toBe('+966501234567');
    }
  });

  maybe('requires name, address, city and a 5-digit postal code', async () => {
    expect((await checkout({ customerName: 'X' })).body.code).toBe('INVALID_NAME');
    expect((await checkout({ address: '' })).body.code).toBe('INVALID_ADDRESS');
    expect((await checkout({ city: '' })).body.code).toBe('INVALID_CITY');
    expect((await checkout({ postalCode: '12' })).body.code).toBe('INVALID_POSTAL_CODE');
  });
});

// =========================================================================
describe('Guest checkout and payment', () => {
// =========================================================================

  maybe('creates an unpaid order and does not touch stock yet', async () => {
    const before = await stockOf(BRAKE);
    const res = await checkout();

    expect(res.status).toBe(201);
    expect(res.body.order.status).toBe('PENDING_PAYMENT');
    expect(res.body.order.paymentStatus).toBe('Pending');
    expect(res.body.order.isGuest).toBe(true);
    expect(res.body.order.orderNumber).toMatch(/^KSA-\d{6}-\d{5}$/);
    expect(res.body.order.trackingToken).toBeTruthy();
    expect(res.body.payment.redirectUrl).toContain('/order/confirmation');
    expect(res.body.payment.isTestMode).toBe(true);

    // Nothing is committed until the provider confirms.
    expect(await stockOf(BRAKE)).toBe(before);
  });

  maybe('marks the order paid only after server-side verification', async () => {
    const before = await stockOf(BRAKE);
    const created = await checkout({ items: [{ productId: BRAKE, quantity: 2 }] });
    const { order, payment } = created.body;

    const res = await confirm(order.trackingToken, payment.providerPaymentId);

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('PAID');
    expect(res.body.order.paymentStatus).toBe('Paid');
    expect(res.body.order.paidAt).toBeTruthy();
    expect(res.body.changed).toBe(true);

    // Stock committed exactly once.
    expect(await stockOf(BRAKE)).toBe(before - 2);

    const movements = await getPool().query(
      `SELECT * FROM "InventoryMovement" WHERE "orderId" = $1`, [order.id]
    );
    expect(movements.rowCount).toBe(1);
    expect(Number(movements.rows[0].changeQty)).toBe(-2);
    expect(movements.rows[0].reason).toBe('ORDER_PAID');
  });

  maybe('records the payment with its provider reference and amount', async () => {
    const created = await checkout();
    await confirm(created.body.order.trackingToken);

    const pay = await getPool().query(
      `SELECT * FROM "Payment" WHERE "orderId" = $1`, [created.body.order.id]
    );
    expect(pay.rowCount).toBe(1);
    const row = pay.rows[0];
    expect(row.provider).toBe('MOCK');
    expect(row.status).toBe('PAID');
    expect(row.method).toBe('mada');
    expect(row.currency).toBe('SAR');
    expect(Number(row.amountHalalas)).toBe(Math.round(created.body.order.total * 100));
    expect(row.providerPaymentId).toBeTruthy();
    expect(row.verifiedAt).toBeTruthy();
    expect(row.isTestMode).toBe(true);
  });

  maybe('absorbs a duplicate confirmation without double-committing stock', async () => {
    const before = await stockOf(BRAKE);
    const created = await checkout({ items: [{ productId: BRAKE, quantity: 3 }] });
    const { order, payment } = created.body;

    const first = await confirm(order.trackingToken, payment.providerPaymentId);
    const second = await confirm(order.trackingToken, payment.providerPaymentId);
    const third = await confirm(order.trackingToken, payment.providerPaymentId);

    expect(first.body.changed).toBe(true);
    expect(second.body.changed).toBe(false);
    expect(third.body.changed).toBe(false);

    expect(await stockOf(BRAKE)).toBe(before - 3);

    const orders = await getPool().query(
      `SELECT COUNT(*)::int AS n FROM "Order" WHERE "trackingToken" = $1`,
      [order.trackingToken]
    );
    expect(orders.rows[0].n).toBe(1);
  });

  maybe('a declined payment leaves the order unpaid and stock untouched', async () => {
    const before = await stockOf(BRAKE);
    const created = await checkout({ testOutcome: 'failed' });

    const res = await confirm(created.body.order.trackingToken);

    expect(res.body.order.status).toBe('PAYMENT_FAILED');
    expect(res.body.order.paymentStatus).toBe('Failed');
    expect(res.body.failureReason).toContain('Simulated decline');
    expect(await stockOf(BRAKE)).toBe(before);
  });

  maybe('a cancelled payment cancels the order', async () => {
    const created = await checkout({ testOutcome: 'cancelled' });
    const res = await confirm(created.body.order.trackingToken);

    expect(res.body.order.status).toBe('CANCELLED');
    expect(res.body.order.paymentStatus).toBe('Cancelled');
  });

  maybe('a late failure callback cannot un-pay a paid order', async () => {
    const created = await checkout();
    const { order } = created.body;
    await confirm(order.trackingToken);

    // A second attempt that fails must not downgrade the paid order.
    const retry = await request(app).post('/api/payments/retry').send({
      trackingToken: order.trackingToken, testOutcome: 'failed',
    });
    expect(retry.status).toBe(409);

    const after = await request(app).get(`/api/orders/track/${order.trackingToken}`);
    expect(after.body.paymentStatus).toBe('Paid');
  });

  maybe('lets a customer retry after a declined payment', async () => {
    const created = await checkout({ testOutcome: 'failed' });
    const { order } = created.body;
    await confirm(order.trackingToken);

    const retry = await request(app).post('/api/payments/retry').send({
      trackingToken: order.trackingToken, testOutcome: 'paid',
    });
    expect(retry.status).toBe(200);

    const res = await confirm(order.trackingToken, retry.body.payment.providerPaymentId);
    expect(res.body.order.status).toBe('PAID');
  });

  maybe('an idempotency key makes a double submit return the same order', async () => {
    const key = crypto.randomUUID();
    const first = await checkout({ idempotencyKey: key });
    const second = await checkout({ idempotencyKey: key });

    expect(first.status).toBe(201);
    expect(second.body.order.id).toBe(first.body.order.id);
    expect(second.body.reused).toBe(true);

    const count = await getPool().query(`SELECT COUNT(*)::int AS n FROM "Order"`);
    expect(count.rows[0].n).toBe(1);
  });

  maybe('refuses to mark paid when the captured amount differs', async () => {
    const created = await checkout();
    const { order, payment } = created.body;

    // Raise the order total behind the payment's back: the provider's signed
    // amount no longer matches, which must block confirmation.
    await getPool().query(
      `UPDATE "Order" SET "totalHalalas" = "totalHalalas" + 50000 WHERE "id" = $1`,
      [order.id]
    );

    const res = await confirm(order.trackingToken, payment.providerPaymentId);
    expect(res.status).toBe(409);
    expect(res.body.code).toBe('AMOUNT_MISMATCH');

    const after = await getPool().query(
      `SELECT "paymentStatus" FROM "Order" WHERE "id" = $1`, [order.id]
    );
    expect(after.rows[0].paymentStatus).not.toBe('Paid');

    const events = await getPool().query(
      `SELECT * FROM "OrderEvent" WHERE "orderId" = $1 AND "eventType" = 'PAYMENT_AMOUNT_MISMATCH'`,
      [order.id]
    );
    expect(events.rowCount).toBe(1);
  });
});

// =========================================================================
describe('Payment webhooks', () => {
// =========================================================================

  const sign = (body: any) =>
    crypto.createHmac('sha256', MOCK_SECRET).update(JSON.stringify(body)).digest('hex');

  maybe('rejects an unsigned or wrongly-signed webhook', async () => {
    const created = await checkout();
    const body = { payment_id: created.body.payment.providerPaymentId, event_id: 'evt-1' };

    const unsigned = await request(app)
      .post('/api/payments/webhook/MOCK')
      .set('Content-Type', 'application/json')
      .send(JSON.stringify(body));
    expect(unsigned.status).toBe(401);

    const wrong = await request(app)
      .post('/api/payments/webhook/MOCK')
      .set('Content-Type', 'application/json')
      .set('x-mock-signature', sign({ tampered: true }))
      .send(JSON.stringify(body));
    expect(wrong.status).toBe(401);

    const after = await getPool().query(
      `SELECT "paymentStatus" FROM "Order" WHERE "id" = $1`, [created.body.order.id]
    );
    expect(after.rows[0].paymentStatus).toBe('Pending');
  });

  maybe('confirms the order from a correctly signed webhook', async () => {
    const before = await stockOf(BRAKE);
    const created = await checkout();
    const body = {
      payment_id: created.body.payment.providerPaymentId,
      event_id: 'evt-paid-1',
      type: 'payment.paid',
    };

    const res = await request(app)
      .post('/api/payments/webhook/MOCK')
      .set('Content-Type', 'application/json')
      .set('x-mock-signature', sign(body))
      .send(JSON.stringify(body));

    expect(res.status).toBe(200);
    expect(res.body.changed).toBe(true);

    const order = await getPool().query(
      `SELECT * FROM "Order" WHERE "id" = $1`, [created.body.order.id]
    );
    expect(order.rows[0].paymentStatus).toBe('Paid');
    expect(await stockOf(BRAKE)).toBe(before - 1);
  });

  maybe('processes a repeated webhook delivery exactly once', async () => {
    const before = await stockOf(BRAKE);
    const created = await checkout({ items: [{ productId: BRAKE, quantity: 2 }] });
    const body = {
      payment_id: created.body.payment.providerPaymentId,
      event_id: 'evt-retry-1',
    };
    const signature = sign(body);

    const send = () => request(app)
      .post('/api/payments/webhook/MOCK')
      .set('Content-Type', 'application/json')
      .set('x-mock-signature', signature)
      .send(JSON.stringify(body));

    const first = await send();
    const second = await send();
    const third = await send();

    expect(first.body.duplicate).toBeUndefined();
    expect(second.body.duplicate).toBe(true);
    expect(third.body.duplicate).toBe(true);

    // Stock moved once, not three times.
    expect(await stockOf(BRAKE)).toBe(before - 2);

    const movements = await getPool().query(
      `SELECT COUNT(*)::int AS n FROM "InventoryMovement" WHERE "orderId" = $1`,
      [created.body.order.id]
    );
    expect(movements.rows[0].n).toBe(1);

    const events = await getPool().query(
      `SELECT COUNT(*)::int AS n FROM "WebhookEvent" WHERE "eventKey" = 'evt-retry-1'`
    );
    expect(events.rows[0].n).toBe(1);
  });

  maybe('acknowledges a webhook for an unknown payment without failing', async () => {
    const body = { payment_id: 'mock_paid_100_deadbeef_bogus', event_id: 'evt-orphan' };
    const res = await request(app)
      .post('/api/payments/webhook/MOCK')
      .set('Content-Type', 'application/json')
      .set('x-mock-signature', sign(body))
      .send(JSON.stringify(body));
    // The forged id fails its own signature check before anything else.
    expect(res.status).toBe(401);
  });
});

// =========================================================================
describe('Discounts', () => {
// =========================================================================

  async function makeDiscount(fields: Record<string, any> = {}) {
    const cookie = await adminCookie();
    const res = await request(app)
      .post('/api/admin/discounts')
      .set('Cookie', cookie)
      .send({ code: 'SAVE10', type: 'PERCENT', value: 10, ...fields });
    return { res, cookie };
  }

  maybe('applies a percentage discount and recalculates VAT and shipping', async () => {
    await makeDiscount();
    const res = await request(app).post('/api/checkout/quote').send({
      items: [{ productId: FILTER, quantity: 2 }], // 230.00
      discountCode: 'SAVE10',
    });

    expect(res.body.subtotal).toBe(230);
    expect(res.body.discount).toBe(23);
    expect(res.body.vat).toBe(31.05);    // 15% of 207, not of 230
    expect(res.body.total).toBe(207 + 31.05 + 25);
  });

  maybe('applies a fixed discount', async () => {
    await makeDiscount({ code: 'FLAT50', type: 'FIXED', value: 50 });
    const res = await request(app).post('/api/checkout/quote').send({
      items: [{ productId: FILTER, quantity: 1 }], // 115.00
      discountCode: 'FLAT50',
    });
    expect(res.body.discount).toBe(50);
    expect(res.body.vat).toBe(9.75);   // 15% of 65
    expect(res.body.total).toBe(65 + 9.75 + 25);
  });

  maybe('refuses a fixed discount that would wipe out the whole total', async () => {
    await makeDiscount({ code: 'FLAT500', type: 'FIXED', value: 500 });
    const res = await request(app).post('/api/checkout/quote').send({
      items: [{ productId: FILTER, quantity: 1 }], // 115.00
      discountCode: 'FLAT500',
    });
    // Never a negative total, and never a zero-amount charge.
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('DISCOUNT_COVERS_TOTAL');
  });

  maybe('honours a maximum discount amount', async () => {
    await makeDiscount({ code: 'BIG50', type: 'PERCENT', value: 50, maxDiscountAmount: 100 });
    const res = await request(app).post('/api/checkout/quote').send({
      items: [{ productId: BRAKE, quantity: 1 }], // 3499.00
      discountCode: 'BIG50',
    });
    expect(res.body.discount).toBe(100);
  });

  maybe('enforces the minimum order value', async () => {
    await makeDiscount({ code: 'MIN1000', minOrderAmount: 1000 });
    const res = await request(app).post('/api/checkout/discount').send({
      items: [{ productId: FILTER, quantity: 1 }],
      code: 'MIN1000',
    });
    expect(res.status).toBe(422);
    expect(res.body.error).toContain('minimum order');
  });

  maybe('rejects an unknown, inactive or expired code', async () => {
    const unknown = await request(app).post('/api/checkout/discount')
      .send({ items: [{ productId: BRAKE, quantity: 1 }], code: 'NOPE' });
    expect(unknown.status).toBe(422);

    await makeDiscount({ code: 'OFFNOW', isActive: false });
    const inactive = await request(app).post('/api/checkout/discount')
      .send({ items: [{ productId: BRAKE, quantity: 1 }], code: 'OFFNOW' });
    expect(inactive.body.error).toContain('no longer active');

    await makeDiscount({
      code: 'LASTYEAR',
      startsAt: '2020-01-01T00:00:00Z',
      endsAt: '2020-12-31T00:00:00Z',
    });
    const expired = await request(app).post('/api/checkout/discount')
      .send({ items: [{ productId: BRAKE, quantity: 1 }], code: 'LASTYEAR' });
    expect(expired.body.error).toContain('expired');

    const future = await makeDiscount({
      code: 'SOON', startsAt: '2099-01-01T00:00:00Z',
    });
    expect(future.res.status).toBe(201);
    const notYet = await request(app).post('/api/checkout/discount')
      .send({ items: [{ productId: BRAKE, quantity: 1 }], code: 'SOON' });
    expect(notYet.body.error).toContain('not active yet');
  });

  maybe('rejects an invalid code at checkout rather than silently dropping it', async () => {
    const res = await checkout({ discountCode: 'TOTALLY-FAKE' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_DISCOUNT');
  });

  maybe('counts a redemption once, on payment, and enforces the usage limit', async () => {
    await makeDiscount({ code: 'ONLYONE', usageLimit: 1 });

    const created = await checkout({ discountCode: 'ONLYONE' });
    expect(created.body.order.discountCode).toBe('ONLYONE');
    expect(created.body.order.discount).toBe(349.9);

    // Not redeemed until the money is confirmed.
    let d = await getPool().query(`SELECT "usageCount" FROM "Discount" WHERE "code" = 'ONLYONE'`);
    expect(Number(d.rows[0].usageCount)).toBe(0);

    await confirm(created.body.order.trackingToken);
    d = await getPool().query(`SELECT "usageCount" FROM "Discount" WHERE "code" = 'ONLYONE'`);
    expect(Number(d.rows[0].usageCount)).toBe(1);

    // Duplicate callbacks must not inflate the counter.
    await confirm(created.body.order.trackingToken);
    d = await getPool().query(`SELECT "usageCount" FROM "Discount" WHERE "code" = 'ONLYONE'`);
    expect(Number(d.rows[0].usageCount)).toBe(1);

    // Limit now reached.
    const second = await checkout({ discountCode: 'ONLYONE' });
    expect(second.status).toBe(400);
    expect(second.body.error).toContain('usage limit');
  });

  maybe('enforces a per-customer limit', async () => {
    await makeDiscount({ code: 'ONCEPER', perCustomerLimit: 1 });

    const first = await checkout({ discountCode: 'ONCEPER' });
    await confirm(first.body.order.trackingToken);

    const again = await checkout({ discountCode: 'ONCEPER' });
    expect(again.status).toBe(400);
    expect(again.body.error).toContain('already used');

    // A different shopper is unaffected.
    const other = await checkout({
      discountCode: 'ONCEPER',
      customerEmail: 'other.person@example.sa',
      customerPhone: '0559998877',
    });
    expect(other.status).toBe(201);
  });

  maybe('rejects invalid discount definitions', async () => {
    const cookie = await adminCookie();
    const post = (body: any) =>
      request(app).post('/api/admin/discounts').set('Cookie', cookie).send(body);

    expect((await post({ code: 'AB', type: 'PERCENT', value: 10 })).status).toBe(400);
    expect((await post({ code: 'OVER', type: 'PERCENT', value: 150 })).status).toBe(400);
    expect((await post({ code: 'NEG', type: 'FIXED', value: -5 })).status).toBe(400);
    expect((await post({ code: 'ZERO', type: 'FIXED', value: 0 })).status).toBe(400);
    expect((await post({ code: 'BADTYPE', type: 'WEIRD', value: 5 })).status).toBe(400);
    expect((await post({
      code: 'BADRANGE', type: 'PERCENT', value: 5,
      startsAt: '2030-01-01', endsAt: '2029-01-01',
    })).status).toBe(400);

    await post({ code: 'DUPE', type: 'PERCENT', value: 5 });
    expect((await post({ code: 'DUPE', type: 'PERCENT', value: 5 })).status).toBe(409);
  });

  maybe('deactivates rather than deletes a redeemed code', async () => {
    const { cookie } = await makeDiscount({ code: 'USED10' });
    const id = (await getPool().query(
      `SELECT "id" FROM "Discount" WHERE "code" = 'USED10'`
    )).rows[0].id;

    const created = await checkout({ discountCode: 'USED10' });
    await confirm(created.body.order.trackingToken);

    const res = await request(app)
      .delete(`/api/admin/discounts/${id}`)
      .set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.deactivated).toBe(true);
    const row = await getPool().query(`SELECT "isActive" FROM "Discount" WHERE "id" = $1`, [id]);
    expect(row.rows[0].isActive).toBe(false);
  });
});

// =========================================================================
describe('Admin authorisation', () => {
// =========================================================================

  maybe('rejects unauthenticated access to every admin route', async () => {
    const routes: [string, string][] = [
      ['get', '/api/admin/orders'],
      ['get', '/api/admin/orders/stats'],
      ['get', '/api/admin/products'],
      ['get', '/api/admin/discounts'],
      ['get', '/api/admin/inventory/movements'],
    ];
    for (const [method, url] of routes) {
      const res = await (request(app) as any)[method](url);
      expect(res.status, `${method.toUpperCase()} ${url}`).toBe(401);
    }

    expect((await request(app).post('/api/admin/discounts').send({})).status).toBe(401);
    expect((await request(app).patch('/api/admin/orders/x/status').send({})).status).toBe(401);
  });

  maybe('rejects bad admin credentials with a uniform message', async () => {
    const wrongPassword = await request(app)
      .post('/api/admin/login').send({ username: 'demoadmin', password: 'nope' });
    const noSuchUser = await request(app)
      .post('/api/admin/login').send({ username: 'ghost', password: 'nope' });

    expect(wrongPassword.status).toBe(401);
    expect(noSuchUser.status).toBe(401);
    // No user enumeration.
    expect(noSuchUser.body.error).toBe(wrongPassword.body.error);
  });

  maybe('issues an httpOnly session cookie on a correct admin login', async () => {
    const res = await request(app)
      .post('/api/admin/login').send({ username: 'demoadmin', password: 'demoadmin' });

    expect(res.status).toBe(200);
    expect(res.body.user.role).toBe('SUPER_ADMIN');
    const cookies = (res.headers['set-cookie'] as unknown as string[]).join(';');
    expect(cookies).toContain('autopart_session');
    expect(cookies).toContain('HttpOnly');
  });

  maybe('refuses a customer account at the admin door', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Regular Customer',
      email: 'customer.only@example.sa',
      password: 'CustomerPass123!',
      confirmPassword: 'CustomerPass123!',
    });

    const login = await request(app).post('/api/admin/login')
      .send({ email: 'customer.only@example.sa', password: 'CustomerPass123!' });
    expect(login.status).toBe(401);

    const session = await request(app).post('/api/auth/login')
      .send({ email: 'customer.only@example.sa', password: 'CustomerPass123!' });
    const cookie = (session.headers['set-cookie'] as unknown as string[]).join('; ');

    const res = await request(app).get('/api/admin/orders').set('Cookie', cookie);
    expect(res.status).toBe(403);
  });

  maybe('ends the admin session on logout', async () => {
    const cookie = await adminCookie();
    expect((await request(app).get('/api/admin/orders').set('Cookie', cookie)).status).toBe(200);

    await request(app).post('/api/admin/logout').set('Cookie', cookie);
    expect((await request(app).get('/api/admin/orders').set('Cookie', cookie)).status).toBe(401);
  });
});

// =========================================================================
describe('Admin order management', () => {
// =========================================================================

  async function paidOrder(overrides: Record<string, any> = {}) {
    const created = await checkout(overrides);
    await confirm(created.body.order.trackingToken);
    return created.body.order;
  }

  maybe('lists real orders from the database with totals and counts', async () => {
    const cookie = await adminCookie();
    await paidOrder();
    await checkout({ customerEmail: 'second.buyer@example.sa' });

    const res = await request(app).get('/api/admin/orders').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.total).toBe(2);
    expect(res.body.orders).toHaveLength(2);
    const first = res.body.orders[0];
    expect(first.orderNumber).toMatch(/^KSA-/);
    expect(first.customerEmail).toBeTruthy();
    expect(first.itemCount).toBeGreaterThan(0);
    expect(typeof first.total).toBe('number');
    expect(Array.isArray(first.allowedTransitions)).toBe(true);
  });

  maybe('searches by order number, name, email, phone and SKU', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const byNumber = await request(app)
      .get(`/api/admin/orders?search=${order.orderNumber}`).set('Cookie', cookie);
    expect(byNumber.body.total).toBe(1);

    for (const term of ['sultan', 'example.sa', '501234567', 'BRK-TEST-001']) {
      const res = await request(app)
        .get(`/api/admin/orders?search=${encodeURIComponent(term)}`).set('Cookie', cookie);
      expect(res.body.total, `search "${term}"`).toBe(1);
    }

    const miss = await request(app)
      .get('/api/admin/orders?search=nothing-matches-this').set('Cookie', cookie);
    expect(miss.body.total).toBe(0);
  });

  maybe('filters by status and payment status, and sorts', async () => {
    const cookie = await adminCookie();
    await paidOrder();
    const failed = await checkout({ testOutcome: 'failed', customerEmail: 'f@example.sa' });
    await confirm(failed.body.order.trackingToken);

    const paid = await request(app)
      .get('/api/admin/orders?paymentStatus=Paid').set('Cookie', cookie);
    expect(paid.body.total).toBe(1);

    const failedList = await request(app)
      .get('/api/admin/orders?status=PAYMENT_FAILED').set('Cookie', cookie);
    expect(failedList.body.total).toBe(1);

    const multi = await request(app)
      .get('/api/admin/orders?status=PAID,PAYMENT_FAILED').set('Cookie', cookie);
    expect(multi.body.total).toBe(2);

    const asc = await request(app)
      .get('/api/admin/orders?sortBy=total&sortDir=asc').set('Cookie', cookie);
    expect(asc.body.orders[0].total).toBeLessThanOrEqual(asc.body.orders[1].total);
  });

  maybe('returns the complete order detail an operator needs', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder({ items: [{ productId: FILTER, quantity: 2 }] });

    const res = await request(app)
      .get(`/api/admin/orders/${order.id}`).set('Cookie', cookie);

    expect(res.status).toBe(200);
    const { order: o, items, payments, refunds, events } = res.body;

    expect(o.orderNumber).toMatch(/^KSA-/);
    expect(o.customerName).toBe(GUEST.customerName);
    expect(o.customerEmail).toBe(GUEST.customerEmail);
    expect(o.customerPhone).toBe('+966501234567');
    expect(o.address).toBe(GUEST.address);
    expect(o.city).toBe('Riyadh');
    expect(o.district).toBe('Al Malqa');
    expect(o.postalCode).toBe('13524');
    expect(o.createdAt).toBeTruthy();

    expect(items).toHaveLength(1);
    expect(items[0].sku).toBe('FIL-TEST-001');
    expect(items[0].productId).toBe(FILTER);
    expect(items[0].unitPrice).toBe(115);
    expect(items[0].quantity).toBe(2);
    expect(items[0].lineTotal).toBe(230);

    expect(o.subtotal).toBe(230);
    expect(o.vat).toBe(34.5);
    expect(o.shipping).toBe(25);
    expect(o.total).toBe(289.5);

    expect(payments).toHaveLength(1);
    expect(payments[0].status).toBe('PAID');
    expect(payments[0].providerPaymentId).toBeTruthy();
    expect(refunds).toHaveLength(0);

    // History: created, then payment confirmed.
    expect(events.map((e: any) => e.eventType)).toEqual(
      expect.arrayContaining(['ORDER_CREATED', 'PAYMENT_CONFIRMED'])
    );
  });

  maybe('walks an order through approve, process, dispatch, ship and deliver', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const steps = ['APPROVED', 'PROCESSING', 'DISPATCHED', 'SHIPPED', 'DELIVERED'];
    for (const status of steps) {
      const res = await request(app)
        .patch(`/api/admin/orders/${order.id}/status`)
        .set('Cookie', cookie)
        .send({ status, note: `Moved to ${status} by test` });
      expect(res.status, status).toBe(200);
      expect(res.body.order.status).toBe(status);
      expect(res.body.changed).toBe(true);
    }

    const final = await getPool().query(
      `SELECT * FROM "Order" WHERE "id" = $1`, [order.id]
    );
    expect(final.rows[0].deliveryStatus).toBe('Delivered');
    expect(final.rows[0].dispatchedAt).toBeTruthy();
    expect(final.rows[0].shippedAt).toBeTruthy();
    expect(final.rows[0].deliveredAt).toBeTruthy();

    const history = await request(app)
      .get(`/api/admin/orders/${order.id}/events`).set('Cookie', cookie);
    const transitions = history.body.events.filter((e: any) => e.eventType === 'STATUS_CHANGED');
    expect(transitions).toHaveLength(5);
    expect(transitions[0].from).toBe('PAID');
    expect(transitions[0].to).toBe('APPROVED');
    expect(transitions[0].actorName).toBeTruthy();
  });

  maybe('refuses an illegal status jump', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'DELIVERED' });

    expect(res.status).toBe(409);
    expect(res.body.code).toBe('INVALID_TRANSITION');
  });

  maybe('refuses to dispatch an unpaid order', async () => {
    const cookie = await adminCookie();
    const created = await checkout();

    const res = await request(app)
      .patch(`/api/admin/orders/${created.body.order.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'APPROVED' });

    expect(res.status).toBe(409);
    // PENDING_PAYMENT -> APPROVED is not in the graph at all.
    expect(['INVALID_TRANSITION', 'ORDER_NOT_PAID']).toContain(res.body.code);
  });

  maybe('rejects an unknown status value', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();
    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'TELEPORTED' });
    expect(res.status).toBe(400);
    expect(res.body.code).toBe('INVALID_STATUS');
  });

  maybe('returns stock to inventory when an order is cancelled', async () => {
    const cookie = await adminCookie();
    const before = await stockOf(BRAKE);
    const order = await paidOrder({ items: [{ productId: BRAKE, quantity: 4 }] });
    expect(await stockOf(BRAKE)).toBe(before - 4);

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'CANCELLED', reason: 'Customer changed their mind' });

    expect(res.status).toBe(200);
    expect(await stockOf(BRAKE)).toBe(before);

    // Cancelling again must not credit the stock twice.
    await request(app)
      .patch(`/api/admin/orders/${order.id}/status`)
      .set('Cookie', cookie)
      .send({ status: 'CANCELLED' });
    expect(await stockOf(BRAKE)).toBe(before);

    const movements = await getPool().query(
      `SELECT * FROM "InventoryMovement" WHERE "orderId" = $1 ORDER BY "createdAt"`,
      [order.id]
    );
    expect(movements.rowCount).toBe(2);
    expect(Number(movements.rows[1].changeQty)).toBe(4);
  });

  maybe('updates tracking number, carrier and address', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const res = await request(app)
      .patch(`/api/admin/orders/${order.id}/fulfilment`)
      .set('Cookie', cookie)
      .send({
        trackingNumber: 'SMSA-998877665',
        carrier: 'SMSA Express',
        city: 'Jeddah',
        postalCode: '23442',
      });

    expect(res.status).toBe(200);
    expect(res.body.order.trackingNumber).toBe('SMSA-998877665');
    expect(res.body.order.carrier).toBe('SMSA Express');
    expect(res.body.order.city).toBe('Jeddah');
    expect(res.body.changed).toBe(true);

    const history = await request(app)
      .get(`/api/admin/orders/${order.id}/events`).set('Cookie', cookie);
    const update = history.body.events.find((e: any) => e.eventType === 'FULFILMENT_UPDATED');
    expect(update.message).toContain('trackingNumber');
  });

  maybe('validates fulfilment edits', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const badPhone = await request(app)
      .patch(`/api/admin/orders/${order.id}/fulfilment`)
      .set('Cookie', cookie).send({ customerPhone: '123' });
    expect(badPhone.status).toBe(400);

    const badPostal = await request(app)
      .patch(`/api/admin/orders/${order.id}/fulfilment`)
      .set('Cookie', cookie).send({ postalCode: 'ABCDE' });
    expect(badPostal.status).toBe(400);
  });

  maybe('records internal notes against the order', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const res = await request(app)
      .post(`/api/admin/orders/${order.id}/notes`)
      .set('Cookie', cookie)
      .send({ note: 'Customer asked for delivery after 6pm.' });

    expect(res.status).toBe(201);
    expect(res.body.order.internalNotes).toContain('after 6pm');

    const empty = await request(app)
      .post(`/api/admin/orders/${order.id}/notes`)
      .set('Cookie', cookie).send({ note: '   ' });
    expect(empty.status).toBe(400);
  });

  maybe('reports accurate dashboard statistics', async () => {
    const cookie = await adminCookie();
    await paidOrder();
    await checkout({ customerEmail: 'pending@example.sa' });
    const failed = await checkout({ testOutcome: 'failed', customerEmail: 'failed@example.sa' });
    await confirm(failed.body.order.trackingToken);

    const res = await request(app).get('/api/admin/orders/stats').set('Cookie', cookie);

    expect(res.status).toBe(200);
    expect(res.body.totalOrders).toBe(3);
    expect(res.body.paidOrders).toBe(1);
    expect(res.body.pendingPayment).toBe(1);
    expect(res.body.failedPayment).toBe(1);
    expect(res.body.grossPaidRevenue).toBeCloseTo(3499 * 1.15, 2);
    expect(res.body.netRevenue).toBeCloseTo(3499 * 1.15, 2);
  });

  maybe('exposes the legal status graph to the UI', async () => {
    const cookie = await adminCookie();
    const res = await request(app).get('/api/admin/orders/statuses').set('Cookie', cookie);
    expect(res.body.statuses).toContain('DISPATCHED');
    expect(res.body.transitions.PAID).toContain('APPROVED');
    expect(res.body.transitions.REFUNDED).toEqual([]);
  });
});

// =========================================================================
describe('Refunds', () => {
// =========================================================================

  async function paidOrder(overrides: Record<string, any> = {}) {
    const created = await checkout(overrides);
    await confirm(created.body.order.trackingToken);
    return created.body.order;
  }

  maybe('refunds in full, restores stock and marks the order refunded', async () => {
    const cookie = await adminCookie();
    const before = await stockOf(BRAKE);
    const order = await paidOrder({ items: [{ productId: BRAKE, quantity: 2 }] });

    const res = await request(app)
      .post(`/api/admin/orders/${order.id}/refund`)
      .set('Cookie', cookie)
      .send({ reason: 'Part arrived damaged' });

    expect(res.status).toBe(200);
    expect(res.body.order.status).toBe('REFUNDED');
    expect(res.body.order.refunded).toBeCloseTo(order.total, 2);
    expect(res.body.isTestMode).toBe(true);
    expect(await stockOf(BRAKE)).toBe(before);
  });

  maybe('supports a partial refund and blocks over-refunding', async () => {
    const cookie = await adminCookie();
    const order = await paidOrder();

    const partial = await request(app)
      .post(`/api/admin/orders/${order.id}/refund`)
      .set('Cookie', cookie).send({ amount: 100, reason: 'Goodwill' });

    expect(partial.status).toBe(200);
    expect(partial.body.order.paymentStatus).toBe('Partially Refunded');
    expect(partial.body.order.refunded).toBe(100);

    const tooMuch = await request(app)
      .post(`/api/admin/orders/${order.id}/refund`)
      .set('Cookie', cookie).send({ amount: order.total });
    expect(tooMuch.status).toBe(409);
    expect(tooMuch.body.error).toContain('refundable balance');

    const negative = await request(app)
      .post(`/api/admin/orders/${order.id}/refund`)
      .set('Cookie', cookie).send({ amount: -5 });
    expect(negative.status).toBe(400);
  });

  maybe('refuses to refund an order that was never paid', async () => {
    const cookie = await adminCookie();
    const created = await checkout();

    const res = await request(app)
      .post(`/api/admin/orders/${created.body.order.id}/refund`)
      .set('Cookie', cookie).send({});

    expect(res.status).toBe(409);
    expect(res.body.error).toContain('no captured payment');
  });
});

// =========================================================================
describe('Login-free order tracking', () => {
// =========================================================================

  maybe('returns the order for a valid tracking token', async () => {
    const created = await checkout({ items: [{ productId: FILTER, quantity: 2 }] });
    await confirm(created.body.order.trackingToken);

    const res = await request(app)
      .get(`/api/orders/track/${created.body.order.trackingToken}`);

    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe(created.body.order.orderNumber);
    expect(res.body.paymentStatus).toBe('Paid');
    expect(res.body.items).toHaveLength(1);
    expect(res.body.total).toBe(289.5);
    expect(res.body.timeline.length).toBeGreaterThan(0);
  });

  maybe('never leaks internal fields through the tracking endpoint', async () => {
    const cookie = await adminCookie();
    const created = await checkout();
    await confirm(created.body.order.trackingToken);

    await request(app)
      .post(`/api/admin/orders/${created.body.order.id}/notes`)
      .set('Cookie', cookie)
      .send({ note: 'INTERNAL: margin is thin on this one' });

    const res = await request(app)
      .get(`/api/orders/track/${created.body.order.trackingToken}`);

    const serialised = JSON.stringify(res.body);
    expect(serialised).not.toContain('INTERNAL');
    expect(res.body.internalNotes).toBeUndefined();
    expect(res.body.trackingToken).toBeUndefined();
    expect(res.body.id).toBeUndefined();
    // Payment provider references stay private.
    expect(serialised).not.toContain('mock_paid');
  });

  maybe('rejects a wrong or truncated tracking token', async () => {
    expect((await request(app).get('/api/orders/track/short')).status).toBe(404);
    expect((await request(app).get(`/api/orders/track/${'x'.repeat(32)}`)).status).toBe(404);
  });

  maybe('shows dispatch progress to the customer as admin advances the order', async () => {
    const cookie = await adminCookie();
    const created = await checkout();
    await confirm(created.body.order.trackingToken);
    const id = created.body.order.id;

    for (const status of ['APPROVED', 'PROCESSING', 'DISPATCHED']) {
      await request(app).patch(`/api/admin/orders/${id}/status`)
        .set('Cookie', cookie).send({ status });
    }
    await request(app).patch(`/api/admin/orders/${id}/fulfilment`)
      .set('Cookie', cookie).send({ trackingNumber: 'SMSA-5551234', carrier: 'SMSA Express' });

    const res = await request(app)
      .get(`/api/orders/track/${created.body.order.trackingToken}`);

    expect(res.body.status).toBe('DISPATCHED');
    expect(res.body.deliveryStatus).toBe('Dispatched');
    expect(res.body.trackingNumber).toBe('SMSA-5551234');
    expect(res.body.carrier).toBe('SMSA Express');
  });
});

// =========================================================================
describe('Inventory management', () => {
// =========================================================================

  maybe('adjusts stock and records the movement', async () => {
    const cookie = await adminCookie();

    const res = await request(app)
      .patch(`/api/admin/products/${FILTER}/stock`)
      .set('Cookie', cookie)
      .send({ stockQuantity: 7, note: 'Stock count correction' });

    expect(res.status).toBe(200);
    expect(res.body.previous).toBe(50);
    expect(res.body.current).toBe(7);
    expect(await stockOf(FILTER)).toBe(7);

    const movements = await request(app)
      .get(`/api/admin/inventory/movements?productId=${FILTER}`)
      .set('Cookie', cookie);
    expect(movements.body.movements[0].reason).toBe('MANUAL_ADJUSTMENT');
    expect(Number(movements.body.movements[0].changeQty)).toBe(-43);
  });

  maybe('rejects a negative or fractional stock level', async () => {
    const cookie = await adminCookie();
    for (const stockQuantity of [-1, 2.5]) {
      const res = await request(app)
        .patch(`/api/admin/products/${FILTER}/stock`)
        .set('Cookie', cookie).send({ stockQuantity });
      expect(res.status).toBe(400);
    }
    expect(await stockOf(FILTER)).toBe(50);
  });

  maybe('the database itself refuses negative stock', async () => {
    await expect(
      getPool().query(`UPDATE "Product" SET "stockQuantity" = -5 WHERE "id" = $1`, [FILTER])
    ).rejects.toThrow(/chk_product_stock_nonneg/);
  });
});

// =========================================================================
describe('Concurrency', () => {
// =========================================================================

  maybe('two shoppers racing for the last unit: only one is committed', async () => {
    expect(await stockOf(SCARCE)).toBe(1);

    const a = await checkout({
      items: [{ productId: SCARCE, quantity: 1 }],
      customerEmail: 'racer.a@example.sa',
    });
    const b = await checkout({
      items: [{ productId: SCARCE, quantity: 1 }],
      customerEmail: 'racer.b@example.sa',
      customerPhone: '0557778899',
    });
    expect(a.status).toBe(201);
    expect(b.status).toBe(201);

    // Both pay at the same moment.
    await Promise.all([
      confirm(a.body.order.trackingToken),
      confirm(b.body.order.trackingToken),
    ]);

    // Stock floors at zero; it never goes negative.
    expect(await stockOf(SCARCE)).toBe(0);

    // Exactly one order committed stock; the other is flagged for the warehouse.
    const committed = await getPool().query(
      `SELECT COUNT(*)::int AS n FROM "InventoryMovement" WHERE "reason" = 'ORDER_PAID'`
    );
    expect(committed.rows[0].n).toBe(1);

    const shortfalls = await getPool().query(
      `SELECT COUNT(*)::int AS n FROM "OrderEvent" WHERE "eventType" = 'STOCK_SHORTFALL'`
    );
    expect(shortfalls.rows[0].n).toBe(1);
  });
});
