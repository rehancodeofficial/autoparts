-- ============================================================================
-- AutoParts KSA — Commerce Migration
-- Guest checkout, payments, discounts, inventory movements, order history.
-- Idempotent: safe to re-run. Compatible with PostgreSQL 14+ and pg-mem tests.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Order.status: enum -> VARCHAR + CHECK
--    The "OrderStatus" enum cannot gain values and be used inside the same
--    transaction, and the migration runner wraps each file in BEGIN/COMMIT.
--    A text column with a CHECK constraint is transaction-safe and keeps the
--    test harness (pg-mem) and Supabase on identical DDL.
-- ---------------------------------------------------------------------------
ALTER TABLE "Order" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Order" ALTER COLUMN "status" TYPE VARCHAR(50) USING "status"::text;
ALTER TABLE "Order" ALTER COLUMN "status" SET DEFAULT 'PENDING_PAYMENT';

-- ---------------------------------------------------------------------------
-- 2. Order: guest checkout, contact, address and money breakdown columns
-- ---------------------------------------------------------------------------
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerEmail"    VARCHAR(255);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "district"         VARCHAR(100);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "postalCode"       VARCHAR(20);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "country"          VARCHAR(100) NOT NULL DEFAULT 'Saudi Arabia';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "addressNotes"     TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "isGuest"          BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "trackingToken"    VARCHAR(64);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "currency"         VARCHAR(10) NOT NULL DEFAULT 'SAR';
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountCode"     VARCHAR(64);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountId"       VARCHAR(64);
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "discountHalalas"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "vatPercent"       NUMERIC(5,2) NOT NULL DEFAULT 15.00;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "refundedHalalas"  INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "internalNotes"    TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paidAt"           TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "dispatchedAt"     TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "shippedAt"        TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "deliveredAt"      TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancelledAt"      TIMESTAMP WITH TIME ZONE;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "cancellationReason" TEXT;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "stockCommitted"   BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "idempotencyKey"   VARCHAR(128);

-- Guest orders have no userId, so the original NOT NULL-ish expectations relax.
ALTER TABLE "Order" ALTER COLUMN "customerPhone" DROP NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_trackingToken"  ON "Order"("trackingToken");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_order_idempotencyKey" ON "Order"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "idx_order_status"          ON "Order"("status");
CREATE INDEX IF NOT EXISTS "idx_order_paymentStatus"   ON "Order"("paymentStatus");
CREATE INDEX IF NOT EXISTS "idx_order_customerEmail"   ON "Order"("customerEmail");
CREATE INDEX IF NOT EXISTS "idx_order_customerPhone"   ON "Order"("customerPhone");

-- ---------------------------------------------------------------------------
-- 3. OrderItem: SKU and snapshot columns so admin views survive product edits
-- ---------------------------------------------------------------------------
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "sku"        VARCHAR(100);
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "imageUrl"   TEXT;
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "brandName"  VARCHAR(255);
ALTER TABLE "OrderItem" ADD COLUMN IF NOT EXISTS "createdAt"  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- ---------------------------------------------------------------------------
-- 4. Payment records — one row per attempt against a payment provider
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Payment" (
    "id"                VARCHAR(64) PRIMARY KEY,
    "orderId"           VARCHAR(64) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "provider"          VARCHAR(50) NOT NULL,
    "providerPaymentId" VARCHAR(255),
    "method"            VARCHAR(50) NOT NULL,
    "status"            VARCHAR(50) NOT NULL DEFAULT 'INITIATED',
    "amountHalalas"     INTEGER NOT NULL,
    "refundedHalalas"   INTEGER NOT NULL DEFAULT 0,
    "currency"          VARCHAR(10) NOT NULL DEFAULT 'SAR',
    "isTestMode"        BOOLEAN NOT NULL DEFAULT true,
    "redirectUrl"       TEXT,
    "failureReason"     TEXT,
    "rawResponse"       JSONB,
    "verifiedAt"        TIMESTAMP WITH TIME ZONE,
    "createdAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"         TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_payment_orderId" ON "Payment"("orderId");
CREATE INDEX IF NOT EXISTS "idx_payment_status"  ON "Payment"("status");
CREATE UNIQUE INDEX IF NOT EXISTS "uq_payment_provider_ref"
    ON "Payment"("provider", "providerPaymentId");

-- ---------------------------------------------------------------------------
-- 5. Refunds
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Refund" (
    "id"               VARCHAR(64) PRIMARY KEY,
    "paymentId"        VARCHAR(64) NOT NULL REFERENCES "Payment"("id") ON DELETE CASCADE,
    "orderId"          VARCHAR(64) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "amountHalalas"    INTEGER NOT NULL,
    "currency"         VARCHAR(10) NOT NULL DEFAULT 'SAR',
    "status"           VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    "reason"           TEXT,
    "providerRefundId" VARCHAR(255),
    "rawResponse"      JSONB,
    "createdByUserId"  VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
    "createdAt"        TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_refund_orderId"   ON "Refund"("orderId");
CREATE INDEX IF NOT EXISTS "idx_refund_paymentId" ON "Refund"("paymentId");

-- ---------------------------------------------------------------------------
-- 6. Webhook events — dedupe guard so repeated callbacks are processed once
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "WebhookEvent" (
    "id"           VARCHAR(64) PRIMARY KEY,
    "provider"     VARCHAR(50) NOT NULL,
    "eventKey"     VARCHAR(255) NOT NULL,
    "eventType"    VARCHAR(100),
    "orderId"      VARCHAR(64),
    "payload"      JSONB,
    "processedAt"  TIMESTAMP WITH TIME ZONE,
    "resultNote"   TEXT,
    "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_webhook_provider_event"
    ON "WebhookEvent"("provider", "eventKey");

-- ---------------------------------------------------------------------------
-- 7. Order events — status transitions, admin actions and internal notes
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "OrderEvent" (
    "id"          VARCHAR(64) PRIMARY KEY,
    "orderId"     VARCHAR(64) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "eventType"   VARCHAR(50) NOT NULL,
    "fromValue"   VARCHAR(100),
    "toValue"     VARCHAR(100),
    "message"     TEXT,
    "isInternal"  BOOLEAN NOT NULL DEFAULT true,
    "actorId"     VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
    "actorName"   VARCHAR(255),
    "metadata"    JSONB,
    "createdAt"   TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_orderEvent_orderId" ON "OrderEvent"("orderId");

-- ---------------------------------------------------------------------------
-- 8. Discounts
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "Discount" (
    "id"                 VARCHAR(64) PRIMARY KEY,
    "code"               VARCHAR(64) NOT NULL,
    "descriptionEn"      TEXT,
    "descriptionAr"      TEXT,
    "type"               VARCHAR(20) NOT NULL DEFAULT 'PERCENT',
    "value"              NUMERIC(12,2) NOT NULL,
    "minOrderHalalas"    INTEGER NOT NULL DEFAULT 0,
    "maxDiscountHalalas" INTEGER,
    "startsAt"           TIMESTAMP WITH TIME ZONE,
    "endsAt"             TIMESTAMP WITH TIME ZONE,
    "usageLimit"         INTEGER,
    "usageCount"         INTEGER NOT NULL DEFAULT 0,
    "perCustomerLimit"   INTEGER,
    "isActive"           BOOLEAN NOT NULL DEFAULT true,
    "createdByUserId"    VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
    "createdAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt"          TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_discount_code" ON "Discount"("code");
CREATE INDEX IF NOT EXISTS "idx_discount_isActive"   ON "Discount"("isActive");

CREATE TABLE IF NOT EXISTS "DiscountRedemption" (
    "id"              VARCHAR(64) PRIMARY KEY,
    "discountId"      VARCHAR(64) NOT NULL REFERENCES "Discount"("id") ON DELETE CASCADE,
    "orderId"         VARCHAR(64) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "customerEmail"   VARCHAR(255),
    "customerPhone"   VARCHAR(50),
    "amountHalalas"   INTEGER NOT NULL,
    "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS "uq_redemption_order" ON "DiscountRedemption"("orderId");
CREATE INDEX IF NOT EXISTS "idx_redemption_discountId"  ON "DiscountRedemption"("discountId");
CREATE INDEX IF NOT EXISTS "idx_redemption_email"       ON "DiscountRedemption"("customerEmail");

-- ---------------------------------------------------------------------------
-- 9. Inventory movements — audit trail for every stock change
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS "InventoryMovement" (
    "id"           VARCHAR(64) PRIMARY KEY,
    "productId"    VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "orderId"      VARCHAR(64) REFERENCES "Order"("id") ON DELETE SET NULL,
    "changeQty"    INTEGER NOT NULL,
    "quantityAfter" INTEGER NOT NULL,
    "reason"       VARCHAR(50) NOT NULL,
    "note"         TEXT,
    "actorId"      VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
    "createdAt"    TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_inventoryMovement_productId" ON "InventoryMovement"("productId");
CREATE INDEX IF NOT EXISTS "idx_inventoryMovement_orderId"   ON "InventoryMovement"("orderId");

-- ---------------------------------------------------------------------------
-- 10. Guard rails
-- ---------------------------------------------------------------------------
-- Stock may never go negative (prevents overselling at the database level).
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "chk_product_stock_nonneg";
ALTER TABLE "Product" ADD CONSTRAINT "chk_product_stock_nonneg"
    CHECK ("stockQuantity" >= 0);

-- Prices may never be negative.
ALTER TABLE "Product" DROP CONSTRAINT IF EXISTS "chk_product_price_nonneg";
ALTER TABLE "Product" ADD CONSTRAINT "chk_product_price_nonneg"
    CHECK ("sellingPrice" >= 0 AND ("salePrice" IS NULL OR "salePrice" >= 0));

-- Order money columns may never be negative.
ALTER TABLE "Order" DROP CONSTRAINT IF EXISTS "chk_order_money_nonneg";
ALTER TABLE "Order" ADD CONSTRAINT "chk_order_money_nonneg"
    CHECK ("subtotalHalalas" >= 0 AND "vatHalalas" >= 0 AND "shippingHalalas" >= 0
           AND "totalHalalas" >= 0 AND "discountHalalas" >= 0 AND "refundedHalalas" >= 0);
