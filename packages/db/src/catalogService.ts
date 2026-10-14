import { query, runTransaction } from './db';
import crypto from 'crypto';

export interface VehicleMake {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  displayOrder: number;
  isPublished: boolean;
  isEnabled: boolean;
  modelCount?: number;
  productCount?: number;
}

export interface VehicleModel {
  id: string;
  makeId: string;
  makeName?: string;
  name: string;
  slug: string;
  generation: string | null;
  imageUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
  years?: VehicleYear[];
}

export interface VehicleYear {
  id: string;
  modelId: string;
  year: number;
  displayOrder: number;
  isPublished: boolean;
  variants?: VehicleVariant[];
}

export interface VehicleVariant {
  id: string;
  yearId: string;
  trim: string | null;
  engine: string | null;
  engineCode: string | null;
  fuelType: string | null;
  transmission: string | null;
  market: string | null;
  bodyType: string | null;
  displayOrder: number;
  isPublished: boolean;
}

export interface PartBrand {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  description: string | null;
  isPublished: boolean;
  isEnabled: boolean;
  productCount?: number;
}

export interface Category {
  id: string;
  parentId: string | null;
  parentName?: string;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  imageUrl: string | null;
  iconUrl: string | null;
  displayOrder: number;
  isPublished: boolean;
  productCount?: number;
  subcategories?: Category[];
  attributes?: CategoryAttribute[];
}

export interface CategoryAttribute {
  id: string;
  categoryId: string;
  name: string;
  code: string;
  dataType: 'text' | 'number' | 'select' | 'boolean';
  unit: string | null;
  options: string[] | null;
  isRequired: boolean;
  displayOrder: number;
}

export interface QualityGradeConfig {
  code: string;
  nameEn: string;
  nameAr: string;
  displayLabel: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
}

export interface ProductFitmentRecord {
  id?: string;
  makeId: string;
  makeName?: string;
  modelId: string;
  modelName?: string;
  yearId?: string | null;
  yearNumber?: number | null;
  variantId?: string | null;
  variantTrim?: string | null;
  engineCode?: string | null;
  fitmentNote?: string | null;
}

export interface ProductCatalogItem {
  id: string;
  sku: string;
  mpn?: string | null;
  oemNumber?: string | null;
  barcode?: string | null;
  supplierRef?: string | null;
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn?: string | null;
  shortDescriptionAr?: string | null;
  descriptionEn?: string | null;
  descriptionAr?: string | null;
  categoryId: string;
  categoryNameEn?: string;
  categoryNameAr?: string;
  categorySlug?: string;
  subcategoryId?: string | null;
  brandId: string;
  brandName?: string;
  brandLogoUrl?: string | null;
  qualityGrade: string; // 'GRADE_A', 'GRADE_B', 'GRADE_C'
  gradeDisplayLabel?: string;
  condition: string; // 'NEW', 'USED', 'REFURBISHED', 'REMANUFACTURED'
  isOem: boolean;
  isOriginal: boolean;
  testedStatus?: string | null;
  defectNotes?: string | null;
  inspectionNotes?: string | null;
  packagingCondition?: string | null;
  warrantyMonths?: number | null;
  warrantyTerms?: string | null;
  returnEligible: boolean;
  returnWindowDays?: number | null;
  handlingNotes?: string | null;
  sellingPrice: number;
  salePrice?: number | null;
  costPrice?: number | null; // Strip in public response
  currency: string;
  stockQuantity: number;
  lowStockThreshold: number;
  warehouseLocation?: string | null;
  shippingWeightKg?: number | null;
  dimensionsCm?: string | null;
  installationPosition?: string | null;
  technicalSpecs: Record<string, any>;
  seoTitle?: string | null;
  seoDescription?: string | null;
  tags: string[];
  status: 'DRAFT' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';
  isFeatured: boolean;
  showOnHomepage: boolean;
  createdAt: string;
  updatedAt: string;
  images?: Array<{ id: string; url: string; altText?: string; isPrimary: boolean; sortOrder: number }>;
  fitments?: ProductFitmentRecord[];
  partNumbers?: Array<{ type: string; numberValue: string; normalized: string }>;
}

export async function getPublishedVehicleMakes(): Promise<VehicleMake[]> {
  const makesRes = await query<VehicleMake>(`
    SELECT * FROM "VehicleMake"
    WHERE "isPublished" = true AND "isEnabled" = true
    ORDER BY "displayOrder" ASC, name ASC
  `);

  const modelsRes = await query<{ makeId: string; count: string }>(`
    SELECT "makeId", COUNT(*) as count FROM "VehicleModel" WHERE "isPublished" = true GROUP BY "makeId"
  `);
  const modelCounts = modelsRes.rows.reduce((acc: any, r) => {
    acc[r.makeId] = Number(r.count);
    return acc;
  }, {});

  return makesRes.rows.map(m => ({
    ...m,
    modelCount: modelCounts[m.id] || 0,
    productCount: 0
  }));
}

export async function getAllVehicleMakes(): Promise<VehicleMake[]> {
  const makesRes = await query<VehicleMake>(`
    SELECT * FROM "VehicleMake"
    ORDER BY "displayOrder" ASC, name ASC
  `);

  const modelsRes = await query<{ makeId: string; count: string }>(`
    SELECT "makeId", COUNT(*) as count FROM "VehicleModel" GROUP BY "makeId"
  `);
  const modelCounts = modelsRes.rows.reduce((acc: any, r) => {
    acc[r.makeId] = Number(r.count);
    return acc;
  }, {});

  return makesRes.rows.map(m => ({
    ...m,
    modelCount: modelCounts[m.id] || 0,
    productCount: 0
  }));
}

export async function getVehicleMakeById(id: string): Promise<VehicleMake | null> {
  const res = await query<VehicleMake>(`SELECT * FROM "VehicleMake" WHERE id = $1`, [id]);
  return res.rows[0] || null;
}

export async function getVehicleMakeBySlug(slug: string): Promise<VehicleMake | null> {
  const res = await query<VehicleMake>(`SELECT * FROM "VehicleMake" WHERE slug = $1`, [slug]);
  return res.rows[0] || null;
}

export async function getModelsByMakeId(makeId: string, onlyPublished: boolean = true): Promise<VehicleModel[]> {
  const condition = onlyPublished ? 'AND vm."isPublished" = true' : '';
  const res = await query<VehicleModel>(`
    SELECT vm.*, m.name as "makeName"
    FROM "VehicleModel" vm
    JOIN "VehicleMake" m ON vm."makeId" = m.id
    WHERE vm."makeId" = $1 ${condition}
    ORDER BY vm."displayOrder" ASC, vm.name ASC
  `, [makeId]);

  // Attach years & variants
  for (const model of res.rows) {
    const yearCond = onlyPublished ? 'AND "isPublished" = true' : '';
    const yearsRes = await query<VehicleYear>(`
      SELECT * FROM "VehicleYear"
      WHERE "modelId" = $1 ${yearCond}
      ORDER BY year DESC
    `, [model.id]);

    for (const yr of yearsRes.rows) {
      const varRes = await query<VehicleVariant>(`
        SELECT * FROM "VehicleVariant"
        WHERE "yearId" = $1 ${yearCond}
        ORDER BY "displayOrder" ASC
      `, [yr.id]);
      yr.variants = varRes.rows;
    }
    model.years = yearsRes.rows;
  }

  return res.rows;
}

export async function getPublishedCategories(): Promise<Category[]> {
  const res = await query<any>(`
    SELECT c.*, p."nameEn" as "parentName"
    FROM "Category" c
    LEFT JOIN "Category" p ON c."parentId" = p.id
    WHERE c."isPublished" = true
    ORDER BY c."displayOrder" ASC, c."nameEn" ASC
  `);

  const countsRes = await query<{ categoryId: string; count: string }>(`
    SELECT "categoryId", COUNT(*) as count FROM "Product" WHERE status = 'PUBLISHED' GROUP BY "categoryId"
  `);
  const catCounts = countsRes.rows.reduce((acc: any, r) => {
    acc[r.categoryId] = Number(r.count);
    return acc;
  }, {});

  // Build tree
  const items: Category[] = res.rows.map(r => ({ ...r, productCount: catCounts[r.id] || 0 }));
  const roots = items.filter(c => !c.parentId);
  for (const root of roots) {
    root.subcategories = items.filter(c => c.parentId === root.id);
  }
  return roots;
}

export async function getAllCategories(): Promise<Category[]> {
  const res = await query<any>(`
    SELECT c.*, p."nameEn" as "parentName"
    FROM "Category" c
    LEFT JOIN "Category" p ON c."parentId" = p.id
    ORDER BY c."displayOrder" ASC, c."nameEn" ASC
  `);

  const countsRes = await query<{ categoryId: string; count: string }>(`
    SELECT "categoryId", COUNT(*) as count FROM "Product" GROUP BY "categoryId"
  `);
  const catCounts = countsRes.rows.reduce((acc: any, r) => {
    acc[r.categoryId] = Number(r.count);
    return acc;
  }, {});

  const items: Category[] = res.rows.map(r => ({ ...r, productCount: catCounts[r.id] || 0 }));
  for (const cat of items) {
    const attrs = await query<CategoryAttribute>(`
      SELECT * FROM "CategoryAttribute" WHERE "categoryId" = $1 ORDER BY "displayOrder" ASC
    `, [cat.id]);
    cat.attributes = attrs.rows;
  }
  return items;
}

export async function getAllPartBrands(onlyPublished: boolean = true): Promise<PartBrand[]> {
  const cond = onlyPublished ? 'WHERE "isPublished" = true AND "isEnabled" = true' : '';
  const res = await query<PartBrand>(`
    SELECT * FROM "PartBrand"
    ${cond}
    ORDER BY name ASC
  `);

  const countsRes = await query<{ brandId: string; count: string }>(`
    SELECT "brandId", COUNT(*) as count FROM "Product" GROUP BY "brandId"
  `);
  const brandCounts = countsRes.rows.reduce((acc: any, r) => {
    acc[r.brandId] = Number(r.count);
    return acc;
  }, {});

  return res.rows.map(b => ({
    ...b,
    productCount: brandCounts[b.id] || 0
  }));
}

export async function getQualityGrades(): Promise<QualityGradeConfig[]> {
  const res = await query<QualityGradeConfig>(`
    SELECT * FROM "QualityGradeConfig" ORDER BY "sortOrder" ASC
  `);
  return res.rows;
}

// ----------------------------------------------------
// Public Catalog Queries with Verified Fitment
// ----------------------------------------------------

export interface CatalogFilterParams {
  searchQuery?: string;
  makeId?: string;
  makeSlug?: string;
  modelId?: string;
  modelSlug?: string;
  year?: number;
  variantId?: string;
  categoryId?: string;
  categorySlug?: string;
  brandId?: string;
  qualityGrade?: string;
  condition?: string;
  inStockOnly?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'name_asc';
  limit?: number;
  offset?: number;
}

export async function searchPublishedProducts(params: CatalogFilterParams) {
  const conditions: string[] = [`p.status = 'PUBLISHED'`];
  const values: any[] = [];
  let paramIdx = 1;

  if (params.inStockOnly) {
    conditions.push(`p."stockQuantity" > 0`);
  }

  if (params.qualityGrade) {
    conditions.push(`p."qualityGrade" = $${paramIdx++}`);
    values.push(params.qualityGrade);
  }

  if (params.condition) {
    conditions.push(`p.condition = $${paramIdx++}`);
    values.push(params.condition);
  }

  if (params.brandId) {
    conditions.push(`p."brandId" = $${paramIdx++}`);
    values.push(params.brandId);
  }

  if (params.minPrice !== undefined) {
    conditions.push(`COALESCE(p."salePrice", p."sellingPrice") >= $${paramIdx++}`);
    values.push(params.minPrice);
  }

  if (params.maxPrice !== undefined) {
    conditions.push(`COALESCE(p."salePrice", p."sellingPrice") <= $${paramIdx++}`);
    values.push(params.maxPrice);
  }

  // Category filter
  if (params.categorySlug) {
    conditions.push(`(
      p."categoryId" IN (SELECT id FROM "Category" WHERE slug = $${paramIdx} OR "parentId" IN (SELECT id FROM "Category" WHERE slug = $${paramIdx}))
      OR p."subcategoryId" IN (SELECT id FROM "Category" WHERE slug = $${paramIdx})
    )`);
    values.push(params.categorySlug);
    paramIdx++;
  } else if (params.categoryId) {
    conditions.push(`(
      p."categoryId" IN (SELECT id FROM "Category" WHERE id = $${paramIdx} OR "parentId" = $${paramIdx})
      OR p."subcategoryId" = $${paramIdx}
    )`);
    values.push(params.categoryId);
    paramIdx++;
  }

  // Verified Vehicle Fitment Filter: MUST check database relationship!
  let fitmentJoin = '';
  if (params.makeId || params.makeSlug || params.modelId || params.modelSlug || params.year) {
    fitmentJoin = `JOIN "ProductFitment" pf ON pf."productId" = p.id`;

    if (params.makeSlug) {
      conditions.push(`pf."makeId" IN (SELECT id FROM "VehicleMake" WHERE slug = $${paramIdx++})`);
      values.push(params.makeSlug);
    } else if (params.makeId) {
      conditions.push(`pf."makeId" = $${paramIdx++}`);
      values.push(params.makeId);
    }

    if (params.modelSlug) {
      conditions.push(`pf."modelId" IN (SELECT id FROM "VehicleModel" WHERE slug = $${paramIdx++})`);
      values.push(params.modelSlug);
    } else if (params.modelId) {
      conditions.push(`pf."modelId" = $${paramIdx++}`);
      values.push(params.modelId);
    }

    if (params.year) {
      conditions.push(`(
        pf."yearNumber" = $${paramIdx}
        OR pf."yearId" IN (SELECT id FROM "VehicleYear" WHERE year = $${paramIdx})
      )`);
      values.push(params.year);
      paramIdx++;
    }

    if (params.variantId) {
      conditions.push(`(pf."variantId" = $${paramIdx++} OR pf."variantId" IS NULL)`);
      values.push(params.variantId);
    }
  }

  // Text/Part Number/OEM Search
  if (params.searchQuery && params.searchQuery.trim()) {
    const rawQ = params.searchQuery.trim();
    const cleanQ = rawQ.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    const likeQ = `%${rawQ}%`;
    const cleanLike = `%${cleanQ}%`;

    conditions.push(`(
      p."nameEn" ILIKE $${paramIdx}
      OR p."nameAr" ILIKE $${paramIdx}
      OR p.sku ILIKE $${paramIdx}
      OR p.mpn ILIKE $${paramIdx}
      OR p."oemNumber" ILIKE $${paramIdx}
      OR p.id IN (
        SELECT "productId" FROM "PartNumber" 
        WHERE normalized LIKE $${paramIdx + 1} OR "numberValue" ILIKE $${paramIdx}
      )
    )`);
    values.push(likeQ, cleanLike);
    paramIdx += 2;
  }

  let orderClause = 'ORDER BY p."createdAt" DESC';
  if (params.sortBy === 'price_asc') {
    orderClause = 'ORDER BY COALESCE(p."salePrice", p."sellingPrice") ASC';
  } else if (params.sortBy === 'price_desc') {
    orderClause = 'ORDER BY COALESCE(p."salePrice", p."sellingPrice") DESC';
  } else if (params.sortBy === 'name_asc') {
    orderClause = 'ORDER BY p."nameEn" ASC';
  }

  const limit = Math.min(params.limit || 50, 100);
  const offset = params.offset || 0;

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  const sql = `
    SELECT DISTINCT
      p.id, p.sku, p.mpn, p."oemNumber", p.slug, p."nameEn", p."nameAr",
      p."shortDescriptionEn", p."shortDescriptionAr", p."descriptionEn", p."descriptionAr",
      p."categoryId", c."nameEn" as "categoryNameEn", c."nameAr" as "categoryNameAr", c.slug as "categorySlug",
      p."brandId", b.name as "brandName", b."logoUrl" as "brandLogoUrl",
      p."qualityGrade", qg."displayLabel" as "gradeDisplayLabel",
      p.condition, p."isOem", p."isOriginal", p."testedStatus",
      p."warrantyMonths", p."returnEligible", p."returnWindowDays",
      p."sellingPrice", p."salePrice", p.currency, p."stockQuantity", p."warehouseLocation",
      p."installationPosition", p."technicalSpecs", p.tags, p.status, p."isFeatured",
      p."createdAt", p."updatedAt"
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    LEFT JOIN "PartBrand" b ON p."brandId" = b.id
    LEFT JOIN "QualityGradeConfig" qg ON p."qualityGrade" = qg.code
    ${fitmentJoin}
    ${whereClause}
    ${orderClause}
    LIMIT ${limit} OFFSET ${offset}
  `;

  const countSql = `
    SELECT COUNT(DISTINCT p.id) as total
    FROM "Product" p
    ${fitmentJoin}
    ${whereClause}
  `;

  const [productsRes, countRes] = await Promise.all([
    query(sql, values),
    query(countSql, values)
  ]);

  const products = productsRes.rows;
  const total = Number(countRes.rows[0]?.total || 0);

  // Hydrate images and fitment badges for found products
  if (products.length > 0) {
    const productIds = products.map(p => p.id);
    const placeholders = productIds.map((_, i) => `$${i + 1}`).join(', ');

    const imagesRes = await query(`
      SELECT * FROM "ProductImage"
      WHERE "productId" IN (${placeholders})
      ORDER BY "sortOrder" ASC, "isPrimary" DESC
    `, productIds);

    const imagesByProd = imagesRes.rows.reduce((acc: any, img: any) => {
      acc[img.productId] = acc[img.productId] || [];
      acc[img.productId].push(img);
      return acc;
    }, {});

    const fitmentsRes = await query(`
      SELECT pf.*, vm.name as "makeName", vmod.name as "modelName"
      FROM "ProductFitment" pf
      JOIN "VehicleMake" vm ON pf."makeId" = vm.id
      JOIN "VehicleModel" vmod ON pf."modelId" = vmod.id
      WHERE pf."productId" IN (${placeholders})
    `, productIds);

    const fitmentsByProd = fitmentsRes.rows.reduce((acc: any, fit: any) => {
      acc[fit.productId] = acc[fit.productId] || [];
      acc[fit.productId].push(fit);
      return acc;
    }, {});

    for (const p of products) {
      p.images = imagesByProd[p.id] || [];
      p.fitments = fitmentsByProd[p.id] || [];
    }
  }

  return {
    products,
    total,
    limit,
    offset
  };
}

export async function getProductBySlugOrId(identifier: string, allowUnpublished: boolean = false) {
  const cond = allowUnpublished ? '' : `AND p.status = 'PUBLISHED'`;
  const res = await query(`
    SELECT
      p.*,
      c."nameEn" as "categoryNameEn", c."nameAr" as "categoryNameAr", c.slug as "categorySlug",
      b.name as "brandName", b."logoUrl" as "brandLogoUrl",
      qg."displayLabel" as "gradeDisplayLabel", qg."descriptionEn" as "gradeDescriptionEn"
    FROM "Product" p
    LEFT JOIN "Category" c ON p."categoryId" = c.id
    LEFT JOIN "PartBrand" b ON p."brandId" = b.id
    LEFT JOIN "QualityGradeConfig" qg ON p."qualityGrade" = qg.code
    WHERE (p.id = $1 OR p.slug = $1) ${cond}
  `, [identifier]);

  if (res.rowCount === 0) return null;
  const prod = res.rows[0];

  // Images
  const imgRes = await query(`
    SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY "sortOrder" ASC, "isPrimary" DESC
  `, [prod.id]);
  prod.images = imgRes.rows;

  // Fitments
  const fitRes = await query(`
    SELECT pf.*, vm.name as "makeName", vmod.name as "modelName"
    FROM "ProductFitment" pf
    JOIN "VehicleMake" vm ON pf."makeId" = vm.id
    JOIN "VehicleModel" vmod ON pf."modelId" = vmod.id
    WHERE pf."productId" = $1
  `, [prod.id]);
  prod.fitments = fitRes.rows;

  // Part numbers
  const pnRes = await query(`
    SELECT * FROM "PartNumber" WHERE "productId" = $1
  `, [prod.id]);
  prod.partNumbers = pnRes.rows;

  if (!allowUnpublished) {
    // Hide internal cost price for public customers
    delete prod.costPrice;
  }

  return prod;
}

// ----------------------------------------------------
// Admin CRUD Methods
// ----------------------------------------------------

export async function createVehicleMake(data: {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  displayOrder?: number;
  isPublished?: boolean;
  isEnabled?: boolean;
}) {
  const id = `make-${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO "VehicleMake" ("id", "name", "slug", "logoUrl", "description", "displayOrder", "isPublished", "isEnabled", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [
      id,
      data.name.trim(),
      data.slug.trim().toLowerCase(),
      data.logoUrl || null,
      data.description || null,
      data.displayOrder || 0,
      data.isPublished ?? true,
      data.isEnabled ?? true
    ]
  );
  return res.rows[0];
}

export async function updateVehicleMake(id: string, data: Partial<VehicleMake>) {
  const fields: string[] = ['"updatedAt" = NOW()'];
  const values: any[] = [id];
  let idx = 2;

  if (data.name !== undefined) { fields.push(`"name" = $${idx++}`); values.push(data.name.trim()); }
  if (data.slug !== undefined) { fields.push(`"slug" = $${idx++}`); values.push(data.slug.trim().toLowerCase()); }
  if (data.logoUrl !== undefined) { fields.push(`"logoUrl" = $${idx++}`); values.push(data.logoUrl); }
  if (data.description !== undefined) { fields.push(`"description" = $${idx++}`); values.push(data.description); }
  if (data.displayOrder !== undefined) { fields.push(`"displayOrder" = $${idx++}`); values.push(data.displayOrder); }
  if (data.isPublished !== undefined) { fields.push(`"isPublished" = $${idx++}`); values.push(data.isPublished); }
  if (data.isEnabled !== undefined) { fields.push(`"isEnabled" = $${idx++}`); values.push(data.isEnabled); }

  const sql = `UPDATE "VehicleMake" SET ${fields.join(', ')} WHERE id = $1 RETURNING *`;
  const res = await query(sql, values);
  return res.rows[0] || null;
}

export async function deleteVehicleMake(id: string) {
  // Check fitments before deleting
  const fitCount = await query(`SELECT COUNT(*)::int as count FROM "ProductFitment" WHERE "makeId" = $1`, [id]);
  if (fitCount.rows[0]?.count > 0) {
    throw new Error(`Cannot delete manufacturer: it has ${fitCount.rows[0].count} product fitment records associated. Please unpublish or remove fitments first.`);
  }
  await query(`DELETE FROM "VehicleMake" WHERE id = $1`, [id]);
  return { success: true };
}

export async function createVehicleModel(data: {
  makeId: string;
  name: string;
  slug: string;
  generation?: string;
  imageUrl?: string;
  displayOrder?: number;
  isPublished?: boolean;
}) {
  const id = `model-${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO "VehicleModel" ("id", "makeId", "name", "slug", "generation", "imageUrl", "displayOrder", "isPublished", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
     RETURNING *`,
    [
      id,
      data.makeId,
      data.name.trim(),
      data.slug.trim().toLowerCase(),
      data.generation || null,
      data.imageUrl || null,
      data.displayOrder || 0,
      data.isPublished ?? true
    ]
  );
  return res.rows[0];
}

export async function addVehicleYear(modelId: string, year: number) {
  const id = `year-${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO "VehicleYear" ("id", "modelId", "year", "displayOrder", "isPublished")
     VALUES ($1, $2, $3, $4, true)
     ON CONFLICT ("modelId", "year") DO UPDATE SET "isPublished" = true
     RETURNING *`,
    [id, modelId, year, year]
  );
  return res.rows[0];
}

export async function createCategory(data: {
  parentId?: string | null;
  nameEn: string;
  nameAr: string;
  slug: string;
  descriptionEn?: string;
  descriptionAr?: string;
  imageUrl?: string;
  iconUrl?: string;
  displayOrder?: number;
  isPublished?: boolean;
}) {
  const id = `cat-${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO "Category" ("id", "parentId", "nameEn", "nameAr", "slug", "descriptionEn", "descriptionAr", "imageUrl", "iconUrl", "displayOrder", "isPublished", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
     RETURNING *`,
    [
      id,
      data.parentId || null,
      data.nameEn.trim(),
      data.nameAr.trim(),
      data.slug.trim().toLowerCase(),
      data.descriptionEn || null,
      data.descriptionAr || null,
      data.imageUrl || null,
      data.iconUrl || null,
      data.displayOrder || 0,
      data.isPublished ?? true
    ]
  );
  return res.rows[0];
}

export async function updateCategory(id: string, data: Partial<Category>) {
  const fields: string[] = ['"updatedAt" = NOW()'];
  const values: any[] = [id];
  let idx = 2;

  if (data.nameEn !== undefined) { fields.push(`"nameEn" = $${idx++}`); values.push(data.nameEn.trim()); }
  if (data.nameAr !== undefined) { fields.push(`"nameAr" = $${idx++}`); values.push(data.nameAr.trim()); }
  if (data.slug !== undefined) { fields.push(`"slug" = $${idx++}`); values.push(data.slug.trim().toLowerCase()); }
  if (data.descriptionEn !== undefined) { fields.push(`"descriptionEn" = $${idx++}`); values.push(data.descriptionEn); }
  if (data.imageUrl !== undefined) { fields.push(`"imageUrl" = $${idx++}`); values.push(data.imageUrl); }
  if (data.displayOrder !== undefined) { fields.push(`"displayOrder" = $${idx++}`); values.push(data.displayOrder); }
  if (data.isPublished !== undefined) { fields.push(`"isPublished" = $${idx++}`); values.push(data.isPublished); }
  if (data.parentId !== undefined) { fields.push(`"parentId" = $${idx++}`); values.push(data.parentId || null); }

  const res = await query(`UPDATE "Category" SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, values);
  return res.rows[0] || null;
}

export async function createPartBrand(data: {
  name: string;
  slug: string;
  logoUrl?: string;
  description?: string;
  isPublished?: boolean;
  isEnabled?: boolean;
}) {
  const id = `brand-${crypto.randomUUID()}`;
  const res = await query(
    `INSERT INTO "PartBrand" ("id", "name", "slug", "logoUrl", "description", "isPublished", "isEnabled", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
     RETURNING *`,
    [
      id,
      data.name.trim(),
      data.slug.trim().toLowerCase(),
      data.logoUrl || null,
      data.description || null,
      data.isPublished ?? true,
      data.isEnabled ?? true
    ]
  );
  return res.rows[0];
}

export async function updatePartBrand(id: string, data: Partial<PartBrand>) {
  const fields: string[] = ['"updatedAt" = NOW()'];
  const values: any[] = [id];
  let idx = 2;

  if (data.name !== undefined) { fields.push(`"name" = $${idx++}`); values.push(data.name.trim()); }
  if (data.slug !== undefined) { fields.push(`"slug" = $${idx++}`); values.push(data.slug.trim().toLowerCase()); }
  if (data.logoUrl !== undefined) { fields.push(`"logoUrl" = $${idx++}`); values.push(data.logoUrl); }
  if (data.description !== undefined) { fields.push(`"description" = $${idx++}`); values.push(data.description); }
  if (data.isPublished !== undefined) { fields.push(`"isPublished" = $${idx++}`); values.push(data.isPublished); }
  if (data.isEnabled !== undefined) { fields.push(`"isEnabled" = $${idx++}`); values.push(data.isEnabled); }

  const res = await query(`UPDATE "PartBrand" SET ${fields.join(', ')} WHERE id = $1 RETURNING *`, values);
  return res.rows[0] || null;
}

export async function deletePartBrand(id: string) {
  const prodCount = await query(`SELECT COUNT(*)::int as count FROM "Product" WHERE "brandId" = $1`, [id]);
  if (prodCount.rows[0]?.count > 0) {
    throw new Error(`Cannot delete brand: it has ${prodCount.rows[0].count} products associated. Please reassign or delete the products first.`);
  }
  await query(`DELETE FROM "PartBrand" WHERE id = $1`, [id]);
  return { success: true };
}

export async function deleteCategory(id: string) {
  const prodCount = await query(`SELECT COUNT(*)::int as count FROM "Product" WHERE "categoryId" = $1 OR "subcategoryId" = $1`, [id]);
  if (prodCount.rows[0]?.count > 0) {
    throw new Error(`Cannot delete category: it has ${prodCount.rows[0].count} products associated. Please reassign or delete products first.`);
  }
  const childCount = await query(`SELECT COUNT(*)::int as count FROM "Category" WHERE "parentId" = $1`, [id]);
  if (childCount.rows[0]?.count > 0) {
    throw new Error(`Cannot delete category: it has ${childCount.rows[0].count} subcategories. Please delete or reassign subcategories first.`);
  }
  await query(`DELETE FROM "Category" WHERE id = $1`, [id]);
  return { success: true };
}

export async function deleteProduct(id: string, actingAdminId?: string) {
  const existing = await query(`SELECT * FROM "Product" WHERE id = $1`, [id]);
  if (!existing.rows.length) {
    throw new Error('Product not found');
  }

  if (actingAdminId) {
    await query(`
      INSERT INTO "AuditLog" ("id", "userId", "action", "entity", "entityId", "oldValues", "createdAt")
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      `audit-${crypto.randomUUID()}`,
      actingAdminId,
      'DELETE_PRODUCT',
      'Product',
      id,
      JSON.stringify({ sku: existing.rows[0].sku, nameEn: existing.rows[0].nameEn, price: existing.rows[0].sellingPrice })
    ]);
  }

  // Cascades clean up ProductImage, ProductFitment, PartNumber
  await query(`DELETE FROM "Product" WHERE id = $1`, [id]);
  return { success: true };
}

export async function updateQualityGradeConfig(code: string, data: Partial<QualityGradeConfig>) {
  const res = await query(
    `INSERT INTO "QualityGradeConfig" ("code", "nameEn", "nameAr", "displayLabel", "descriptionEn", "sortOrder", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, 1, NOW())
     ON CONFLICT ("code") DO UPDATE SET
       "nameEn" = COALESCE(EXCLUDED."nameEn", "QualityGradeConfig"."nameEn"),
       "nameAr" = COALESCE(EXCLUDED."nameAr", "QualityGradeConfig"."nameAr"),
       "displayLabel" = COALESCE(EXCLUDED."displayLabel", "QualityGradeConfig"."displayLabel"),
       "descriptionEn" = COALESCE(EXCLUDED."descriptionEn", "QualityGradeConfig"."descriptionEn"),
       "updatedAt" = NOW()
     RETURNING *`,
    [code, data.nameEn || code, data.nameAr || code, data.displayLabel || code, data.descriptionEn || null]
  );
  return res.rows[0];
}

// ----------------------------------------------------
// Complete Product Creation & Update with Fitments
// ----------------------------------------------------

export async function saveProductWithFitments(productData: any, actingAdminId?: string) {
  return await runTransaction(async (client) => {
    const isNew = !productData.id;
    const productId = productData.id || `prod-${crypto.randomUUID()}`;
    const slug = productData.slug || `${(productData.nameEn || 'part').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Date.now().toString(36)}`;

    // Uniqueness checks
    const skuCheck = await client.query('SELECT id FROM "Product" WHERE sku = $1 AND id <> $2', [productData.sku, productId]);
    if (skuCheck.rowCount && skuCheck.rowCount > 0) {
      throw new Error(`SKU "${productData.sku}" is already in use by another product.`);
    }

    if (isNew) {
      await client.query(`
        INSERT INTO "Product" (
          "id", "sku", "mpn", "oemNumber", "barcode", "supplierRef", "slug",
          "nameEn", "nameAr", "shortDescriptionEn", "shortDescriptionAr", "descriptionEn", "descriptionAr",
          "categoryId", "subcategoryId", "brandId", "qualityGrade", "condition",
          "isOem", "isOriginal", "testedStatus", "defectNotes", "inspectionNotes", "packagingCondition",
          "warrantyMonths", "warrantyTerms", "returnEligible", "returnWindowDays", "handlingNotes",
          "sellingPrice", "salePrice", "costPrice", "currency", "stockQuantity", "lowStockThreshold",
          "warehouseLocation", "shippingWeightKg", "dimensionsCm", "installationPosition",
          "technicalSpecs", "seoTitle", "seoDescription", "tags", "status", "isFeatured", "showOnHomepage",
          "createdAt", "updatedAt"
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18,
          $19, $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30, $31, $32, $33, $34, $35,
          $36, $37, $38, $39,
          $40, $41, $42, $43, $44, $45, $46,
          NOW(), NOW()
        )
      `, [
        productId,
        productData.sku,
        productData.mpn || null,
        productData.oemNumber || null,
        productData.barcode || null,
        productData.supplierRef || null,
        slug,
        productData.nameEn,
        productData.nameAr || productData.nameEn,
        productData.shortDescriptionEn || null,
        productData.shortDescriptionAr || null,
        productData.descriptionEn || null,
        productData.descriptionAr || null,
        productData.categoryId,
        productData.subcategoryId || null,
        productData.brandId,
        productData.qualityGrade || 'GRADE_A',
        productData.condition || 'NEW',
        productData.isOem ?? true,
        productData.isOriginal ?? true,
        productData.testedStatus || 'TESTED_VERIFIED',
        productData.defectNotes || null,
        productData.inspectionNotes || null,
        productData.packagingCondition || 'ORIGINAL_BOX',
        productData.warrantyMonths || 12,
        productData.warrantyTerms || null,
        productData.returnEligible ?? true,
        productData.returnWindowDays || 14,
        productData.handlingNotes || null,
        Number(productData.sellingPrice),
        productData.salePrice ? Number(productData.salePrice) : null,
        productData.costPrice ? Number(productData.costPrice) : null,
        productData.currency || 'SAR',
        parseInt(productData.stockQuantity, 10) || 0,
        parseInt(productData.lowStockThreshold, 10) || 5,
        productData.warehouseLocation || 'Riyadh Central Hub',
        productData.shippingWeightKg ? Number(productData.shippingWeightKg) : null,
        productData.dimensionsCm || null,
        productData.installationPosition || null,
        JSON.stringify(productData.technicalSpecs || {}),
        productData.seoTitle || productData.nameEn,
        productData.seoDescription || productData.shortDescriptionEn,
        JSON.stringify(productData.tags || []),
        productData.status || 'DRAFT',
        productData.isFeatured ?? false,
        productData.showOnHomepage ?? false
      ]);
    } else {
      // Record Audit before update
      const existing = await client.query('SELECT * FROM "Product" WHERE id = $1', [productId]);
      if (existing.rowCount && existing.rowCount > 0 && actingAdminId) {
        await client.query(`
          INSERT INTO "AuditLog" ("id", "userId", "action", "entity", "entityId", "oldValues", "newValues", "createdAt")
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
        `, [
          `audit-${crypto.randomUUID()}`,
          actingAdminId,
          'UPDATE_PRODUCT',
          'Product',
          productId,
          JSON.stringify({ price: existing.rows[0].sellingPrice, stock: existing.rows[0].stockQuantity, status: existing.rows[0].status }),
          JSON.stringify({ price: productData.sellingPrice, stock: productData.stockQuantity, status: productData.status })
        ]);
      }

      await client.query(`
        UPDATE "Product" SET
          "sku" = $2, "mpn" = $3, "oemNumber" = $4, "barcode" = $5, "supplierRef" = $6, "slug" = $7,
          "nameEn" = $8, "nameAr" = $9, "shortDescriptionEn" = $10, "shortDescriptionAr" = $11, "descriptionEn" = $12, "descriptionAr" = $13,
          "categoryId" = $14, "subcategoryId" = $15, "brandId" = $16, "qualityGrade" = $17, "condition" = $18,
          "isOem" = $19, "isOriginal" = $20, "testedStatus" = $21, "defectNotes" = $22, "inspectionNotes" = $23, "packagingCondition" = $24,
          "warrantyMonths" = $25, "warrantyTerms" = $26, "returnEligible" = $27, "returnWindowDays" = $28, "handlingNotes" = $29,
          "sellingPrice" = $30, "salePrice" = $31, "costPrice" = $32, "currency" = $33, "stockQuantity" = $34, "lowStockThreshold" = $35,
          "warehouseLocation" = $36, "shippingWeightKg" = $37, "dimensionsCm" = $38, "installationPosition" = $39,
          "technicalSpecs" = $40, "seoTitle" = $41, "seoDescription" = $42, "tags" = $43, "status" = $44, "isFeatured" = $45, "showOnHomepage" = $46,
          "updatedAt" = NOW()
        WHERE id = $1
      `, [
        productId,
        productData.sku,
        productData.mpn || null,
        productData.oemNumber || null,
        productData.barcode || null,
        productData.supplierRef || null,
        slug,
        productData.nameEn,
        productData.nameAr || productData.nameEn,
        productData.shortDescriptionEn || null,
        productData.shortDescriptionAr || null,
        productData.descriptionEn || null,
        productData.descriptionAr || null,
        productData.categoryId,
        productData.subcategoryId || null,
        productData.brandId,
        productData.qualityGrade || 'GRADE_A',
        productData.condition || 'NEW',
        productData.isOem ?? true,
        productData.isOriginal ?? true,
        productData.testedStatus || 'TESTED_VERIFIED',
        productData.defectNotes || null,
        productData.inspectionNotes || null,
        productData.packagingCondition || 'ORIGINAL_BOX',
        productData.warrantyMonths || 12,
        productData.warrantyTerms || null,
        productData.returnEligible ?? true,
        productData.returnWindowDays || 14,
        productData.handlingNotes || null,
        Number(productData.sellingPrice),
        productData.salePrice ? Number(productData.salePrice) : null,
        productData.costPrice ? Number(productData.costPrice) : null,
        productData.currency || 'SAR',
        parseInt(productData.stockQuantity, 10) || 0,
        parseInt(productData.lowStockThreshold, 10) || 5,
        productData.warehouseLocation || 'Riyadh Central Hub',
        productData.shippingWeightKg ? Number(productData.shippingWeightKg) : null,
        productData.dimensionsCm || null,
        productData.installationPosition || null,
        JSON.stringify(productData.technicalSpecs || {}),
        productData.seoTitle || productData.nameEn,
        productData.seoDescription || productData.shortDescriptionEn,
        JSON.stringify(productData.tags || []),
        productData.status || 'DRAFT',
        productData.isFeatured ?? false,
        productData.showOnHomepage ?? false
      ]);
    }

    // Replace Images if provided
    if (Array.isArray(productData.images)) {
      await client.query('DELETE FROM "ProductImage" WHERE "productId" = $1', [productId]);
      for (let i = 0; i < productData.images.length; i++) {
        const img = productData.images[i];
        const imgUrl = typeof img === 'string' ? img : img.url;
        if (!imgUrl) continue;
        await client.query(`
          INSERT INTO "ProductImage" ("id", "productId", "url", "altText", "isPrimary", "sortOrder")
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [
          `img-${crypto.randomUUID()}`,
          productId,
          imgUrl,
          img.altText || productData.nameEn,
          i === 0,
          i
        ]);
      }
    }

    // Replace Fitments if provided
    if (Array.isArray(productData.fitments)) {
      await client.query('DELETE FROM "ProductFitment" WHERE "productId" = $1', [productId]);
      for (const fit of productData.fitments) {
        if (!fit.makeId || !fit.modelId) continue;
        await client.query(`
          INSERT INTO "ProductFitment" ("id", "productId", "makeId", "modelId", "yearId", "yearNumber", "variantId", "fitmentNote")
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT DO NOTHING
        `, [
          `fit-${crypto.randomUUID()}`,
          productId,
          fit.makeId,
          fit.modelId,
          fit.yearId || null,
          fit.yearNumber || null,
          fit.variantId || null,
          fit.fitmentNote || null
        ]);
      }
    }

    // Cross-reference Part numbers
    if (productData.oemNumber) {
      await client.query('DELETE FROM "PartNumber" WHERE "productId" = $1', [productId]);
      const normOem = productData.oemNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      await client.query(`
        INSERT INTO "PartNumber" ("id", "productId", "type", "numberValue", "normalized")
        VALUES ($1, $2, 'OEM', $3, $4)
      `, [`pn-${crypto.randomUUID()}`, productId, productData.oemNumber, normOem]);
    }

    return { id: productId, status: productData.status, sku: productData.sku };
  });
}
