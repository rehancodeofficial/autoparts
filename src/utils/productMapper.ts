/**
 * Maps a product row from /api/products onto the `Part` shape the storefront
 * components already render, so the catalogue can come from the database
 * without touching any presentation code.
 */
import { Part, PartFitment } from '../types';

interface ApiFitment {
  makeName?: string;
  modelName?: string;
  yearNumber?: number | null;
  engineCode?: string | null;
  fitmentNote?: string | null;
  makeId?: string;
  modelId?: string;
  yearId?: string | null;
}

/** Collapses per-year fitment rows into one entry per make + model. */
function groupFitments(rows: ApiFitment[] = []): PartFitment[] {
  const byKey = new Map<string, PartFitment>();

  for (const row of rows) {
    const make = row.makeName || '';
    const model = row.modelName || '';
    if (!make && !model) continue;

    const key = `${make}|${model}`;
    const existing = byKey.get(key);
    const year = row.yearNumber ?? null;

    if (existing) {
      if (year && !existing.years.includes(year)) existing.years.push(year);
      if (row.engineCode && !existing.engines?.includes(row.engineCode)) {
        existing.engines = [...(existing.engines || []), row.engineCode];
      }
    } else {
      byKey.set(key, {
        make,
        model,
        years: year ? [year] : [],
        engines: row.engineCode ? [row.engineCode] : [],
        notes: row.fitmentNote || undefined,
        makeId: row.makeId,
        modelId: row.modelId,
        yearId: row.yearId || undefined,
      });
    }
  }

  for (const fitment of byKey.values()) fitment.years.sort((a, b) => a - b);
  return [...byKey.values()];
}

function toNumber(value: any, fallback = 0): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function mapApiProductToPart(row: any): Part {
  // NUMERIC columns arrive as strings over JSON.
  const sellingPrice = toNumber(row.sellingPrice);
  const salePrice = row.salePrice === null || row.salePrice === undefined
    ? null
    : toNumber(row.salePrice);
  const hasSale = salePrice !== null && salePrice > 0 && salePrice < sellingPrice;

  const images: string[] = Array.isArray(row.images)
    ? row.images
        .map((img: any) => (typeof img === 'string' ? img : img?.url))
        .filter(Boolean)
    : [];

  const specs = row.technicalSpecs && typeof row.technicalSpecs === 'object'
    ? row.technicalSpecs
    : {};

  const discountPercent = hasSale
    ? Math.round(((sellingPrice - (salePrice as number)) / sellingPrice) * 100)
    : 0;

  return {
    id: row.id,
    sku: row.sku,
    mpn: row.mpn || undefined,
    oemNumber: row.oemNumber || '',
    barcode: row.barcode || undefined,
    slug: row.slug,
    alternateNumbers: Array.isArray(row.alternateNumbers)
      ? row.alternateNumbers
      : Array.isArray(row.partNumbers)
        ? row.partNumbers.map((n: any) => n.numberValue).filter(Boolean)
        : [],
    nameEn: row.nameEn,
    nameAr: row.nameAr,
    shortDescriptionEn: row.shortDescriptionEn || undefined,
    shortDescriptionAr: row.shortDescriptionAr || undefined,

    category: row.categoryNameEn || '',
    categoryId: row.categoryId,
    categorySlug: row.categorySlug || undefined,
    subcategoryId: row.subcategoryId || undefined,

    brand: row.brandName || '',
    brandId: row.brandId,
    brandLogoUrl: row.brandLogoUrl || undefined,

    qualityGrade: row.qualityGrade,
    gradeDisplayLabel: row.gradeDisplayLabel || undefined,
    condition: row.condition === 'NEW'
      ? 'Genuine Original'
      : String(row.condition || '').replace(/_/g, ' ') || 'Genuine Original',
    isOem: row.isOem,
    isOriginal: row.isOriginal,
    testedStatus: row.testedStatus || undefined,
    defectNotes: row.defectNotes || undefined,
    inspectionNotes: row.inspectionNotes || undefined,
    packagingCondition: row.packagingCondition || undefined,
    warrantyMonths: row.warrantyMonths ?? undefined,
    returnEligible: row.returnEligible,
    returnWindowDays: row.returnWindowDays ?? undefined,

    // `price` is what the shopper pays; the server re-derives it identically
    // at checkout, so the two can never disagree.
    price: hasSale ? (salePrice as number) : sellingPrice,
    originalPrice: hasSale ? sellingPrice : undefined,
    salePrice: salePrice ?? undefined,
    costPrice: row.costPrice !== undefined && row.costPrice !== null
      ? toNumber(row.costPrice)
      : undefined,

    stock: toNumber(row.stockQuantity),
    lowStockThreshold: row.lowStockThreshold ?? undefined,
    warehouseLocation: row.warehouseLocation || '',

    // No review system exists yet, so these stay neutral rather than inventing
    // ratings the database does not hold.
    rating: 0,
    reviewCount: 0,

    images,
    descriptionEn: row.descriptionEn || row.shortDescriptionEn || '',
    descriptionAr: row.descriptionAr || row.shortDescriptionAr || '',
    installationPosition: row.installationPosition || undefined,
    specifications: Object.fromEntries(
      Object.entries(specs).map(([k, v]) => [k, String(v)])
    ),
    technicalSpecs: specs,
    fitments: groupFitments(row.fitments),

    warranty: row.warrantyMonths
      ? `${row.warrantyMonths} Months Official Warranty`
      : 'Manufacturer warranty',
    deliveryDays: 'Same-day Riyadh, 24-48h KSA',

    status: row.status,
    isFeatured: Boolean(row.isFeatured),
    showOnHomepage: Boolean(row.showOnHomepage),
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,

    // Flags the existing deal components read.
    ...(hasSale ? { isDeal: true, dealBadge: `${discountPercent}% OFF` } : {}),
  } as Part;
}

export function mapApiProductsToParts(rows: any[]): Part[] {
  return (rows || []).map(mapApiProductToPart);
}
