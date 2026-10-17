/**
 * Server-side pricing engine — the single source of truth for every amount
 * that reaches a payment provider or the "Order" table.
 *
 * Nothing here trusts the client. Unit prices are re-read from "Product",
 * discounts are re-validated against "Discount", and all arithmetic is done in
 * integer halalas (1 SAR = 100 halalas) so no float rounding can drift.
 *
 * The formula matches what the storefront has always displayed:
 *     goods     = sum(unitPrice * qty)
 *     discount  = percent/fixed off goods, capped at goods
 *     net       = goods - discount
 *     vat       = 15% of net
 *     shipping  = 0 if net >= freeShippingThreshold else flat rate
 *     total     = net + vat + shipping
 */
import { query } from './db';
import type { PoolClient } from 'pg';

export const VAT_PERCENT = Number(process.env.STORE_VAT_PERCENT || 15);
export const CURRENCY = process.env.STORE_DEFAULT_CURRENCY || 'SAR';
export const FREE_SHIPPING_THRESHOLD_HALALAS = Number(
  process.env.STORE_FREE_SHIPPING_THRESHOLD_HALALAS || 50000 // SAR 500
);
export const FLAT_SHIPPING_HALALAS = Number(
  process.env.STORE_FLAT_SHIPPING_HALALAS || 2500 // SAR 25
);

export interface RequestedItem {
  productId: string;
  quantity: number;
}

export interface PricedItem {
  productId: string;
  sku: string;
  nameEn: string;
  nameAr: string;
  brandName: string | null;
  imageUrl: string | null;
  unitPriceHalalas: number;
  quantity: number;
  totalHalalas: number;
  stockQuantity: number;
}

export interface DiscountEvaluation {
  id: string;
  code: string;
  type: 'PERCENT' | 'FIXED';
  value: number;
  amountHalalas: number;
}

export interface PriceQuote {
  items: PricedItem[];
  subtotalHalalas: number;
  discountHalalas: number;
  vatHalalas: number;
  shippingHalalas: number;
  totalHalalas: number;
  vatPercent: number;
  currency: string;
  discount: DiscountEvaluation | null;
  discountError: string | null;
}

export class PricingError extends Error {
  statusCode: number;
  code: string;
  constructor(message: string, code = 'PRICING_ERROR', statusCode = 400) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
  }
}

/** Collapses duplicate product lines and rejects malformed quantities. */
export function normalizeRequestedItems(raw: any): RequestedItem[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    throw new PricingError('Your cart is empty.', 'EMPTY_CART');
  }
  if (raw.length > 100) {
    throw new PricingError('Too many distinct items in one order.', 'CART_TOO_LARGE');
  }

  const merged = new Map<string, number>();
  for (const entry of raw) {
    const productId = String(
      entry?.productId ?? entry?.id ?? entry?.part?.id ?? ''
    ).trim();
    if (!productId) {
      throw new PricingError('Every cart line must reference a product.', 'MISSING_PRODUCT_ID');
    }

    const qty = Number(entry?.quantity);
    if (!Number.isFinite(qty) || !Number.isInteger(qty) || qty < 1 || qty > 999) {
      throw new PricingError(
        `Invalid quantity for product ${productId}. Quantity must be a whole number between 1 and 999.`,
        'INVALID_QUANTITY'
      );
    }

    merged.set(productId, (merged.get(productId) || 0) + qty);
  }

  for (const [productId, qty] of merged) {
    if (qty > 999) {
      throw new PricingError(
        `Quantity for product ${productId} exceeds the 999 per-order limit.`,
        'INVALID_QUANTITY'
      );
    }
  }

  return [...merged].map(([productId, quantity]) => ({ productId, quantity }));
}

/**
 * Re-reads prices and stock from the database. Only PUBLISHED products are
 * purchasable, so a product pulled from sale cannot be bought from a stale tab.
 */
export async function priceItems(
  items: RequestedItem[],
  opts: { client?: PoolClient; requireStock?: boolean } = {}
): Promise<PricedItem[]> {
  const runner = opts.client
    ? (sql: string, params: any[]) => opts.client!.query(sql, params)
    : (sql: string, params: any[]) => query(sql, params);

  const ids = items.map(i => i.productId);
  const lockClause = opts.client ? 'FOR UPDATE OF p' : '';

  const res = await runner(
    `SELECT p."id", p."sku", p."nameEn", p."nameAr", p."sellingPrice", p."salePrice",
            p."stockQuantity", p."status", b."name" AS "brandName",
            (SELECT pi."url" FROM "ProductImage" pi
              WHERE pi."productId" = p."id"
              ORDER BY pi."isPrimary" DESC, pi."sortOrder" ASC LIMIT 1) AS "imageUrl"
       FROM "Product" p
       LEFT JOIN "PartBrand" b ON b."id" = p."brandId"
      WHERE p."id" = ANY($1::text[])
      ${lockClause}`,
    [ids]
  );

  const byId = new Map<string, any>(res.rows.map((r: any) => [r.id, r]));
  const priced: PricedItem[] = [];

  for (const item of items) {
    const row = byId.get(item.productId);
    if (!row) {
      throw new PricingError(
        `A product in your cart is no longer available (${item.productId}).`,
        'PRODUCT_NOT_FOUND',
        409
      );
    }
    if (row.status !== 'PUBLISHED') {
      throw new PricingError(
        `"${row.nameEn}" is no longer available for purchase.`,
        'PRODUCT_UNPUBLISHED',
        409
      );
    }

    // salePrice wins when set; both are NUMERIC so they arrive as strings.
    const sellingPrice = Number(row.sellingPrice);
    const salePrice = row.salePrice === null ? null : Number(row.salePrice);
    const effective = salePrice !== null && salePrice > 0 && salePrice < sellingPrice
      ? salePrice
      : sellingPrice;

    if (!Number.isFinite(effective) || effective < 0) {
      throw new PricingError(
        `"${row.nameEn}" has an invalid price and cannot be sold.`,
        'INVALID_PRICE',
        409
      );
    }

    const stockQuantity = Number(row.stockQuantity);
    if (opts.requireStock !== false && stockQuantity < item.quantity) {
      throw new PricingError(
        stockQuantity <= 0
          ? `"${row.nameEn}" is out of stock.`
          : `Only ${stockQuantity} unit(s) of "${row.nameEn}" remain in stock.`,
        'INSUFFICIENT_STOCK',
        409
      );
    }

    const unitPriceHalalas = Math.round(effective * 100);
    priced.push({
      productId: row.id,
      sku: row.sku,
      nameEn: row.nameEn,
      nameAr: row.nameAr,
      brandName: row.brandName ?? null,
      imageUrl: row.imageUrl ?? null,
      unitPriceHalalas,
      quantity: item.quantity,
      totalHalalas: unitPriceHalalas * item.quantity,
      stockQuantity,
    });
  }

  return priced;
}

/**
 * Validates a discount code against every stored rule: active flag, date
 * window, global usage limit, per-customer limit and minimum order value.
 * Returns null plus a human-readable reason rather than throwing, so the
 * checkout can show the message and still price the cart.
 */
export async function evaluateDiscount(
  code: string | null | undefined,
  goodsHalalas: number,
  customer: { email?: string | null; phone?: string | null } = {},
  opts: { client?: PoolClient } = {}
): Promise<{ discount: DiscountEvaluation | null; error: string | null }> {
  const cleaned = (code || '').trim().toUpperCase();
  if (!cleaned) return { discount: null, error: null };

  const runner = opts.client
    ? (sql: string, params: any[]) => opts.client!.query(sql, params)
    : (sql: string, params: any[]) => query(sql, params);

  const res = await runner(
    `SELECT * FROM "Discount" WHERE UPPER("code") = $1 LIMIT 1`,
    [cleaned]
  );
  const d = res.rows[0];

  if (!d) return { discount: null, error: 'That discount code is not valid.' };
  if (!d.isActive) return { discount: null, error: 'That discount code is no longer active.' };

  const now = Date.now();
  if (d.startsAt && new Date(d.startsAt).getTime() > now) {
    return { discount: null, error: 'That discount code is not active yet.' };
  }
  if (d.endsAt && new Date(d.endsAt).getTime() < now) {
    return { discount: null, error: 'That discount code has expired.' };
  }
  if (d.usageLimit !== null && Number(d.usageCount) >= Number(d.usageLimit)) {
    return { discount: null, error: 'That discount code has reached its usage limit.' };
  }
  if (goodsHalalas < Number(d.minOrderHalalas)) {
    const minSar = (Number(d.minOrderHalalas) / 100).toFixed(2);
    return {
      discount: null,
      error: `This code requires a minimum order of SAR ${minSar}.`,
    };
  }

  if (d.perCustomerLimit !== null && (customer.email || customer.phone)) {
    const used = await runner(
      `SELECT COUNT(*)::int AS n FROM "DiscountRedemption"
        WHERE "discountId" = $1
          AND (($2::text IS NOT NULL AND LOWER("customerEmail") = LOWER($2))
            OR ($3::text IS NOT NULL AND "customerPhone" = $3))`,
      [d.id, customer.email || null, customer.phone || null]
    );
    if (Number(used.rows[0].n) >= Number(d.perCustomerLimit)) {
      return { discount: null, error: 'You have already used this discount code.' };
    }
  }

  const type = String(d.type).toUpperCase() === 'FIXED' ? 'FIXED' : 'PERCENT';
  const value = Number(d.value);
  if (!Number.isFinite(value) || value <= 0) {
    return { discount: null, error: 'That discount code is misconfigured.' };
  }

  let amountHalalas =
    type === 'PERCENT'
      ? Math.round((goodsHalalas * Math.min(value, 100)) / 100)
      : Math.round(value * 100);

  if (d.maxDiscountHalalas !== null) {
    amountHalalas = Math.min(amountHalalas, Number(d.maxDiscountHalalas));
  }
  // A discount can never exceed the goods value or create a negative total.
  amountHalalas = Math.max(0, Math.min(amountHalalas, goodsHalalas));

  return {
    discount: { id: d.id, code: d.code, type, value, amountHalalas },
    error: null,
  };
}

/** Builds a complete, authoritative quote for a cart. */
export async function buildQuote(
  rawItems: any,
  options: {
    discountCode?: string | null;
    customer?: { email?: string | null; phone?: string | null };
    client?: PoolClient;
    requireStock?: boolean;
  } = {}
): Promise<PriceQuote> {
  const items = normalizeRequestedItems(rawItems);
  const priced = await priceItems(items, {
    client: options.client,
    requireStock: options.requireStock,
  });

  const subtotalHalalas = priced.reduce((s, i) => s + i.totalHalalas, 0);

  const { discount, error: discountError } = await evaluateDiscount(
    options.discountCode,
    subtotalHalalas,
    options.customer || {},
    { client: options.client }
  );

  const discountHalalas = discount ? discount.amountHalalas : 0;
  const netHalalas = Math.max(0, subtotalHalalas - discountHalalas);
  const vatHalalas = Math.round((netHalalas * VAT_PERCENT) / 100);
  const shippingHalalas =
    netHalalas === 0 || netHalalas >= FREE_SHIPPING_THRESHOLD_HALALAS
      ? 0
      : FLAT_SHIPPING_HALALAS;
  const totalHalalas = netHalalas + vatHalalas + shippingHalalas;

  if (totalHalalas <= 0) {
    // A code that wipes out the whole order would mean charging zero, which no
    // payment provider accepts. Say so plainly instead of failing obscurely.
    throw new PricingError(
      discountHalalas > 0
        ? 'This discount cannot be applied: it would reduce the order total to zero.'
        : 'Order total must be greater than zero.',
      discountHalalas > 0 ? 'DISCOUNT_COVERS_TOTAL' : 'ZERO_TOTAL'
    );
  }

  return {
    items: priced,
    subtotalHalalas,
    discountHalalas,
    vatHalalas,
    shippingHalalas,
    totalHalalas,
    vatPercent: VAT_PERCENT,
    currency: CURRENCY,
    discount,
    discountError,
  };
}

/** Shapes a quote for the browser, in SAR, without internal stock figures. */
export function quoteToClient(quote: PriceQuote) {
  return {
    items: quote.items.map(i => ({
      productId: i.productId,
      sku: i.sku,
      nameEn: i.nameEn,
      nameAr: i.nameAr,
      brandName: i.brandName,
      imageUrl: i.imageUrl,
      unitPrice: i.unitPriceHalalas / 100,
      quantity: i.quantity,
      lineTotal: i.totalHalalas / 100,
    })),
    subtotal: quote.subtotalHalalas / 100,
    discount: quote.discountHalalas / 100,
    vat: quote.vatHalalas / 100,
    shipping: quote.shippingHalalas / 100,
    total: quote.totalHalalas / 100,
    vatPercent: quote.vatPercent,
    currency: quote.currency,
    discountCode: quote.discount?.code ?? null,
    discountError: quote.discountError,
  };
}
