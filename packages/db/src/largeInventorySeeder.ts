/**
 * AutoPart Large Demo Inventory Seeder
 * ------------------------------------
 * Adds ~42 realistic automotive parts across all existing vehicle makes/models.
 * Idempotent: uses ON CONFLICT DO NOTHING / DO UPDATE everywhere.
 * Safe to re-run multiple times without creating duplicates.
 *
 * NOTE: All fitment records are labeled [DEMO] — they represent illustrative
 * compatibility only and should be verified before claiming OEM fitment accuracy.
 */
import { query } from './db.js';

interface Fitment {
  makeId: string;
  modelId: string;
  year: number;
  note: string;
}

interface ProductDef {
  id: string;
  sku: string;
  mpn: string;
  oemNumber: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  shortDescriptionEn: string;
  shortDescriptionAr: string;
  categoryId: string;
  brandId: string;
  qualityGrade: 'GRADE_A' | 'GRADE_B' | 'GRADE_C';
  condition: 'NEW' | 'USED' | 'REFURBISHED' | 'REMANUFACTURED';
  isOem: boolean;
  isOriginal: boolean;
  sellingPrice: number;
  salePrice: number | null;
  costPrice: number | null;
  stockQuantity: number;
  warrantyMonths: number;
  status: 'PUBLISHED' | 'DRAFT';
  isFeatured: boolean;
  showOnHomepage: boolean;
  specs: Record<string, string>;
  images: string[];
  fitments: Fitment[];
}

async function upsertProduct(p: ProductDef) {
  await query(`
    INSERT INTO "Product" (
      "id", "sku", "mpn", "oemNumber", "slug", "nameEn", "nameAr",
      "shortDescriptionEn", "shortDescriptionAr", "categoryId", "brandId",
      "qualityGrade", "condition", "isOem", "isOriginal",
      "sellingPrice", "salePrice", "costPrice", "stockQuantity",
      "warrantyMonths", "technicalSpecs", "status", "isFeatured", "showOnHomepage"
    ) VALUES (
      $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24
    )
    ON CONFLICT ("sku") DO UPDATE SET
      "sellingPrice"    = EXCLUDED."sellingPrice",
      "stockQuantity"   = EXCLUDED."stockQuantity",
      "salePrice"       = EXCLUDED."salePrice",
      "status"          = EXCLUDED."status",
      "nameEn"          = EXCLUDED."nameEn",
      "nameAr"          = EXCLUDED."nameAr"
  `, [
    p.id, p.sku, p.mpn, p.oemNumber, p.slug, p.nameEn, p.nameAr,
    p.shortDescriptionEn, p.shortDescriptionAr, p.categoryId, p.brandId,
    p.qualityGrade, p.condition, p.isOem, p.isOriginal,
    p.sellingPrice, p.salePrice, p.costPrice, p.stockQuantity,
    p.warrantyMonths, JSON.stringify(p.specs), p.status, p.isFeatured, p.showOnHomepage
  ]);

  for (let i = 0; i < p.images.length; i++) {
    await query(`
      INSERT INTO "ProductImage" ("id","productId","url","isPrimary","sortOrder")
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT DO NOTHING
    `, [`img-${p.id}-${i}`, p.id, p.images[i], i === 0, i]);
  }

  if (p.oemNumber) {
    const norm = p.oemNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    await query(`
      INSERT INTO "PartNumber" ("id","productId","type","numberValue","normalized")
      VALUES ($1,$2,'OEM',$3,$4)
      ON CONFLICT DO NOTHING
    `, [`pn-${p.id}-oem`, p.id, p.oemNumber, norm]);
  }

  for (const fit of p.fitments) {
    const fitId = `fit-${p.id}-${fit.makeId}-${fit.modelId}-${fit.year}`;
    await query(`
      INSERT INTO "ProductFitment" ("id","productId","makeId","modelId","yearNumber","fitmentNote","isUniversal")
      VALUES ($1,$2,$3,$4,$5,$6,false)
      ON CONFLICT DO NOTHING
    `, [fitId, p.id, fit.makeId, fit.modelId, fit.year, fit.note]);
  }
}

async function seedAdditionalBrands() {
  const brands = [
    { id: 'brand-ngk', name: 'NGK Spark Plugs', slug: 'ngk', logoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=120&q=80', desc: 'World leading manufacturer of spark plugs and sensors' },
    { id: 'brand-mann', name: 'MANN+HUMMEL Filters', slug: 'mann-hummel', logoUrl: 'https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=120&q=80', desc: 'German OEM-quality air, oil, cabin, and fuel filtration' },
    { id: 'brand-aisin', name: 'Aisin Japan', slug: 'aisin', logoUrl: 'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=120&q=80', desc: 'Toyota-affiliated OEM drivetrain, transmission, and cooling parts' },
    { id: 'brand-gates', name: 'Gates Belts & Hoses', slug: 'gates', logoUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=120&q=80', desc: 'Precision-engineered timing belts, serpentine belts, and drive systems' },
    { id: 'brand-valeo', name: 'Valeo France', slug: 'valeo', logoUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=120&q=80', desc: 'European OEM lighting, alternators, starters, and ADAS components' },
    { id: 'brand-exide', name: 'Exide Technologies', slug: 'exide', logoUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=120&q=80', desc: 'Trusted automotive, EFB, and AGM battery manufacturer since 1888' },
    { id: 'brand-honda-oem', name: 'Honda Genuine Parts', slug: 'honda-genuine', logoUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=120&q=80', desc: 'Factory OEM parts for Honda and Acura vehicles' },
    { id: 'brand-nissan-oem', name: 'Nissan Genuine Parts', slug: 'nissan-genuine', logoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=120&q=80', desc: 'OEM factory replacement parts for Nissan and Infiniti' },
    { id: 'brand-hyundai-oem', name: 'Hyundai Genuine Parts', slug: 'hyundai-genuine', logoUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=120&q=80', desc: 'Official OEM parts for Hyundai and Kia vehicles' },
    { id: 'brand-monroe', name: 'Monroe Shocks', slug: 'monroe', logoUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=120&q=80', desc: 'Leading shock absorber and strut manufacturer' },
  ];
  for (const b of brands) {
    await query(`
      INSERT INTO "PartBrand" ("id","name","slug","logoUrl","description","isPublished","isEnabled")
      VALUES ($1,$2,$3,$4,$5,true,true)
      ON CONFLICT ("name") DO NOTHING
    `, [b.id, b.name, b.slug, b.logoUrl, b.desc]);
  }
}

async function seedAdditionalCategories() {
  const cats = [
    { id: 'cat-batteries', nameEn: 'Car Batteries', nameAr: 'بطاريات السيارات', slug: 'car-batteries', descEn: 'Start-Stop AGM, EFB, and standard lead-acid batteries.', imageUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=300&q=80', order: 9 },
    { id: 'cat-belts', nameEn: 'Belts, Chains & Tensioners', nameAr: 'السيور والسلاسل والشادّات', slug: 'belts-chains-tensioners', descEn: 'Timing belts, timing chains, serpentine belts, idlers, and tensioner pulleys.', imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=300&q=80', order: 10 },
    { id: 'cat-sensors', nameEn: 'Sensors & Electronics', nameAr: 'أجهزة الاستشعار والإلكترونيات', slug: 'sensors-electronics', descEn: 'Oxygen sensors, ABS sensors, MAP sensors, throttle position, and engine management.', imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=300&q=80', order: 11 },
    { id: 'cat-alternators', nameEn: 'Alternators & Starters', nameAr: 'الدينامو ومحرك البادئ', slug: 'alternators-starters', descEn: 'Remanufactured and new alternators, starters, and voltage regulators.', imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=300&q=80', order: 12 },
    { id: 'cat-mirrors', nameEn: 'Mirrors & Cameras', nameAr: 'المرايا وكاميرات السيارة', slug: 'mirrors-cameras', descEn: 'Wing mirrors, blind-spot mirrors, reverse cameras, and parking sensors.', imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80', order: 13 },
    { id: 'cat-exhaust', nameEn: 'Exhaust & Emission Parts', nameAr: 'منظومة العادم والانبعاثات', slug: 'exhaust-emission-parts', descEn: 'Catalytic converters, mufflers, oxygen sensors, DPF, and exhaust manifolds.', imageUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=300&q=80', order: 14 },
    { id: 'cat-transmission', nameEn: 'Transmission & Clutch', nameAr: 'ناقل الحركة والقابوس', slug: 'transmission-clutch', descEn: 'ATF filters, clutch kits, torque converters, CV axles, and driveshaft components.', imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80', order: 15 },
  ];
  for (const c of cats) {
    await query(`
      INSERT INTO "Category" ("id","nameEn","nameAr","slug","descriptionEn","imageUrl","displayOrder","isPublished")
      VALUES ($1,$2,$3,$4,$5,$6,$7,true)
      ON CONFLICT ("slug") DO UPDATE SET "imageUrl" = EXCLUDED."imageUrl", "isPublished" = true
    `, [c.id, c.nameEn, c.nameAr, c.slug, c.descEn, c.imageUrl, c.order]);
  }
}

const INVENTORY: ProductDef[] = [
  // ---- BATTERIES ----
  {
    id: 'prod-b01', sku: 'BAT-EXI-60AH-55B24', mpn: '55B24R-EXI', oemNumber: '28800-21080',
    slug: 'exide-premium-60ah-car-battery-55b24r',
    nameEn: 'Exide Premium 60Ah Car Battery (55B24R)',
    nameAr: 'بطارية سيارة إكسايد بريميوم 60 أمبير',
    shortDescriptionEn: 'Calcium-calcium sealed maintenance-free 60Ah battery with 500 CCA.',
    shortDescriptionAr: 'بطارية كالسيوم مغلقة 60 أمبير 500 تيار إدارة.',
    categoryId: 'cat-batteries', brandId: 'brand-exide',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 320, salePrice: 285, costPrice: 195, stockQuantity: 35, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: true, showOnHomepage: true,
    specs: { Capacity: '60Ah', CCA: '500A', Voltage: '12V', Group: '55B24R' },
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] 2.5L All Trims' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2021, note: '[DEMO] 2.0L Engine' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 1.5T Engine' },
    ]
  },
  {
    id: 'prod-b02', sku: 'BAT-EXI-80AH-DIN', mpn: '80D26R-EXI', oemNumber: '28800-YZZ22',
    slug: 'exide-heavy-duty-80ah-suv-battery',
    nameEn: 'Exide Heavy Duty 80Ah Battery for Large SUVs',
    nameAr: 'بطارية إكسايد ثقيلة 80 أمبير للسيارات الكبيرة',
    shortDescriptionEn: '80Ah 700 CCA battery for V8 engines in extreme desert conditions.',
    shortDescriptionAr: 'بطارية 80 أمبير 700 أمبير تيار للمحركات V8 في صحراء الخليج.',
    categoryId: 'cat-batteries', brandId: 'brand-exide',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 490, salePrice: 440, costPrice: 290, stockQuantity: 18, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Capacity: '80Ah', CCA: '700A', Voltage: '12V', Group: '80D26R' },
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2022, note: '[DEMO] 4.5L V8 Diesel' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] 5.6L V8' },
      { makeId: 'make-ford', modelId: 'model-f150', year: 2021, note: '[DEMO] 5.0L V8' },
    ]
  },
  // ---- BRAKE PADS ----
  {
    id: 'prod-brk-02', sku: 'BRK-HON-CIVIC-FR', mpn: '45022-T5A-A01', oemNumber: '45022-T5A-A01',
    slug: 'honda-civic-genuine-front-brake-pads',
    nameEn: 'Honda Genuine Front Brake Pad Set — Civic / Accord',
    nameAr: 'طقم أقمشة فرامل أمامية أصلية هوندا سيفيك وأكورد',
    shortDescriptionEn: 'OEM ceramic front brake pads with wear indicator for Honda Civic and Accord.',
    shortDescriptionAr: 'أقمشة فرامل أمامية سيراميك أصلية مع حساس بلى للهوندا سيفيك والأكورد.',
    categoryId: 'cat-brakes', brandId: 'brand-honda-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 195, salePrice: null, costPrice: 115, stockQuantity: 50, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { 'Axle Position': 'Front', Material: 'Ceramic', 'Wear Sensor': 'Included' },
    images: ['https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] All Trims' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] All Trims' },
      { makeId: 'make-honda', modelId: 'model-accord', year: 2021, note: '[DEMO] 1.5T & 2.0T' },
    ]
  },
  {
    id: 'prod-brk-03', sku: 'BRK-TOY-CAM-REAR', mpn: '04466-33150', oemNumber: '04466-33150',
    slug: 'toyota-camry-rear-ceramic-brake-pads',
    nameEn: 'Toyota Genuine Rear Ceramic Brake Pads — Camry XV70',
    nameAr: 'طقم أقمشة فرامل خلفية سيراميك أصلية كامري XV70',
    shortDescriptionEn: 'OEM rear ceramic pads for Camry XV70 (2018–2024) with low dust formulation.',
    shortDescriptionAr: 'أقمشة فرامل خلفية أصلية منخفضة الغبار للكامري XV70.',
    categoryId: 'cat-brakes', brandId: 'brand-toyota-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 240, salePrice: 215, costPrice: 140, stockQuantity: 38, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { 'Axle Position': 'Rear', Material: 'Ceramic Low-Dust', Generation: 'XV70 2018–2024' },
    images: ['https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] All Trims' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] All Trims' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2020, note: '[DEMO] All Trims' },
    ]
  },
  {
    id: 'prod-brk-04', sku: 'BRK-BOS-HYU-ELAN', mpn: 'BP1030', oemNumber: '58101-F2A30',
    slug: 'bosch-quietcast-hyundai-elantra-sonata-front-pads',
    nameEn: 'Bosch QuietCast Ceramic Front Pads — Hyundai Elantra / Sonata',
    nameAr: 'أقمشة فرامل بوش سيراميك هيونداي إلانترا وسوناتا',
    shortDescriptionEn: 'Bosch QuietCast pads with pre-coated hardware for noise-free braking.',
    shortDescriptionAr: 'أقمشة بوش كيوايت كاست مع إطارات مطلية لفرملة هادئة.',
    categoryId: 'cat-brakes', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 165, salePrice: 145, costPrice: 90, stockQuantity: 60, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { 'Axle Position': 'Front', Material: 'Ceramic QuietCast', Hardware: 'Pre-Coated' },
    images: ['https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2023, note: '[DEMO] 1.6L & 2.0L' },
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2022, note: '[DEMO] 1.6L & 2.0L' },
      { makeId: 'make-hyundai', modelId: 'model-sonata', year: 2022, note: '[DEMO] 2.5L' },
    ]
  },
  {
    id: 'prod-lc-02', sku: 'BRK-ADV-LC-FRONT', mpn: '04465-60430', oemNumber: '04465-60430',
    slug: 'advics-brake-pads-front-land-cruiser',
    nameEn: 'Advics Heavy-Duty Front Brake Pads — Land Cruiser LC200/LC300',
    nameAr: 'طقم أقمشة فرامل أدفيكس ثقيلة أمامية — لاند كروزر LC200/LC300',
    shortDescriptionEn: 'Heavy-duty Advics ceramic pads for Land Cruiser with improved high-heat fade resistance.',
    shortDescriptionAr: 'أقمشة فرامل ثقيلة أدفيكس للاند كروزر بمقاومة تلاشي عالية الحرارة.',
    categoryId: 'cat-brakes', brandId: 'brand-advics',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 580, salePrice: 520, costPrice: 340, stockQuantity: 20, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Axle: 'Front', Material: 'Ceramic Heavy-Duty', 'Heat Rating': 'Grade HH' },
    images: ['https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2023, note: '[DEMO] LC300' },
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2022, note: '[DEMO] LC300' },
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2021, note: '[DEMO] LC200' },
    ]
  },
  // ---- FILTERS ----
  {
    id: 'prod-flt-02', sku: 'FLT-MAN-W71930', mpn: 'W719/30', oemNumber: 'W71930',
    slug: 'mann-oil-filter-w71930-honda-civic-accord',
    nameEn: 'MANN+HUMMEL Spin-On Oil Filter W719/30 — Honda',
    nameAr: 'فلتر زيت مان هيوميل دوار — هوندا سيفيك والأكورد',
    shortDescriptionEn: 'German-engineered spin-on oil filter with anti-drain back valve for Honda engines.',
    shortDescriptionAr: 'فلتر زيت دوار هندسة ألمانية مع صمام منع التسرب لمحركات هوندا.',
    categoryId: 'cat-filters', brandId: 'brand-mann',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 42, salePrice: null, costPrice: 24, stockQuantity: 120, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Spin-On Full-Flow', Thread: 'M20x1.5', Height: '78 mm', 'Anti-Drain Valve': 'Yes' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 1.5T Engine' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 1.5T Engine' },
      { makeId: 'make-honda', modelId: 'model-accord', year: 2021, note: '[DEMO] 1.5T' },
    ]
  },
  {
    id: 'prod-flt-03', sku: 'FLT-TOY-AIR-17801', mpn: '17801-YZZ02', oemNumber: '17801-YZZ02',
    slug: 'toyota-genuine-engine-air-filter-camry-corolla',
    nameEn: 'Toyota Genuine Engine Air Filter — Camry / Corolla 2.0–2.5L',
    nameAr: 'فلتر هواء محرك أصلي تويوتا — كامري وكورولا',
    shortDescriptionEn: 'OEM multi-layer paper engine air filter engineered for dusty GCC environments.',
    shortDescriptionAr: 'فلتر هواء محرك متعدد الطبقات أصلي مصمم لبيئة الغبار الخليجية.',
    categoryId: 'cat-filters', brandId: 'brand-toyota-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 65, salePrice: null, costPrice: 38, stockQuantity: 90, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Panel Air Filter', Media: 'Multi-Ply Synthetic', Efficiency: '>99%' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 2.5L Engine' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] 2.0L Engine' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2021, note: '[DEMO] 2.0L Engine' },
    ]
  },
  {
    id: 'prod-flt-04', sku: 'FLT-MAN-CABIN-HYU', mpn: 'CU34018-2', oemNumber: '97133-G3000',
    slug: 'mann-carbon-cabin-filter-hyundai-elantra-sonata',
    nameEn: 'MANN+HUMMEL Carbon Cabin Filter — Hyundai Elantra / Sonata',
    nameAr: 'فلتر هواء مقصورة كربون مان هيوميل — هيونداي إلانترا وسوناتا',
    shortDescriptionEn: 'Activated carbon cabin filter removing dust, pollen, odors, and gases.',
    shortDescriptionAr: 'فلتر مقصورة كربون نشط يُزيل الغبار والروائح والغازات.',
    categoryId: 'cat-filters', brandId: 'brand-mann',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 75, salePrice: 65, costPrice: 40, stockQuantity: 75, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Carbon Combi', 'Particle Efficiency': '>95%', 'Activated Carbon': 'Yes' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2023, note: '[DEMO] All Variants' },
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2022, note: '[DEMO] All Variants' },
      { makeId: 'make-hyundai', modelId: 'model-sonata', year: 2022, note: '[DEMO] All Variants' },
    ]
  },
  {
    id: 'prod-flt-05', sku: 'FLT-NIS-OIL-PATROL', mpn: '15208-9E01B', oemNumber: '15208-9E01B',
    slug: 'nissan-genuine-oil-filter-patrol-vk56',
    nameEn: 'Nissan Genuine Oil Filter — Patrol Y62 5.6L V8',
    nameAr: 'فلتر زيت نيسان أصلي — باترول Y62 5.6 في8',
    shortDescriptionEn: 'OEM Nissan spin-on oil filter for VK56VD engine with double-layer media.',
    shortDescriptionAr: 'فلتر زيت نيسان أصلي دوار للمحرك VK56VD بوسيط ثنائي الطبقة.',
    categoryId: 'cat-filters', brandId: 'brand-nissan-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 55, salePrice: null, costPrice: 30, stockQuantity: 65, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Spin-On', Engine: 'VK56VD 5.6L V8', Thread: 'M20x1.5' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2023, note: '[DEMO] VK56VD' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] VK56VD' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2021, note: '[DEMO] VK56VD' },
    ]
  },
  {
    id: 'prod-lc-01', sku: 'FLT-TOY-LC-AIR-300', mpn: '17801-0S010', oemNumber: '17801-0S010',
    slug: 'toyota-genuine-air-filter-land-cruiser-300',
    nameEn: 'Toyota Genuine Air Filter — Land Cruiser LC300 3.5L V6 TT',
    nameAr: 'فلتر هواء أصلي تويوتا — لاند كروزر LC300 3.5 تيرو',
    shortDescriptionEn: 'OEM Toyota air filter for the LC300 twin-turbo V6 with desert filtration.',
    shortDescriptionAr: 'فلتر هواء أصلي للاند كروزر LC300 تيرو V6 مزدوج مع ترشيح صحراوي.',
    categoryId: 'cat-filters', brandId: 'brand-toyota-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 120, salePrice: null, costPrice: 68, stockQuantity: 45, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Engine: 'F33A-FTV 3.5L V6 TT', Type: 'Panel Air Filter', 'Service Interval': '15,000 km' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2023, note: '[DEMO] LC300 3.5L V6 TT' },
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2022, note: '[DEMO] LC300 3.5L V6 TT' },
    ]
  },
  {
    id: 'prod-f150-01', sku: 'FLT-FORD-F150-OIL', mpn: 'FL-500S', oemNumber: 'FL500S',
    slug: 'oil-filter-ford-f150-50l-v8',
    nameEn: 'Extended Life Oil Filter — Ford F-150 5.0L V8 (Motorcraft Spec)',
    nameAr: 'فلتر زيت طويل العمر — فورد F-150 5.0 في8',
    shortDescriptionEn: 'FL500S-spec oil filter for F-150 Coyote 5.0L V8 with synthetic filtration media.',
    shortDescriptionAr: 'فلتر زيت FL500S للـ F-150 محرك كويوت 5.0L V8 بوسيط اصطناعي.',
    categoryId: 'cat-filters', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 65, salePrice: null, costPrice: 35, stockQuantity: 55, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Engine: 'Coyote 5.0L V8', Type: 'Spin-On', Capacity: 'Extended Life' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-ford', modelId: 'model-f150', year: 2022, note: '[DEMO] 5.0L Coyote V8' },
      { makeId: 'make-ford', modelId: 'model-f150', year: 2021, note: '[DEMO] 5.0L Coyote V8' },
    ]
  },
  {
    id: 'prod-lex-01', sku: 'FLT-LEX-ES350-OIL', mpn: '04152-YZZA5', oemNumber: '04152-YZZA5',
    slug: 'lexus-genuine-oil-filter-es350-35l-v6',
    nameEn: 'Lexus Genuine Oil Filter Cartridge — ES350 3.5L V6',
    nameAr: 'فلتر زيت ليكسوس أصلي — ES350 3.5 في6',
    shortDescriptionEn: 'OEM Lexus oil filter element for the 2GR-FKS 3.5L V6 engine.',
    shortDescriptionAr: 'عنصر فلتر زيت ليكسوس أصلي للمحرك 2GR-FKS 3.5L V6.',
    categoryId: 'cat-filters', brandId: 'brand-toyota-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 65, salePrice: null, costPrice: 38, stockQuantity: 70, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Engine: '2GR-FKS 3.5L V6', Type: 'Cartridge Element', Gasket: 'Included' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-lexus', modelId: 'model-es350', year: 2023, note: '[DEMO] 2GR-FKS V6' },
      { makeId: 'make-lexus', modelId: 'model-es350', year: 2022, note: '[DEMO] 2GR-FKS V6' },
      { makeId: 'make-lexus', modelId: 'model-es350', year: 2021, note: '[DEMO] 2GR-FKS V6' },
    ]
  },
  // ---- SPARK PLUGS / ENGINE ----
  {
    id: 'prod-eng-02', sku: 'IGN-NGK-IRIDIX-HON', mpn: 'ILZKR7B-11S', oemNumber: 'DILZKR7B11S',
    slug: 'ngk-laser-iridium-honda-civic-accord-4pack',
    nameEn: 'NGK Laser Iridium Spark Plugs — Honda Civic 1.5T / Accord (Pack 4)',
    nameAr: 'بواجي NGK ليزر إيريديوم — هوندا سيفيك وأكورد (طقم 4)',
    shortDescriptionEn: 'NGK 0.8mm iridium tip for optimal combustion in turbocharged Honda VTEC engines.',
    shortDescriptionAr: 'بواجي NGK إيريديوم 0.8 ملم للمحركات التربو سيفيك وأكورد.',
    categoryId: 'cat-engine', brandId: 'brand-ngk',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 180, salePrice: 160, costPrice: 100, stockQuantity: 48, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: true, showOnHomepage: true,
    specs: { Electrode: 'Laser Iridium 0.8mm', 'Thread Size': '14mm', Gap: '1.1mm' },
    images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 1.5T VTEC Turbo' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 1.5T VTEC Turbo' },
      { makeId: 'make-honda', modelId: 'model-accord', year: 2021, note: '[DEMO] 1.5T & 2.0T' },
    ]
  },
  {
    id: 'prod-eng-03', sku: 'IGN-DEN-V8-8PACK', mpn: 'SC20HR11', oemNumber: 'SC20HR11',
    slug: 'denso-iridium-tt-spark-plugs-v8-8pack',
    nameEn: 'Denso Iridium TT Spark Plugs — Land Cruiser / Patrol V8 (Pack 8)',
    nameAr: 'بواجي دينسو إيريديوم TT — لاند كروزر وباترول V8 (طقم 8)',
    shortDescriptionEn: 'Twin-tip iridium+platinum electrodes for V8 engines for maximum power and longevity.',
    shortDescriptionAr: 'بواجي ذو طرفين إيريديوم وبلاتين للمحركات V8 لأعلى أداء.',
    categoryId: 'cat-engine', brandId: 'brand-denso',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 420, salePrice: 380, costPrice: 240, stockQuantity: 22, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Configuration: 'TT Twin-Tip', Electrode: 'Iridium + Platinum', 'Pack Size': '8 Plugs', Engine: 'V8 4.0L–5.6L' },
    images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2022, note: '[DEMO] 4.0L V6' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] 5.6L V8 VK56VD' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2021, note: '[DEMO] 5.6L V8' },
    ]
  },
  // ---- BELTS & TENSIONERS ----
  {
    id: 'prod-blt-01', sku: 'BLT-GAT-TIM-KIT-CAM', mpn: 'TCK286', oemNumber: '13568-0P010',
    slug: 'gates-timing-belt-kit-water-pump-toyota-camry-corolla',
    nameEn: 'Gates Timing Belt Kit with Water Pump — Toyota Camry / Corolla',
    nameAr: 'طقم سير توقيت مع طرمبة ماء جيتس — كامري وكورولا',
    shortDescriptionEn: 'Complete Gates timing belt kit including tensioner, idler, and water pump for 2AR-FE / 2ZR-FE.',
    shortDescriptionAr: 'طقم سير توقيت كامل جيتس مع شادّ ومتكئ وطرمبة ماء لمحركات تويوتا.',
    categoryId: 'cat-belts', brandId: 'brand-gates',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 385, salePrice: 345, costPrice: 220, stockQuantity: 25, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: true, showOnHomepage: false,
    specs: { Components: 'Belt + Tensioner + Idler + Water Pump', Engine: '2AR-FE / 2ZR-FE', Teeth: '143T' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 2.5L 2AR-FE' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] 2.5L 2AR-FE' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] 2.0L 2ZR-FE' },
    ]
  },
  {
    id: 'prod-blt-02', sku: 'BLT-GAT-SRPE-HON', mpn: 'K061006', oemNumber: '38920-R40-A01',
    slug: 'gates-serpentine-belt-honda-civic-accord',
    nameEn: 'Gates Micro-V Serpentine Belt — Honda Civic / Accord 1.5T',
    nameAr: 'سير ميكانيكي جيتس Micro-V — هوندا سيفيك والأكورد',
    shortDescriptionEn: 'Gates EPDM Micro-V serpentine belt with 200,000 km service life.',
    shortDescriptionAr: 'سير محرك جيتس EPDM لعمر تشغيلي 200 ألف كيلومتر.',
    categoryId: 'cat-belts', brandId: 'brand-gates',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 95, salePrice: 82, costPrice: 52, stockQuantity: 55, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Micro-V Serpentine', Compound: 'EPDM', Length: '1006mm', Ribs: 'K6' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 1.5T VTEC' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 1.5T VTEC' },
      { makeId: 'make-honda', modelId: 'model-accord', year: 2021, note: '[DEMO] 1.5T' },
    ]
  },
  {
    id: 'prod-blt-03', sku: 'BLT-GAT-CHAIN-PATROL', mpn: 'TCK280WP', oemNumber: '13070-EA20A',
    slug: 'gates-timing-chain-kit-nissan-patrol-vk56vd',
    nameEn: 'Gates Timing Chain Kit — Nissan Patrol VK56VD V8',
    nameAr: 'طقم سلسلة توقيت جيتس — نيسان باترول VK56VD V8',
    shortDescriptionEn: 'Complete timing chain set for VK56VD V8 engine including guides and tensioners.',
    shortDescriptionAr: 'طقم سلسلة توقيت كامل لمحرك VK56VD V8 مع الأدلة والشادات.',
    categoryId: 'cat-belts', brandId: 'brand-gates',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 850, salePrice: 780, costPrice: 510, stockQuantity: 10, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Engine: 'VK56VD 5.6L V8', Includes: 'Chain + Tensioners + Guides', Type: 'Timing Chain Set' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] VK56VD V8' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2021, note: '[DEMO] VK56VD V8' },
    ]
  },
  // ---- SENSORS ----
  {
    id: 'prod-sen-01', sku: 'SEN-BOS-O2-CAM', mpn: '0258006028', oemNumber: '89465-33460',
    slug: 'bosch-upstream-o2-sensor-toyota-camry',
    nameEn: 'Bosch Wideband O2 Sensor (Upstream) — Toyota Camry 2.5L',
    nameAr: 'حساس أكسجين بوش عريض النطاق أمامي — تويوتا كامري 2.5 لتر',
    shortDescriptionEn: 'Bosch OE-Spec wideband upstream oxygen sensor for optimal fuel mixture control.',
    shortDescriptionAr: 'حساس أكسجين بوش عريض النطاق للتحكم في خليط الوقود كامري 2.5 لتر.',
    categoryId: 'cat-sensors', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 185, salePrice: 165, costPrice: 100, stockQuantity: 42, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Wideband AFR', Position: 'Upstream Bank 1', Connector: '4-Wire', Heating: 'Yes' },
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 2.5L 2AR-FE Bank 1' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] 2.5L 2AR-FE Bank 1' },
    ]
  },
  {
    id: 'prod-sen-02', sku: 'SEN-BOS-ABS-ELAN', mpn: '0986594649', oemNumber: '59810-F2350',
    slug: 'bosch-abs-wheel-speed-sensor-hyundai-elantra',
    nameEn: 'Bosch ABS Wheel Speed Sensor — Hyundai Elantra (Front)',
    nameAr: 'حساس سرعة عجل ABS بوش أمامي — هيونداي إلانترا',
    shortDescriptionEn: 'Precision Bosch ABS sensor for accurate wheel speed data in Elantra.',
    shortDescriptionAr: 'حساس سرعة ABS دقيق لنظام الثبات في هيونداي إلانترا.',
    categoryId: 'cat-sensors', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 145, salePrice: null, costPrice: 80, stockQuantity: 38, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Magnetic Active ABS', Position: 'Front Left or Right', Connector: '2-Pin' },
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2023, note: '[DEMO] Front' },
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2022, note: '[DEMO] Front' },
      { makeId: 'make-hyundai', modelId: 'model-sonata', year: 2022, note: '[DEMO] Front' },
    ]
  },
  {
    id: 'prod-sen-03', sku: 'SEN-DEN-MAF-LC', mpn: '197400-2050', oemNumber: '22204-75020',
    slug: 'denso-maf-sensor-land-cruiser-40l-v6',
    nameEn: 'Denso Mass Air Flow (MAF) Sensor — Land Cruiser 4.0L V6',
    nameAr: 'حساس تدفق الهواء MAF دينسو — لاند كروزر 4.0 لتر في6',
    shortDescriptionEn: 'OEM Denso MAF sensor for accurate air mass measurement in Land Cruiser 4.0L engines.',
    shortDescriptionAr: 'حساس تدفق هواء دينسو OEM لقياس دقيق لكتلة الهواء في لاند كروزر 4.0L.',
    categoryId: 'cat-sensors', brandId: 'brand-denso',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 420, salePrice: 380, costPrice: 250, stockQuantity: 15, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Hot Wire MAF', Engine: '1GR-FE 4.0L V6', Connector: '5-Pin', Output: 'Analog 0–5V' },
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2022, note: '[DEMO] 4.0L 1GR-FE V6' },
      { makeId: 'make-toyota', modelId: 'model-landcruiser', year: 2021, note: '[DEMO] 4.0L 1GR-FE V6' },
    ]
  },
  {
    id: 'prod-sen-04', sku: 'SEN-NIS-CRANK-PATROL', mpn: '23731-JA11A', oemNumber: '23731-JA11A',
    slug: 'nissan-genuine-crankshaft-position-sensor-patrol',
    nameEn: 'Nissan Genuine Crankshaft Position Sensor — Patrol VK56VD',
    nameAr: 'حساس وضع عمود الكرنك نيسان أصلي — باترول VK56VD',
    shortDescriptionEn: 'OEM crankshaft position sensor for Patrol VK56VD ensuring precise ignition timing.',
    shortDescriptionAr: 'حساس وضع عمود الكرنك أصلي للباترول VK56VD لدقة توقيت الاشتعال.',
    categoryId: 'cat-sensors', brandId: 'brand-nissan-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 210, salePrice: null, costPrice: 120, stockQuantity: 20, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Hall Effect CKP Sensor', Engine: 'VK56VD 5.6L', Connector: '3-Pin' },
    images: ['https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2023, note: '[DEMO] VK56VD' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] VK56VD' },
    ]
  },
  // ---- SUSPENSION ----
  {
    id: 'prod-sus-02', sku: 'SHK-KYB-REAR-CAM', mpn: '349088', oemNumber: '48530-06830',
    slug: 'kyb-excel-g-rear-shock-toyota-camry-xv70',
    nameEn: 'KYB Excel-G Rear Gas Shock Absorber — Toyota Camry XV70',
    nameAr: 'مساعد هيدروليك خلفي KYB — كامري XV70',
    shortDescriptionEn: 'KYB Excel-G twin-tube rear shock for Camry XV70, restoring OEM ride quality.',
    shortDescriptionAr: 'مساعد تعليق خلفي KYB ثنائي الأنبوب لاستعادة ثبات كامري XV70.',
    categoryId: 'cat-suspension', brandId: 'brand-kyb',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 295, salePrice: 270, costPrice: 175, stockQuantity: 30, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Position: 'Rear Left or Right', Design: 'Twin-tube Gas', Type: 'Shock Absorber' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] XV70 Rear' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] XV70 Rear' },
    ]
  },
  {
    id: 'prod-sus-03', sku: 'SHK-MON-PATROL-FR', mpn: 'E4861', oemNumber: '56210-1LA0A',
    slug: 'monroe-gas-magnum-front-shock-nissan-patrol-y62',
    nameEn: 'Monroe Gas-Magnum Heavy Duty Front Shock — Nissan Patrol Y62',
    nameAr: 'مساعد مونرو غاز ماغنم ثقيل أمامي — نيسان باترول Y62',
    shortDescriptionEn: 'Monroe Gas-Magnum monotube front shock for Patrol Y62 off-road and GCC highway use.',
    shortDescriptionAr: 'مساعد مونرو غاز مونوتيوب للباترول Y62 للطرق الوعرة والسريعة.',
    categoryId: 'cat-suspension', brandId: 'brand-monroe',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 580, salePrice: 520, costPrice: 340, stockQuantity: 12, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Position: 'Front', Design: 'Monotube Gas', 'Load Rating': 'Heavy Duty' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] Y62 Front' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2021, note: '[DEMO] Y62 Front' },
    ]
  },
  {
    id: 'prod-sus-04', sku: 'SHK-KYB-CIVIC-FR', mpn: '339263', oemNumber: '51621-TBA-A01',
    slug: 'kyb-excel-g-front-strut-honda-civic-11th-gen',
    nameEn: 'KYB Excel-G Front Strut Assembly — Honda Civic 11th Gen (2021+)',
    nameAr: 'مجموعة مساعد أمامي KYB — هوندا سيفيك الجيل 11',
    shortDescriptionEn: 'Complete KYB strut for Civic 2021+ ensuring factory ride height and alignment.',
    shortDescriptionAr: 'مجموعة مساعد KYB للسيفيك 2021+ لارتفاع مصنعي وإعداد دقيق.',
    categoryId: 'cat-suspension', brandId: 'brand-kyb',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 420, salePrice: 385, costPrice: 245, stockQuantity: 18, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Position: 'Front Left or Right', Type: 'Complete Strut Assembly', Generation: '11th Gen 2021+' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 11th Gen Front' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 11th Gen Front' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2021, note: '[DEMO] 11th Gen Front' },
    ]
  },
  {
    id: 'prod-lex-02', sku: 'SHK-KYB-ES350-REAR', mpn: '340096', oemNumber: '48530-79175',
    slug: 'kyb-rear-shock-lexus-es350-xz10',
    nameEn: 'KYB Excel-G Rear Shock — Lexus ES350 XZ10 (2019+)',
    nameAr: 'مساعد خلفي KYB — ليكسوس ES350 XZ10',
    shortDescriptionEn: 'KYB OE-equivalent rear shock for Lexus ES350 XZ10 maintaining luxury ride compliance.',
    shortDescriptionAr: 'مساعد خلفي KYB معادل OE لليكسوس ES350 XZ10.',
    categoryId: 'cat-suspension', brandId: 'brand-kyb',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 480, salePrice: 430, costPrice: 290, stockQuantity: 10, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Position: 'Rear', Generation: 'XZ10 2019+', Type: 'Twin-Tube Gas Shock' },
    images: ['https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-lexus', modelId: 'model-es350', year: 2023, note: '[DEMO] XZ10 Rear' },
      { makeId: 'make-lexus', modelId: 'model-es350', year: 2022, note: '[DEMO] XZ10 Rear' },
    ]
  },
  // ---- COOLING ----
  {
    id: 'prod-cool-02', sku: 'RAD-DEN-CIVIC-11', mpn: '19010-5PA-A51', oemNumber: '19010-5PA-A51',
    slug: 'denso-radiator-honda-civic-accord-15t',
    nameEn: 'Denso Cooling Radiator — Honda Civic / Accord 1.5T',
    nameAr: 'رديتر تبريد دينسو — هوندا سيفيك وأكورد 1.5 تيرو',
    shortDescriptionEn: 'OE-quality Denso aluminum radiator with integrated ATF oil cooler for Civic and Accord.',
    shortDescriptionAr: 'رديتر ألمنيوم دينسو جودة OE مع مبرد زيت ناقل الحركة.',
    categoryId: 'cat-cooling', brandId: 'brand-denso',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 490, salePrice: 445, costPrice: 290, stockQuantity: 16, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Material: 'Aluminum / Polymer Tank', 'ATF Cooler': 'Integrated', Rows: 'Double-Row' },
    images: ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 1.5T CVT' },
      { makeId: 'make-honda', modelId: 'model-accord', year: 2021, note: '[DEMO] 1.5T & 2.0T' },
    ]
  },
  {
    id: 'prod-cool-03', sku: 'WPP-AIS-CAM', mpn: 'AWP-0105', oemNumber: '16110-29085',
    slug: 'aisin-water-pump-toyota-camry-corolla-2ar-fe',
    nameEn: 'Aisin OEM Water Pump — Toyota Camry / Corolla 2AR-FE',
    nameAr: 'طرمبة ماء أيسين — تويوتا كامري وكورولا 2AR-FE',
    shortDescriptionEn: 'Aisin OE water pump with ceramic mechanical seal for Toyota 2AR-FE engines.',
    shortDescriptionAr: 'طرمبة ماء أيسين مع إيصال ميكانيكي سيراميكي لمحركات تويوتا 2AR-FE.',
    categoryId: 'cat-cooling', brandId: 'brand-aisin',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 220, salePrice: 195, costPrice: 130, stockQuantity: 32, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Engine: '2AR-FE 2.5L', 'Seal Type': 'Ceramic Mechanical', Impeller: 'Pressed Steel' },
    images: ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 2.5L 2AR-FE' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] 2.0L' },
    ]
  },
  // ---- HEADLIGHTS ----
  {
    id: 'prod-lgt-02', sku: 'LGT-VAL-COR-LEFT', mpn: '044814', oemNumber: '81150-12C10',
    slug: 'valeo-led-headlight-left-toyota-corolla-e210',
    nameEn: 'Valeo Full LED Headlamp (Left) — Toyota Corolla E210 (2019+)',
    nameAr: 'شمعة نور ليد يسار فاليو — تويوتا كورولا E210',
    shortDescriptionEn: 'Valeo replacement full LED headlight (left/driver) for Corolla E210 (2019+).',
    shortDescriptionAr: 'شمعة إضاءة ليد كاملة يسار بديلة فاليو للكورولا E210.',
    categoryId: 'cat-headlights', brandId: 'brand-valeo',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 890, salePrice: 810, costPrice: 530, stockQuantity: 9, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Side: 'Left (Driver)', Technology: 'Full LED', DRL: 'Integrated', AFS: 'No' },
    images: ['https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] E210 Left Side' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2021, note: '[DEMO] E210 Left Side' },
    ]
  },
  {
    id: 'prod-lgt-03', sku: 'LGT-HON-CIV-PAIR', mpn: '33150-T20-A01', oemNumber: '33150-T20-A01',
    slug: 'honda-genuine-led-headlight-pair-civic-11gen',
    nameEn: 'Honda Genuine LED Headlight Pair — Civic 11th Gen (2021+)',
    nameAr: 'طقم مصابيح ليد أصلي هوندا — سيفيك الجيل 11',
    shortDescriptionEn: 'Matching pair (left + right) genuine Honda LED headlamp assemblies for Civic 11th Gen.',
    shortDescriptionAr: 'طقم كامل (يسار ويمين) مصابيح ليد أصلية هوندا سيفيك الجيل 11.',
    categoryId: 'cat-headlights', brandId: 'brand-honda-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 2200, salePrice: 1980, costPrice: 1320, stockQuantity: 5, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: true, showOnHomepage: false,
    specs: { Side: 'Set (Left + Right)', Technology: 'Full LED', DRL: 'Yes', Generation: '11th Gen 2021+' },
    images: ['https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 11th Gen' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 11th Gen' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2021, note: '[DEMO] 11th Gen' },
    ]
  },
  {
    id: 'prod-lgt-04', sku: 'LGT-VAL-ELAN-RIGHT', mpn: '047520', oemNumber: '92101-AA510',
    slug: 'valeo-led-headlight-right-hyundai-elantra-cn7',
    nameEn: 'Valeo LED Headlamp (Right) — Hyundai Elantra CN7 (2020+)',
    nameAr: 'شمعة نور ليد يمين فاليو — هيونداي إلانترا CN7',
    shortDescriptionEn: 'Valeo OE-quality LED headlamp right side for Elantra CN7 generation.',
    shortDescriptionAr: 'شمعة إضاءة ليد يمين فاليو جودة OE للإلانترا CN7.',
    categoryId: 'cat-headlights', brandId: 'brand-valeo',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 750, salePrice: 680, costPrice: 450, stockQuantity: 11, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Side: 'Right (Passenger)', Technology: 'Full LED', DRL: 'Integrated', Generation: 'CN7 2020+' },
    images: ['https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2023, note: '[DEMO] CN7 Right Side' },
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2022, note: '[DEMO] CN7 Right Side' },
    ]
  },
  // ---- MIRRORS ----
  {
    id: 'prod-mir-01', sku: 'MIR-TOY-CAM-LEFT', mpn: '87940-06540', oemNumber: '87940-06540',
    slug: 'toyota-genuine-wing-mirror-left-camry-xv70',
    nameEn: 'Toyota Genuine Power Wing Mirror (Left) — Camry XV70',
    nameAr: 'مرآة جانبية كهربائية يسار أصلية — كامري XV70',
    shortDescriptionEn: 'OEM left power-fold, heated, turn-signal side mirror for Camry XV70.',
    shortDescriptionAr: 'مرآة جانبية يسار أصلية قابلة للطي كهربائياً مع تسخين وإشارة انعطاف.',
    categoryId: 'cat-mirrors', brandId: 'brand-toyota-oem',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 680, salePrice: 610, costPrice: 400, stockQuantity: 12, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Side: 'Left (Driver)', Fold: 'Power-Fold', Heated: 'Yes', 'Turn Signal': 'Integrated' },
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] XV70 XLE & Grande' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] XV70 XLE & Grande' },
    ]
  },
  {
    id: 'prod-mir-02', sku: 'MIR-BOS-REVCAN-PAT', mpn: 'BC-PATROL-NIS', oemNumber: '28442-1LB0A',
    slug: 'bosch-reverse-camera-nissan-patrol-y62',
    nameEn: 'Bosch OE-Spec HD Reverse Camera — Nissan Patrol Y62',
    nameAr: 'كاميرا خلفية بوش HD عالية الدقة — نيسان باترول Y62',
    shortDescriptionEn: 'Bosch OE-spec rear-view camera with dynamic parking guidelines for Patrol Y62.',
    shortDescriptionAr: 'كاميرا رؤية خلفية بوش مع خطوط مواقف ديناميكية للباترول Y62.',
    categoryId: 'cat-mirrors', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 380, salePrice: 340, costPrice: 210, stockQuantity: 18, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Resolution: '1080p HD', 'Night Vision': 'IR Night Mode', FOV: '170°', Guidelines: 'Dynamic' },
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] Y62 All Trims' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2021, note: '[DEMO] Y62 All Trims' },
    ]
  },
  // ---- BUMPERS ----
  {
    id: 'prod-bmp-01', sku: 'BMP-TOY-COR-FR', mpn: '52119-12A11', oemNumber: '52119-12A11',
    slug: 'toyota-corolla-e210-front-bumper-primed',
    nameEn: 'Toyota Corolla E210 Front Bumper Cover — Primed',
    nameAr: 'غطاء الصدام الأمامي تويوتا كورولا E210 مبطن للدهان',
    shortDescriptionEn: 'OEM-compatible primed front bumper cover for Corolla E210 (2019–2024).',
    shortDescriptionAr: 'غطاء صدام أمامي متوافق OEM للكورولا E210 مبطن وجاهز للدهان.',
    categoryId: 'cat-bumpers', brandId: 'brand-toyota-oem',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: false,
    sellingPrice: 450, salePrice: 395, costPrice: 260, stockQuantity: 8, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Finish: 'Primed (Paint Required)', 'Sensor Cutouts': '4-Sensor', Material: 'PP Plastic' },
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] E210' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2021, note: '[DEMO] E210' },
    ]
  },
  {
    id: 'prod-bmp-02', sku: 'BMP-HYU-ELAN-REAR', mpn: '86611-AA520', oemNumber: '86611-AA520',
    slug: 'hyundai-elantra-cn7-rear-bumper-primed',
    nameEn: 'Hyundai Elantra CN7 Rear Bumper Cover — Primed',
    nameAr: 'غطاء الصدام الخلفي هيونداي إلانترا CN7 مبطن',
    shortDescriptionEn: 'Replacement primed rear bumper for Elantra CN7 (2020–2024) with sensor cutouts.',
    shortDescriptionAr: 'غطاء صدام خلفي بديل مبطن للإلانترا CN7 مع فتحات حساسات الوقوف.',
    categoryId: 'cat-bumpers', brandId: 'brand-hyundai-oem',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: false,
    sellingPrice: 380, salePrice: 340, costPrice: 215, stockQuantity: 7, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Finish: 'Primed', 'Sensor Holes': '4-Sensor Pattern', Material: 'PP Bumper Grade' },
    images: ['https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2023, note: '[DEMO] CN7 Rear' },
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2022, note: '[DEMO] CN7 Rear' },
    ]
  },
  // ---- ALTERNATORS & STARTERS ----
  {
    id: 'prod-alt-01', sku: 'ALT-VAL-CAM-150A', mpn: '437566', oemNumber: '27060-F0010',
    slug: 'valeo-150a-alternator-toyota-camry-corolla',
    nameEn: 'Valeo 150A Remanufactured Alternator — Toyota Camry / Corolla',
    nameAr: 'دينامو فاليو 150 أمبير معاد تصنيعه — كامري وكورولا',
    shortDescriptionEn: 'OE-spec Valeo 150A remanufactured alternator for Toyota 2AR-FE engines.',
    shortDescriptionAr: 'دينامو فاليو 150 أمبير معاد تصنيعه بمعادل OE لمحركات تويوتا.',
    categoryId: 'cat-alternators', brandId: 'brand-valeo',
    qualityGrade: 'GRADE_B', condition: 'REMANUFACTURED', isOem: false, isOriginal: false,
    sellingPrice: 680, salePrice: 620, costPrice: 390, stockQuantity: 14, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Output: '150A', Voltage: '12V', Condition: 'Remanufactured', Engine: '2AR-FE 2.5L' },
    images: ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 2.5L 2AR-FE' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] 2.0L' },
    ]
  },
  {
    id: 'prod-alt-02', sku: 'STR-DEN-PATROL-V8', mpn: '128000-8390', oemNumber: '23300-1LA2B',
    slug: 'denso-starter-motor-nissan-patrol-vk56vd',
    nameEn: 'Denso High-Torque Starter Motor — Nissan Patrol VK56VD V8',
    nameAr: 'موتور بادئ دينسو عالي العزم — نيسان باترول VK56VD V8',
    shortDescriptionEn: 'Denso high-torque direct-drive starter for reliable V8 cold starts in desert.',
    shortDescriptionAr: 'موتور بادئ دينسو عالي العزم للتشغيل الموثوق للمحرك V8 في الصحراء.',
    categoryId: 'cat-alternators', brandId: 'brand-denso',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 850, salePrice: 780, costPrice: 510, stockQuantity: 8, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Direct Drive', Power: '2.5kW', Voltage: '12V', Engine: 'VK56VD 5.6L V8' },
    images: ['https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2022, note: '[DEMO] VK56VD' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2021, note: '[DEMO] VK56VD' },
    ]
  },
  // ---- EXHAUST ----
  {
    id: 'prod-exh-01', sku: 'CAT-BOS-CAM-CONV', mpn: '0986BO3002', oemNumber: '89465-33450',
    slug: 'bosch-catalytic-converter-toyota-camry-25l',
    nameEn: 'Bosch OE-Equivalent Catalytic Converter — Toyota Camry 2.5L',
    nameAr: 'محوّل حفاز بوش معادل OE — تويوتا كامري 2.5 لتر',
    shortDescriptionEn: 'Direct-fit three-way catalytic converter with PGM coating for Camry 2.5L.',
    shortDescriptionAr: 'محوّل حفاز ثلاثي مباشر مع طلاء معادن ثمينة PGM لكامري 2.5 لتر.',
    categoryId: 'cat-exhaust', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 950, salePrice: 850, costPrice: 570, stockQuantity: 8, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'Three-Way Catalytic Converter', Substrate: 'PGM Honeycomb', 'Direct Fit': 'Yes' },
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 2.5L 2AR-FE' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] 2.5L 2AR-FE' },
    ]
  },
  {
    id: 'prod-exh-02', sku: 'MUFL-BOS-COR-REAR', mpn: '0986BM0310', oemNumber: '17430-36060',
    slug: 'bosch-stainless-rear-muffler-toyota-corolla-e210',
    nameEn: 'Bosch Stainless Rear Muffler — Toyota Corolla E210',
    nameAr: 'صامت عادم خلفي بوش ستانلس ستيل — كورولا E210',
    shortDescriptionEn: 'Stainless direct-fit rear muffler with OEM-matched pipe diameters for Corolla E210.',
    shortDescriptionAr: 'صامت عادم خلفي ستانلس مطابق OE للكورولا E210.',
    categoryId: 'cat-exhaust', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 320, salePrice: 285, costPrice: 185, stockQuantity: 14, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Material: '409 Stainless Steel', 'Inlet Diameter': '45mm', 'Outlet Diameter': '57mm' },
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] E210 2.0L' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2021, note: '[DEMO] E210 2.0L' },
    ]
  },
  // ---- TRANSMISSION ----
  {
    id: 'prod-trn-01', sku: 'ATF-AIS-TOY-8AT', mpn: 'ATF-3417', oemNumber: '35330-AA050',
    slug: 'aisin-atf-filter-kit-toyota-camry-corolla-8at',
    nameEn: 'Aisin ATF Transmission Filter Kit — Toyota Camry / Corolla 8AT',
    nameAr: 'طقم فلتر زيت ناقل حركة أيسين — كامري وكورولا 8AT',
    shortDescriptionEn: 'Aisin ATF filter and pan gasket kit for 8-speed automatic transmission service.',
    shortDescriptionAr: 'طقم فلتر زيت وحشية قاع أيسين لصيانة ناقل الحركة الأوتوماتيكي 8 سرعات.',
    categoryId: 'cat-transmission', brandId: 'brand-aisin',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: true, isOriginal: true,
    sellingPrice: 185, salePrice: null, costPrice: 105, stockQuantity: 40, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Transmission: '8-Speed Automatic (AA80E)', Includes: 'Filter + Pan Gasket', 'Service Interval': '80,000 km' },
    images: ['https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] 8-Speed Auto' },
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] CVT / Auto' },
    ]
  },
  {
    id: 'prod-trn-02', sku: 'CVJ-AIS-HON-FR-L', mpn: 'CV-8183', oemNumber: '44305-T2A-A01',
    slug: 'aisin-cv-axle-shaft-honda-civic-front-left-11gen',
    nameEn: 'Aisin Front Left CV Axle Shaft — Honda Civic 11th Gen (2021+)',
    nameAr: 'نصف محور أمامي أيسين يسار — هوندا سيفيك الجيل 11',
    shortDescriptionEn: 'OE-quality Aisin CV axle shaft for Civic 11th Gen with triple-groove tripod joint.',
    shortDescriptionAr: 'نصف محور أيسين جودة OE للسيفيك الجيل 11 مع وصلة ثلاثية المسار.',
    categoryId: 'cat-transmission', brandId: 'brand-aisin',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 480, salePrice: 430, costPrice: 280, stockQuantity: 15, warrantyMonths: 24,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Side: 'Front Left', 'Joint Type': 'Tripod + Rzeppa', Engine: '1.5T CVT' },
    images: ['https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-civic', year: 2023, note: '[DEMO] 1.5T CVT Left' },
      { makeId: 'make-honda', modelId: 'model-civic', year: 2022, note: '[DEMO] 1.5T CVT Left' },
    ]
  },
  // ---- WINDSCREEN ----
  {
    id: 'prod-gls-01', sku: 'GLS-VAL-CAM-FRONT', mpn: '75006', oemNumber: '56101-06290',
    slug: 'valeo-oe-windshield-toyota-camry-xv70',
    nameEn: 'Valeo OE-Spec Laminated Windshield — Toyota Camry XV70 (2018–2024)',
    nameAr: 'زجاج أمامي فاليو طبقي معادل OE — تويوتا كامري XV70',
    shortDescriptionEn: 'Valeo AS2 laminated windscreen for Camry XV70 with rain sensor slot and UV coating.',
    shortDescriptionAr: 'زجاج أمامي طبقي فاليو للكامري XV70 مع فتحة حساس المطر وطلاء UV.',
    categoryId: 'cat-glass', brandId: 'brand-valeo',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 780, salePrice: 710, costPrice: 465, stockQuantity: 7, warrantyMonths: 12,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Standard: 'AS2 Laminated', 'Rain Sensor': 'Slot Included', 'UV Filter': 'Yes' },
    images: ['https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '[DEMO] XV70 — verify camera positions' },
      { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '[DEMO] XV70' },
    ]
  },
  // ---- FORD F-150 BATTERY ----
  {
    id: 'prod-f150-02', sku: 'BAT-EXI-F150-AGM', mpn: '95RE', oemNumber: 'BXT-65-850',
    slug: 'exide-agm-850cca-battery-ford-f150',
    nameEn: 'Exide Edge AGM 850 CCA Battery — Ford F-150 V8 / EcoBoost',
    nameAr: 'بطارية إكسايد Edge AGM 850 أمبير — فورد F-150',
    shortDescriptionEn: 'Exide Edge AGM 850 CCA with SureLife graphite tech for F-150 high-demand electrical.',
    shortDescriptionAr: 'بطارية إكسايد Edge AGM 850 أمبير بتقنية SureLife الجرافيت للأنظمة الكهربائية عالية الطلب.',
    categoryId: 'cat-batteries', brandId: 'brand-exide',
    qualityGrade: 'GRADE_A', condition: 'NEW', isOem: false, isOriginal: true,
    sellingPrice: 620, salePrice: 560, costPrice: 370, stockQuantity: 14, warrantyMonths: 36,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Type: 'AGM', CCA: '850A', 'Reserve Capacity': '140 min', Technology: 'SureLife Graphite' },
    images: ['https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-ford', modelId: 'model-f150', year: 2022, note: '[DEMO] 5.0L V8 & 3.5L EcoBoost' },
      { makeId: 'make-ford', modelId: 'model-f150', year: 2021, note: '[DEMO] All Engines' },
    ]
  },
  // ---- GRADE C ECONOMY ITEMS ----
  {
    id: 'prod-eco-01', sku: 'BRK-GRB-PADS-ECONOMY', mpn: 'D1031-8528', oemNumber: 'D1031-8528',
    slug: 'economy-grade-b-brake-pads-toyota-nissan',
    nameEn: 'Economy Ceramic Brake Pads (Front) — Toyota / Nissan [Grade B Demo]',
    nameAr: 'أقمشة فرامل اقتصادية سيراميك أمامية — تويوتا / نيسان [درجة ب]',
    shortDescriptionEn: 'Grade B economy ceramic front pads for budget-conscious customers on multiple models.',
    shortDescriptionAr: 'أقمشة فرامل أمامية سيراميك اقتصادية درجة ب للميزانيات المحدودة.',
    categoryId: 'cat-brakes', brandId: 'brand-bosch',
    qualityGrade: 'GRADE_B', condition: 'NEW', isOem: false, isOriginal: false,
    sellingPrice: 120, salePrice: 98, costPrice: 60, stockQuantity: 95, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Grade: 'B - Certified Tested', Material: 'Ceramic Economy', Axle: 'Front', Note: '[DEMO Data]' },
    images: ['https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '[DEMO] Economy — verify before fitting' },
      { makeId: 'make-nissan', modelId: 'model-patrol', year: 2020, note: '[DEMO] Economy — verify before fitting' },
    ]
  },
  {
    id: 'prod-eco-02', sku: 'FLT-GRDC-OIL-ECON', mpn: 'PH8172-C', oemNumber: 'PH8172',
    slug: 'grade-c-economy-oil-filter-universal',
    nameEn: 'Economy Spin-On Oil Filter (Universal M20x1.5) — Grade C Value Tier',
    nameAr: 'فلتر زيت دوار اقتصادي عالمي — درجة ج',
    shortDescriptionEn: 'Budget Grade C spin-on oil filter for standard service intervals on economy-conscious vehicles.',
    shortDescriptionAr: 'فلتر زيت دوار اقتصادي درجة ج للصيانة الدورية العادية.',
    categoryId: 'cat-filters', brandId: 'brand-mann',
    qualityGrade: 'GRADE_C', condition: 'NEW', isOem: false, isOriginal: false,
    sellingPrice: 22, salePrice: null, costPrice: 11, stockQuantity: 200, warrantyMonths: 3,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Grade: 'C - Value Tier', Type: 'Spin-On', Thread: 'M20x1.5 / M22x1.5', Note: '[DEMO — verify fitment]' },
    images: ['https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-hyundai', modelId: 'model-sonata', year: 2021, note: '[DEMO] Grade C — verify before fitting' },
      { makeId: 'make-hyundai', modelId: 'model-elantra', year: 2022, note: '[DEMO] Grade C — verify before fitting' },
    ]
  },
  {
    id: 'prod-eco-03', sku: 'IGN-GRDC-NGK-COPPER', mpn: 'BKR6E-ECON', oemNumber: 'BKR6E',
    slug: 'ngk-copper-core-spark-plugs-grade-c-set4',
    nameEn: 'NGK Copper Core Spark Plugs (Set of 4) — Grade C Value',
    nameAr: 'بواجي NGK نحاس (طقم 4) — درجة ج',
    shortDescriptionEn: 'NGK BKR6E copper core plugs for standard service where OEM iridium is not required.',
    shortDescriptionAr: 'بواجي NGK نحاس لخدمة أساسية حيث لا يُشترط الإيريديوم الأصلي.',
    categoryId: 'cat-engine', brandId: 'brand-ngk',
    qualityGrade: 'GRADE_C', condition: 'NEW', isOem: false, isOriginal: false,
    sellingPrice: 65, salePrice: null, costPrice: 30, stockQuantity: 150, warrantyMonths: 6,
    status: 'PUBLISHED', isFeatured: false, showOnHomepage: false,
    specs: { Electrode: 'Copper Core', Thread: '14mm', Gap: '0.8mm', Grade: 'C - Value Tier' },
    images: ['https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'],
    fitments: [
      { makeId: 'make-honda', modelId: 'model-accord', year: 2019, note: '[DEMO] Grade C — verify gap' },
      { makeId: 'make-hyundai', modelId: 'model-sonata', year: 2021, note: '[DEMO] Grade C — verify gap' },
    ]
  },
];

export async function seedLargeInventory() {
  console.log('\n📦  AutoPart Large Inventory Seeder — Starting...\n');

  console.log('  → Seeding additional part brands (10 new)...');
  await seedAdditionalBrands();

  console.log('  → Seeding additional categories (7 new)...');
  await seedAdditionalCategories();

  console.log(`  → Seeding ${INVENTORY.length} demo products...`);
  let inserted = 0;
  let updated = 0;

  for (const p of INVENTORY) {
    try {
      const existing = await query(`SELECT id FROM "Product" WHERE sku = $1`, [p.sku]);
      await upsertProduct(p);
      if (existing.rows.length > 0) { updated++; } else { inserted++; }
    } catch (err: any) {
      console.error(`  ✗ Failed ${p.sku}: ${err.message}`);
    }
  }

  const total = await query(`SELECT COUNT(*) as count FROM "Product" WHERE status = 'PUBLISHED'`);
  const cats = await query(`SELECT COUNT(*) as count FROM "Category"`);
  const brands = await query(`SELECT COUNT(*) as count FROM "PartBrand"`);
  const fitments = await query(`SELECT COUNT(*) as count FROM "ProductFitment"`);

  console.log('\n✅  Large Inventory Seeder — Completed!');
  console.log(`   Products inserted : ${inserted}`);
  console.log(`   Products updated  : ${updated}`);
  console.log(`   PUBLISHED total   : ${total.rows[0].count}`);
  console.log(`   Categories total  : ${cats.rows[0].count}`);
  console.log(`   Brands total      : ${brands.rows[0].count}`);
  console.log(`   Fitments total    : ${fitments.rows[0].count}\n`);
}
