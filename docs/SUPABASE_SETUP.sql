-- ============================================================================
-- AutoParts KSA — complete Supabase schema
--
-- Your Supabase project currently has NO tables: the application's migration
-- runner connects over plain PostgreSQL using DATABASE_URL, which pointed at
-- localhost, so nothing was ever created there.
--
-- HOW TO APPLY
--   1. Supabase dashboard -> SQL Editor -> New query
--   2. Paste this whole file and Run. It is idempotent; re-running is safe.
--   3. Then set these Vercel environment variables:
--        DATABASE_URL              your Transaction Pooler connection string
--                                  (Project Settings -> Database -> Connection
--                                   string -> Transaction pooler, port 6543)
--        SUPABASE_URL              https://<ref>.supabase.co
--        SUPABASE_SERVICE_ROLE_KEY your service role key
--        PAYMENT_GATEWAY_PROVIDER  MOCK  (until real payment keys are added)
--        PAYMENT_MOCK_SECRET       a long random string
--        ADMIN_PASSWORD            your own admin password
--        PUBLIC_BASE_URL           https://<your-domain>
--        NODE_ENV                  production
--
-- The service-role key is NOT a database password. DATABASE_URL needs the
-- database password from the same settings page.
--
-- This file contains migrations 0001-0004 plus the administrator account.
-- It does NOT contain product data; add products through the admin panel, or
-- run `pnpm db:bootstrap` locally with DATABASE_URL pointed at Supabase to
-- load the starter catalogue.
-- ============================================================================

BEGIN;

CREATE TABLE IF NOT EXISTS "_migrations" (
    "id" SERIAL PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "appliedAt" TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);


-- ===== 0001_initial_schema.sql =======================================

-- AutoParts KSA Initial PostgreSQL Schema Migration
-- Compatible with schema.prisma and standalone PostgreSQL 14/15/16

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum types
DO $$ BEGIN
    CREATE TYPE "UserRole" AS ENUM ('CUSTOMER', 'SUPER_ADMIN', 'CATALOG_MANAGER', 'WAREHOUSE', 'SUPPORT', 'FINANCE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE "OrderStatus" AS ENUM ('PENDING_PAYMENT', 'PAID', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'PAYMENT_FAILED', 'EXPIRED', 'RETURN_REQUESTED', 'RETURNED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 1. Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" VARCHAR(64) PRIMARY KEY,
    "email" VARCHAR(255) UNIQUE,
    "phone" VARCHAR(50) UNIQUE,
    "passwordHash" VARCHAR(255),
    "name" VARCHAR(255),
    "role" "UserRole" NOT NULL DEFAULT 'CUSTOMER',
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_user_role" ON "User"("role");
CREATE INDEX IF NOT EXISTS "idx_user_email" ON "User"("email");

-- 2. User Addresses
CREATE TABLE IF NOT EXISTS "Address" (
    "id" VARCHAR(64) PRIMARY KEY,
    "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "recipientName" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "district" VARCHAR(100) NOT NULL,
    "street" VARCHAR(255) NOT NULL,
    "buildingNo" VARCHAR(50),
    "postalCode" VARCHAR(20),
    "nationalCode" VARCHAR(20),
    "notes" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_address_userId" ON "Address"("userId");

-- 3. Sessions (for secure server-managed sessions)
CREATE TABLE IF NOT EXISTS "Session" (
    "id" VARCHAR(128) PRIMARY KEY,
    "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "ipAddress" VARCHAR(64),
    "userAgent" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_session_userId" ON "Session"("userId");
CREATE INDEX IF NOT EXISTS "idx_session_expiresAt" ON "Session"("expiresAt");

-- 4. Refresh Tokens
CREATE TABLE IF NOT EXISTS "RefreshToken" (
    "id" VARCHAR(64) PRIMARY KEY,
    "userId" VARCHAR(64) NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
    "tokenHash" VARCHAR(255) UNIQUE NOT NULL,
    "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL,
    "revokedAt" TIMESTAMP WITH TIME ZONE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_refreshToken_userId" ON "RefreshToken"("userId");

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" VARCHAR(64) PRIMARY KEY,
    "userId" VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
    "action" VARCHAR(100) NOT NULL,
    "entity" VARCHAR(100) NOT NULL,
    "entityId" VARCHAR(64) NOT NULL,
    "oldValues" JSONB,
    "newValues" JSONB,
    "ipAddress" VARCHAR(64),
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_auditLog_userId" ON "AuditLog"("userId");
CREATE INDEX IF NOT EXISTS "idx_auditLog_entity" ON "AuditLog"("entity", "entityId");

-- 6. Carts & Cart Items
CREATE TABLE IF NOT EXISTS "Cart" (
    "id" VARCHAR(64) PRIMARY KEY,
    "sessionToken" VARCHAR(128) UNIQUE,
    "userId" VARCHAR(64) REFERENCES "User"("id") ON DELETE CASCADE,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_cart_userId" ON "Cart"("userId");
CREATE INDEX IF NOT EXISTS "idx_cart_sessionToken" ON "Cart"("sessionToken");

CREATE TABLE IF NOT EXISTS "CartItem" (
    "id" VARCHAR(64) PRIMARY KEY,
    "cartId" VARCHAR(64) NOT NULL REFERENCES "Cart"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    CONSTRAINT "uq_cart_product" UNIQUE ("cartId", "productId")
);

CREATE INDEX IF NOT EXISTS "idx_cartItem_cartId" ON "CartItem"("cartId");

-- 7. Orders & Order Items
CREATE TABLE IF NOT EXISTS "Order" (
    "id" VARCHAR(64) PRIMARY KEY,
    "orderNumber" VARCHAR(64) UNIQUE NOT NULL,
    "userId" VARCHAR(64) REFERENCES "User"("id") ON DELETE SET NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'PENDING_PAYMENT',
    "customerName" VARCHAR(255) NOT NULL,
    "customerPhone" VARCHAR(50) NOT NULL,
    "city" VARCHAR(100) NOT NULL,
    "address" TEXT NOT NULL,
    "subtotalHalalas" INTEGER NOT NULL,
    "vatHalalas" INTEGER NOT NULL,
    "shippingHalalas" INTEGER NOT NULL,
    "totalHalalas" INTEGER NOT NULL,
    "paymentMethod" VARCHAR(50) NOT NULL,
    "paymentStatus" VARCHAR(50) NOT NULL DEFAULT 'Pending',
    "deliveryStatus" VARCHAR(50) NOT NULL DEFAULT 'Processing',
    "trackingNumber" VARCHAR(100),
    "carrier" VARCHAR(100),
    "zatcaQrString" TEXT,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_order_userId" ON "Order"("userId");
CREATE INDEX IF NOT EXISTS "idx_order_orderNumber" ON "Order"("orderNumber");
CREATE INDEX IF NOT EXISTS "idx_order_createdAt" ON "Order"("createdAt");

CREATE TABLE IF NOT EXISTS "OrderItem" (
    "id" VARCHAR(64) PRIMARY KEY,
    "orderId" VARCHAR(64) NOT NULL REFERENCES "Order"("id") ON DELETE CASCADE,
    "productId" VARCHAR(64) NOT NULL,
    "productNameEn" VARCHAR(255) NOT NULL,
    "productNameAr" VARCHAR(255) NOT NULL,
    "unitPriceHalalas" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalHalalas" INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS "idx_orderItem_orderId" ON "OrderItem"("orderId");

INSERT INTO "_migrations" ("name") VALUES ('0001_initial_schema.sql')
ON CONFLICT ("name") DO NOTHING;

-- ===== 0002_catalog_vehicle_fitment.sql ==============================

-- AutoParts Vehicle Catalog, Dynamic Categories, Part Brands, Quality Grades, and Dynamic Attributes Migration

-- 1. Vehicle Manufacturer (Make)
CREATE TABLE IF NOT EXISTS "VehicleMake" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_vehicleMake_isPublished" ON "VehicleMake"("isPublished", "isEnabled");
CREATE INDEX IF NOT EXISTS "idx_vehicleMake_slug" ON "VehicleMake"("slug");

-- 2. Vehicle Model
CREATE TABLE IF NOT EXISTS "VehicleModel" (
    "id" VARCHAR(64) PRIMARY KEY,
    "makeId" VARCHAR(64) NOT NULL REFERENCES "VehicleMake"("id") ON DELETE CASCADE,
    "name" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) NOT NULL,
    "generation" VARCHAR(100),
    "imageUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_make_model_slug" UNIQUE ("makeId", "slug")
);

CREATE INDEX IF NOT EXISTS "idx_vehicleModel_makeId" ON "VehicleModel"("makeId");
CREATE INDEX IF NOT EXISTS "idx_vehicleModel_isPublished" ON "VehicleModel"("isPublished");

-- 3. Vehicle Year
CREATE TABLE IF NOT EXISTS "VehicleYear" (
    "id" VARCHAR(64) PRIMARY KEY,
    "modelId" VARCHAR(64) NOT NULL REFERENCES "VehicleModel"("id") ON DELETE CASCADE,
    "year" INTEGER NOT NULL,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_model_year" UNIQUE ("modelId", "year")
);

CREATE INDEX IF NOT EXISTS "idx_vehicleYear_modelId" ON "VehicleYear"("modelId");
CREATE INDEX IF NOT EXISTS "idx_vehicleYear_year" ON "VehicleYear"("year");

-- 4. Vehicle Variant (Engine / Trim / Transmission / Market)
CREATE TABLE IF NOT EXISTS "VehicleVariant" (
    "id" VARCHAR(64) PRIMARY KEY,
    "yearId" VARCHAR(64) NOT NULL REFERENCES "VehicleYear"("id") ON DELETE CASCADE,
    "trim" VARCHAR(100),
    "engine" VARCHAR(100),
    "engineCode" VARCHAR(100),
    "fuelType" VARCHAR(50),
    "transmission" VARCHAR(50),
    "market" VARCHAR(50),
    "bodyType" VARCHAR(50),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_vehicleVariant_yearId" ON "VehicleVariant"("yearId");

-- 5. Part Brands (distinct from vehicle manufacturers)
CREATE TABLE IF NOT EXISTS "PartBrand" (
    "id" VARCHAR(64) PRIMARY KEY,
    "name" VARCHAR(255) UNIQUE NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "logoUrl" TEXT,
    "description" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "isEnabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_partBrand_slug" ON "PartBrand"("slug");

-- 6. Categories (Hierarchical with displayOrder, isPublished)
CREATE TABLE IF NOT EXISTS "Category" (
    "id" VARCHAR(64) PRIMARY KEY,
    "parentId" VARCHAR(64) REFERENCES "Category"("id") ON DELETE SET NULL,
    "nameEn" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255) NOT NULL,
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "imageUrl" TEXT,
    "iconUrl" TEXT,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "isPublished" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_category_parentId" ON "Category"("parentId");
CREATE INDEX IF NOT EXISTS "idx_category_slug" ON "Category"("slug");
CREATE INDEX IF NOT EXISTS "idx_category_isPublished" ON "Category"("isPublished");

-- 7. Category Attributes (Dynamic technical specs per category)
CREATE TABLE IF NOT EXISTS "CategoryAttribute" (
    "id" VARCHAR(64) PRIMARY KEY,
    "categoryId" VARCHAR(64) NOT NULL REFERENCES "Category"("id") ON DELETE CASCADE,
    "name" VARCHAR(100) NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "dataType" VARCHAR(50) NOT NULL DEFAULT 'text', -- 'text', 'number', 'select', 'boolean'
    "unit" VARCHAR(50),
    "options" JSONB, -- array of selectable options
    "isRequired" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_category_attr_code" UNIQUE ("categoryId", "code")
);

CREATE INDEX IF NOT EXISTS "idx_catAttr_categoryId" ON "CategoryAttribute"("categoryId");

-- 8. Quality Grade Configuration
CREATE TABLE IF NOT EXISTS "QualityGradeConfig" (
    "code" VARCHAR(20) PRIMARY KEY, -- 'GRADE_A', 'GRADE_B', 'GRADE_C'
    "nameEn" VARCHAR(100) NOT NULL,
    "nameAr" VARCHAR(100) NOT NULL,
    "displayLabel" VARCHAR(100) NOT NULL,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 9. Products table (Full Automotive schema)
CREATE TABLE IF NOT EXISTS "Product" (
    "id" VARCHAR(64) PRIMARY KEY,
    "sku" VARCHAR(100) UNIQUE NOT NULL,
    "mpn" VARCHAR(100),
    "oemNumber" VARCHAR(100),
    "barcode" VARCHAR(100),
    "supplierRef" VARCHAR(100),
    "slug" VARCHAR(255) UNIQUE NOT NULL,
    "nameEn" VARCHAR(255) NOT NULL,
    "nameAr" VARCHAR(255) NOT NULL,
    "shortDescriptionEn" TEXT,
    "shortDescriptionAr" TEXT,
    "descriptionEn" TEXT,
    "descriptionAr" TEXT,
    "categoryId" VARCHAR(64) NOT NULL REFERENCES "Category"("id") ON DELETE RESTRICT,
    "subcategoryId" VARCHAR(64) REFERENCES "Category"("id") ON DELETE SET NULL,
    "brandId" VARCHAR(64) NOT NULL REFERENCES "PartBrand"("id") ON DELETE RESTRICT,
    "qualityGrade" VARCHAR(20) NOT NULL DEFAULT 'GRADE_A', -- References QualityGradeConfig code
    "condition" VARCHAR(50) NOT NULL DEFAULT 'NEW', -- NEW, USED, REFURBISHED, REMANUFACTURED
    "isOem" BOOLEAN NOT NULL DEFAULT true, -- OEM vs Aftermarket
    "isOriginal" BOOLEAN NOT NULL DEFAULT true, -- Original vs Replacement
    "testedStatus" VARCHAR(50) DEFAULT 'TESTED_VERIFIED',
    "defectNotes" TEXT,
    "inspectionNotes" TEXT,
    "packagingCondition" VARCHAR(50) DEFAULT 'ORIGINAL_BOX',
    "warrantyMonths" INTEGER DEFAULT 12,
    "warrantyTerms" TEXT,
    "returnEligible" BOOLEAN NOT NULL DEFAULT true,
    "returnWindowDays" INTEGER DEFAULT 14,
    "handlingNotes" TEXT,
    "sellingPrice" NUMERIC(12, 2) NOT NULL,
    "salePrice" NUMERIC(12, 2),
    "costPrice" NUMERIC(12, 2), -- Internal only, never exposed to customers
    "currency" VARCHAR(10) NOT NULL DEFAULT 'SAR',
    "stockQuantity" INTEGER NOT NULL DEFAULT 0,
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "warehouseLocation" VARCHAR(100),
    "shippingWeightKg" NUMERIC(8, 2),
    "dimensionsCm" VARCHAR(100),
    "installationPosition" VARCHAR(100),
    "technicalSpecs" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "seoTitle" VARCHAR(255),
    "seoDescription" TEXT,
    "tags" JSONB NOT NULL DEFAULT '[]'::jsonb,
    "status" VARCHAR(50) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, DISABLED, ARCHIVED
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "showOnHomepage" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_product_status" ON "Product"("status");
CREATE INDEX IF NOT EXISTS "idx_product_categoryId" ON "Product"("categoryId");
CREATE INDEX IF NOT EXISTS "idx_product_brandId" ON "Product"("brandId");
CREATE INDEX IF NOT EXISTS "idx_product_sku" ON "Product"("sku");
CREATE INDEX IF NOT EXISTS "idx_product_oemNumber" ON "Product"("oemNumber");
CREATE INDEX IF NOT EXISTS "idx_product_slug" ON "Product"("slug");

-- 10. Product Images
CREATE TABLE IF NOT EXISTS "ProductImage" (
    "id" VARCHAR(64) PRIMARY KEY,
    "productId" VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "url" TEXT NOT NULL,
    "altText" VARCHAR(255),
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_productImage_productId" ON "ProductImage"("productId");

-- 11. Product Cross-Reference Part Numbers
CREATE TABLE IF NOT EXISTS "PartNumber" (
    "id" VARCHAR(64) PRIMARY KEY,
    "productId" VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "type" VARCHAR(50) NOT NULL, -- 'OEM', 'MANUFACTURER', 'ALTERNATE', 'SUPERSEDED'
    "numberValue" VARCHAR(100) NOT NULL,
    "normalized" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "idx_partNumber_normalized" ON "PartNumber"("normalized");
CREATE INDEX IF NOT EXISTS "idx_partNumber_productId" ON "PartNumber"("productId");

-- 12. Verified Vehicle Fitment (Many-to-Many verified database relationship)
CREATE TABLE IF NOT EXISTS "ProductFitment" (
    "id" VARCHAR(64) PRIMARY KEY,
    "productId" VARCHAR(64) NOT NULL REFERENCES "Product"("id") ON DELETE CASCADE,
    "makeId" VARCHAR(64) NOT NULL REFERENCES "VehicleMake"("id") ON DELETE CASCADE,
    "modelId" VARCHAR(64) NOT NULL REFERENCES "VehicleModel"("id") ON DELETE CASCADE,
    "yearId" VARCHAR(64) REFERENCES "VehicleYear"("id") ON DELETE CASCADE,
    "variantId" VARCHAR(64) REFERENCES "VehicleVariant"("id") ON DELETE CASCADE,
    "yearNumber" INTEGER, -- optional cached/direct year integer
    "engineCode" VARCHAR(100),
    "fitmentNote" TEXT,
    "isUniversal" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uq_product_fitment" UNIQUE ("productId", "modelId", "yearId", "variantId")
);

CREATE INDEX IF NOT EXISTS "idx_fitment_product" ON "ProductFitment"("productId");
CREATE INDEX IF NOT EXISTS "idx_fitment_make_model" ON "ProductFitment"("makeId", "modelId");
CREATE INDEX IF NOT EXISTS "idx_fitment_model_year" ON "ProductFitment"("modelId", "yearId");

INSERT INTO "_migrations" ("name") VALUES ('0002_catalog_vehicle_fitment.sql')
ON CONFLICT ("name") DO NOTHING;

-- ===== 0003_commerce_orders_payments_discounts.sql ===================

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

INSERT INTO "_migrations" ("name") VALUES ('0003_commerce_orders_payments_discounts.sql')
ON CONFLICT ("name") DO NOTHING;

-- ===== 0004_rls_lockdown.sql =========================================

-- ============================================================================
-- AutoParts KSA — Row Level Security lockdown
--
-- Every read and write in this application goes through the Express API, which
-- connects as the database owner (Supabase `postgres` role via the pooler) and
-- therefore bypasses RLS. The browser never talks to PostgREST directly — the
-- anon key in VITE_SUPABASE_ANON_KEY is unused by application code.
--
-- So the correct posture is deny-all: enable RLS on every table and create no
-- policies for `anon` or `authenticated`. With RLS on and no matching policy,
-- PostgREST returns zero rows and rejects every write. If the anon key ever
-- leaks, customer orders, payments and admin data stay unreachable.
--
-- Portable: the role GRANT/REVOKE statements are skipped when the Supabase
-- roles are absent (local PostgreSQL, pg-mem test harness).
-- ============================================================================

DO $rls$
DECLARE
    t text;
    tables text[] := ARRAY[
        'User', 'Address', 'Session', 'RefreshToken', 'AuditLog',
        'Cart', 'CartItem',
        'Order', 'OrderItem', 'OrderEvent',
        'Payment', 'Refund', 'WebhookEvent',
        'Discount', 'DiscountRedemption',
        'InventoryMovement',
        'VehicleMake', 'VehicleModel', 'VehicleYear', 'VehicleVariant',
        'PartBrand', 'Category', 'CategoryAttribute', 'QualityGradeConfig',
        'Product', 'ProductImage', 'ProductFitment', 'PartNumber'
    ];
BEGIN
    FOREACH t IN ARRAY tables LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables
            WHERE table_schema = 'public' AND table_name = t
        ) THEN
            EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
        END IF;
    END LOOP;
END
$rls$;

-- Strip table privileges from the public API roles as a second layer of
-- defence, so a future policy mistake cannot expose data on its own.
DO $revoke$
DECLARE
    r text;
BEGIN
    FOREACH r IN ARRAY ARRAY['anon', 'authenticated'] LOOP
        IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = r) THEN
            EXECUTE format(
                'REVOKE ALL ON ALL TABLES IN SCHEMA public FROM %I', r);
            EXECUTE format(
                'REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM %I', r);
            EXECUTE format(
                'ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM %I', r);
        END IF;
    END LOOP;
END
$revoke$;

INSERT INTO "_migrations" ("name") VALUES ('0004_rls_lockdown.sql')
ON CONFLICT ("name") DO NOTHING;

-- ============================================================================
-- Administrator account
--
-- The admin panel used to compare "demoadmin"/"demoadmin" in the browser and
-- set a sessionStorage flag. That authenticated nobody, so every /api/admin/*
-- request was rejected with 401 and the panel could not save anything. Sign-in
-- is now checked against this row on the server.
--
-- Sign in at /admin with   username: demoadmin   password: demoadmin
--
-- >>> CHANGE THIS PASSWORD BEFORE THE SITE GOES LIVE. <<<
-- Set ADMIN_PASSWORD in Vercel and run `pnpm db:bootstrap`, or generate a new
-- bcrypt hash and run:
--   UPDATE "User" SET "passwordHash" = '<new-bcrypt-hash>'
--    WHERE "email" = 'demoadmin@admin.local';
-- ============================================================================

INSERT INTO "User" ("id", "email", "name", "passwordHash", "role", "isBlocked")
VALUES (
    gen_random_uuid()::text,
    'demoadmin@admin.local',
    'Store Administrator',
    '$2b$10$n7nYFLA/qTFV8SZXmzcYEeFsUoOAQAg4Yu7PCfukDx8EsJoBzyo1W',
    'SUPER_ADMIN',
    false
)
ON CONFLICT ("email") DO NOTHING;

COMMIT;

-- ============================================================================
-- Verify
-- ============================================================================
-- SELECT table_name FROM information_schema.tables
--  WHERE table_schema = 'public' ORDER BY table_name;
-- SELECT "email", "role" FROM "User" WHERE "role" <> 'CUSTOMER';
