/**
 * Payment provider abstraction.
 *
 * Every provider implements the same four operations, so the checkout and
 * webhook routes never contain provider-specific logic:
 *
 *   createPayment  — open a charge/session and hand back a redirect URL
 *   verifyPayment  — ask the provider, server to server, what really happened
 *   refund         — refund all or part of a captured payment
 *   parseWebhook   — authenticate a callback and normalise its payload
 *
 * An order is only ever marked paid from `verifyPayment` or an authenticated
 * `parseWebhook` result. A browser redirect by itself proves nothing and never
 * moves money.
 *
 * Drivers:
 *   MOCK     — fully implemented and covered by the test suite. Stateless:
 *              the intended outcome is encoded in the provider payment id, so
 *              it behaves identically across serverless invocations.
 *   MOYASAR  — implemented against Moyasar's documented Invoices API (hosted
 *              page: mada, Visa/Mastercard, Apple Pay, STC Pay). Requires
 *              MOYASAR_SECRET_KEY. NOT yet exercised against the live sandbox —
 *              no credentials were available.
 */
import crypto from 'crypto';

export type PaymentStatus =
  | 'INITIATED'
  | 'PENDING'
  | 'PAID'
  | 'FAILED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export interface PaymentIntentRequest {
  orderId: string;
  orderNumber: string;
  amountHalalas: number;
  currency: string;
  method: string;
  description: string;
  customer: { name: string; email?: string | null; phone?: string | null };
  /** Where the provider sends the shopper back to. */
  returnUrl: string;
  /** MOCK driver only: forces a specific outcome in automated tests. */
  testOutcome?: 'paid' | 'failed' | 'cancelled' | 'pending';
}

export interface PaymentIntentResult {
  providerPaymentId: string;
  status: PaymentStatus;
  redirectUrl: string | null;
  raw: any;
}

export interface PaymentVerification {
  providerPaymentId: string;
  status: PaymentStatus;
  amountHalalas: number;
  currency: string;
  method: string | null;
  failureReason: string | null;
  raw: any;
}

export interface RefundResult {
  providerRefundId: string | null;
  status: 'PENDING' | 'SUCCEEDED' | 'FAILED';
  amountHalalas: number;
  raw: any;
}

export interface WebhookParseResult {
  ok: boolean;
  error?: string;
  /** Stable per-event identity used to reject duplicate deliveries. */
  eventKey?: string;
  eventType?: string;
  providerPaymentId?: string;
  orderRef?: string;
  status?: PaymentStatus;
  amountHalalas?: number;
  raw?: any;
}

export interface PaymentDriver {
  readonly name: string;
  readonly isTestMode: boolean;
  readonly supportedMethods: string[];
  createPayment(req: PaymentIntentRequest): Promise<PaymentIntentResult>;
  verifyPayment(providerPaymentId: string): Promise<PaymentVerification>;
  refund(providerPaymentId: string, amountHalalas: number, reason?: string): Promise<RefundResult>;
  parseWebhook(headers: Record<string, any>, rawBody: string): WebhookParseResult;
}

export class PaymentProviderError extends Error {
  statusCode: number;
  constructor(message: string, statusCode = 502) {
    super(message);
    this.statusCode = statusCode;
  }
}

// ---------------------------------------------------------------------------
// MOCK driver
// ---------------------------------------------------------------------------

const MOCK_OUTCOMES = ['paid', 'failed', 'cancelled', 'pending'] as const;
type MockOutcome = (typeof MOCK_OUTCOMES)[number];

const MOCK_STATUS: Record<MockOutcome, PaymentStatus> = {
  paid: 'PAID',
  failed: 'FAILED',
  cancelled: 'CANCELLED',
  pending: 'PENDING',
};

/**
 * A self-contained test gateway. No network, no charges, no stored state.
 *
 * The outcome and the amount are both encoded into the provider payment id at
 * creation time, which is what makes `verifyPayment` work without a database
 * or a warm process — important on Vercel, where every request is a new
 * container.
 *
 *   mock_<outcome>_<amountHalalas>_<nonce>_<hmac>
 *
 * The HMAC is over the whole id, so an id cannot be hand-crafted by a client
 * to claim a payment succeeded.
 */
export class MockPaymentDriver implements PaymentDriver {
  readonly name = 'MOCK';
  readonly isTestMode = true;
  readonly supportedMethods = ['mada', 'visa', 'mastercard', 'applepay', 'stcpay', 'tamara'];

  private secret: string;
  private defaultOutcome: MockOutcome;

  constructor(secret?: string, defaultOutcome?: string) {
    this.secret = secret || process.env.PAYMENT_MOCK_SECRET || 'mock_dev_secret';
    const requested = (defaultOutcome || process.env.MOCK_PAYMENT_OUTCOME || 'paid').toLowerCase();
    this.defaultOutcome = (MOCK_OUTCOMES as readonly string[]).includes(requested)
      ? (requested as MockOutcome)
      : 'paid';
  }

  private sign(payload: string): string {
    return crypto.createHmac('sha256', this.secret).update(payload).digest('hex').slice(0, 32);
  }

  private parseId(id: string): { outcome: MockOutcome; amountHalalas: number } {
    const parts = id.split('_');
    // mock, outcome, amount, nonce, hmac
    if (parts.length !== 5 || parts[0] !== 'mock') {
      throw new PaymentProviderError(`Malformed mock payment reference: ${id}`, 400);
    }
    const [, outcome, amountStr, nonce, mac] = parts;
    const expected = this.sign(`mock_${outcome}_${amountStr}_${nonce}`);
    // Timing-safe compare; lengths are fixed by sign().
    const macBuf = Buffer.from(mac);
    const expBuf = Buffer.from(expected);
    if (macBuf.length !== expBuf.length || !crypto.timingSafeEqual(macBuf, expBuf)) {
      throw new PaymentProviderError('Mock payment reference failed signature check.', 400);
    }
    if (!(MOCK_OUTCOMES as readonly string[]).includes(outcome)) {
      throw new PaymentProviderError(`Unknown mock outcome: ${outcome}`, 400);
    }
    return { outcome: outcome as MockOutcome, amountHalalas: parseInt(amountStr, 10) };
  }

  async createPayment(req: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const outcome: MockOutcome = req.testOutcome || this.defaultOutcome;
    const nonce = crypto.randomBytes(8).toString('hex');
    const base = `mock_${outcome}_${req.amountHalalas}_${nonce}`;
    const providerPaymentId = `${base}_${this.sign(base)}`;

    // The "hosted page" is our own callback — the shopper is bounced straight
    // back, exactly as a real provider would redirect them.
    const sep = req.returnUrl.includes('?') ? '&' : '?';
    const redirectUrl =
      `${req.returnUrl}${sep}provider=MOCK&payment_id=${encodeURIComponent(providerPaymentId)}`;

    return {
      providerPaymentId,
      status: 'PENDING',
      redirectUrl,
      raw: {
        provider: 'MOCK',
        testMode: true,
        outcome,
        amountHalalas: req.amountHalalas,
        currency: req.currency,
        method: req.method,
        orderNumber: req.orderNumber,
      },
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentVerification> {
    const { outcome, amountHalalas } = this.parseId(providerPaymentId);
    return {
      providerPaymentId,
      status: MOCK_STATUS[outcome],
      amountHalalas,
      currency: 'SAR',
      method: null,
      failureReason:
        outcome === 'failed'
          ? 'Simulated decline (test mode)'
          : outcome === 'cancelled'
            ? 'Shopper cancelled the payment (test mode)'
            : null,
      raw: { provider: 'MOCK', testMode: true, outcome },
    };
  }

  async refund(providerPaymentId: string, amountHalalas: number): Promise<RefundResult> {
    const { outcome } = this.parseId(providerPaymentId);
    if (outcome !== 'paid') {
      throw new PaymentProviderError('Only a captured payment can be refunded.', 409);
    }
    return {
      providerRefundId: `mockref_${crypto.randomBytes(8).toString('hex')}`,
      status: 'SUCCEEDED',
      amountHalalas,
      raw: { provider: 'MOCK', testMode: true },
    };
  }

  parseWebhook(headers: Record<string, any>, rawBody: string): WebhookParseResult {
    const signature = String(
      headers['x-mock-signature'] || headers['X-Mock-Signature'] || ''
    );
    const expected = crypto
      .createHmac('sha256', this.secret)
      .update(rawBody)
      .digest('hex');

    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expected);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { ok: false, error: 'Invalid webhook signature.' };
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { ok: false, error: 'Webhook body is not valid JSON.' };
    }

    const providerPaymentId = String(body?.payment_id || body?.id || '');
    if (!providerPaymentId) {
      return { ok: false, error: 'Webhook payload has no payment id.' };
    }

    // Re-derive status from the signed id rather than trusting the body.
    let status: PaymentStatus;
    let amountHalalas: number;
    try {
      const parsed = this.parseId(providerPaymentId);
      status = MOCK_STATUS[parsed.outcome];
      amountHalalas = parsed.amountHalalas;
    } catch (e: any) {
      return { ok: false, error: e.message };
    }

    return {
      ok: true,
      eventKey: String(body?.event_id || `${providerPaymentId}:${status}`),
      eventType: String(body?.type || `payment.${status.toLowerCase()}`),
      providerPaymentId,
      orderRef: body?.order_id ? String(body.order_id) : undefined,
      status,
      amountHalalas,
      raw: body,
    };
  }
}

// ---------------------------------------------------------------------------
// Moyasar driver (Invoices API — hosted page)
// ---------------------------------------------------------------------------

const MOYASAR_BASE = process.env.MOYASAR_API_BASE || 'https://api.moyasar.com/v1';

/**
 * Moyasar hosted-invoice flow. One hosted page covers mada, Visa/Mastercard,
 * Apple Pay and STC Pay, so no card data ever touches this application.
 *
 * Status mapping follows Moyasar's documented invoice/payment statuses.
 *
 * Unverified: written from the published API shape, never run against the
 * sandbox, because no MOYASAR_SECRET_KEY was supplied.
 */
export class MoyasarPaymentDriver implements PaymentDriver {
  readonly name = 'MOYASAR';
  readonly isTestMode: boolean;
  readonly supportedMethods = ['mada', 'visa', 'mastercard', 'applepay', 'stcpay'];

  private secretKey: string;
  private webhookSecret: string;

  constructor(secretKey?: string, webhookSecret?: string) {
    this.secretKey = secretKey || process.env.MOYASAR_SECRET_KEY || '';
    this.webhookSecret = webhookSecret || process.env.MOYASAR_WEBHOOK_SECRET || '';
    if (!this.secretKey) {
      throw new PaymentProviderError(
        'MOYASAR_SECRET_KEY is not configured. Set it, or set PAYMENT_GATEWAY_PROVIDER=MOCK.',
        500
      );
    }
    this.isTestMode = this.secretKey.startsWith('sk_test');
  }

  private authHeader(): string {
    return 'Basic ' + Buffer.from(`${this.secretKey}:`).toString('base64');
  }

  private async call(path: string, init: RequestInit = {}): Promise<any> {
    let res: Response;
    try {
      res = await fetch(`${MOYASAR_BASE}${path}`, {
        ...init,
        headers: {
          Authorization: this.authHeader(),
          'Content-Type': 'application/json',
          ...(init.headers || {}),
        },
      });
    } catch (e: any) {
      throw new PaymentProviderError(`Could not reach Moyasar: ${e.message}`, 502);
    }

    const text = await res.text();
    let body: any = null;
    try {
      body = text ? JSON.parse(text) : null;
    } catch {
      body = { raw: text };
    }

    if (!res.ok) {
      const message = body?.message || body?.errors || `Moyasar returned HTTP ${res.status}`;
      throw new PaymentProviderError(
        `Moyasar request failed: ${typeof message === 'string' ? message : JSON.stringify(message)}`,
        res.status >= 500 ? 502 : 400
      );
    }
    return body;
  }

  private static mapStatus(raw: string | undefined): PaymentStatus {
    switch ((raw || '').toLowerCase()) {
      case 'paid':
        return 'PAID';
      case 'authorized':
      case 'initiated':
        return 'PENDING';
      case 'failed':
        return 'FAILED';
      case 'voided':
      case 'canceled':
      case 'cancelled':
      case 'expired':
        return 'CANCELLED';
      case 'refunded':
        return 'REFUNDED';
      case 'partially_refunded':
        return 'PARTIALLY_REFUNDED';
      default:
        return 'PENDING';
    }
  }

  async createPayment(req: PaymentIntentRequest): Promise<PaymentIntentResult> {
    const body = await this.call('/invoices', {
      method: 'POST',
      body: JSON.stringify({
        amount: req.amountHalalas, // Moyasar bills in the minor unit
        currency: req.currency,
        description: req.description,
        success_url: req.returnUrl,
        back_url: req.returnUrl,
        metadata: {
          order_id: req.orderId,
          order_number: req.orderNumber,
          customer_name: req.customer.name,
        },
      }),
    });

    return {
      providerPaymentId: String(body.id),
      status: MoyasarPaymentDriver.mapStatus(body.status),
      redirectUrl: body.url || null,
      raw: body,
    };
  }

  async verifyPayment(providerPaymentId: string): Promise<PaymentVerification> {
    const body = await this.call(`/invoices/${encodeURIComponent(providerPaymentId)}`);
    // A paid invoice carries the settled payment under `payments`.
    const settled = Array.isArray(body?.payments)
      ? body.payments.find((p: any) => (p?.status || '').toLowerCase() === 'paid') || body.payments[0]
      : null;

    return {
      providerPaymentId: String(body.id),
      status: MoyasarPaymentDriver.mapStatus(settled?.status || body.status),
      amountHalalas: Number(settled?.amount ?? body.amount ?? 0),
      currency: String(settled?.currency || body.currency || 'SAR'),
      method: settled?.source?.type || null,
      failureReason: settled?.source?.message || body?.message || null,
      raw: body,
    };
  }

  async refund(providerPaymentId: string, amountHalalas: number): Promise<RefundResult> {
    // Refunds act on the payment, not the invoice, so resolve it first.
    const invoice = await this.call(`/invoices/${encodeURIComponent(providerPaymentId)}`);
    const settled = Array.isArray(invoice?.payments)
      ? invoice.payments.find((p: any) => (p?.status || '').toLowerCase() === 'paid')
      : null;
    if (!settled?.id) {
      throw new PaymentProviderError('No captured Moyasar payment found to refund.', 409);
    }

    const body = await this.call(`/payments/${encodeURIComponent(settled.id)}/refund`, {
      method: 'POST',
      body: JSON.stringify({ amount: amountHalalas }),
    });

    return {
      providerRefundId: String(body?.id || settled.id),
      status: (body?.status || '').toLowerCase() === 'refunded' ? 'SUCCEEDED' : 'PENDING',
      amountHalalas,
      raw: body,
    };
  }

  parseWebhook(_headers: Record<string, any>, rawBody: string): WebhookParseResult {
    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return { ok: false, error: 'Webhook body is not valid JSON.' };
    }

    // Moyasar authenticates webhooks with a shared secret_token in the body.
    if (!this.webhookSecret) {
      return { ok: false, error: 'MOYASAR_WEBHOOK_SECRET is not configured.' };
    }
    const provided = String(body?.secret_token || '');
    const sigBuf = Buffer.from(provided);
    const expBuf = Buffer.from(this.webhookSecret);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return { ok: false, error: 'Invalid webhook secret token.' };
    }

    const data = body?.data || {};
    const invoiceId = data?.invoice_id || data?.id;
    if (!invoiceId) {
      return { ok: false, error: 'Webhook payload has no invoice id.' };
    }

    return {
      ok: true,
      eventKey: String(body?.id || `${invoiceId}:${data?.status}`),
      eventType: String(body?.type || 'payment.updated'),
      providerPaymentId: String(invoiceId),
      orderRef: data?.metadata?.order_id ? String(data.metadata.order_id) : undefined,
      status: MoyasarPaymentDriver.mapStatus(data?.status),
      amountHalalas: Number(data?.amount ?? 0),
      raw: body,
    };
  }
}

// ---------------------------------------------------------------------------
// Resolution
// ---------------------------------------------------------------------------

let cachedDriver: PaymentDriver | null = null;
let cachedDriverName: string | null = null;

/** Returns the configured driver. PAYMENT_GATEWAY_PROVIDER selects it. */
export function getPaymentDriver(): PaymentDriver {
  const requested = (process.env.PAYMENT_GATEWAY_PROVIDER || 'MOCK').toUpperCase();
  if (cachedDriver && cachedDriverName === requested) return cachedDriver;

  let driver: PaymentDriver;
  switch (requested) {
    case 'MOYASAR':
      driver = new MoyasarPaymentDriver();
      break;
    case 'MOCK':
      driver = new MockPaymentDriver();
      break;
    default:
      throw new PaymentProviderError(
        `Unsupported PAYMENT_GATEWAY_PROVIDER "${requested}". Supported: MOCK, MOYASAR.`,
        500
      );
  }

  cachedDriver = driver;
  cachedDriverName = requested;
  return driver;
}

/** Test seam: force a driver, or pass null to fall back to env resolution. */
export function setPaymentDriver(driver: PaymentDriver | null): void {
  cachedDriver = driver;
  cachedDriverName = driver
    ? (process.env.PAYMENT_GATEWAY_PROVIDER || 'MOCK').toUpperCase()
    : null;
}
