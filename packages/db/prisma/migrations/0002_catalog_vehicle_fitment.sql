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
