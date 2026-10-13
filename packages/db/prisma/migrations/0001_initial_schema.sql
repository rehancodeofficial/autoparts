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
