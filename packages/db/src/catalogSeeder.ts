import { query, runTransaction } from './db';
import crypto from 'crypto';

export async function seedCatalogData() {
  console.log('Seeding initial vehicle catalog, categories, part brands, and products...');

  // 1. Seed Quality Grades
  await query(`
    INSERT INTO "QualityGradeConfig" ("code", "nameEn", "nameAr", "displayLabel", "descriptionEn", "descriptionAr", "sortOrder")
    VALUES 
      ('GRADE_A', 'Grade A (Pristine / OEM Benchmark)', 'درجة أ (ممتاز / معيار الوكالة)', 'Grade A - Premium Tier', 'Factory-certified highest quality tier with zero defects and full factory warranty.', 'أعلى معايير الجودة المعتمدة من المصنع مع ضمان شامل وخلو تام من العيوب.', 1),
      ('GRADE_B', 'Grade B (Certified Tested / Minor Cosmetic)', 'درجة ب (مفحوص ومعتمد / تغليف بديل)', 'Grade B - Standard Tier', 'Fully tested and functional component, meeting strict safety tolerances at optimal value.', 'مكون مفحوص ومطابق للمواصفات الفنية مع كفاءة تشغيلية كاملة بسعر اقتصادي.', 2),
      ('GRADE_C', 'Grade C (Budget Value / Clearance)', 'درجة ج (اقتصادي / تصفية)', 'Grade C - Value Tier', 'Operational replacement component suitable for cost-effective standard repairs.', 'قطعة غيار بديلة تعمل بكفاءة للميزانيات الاقتصادية مع ضمان أساسي.', 3)
    ON CONFLICT (code) DO NOTHING
  `);

  // 2. Seed Vehicle Manufacturers (Makes)
  const makes = [
    {
      id: 'make-toyota',
      name: 'Toyota',
      slug: 'toyota',
      logoUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=160&q=80',
      description: 'Japan automotive pioneer, world market leader in reliability and GCC durability.',
      displayOrder: 1,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-honda',
      name: 'Honda',
      slug: 'honda',
      logoUrl: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?auto=format&fit=crop&w=160&q=80',
      description: 'Precision Japanese engineering known for VTEC engines and high efficiency.',
      displayOrder: 2,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-hyundai',
      name: 'Hyundai',
      slug: 'hyundai',
      logoUrl: 'https://images.unsplash.com/photo-1617814076367-b759c7d7e738?auto=format&fit=crop&w=160&q=80',
      description: 'Leading South Korean automotive manufacturer with advanced tech and broad parts availability.',
      displayOrder: 3,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-nissan',
      name: 'Nissan',
      slug: 'nissan',
      logoUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=160&q=80',
      description: 'Iconic Japanese manufacturer known for Patrol, Altima, and tough desert performance.',
      displayOrder: 4,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-ford',
      name: 'Ford',
      slug: 'ford',
      logoUrl: 'https://images.unsplash.com/photo-1551830820-330a71b99659?auto=format&fit=crop&w=160&q=80',
      description: 'American automotive powerhouse famed for F-150 trucks and EcoBoost performance.',
      displayOrder: 5,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-bmw',
      name: 'BMW',
      slug: 'bmw',
      logoUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?auto=format&fit=crop&w=160&q=80',
      description: 'Bavarian luxury and precision driving dynamics with OEM electronic components.',
      displayOrder: 6,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-mercedes',
      name: 'Mercedes-Benz',
      slug: 'mercedes-benz',
      logoUrl: 'https://images.unsplash.com/photo-1617814076668-8dfc6ba32363?auto=format&fit=crop&w=160&q=80',
      description: 'The pinnacle of German automotive prestige, safety, and luxury engineering.',
      displayOrder: 7,
      isPublished: true,
      isEnabled: true
    },
    {
      id: 'make-lexus',
      name: 'Lexus',
      slug: 'lexus',
      logoUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=160&q=80',
      description: 'Toyota luxury division engineered for ultimate refinement and harsh climate resilience.',
      displayOrder: 8,
      isPublished: true,
      isEnabled: true
    }
  ];

  for (const m of makes) {
    await query(`
      INSERT INTO "VehicleMake" ("id", "name", "slug", "logoUrl", "description", "displayOrder", "isPublished", "isEnabled")
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT ("name") DO UPDATE SET "logoUrl" = EXCLUDED."logoUrl", "isPublished" = EXCLUDED."isPublished"
    `, [m.id, m.name, m.slug, m.logoUrl, m.description, m.displayOrder, m.isPublished, m.isEnabled]);
  }

  // 3. Seed Models & Years
  const models = [
    { id: 'model-camry', makeId: 'make-toyota', name: 'Camry', slug: 'camry', gen: 'XV70', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024] },
    { id: 'model-corolla', makeId: 'make-toyota', name: 'Corolla', slug: 'corolla', gen: 'E210', years: [2019, 2020, 2021, 2022, 2023, 2024] },
    { id: 'model-landcruiser', makeId: 'make-toyota', name: 'Land Cruiser', slug: 'land-cruiser', gen: 'LC300/LC200', years: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },
    { id: 'model-accord', makeId: 'make-honda', name: 'Accord', slug: 'accord', gen: '10th Gen', years: [2018, 2019, 2020, 2021, 2022, 2023] },
    { id: 'model-civic', makeId: 'make-honda', name: 'Civic', slug: 'civic', gen: '11th Gen', years: [2021, 2022, 2023, 2024] },
    { id: 'model-elantra', makeId: 'make-hyundai', name: 'Elantra', slug: 'elantra', gen: 'CN7', years: [2020, 2021, 2022, 2023, 2024] },
    { id: 'model-sonata', makeId: 'make-hyundai', name: 'Sonata', slug: 'sonata', gen: 'DN8', years: [2019, 2020, 2021, 2022, 2023] },
    { id: 'model-patrol', makeId: 'make-nissan', name: 'Patrol', slug: 'patrol', gen: 'Y62', years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024] },
    { id: 'model-f150', makeId: 'make-ford', name: 'F-150', slug: 'f-150', gen: '14th Gen', years: [2018, 2019, 2020, 2021, 2022, 2023] },
    { id: 'model-es350', makeId: 'make-lexus', name: 'ES350', slug: 'es350', gen: 'XZ10', years: [2019, 2020, 2021, 2022, 2023, 2024] }
  ];

  for (const mdl of models) {
    await query(`
      INSERT INTO "VehicleModel" ("id", "makeId", "name", "slug", "generation", "isPublished")
      VALUES ($1, $2, $3, $4, $5, true)
      ON CONFLICT ("makeId", "slug") DO NOTHING
    `, [mdl.id, mdl.makeId, mdl.name, mdl.slug, mdl.gen]);

    for (const yr of mdl.years) {
      const yearId = `yr-${mdl.slug}-${yr}`;
      await query(`
        INSERT INTO "VehicleYear" ("id", "modelId", "year", "displayOrder", "isPublished")
        VALUES ($1, $2, $3, $3, true)
        ON CONFLICT ("modelId", "year") DO NOTHING
      `, [yearId, mdl.id, yr]);

      // Add standard engine variant
      const varId = `var-${mdl.slug}-${yr}-std`;
      await query(`
        INSERT INTO "VehicleVariant" ("id", "yearId", "trim", "engine", "transmission", "isPublished")
        VALUES ($1, $2, 'Standard GL/XLE', '2.5L 4-Cylinder / Hybrid', 'Automatic / CVT', true)
        ON CONFLICT ("id") DO NOTHING
      `, [varId, yearId]);
    }
  }

  // 4. Seed Part Brands
  const brands = [
    { id: 'brand-toyota-oem', name: 'Toyota Genuine Parts', slug: 'toyota-genuine', logoUrl: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?auto=format&fit=crop&w=120&q=80', desc: 'Direct OEM factory equipment for Toyota & Lexus vehicles' },
    { id: 'brand-denso', name: 'Denso Japan', slug: 'denso', logoUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=120&q=80', desc: 'Premier OEM spark plugs, starters, alternators, and cooling systems' },
    { id: 'brand-bosch', name: 'Bosch Automotive', slug: 'bosch', logoUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=120&q=80', desc: 'World leader in braking, sensors, filters, and wiper systems' },
    { id: 'brand-brembo', name: 'Brembo Italy', slug: 'brembo', logoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=120&q=80', desc: 'High performance brake rotors and ceramic pad technology' },
    { id: 'brand-advics', name: 'Advics Aisin', slug: 'advics', logoUrl: 'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=120&q=80', desc: 'Top-tier Japanese braking systems manufacturer' },
    { id: 'brand-kyb', name: 'KYB Shocks Japan', slug: 'kyb', logoUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=120&q=80', desc: 'Original equipment shock absorbers and strut assemblies' }
  ];

  for (const b of brands) {
    await query(`
      INSERT INTO "PartBrand" ("id", "name", "slug", "logoUrl", "description", "isPublished", "isEnabled")
      VALUES ($1, $2, $3, $4, $5, true, true)
      ON CONFLICT ("name") DO NOTHING
    `, [b.id, b.name, b.slug, b.logoUrl, b.desc]);
  }

  // 5. Seed Visual Part Categories
  const categories = [
    {
      id: 'cat-headlights',
      nameEn: 'Headlights & Lighting',
      nameAr: 'الأنوار والمصابيح الأمامية والخلفية',
      slug: 'headlights-lighting',
      descEn: 'LED, Xenon HID, and Halogen headlamps, fog lights, and rear lamps.',
      imageUrl: 'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=300&q=80',
      order: 1
    },
    {
      id: 'cat-brakes',
      nameEn: 'Brake Pads & Discs',
      nameAr: 'أقمشة وفحمات وهوبات الفرامل',
      slug: 'brake-pads-discs',
      descEn: 'Ceramic pads, vented rotors, calipers, and hydraulic components.',
      imageUrl: 'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=300&q=80',
      order: 2
    },
    {
      id: 'cat-bumpers',
      nameEn: 'Bumpers & Body Panels',
      nameAr: 'الصدامات وأجزاء الهيكل والرفارف',
      slug: 'bumpers-body-panels',
      descEn: 'Front and rear bumpers, grilles, fenders, bonnet hoods, and side mirrors.',
      imageUrl: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=300&q=80',
      order: 3
    },
    {
      id: 'cat-engine',
      nameEn: 'Engine & Ignition Parts',
      nameAr: 'قطع المحرك ونظام الاشتعال',
      slug: 'engine-ignition-parts',
      descEn: 'Spark plugs, ignition coils, timing belts, gaskets, and mounts.',
      imageUrl: 'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=300&q=80',
      order: 4
    },
    {
      id: 'cat-cooling',
      nameEn: 'Radiators & Cooling',
      nameAr: 'الرديترات ومكيف السيارة ونظام التبريد',
      slug: 'radiators-cooling',
      descEn: 'Engine radiators, AC condensers, water pumps, and cooling fans.',
      imageUrl: 'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=300&q=80',
      order: 5
    },
    {
      id: 'cat-filters',
      nameEn: 'Air, Oil & Cabin Filters',
      nameAr: 'فلاتر الهواء والزيت والمكيف',
      slug: 'air-oil-cabin-filters',
      descEn: 'High efficiency engine air filters, carbon cabin filters, and oil cartridges.',
      imageUrl: 'https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=300&q=80',
      order: 6
    },
    {
      id: 'cat-suspension',
      nameEn: 'Suspension & Steering',
      nameAr: 'المساعدات ونظام التعليق والمقصات',
      slug: 'suspension-steering',
      descEn: 'Shock absorbers, control arms, tie rods, bushings, and stabilizer links.',
      imageUrl: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=300&q=80',
      order: 7
    },
    {
      id: 'cat-glass',
      nameEn: 'Windscreens & Windows',
      nameAr: 'الزجاج الأمامي وزجاج الأبواب',
      slug: 'windscreens-windows',
      descEn: 'Front and rear laminated windscreens, tempered side door glass, and seals.',
      imageUrl: 'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=300&q=80',
      order: 8
    }
  ];

  for (const c of categories) {
    await query(`
      INSERT INTO "Category" ("id", "nameEn", "nameAr", "slug", "descriptionEn", "imageUrl", "displayOrder", "isPublished")
      VALUES ($1, $2, $3, $4, $5, $6, $7, true)
      ON CONFLICT ("slug") DO UPDATE SET "imageUrl" = EXCLUDED."imageUrl", "isPublished" = true
    `, [c.id, c.nameEn, c.nameAr, c.slug, c.descEn, c.imageUrl, c.order]);
  }

  // 6. Seed Dynamic Category Attributes
  const attributes = [
    { catId: 'cat-headlights', name: 'Installation Position', code: 'position', type: 'select', opts: ['Front Left (Driver Side)', 'Front Right (Passenger Side)', 'Set (Left & Right)'], req: true },
    { catId: 'cat-headlights', name: 'Bulb Technology', code: 'bulb_tech', type: 'select', opts: ['Full LED Bi-Beam', 'Xenon HID', 'Halogen H7/H11'], req: true },
    { catId: 'cat-headlights', name: 'AFS Adaptive Steer', code: 'afs_adaptive', type: 'boolean', opts: null, req: false },
    { catId: 'cat-brakes', name: 'Axle Position', code: 'axle_position', type: 'select', opts: ['Front Axle', 'Rear Axle'], req: true },
    { catId: 'cat-brakes', name: 'Friction Material', code: 'friction_material', type: 'select', opts: ['Ceramic Low-Dust', 'Semi-Metallic Heavy Duty'], req: true },
    { catId: 'cat-cooling', name: 'Core Dimensions', code: 'core_dimensions', type: 'text', opts: null, req: false },
    { catId: 'cat-cooling', name: 'Inlet/Outlet Diameter (mm)', code: 'inlet_outlet_mm', type: 'number', opts: null, req: false },
    { catId: 'cat-bumpers', name: 'Sensor Cutouts', code: 'parking_sensors', type: 'boolean', opts: null, req: true }
  ];

  for (const a of attributes) {
    await query(`
      INSERT INTO "CategoryAttribute" ("id", "categoryId", "name", "code", "dataType", "options", "isRequired")
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT ("categoryId", "code") DO NOTHING
    `, [
      `attr-${crypto.randomUUID()}`,
      a.catId,
      a.name,
      a.code,
      a.type,
      a.opts ? JSON.stringify(a.opts) : null,
      a.req
    ]);
  }

  // 7. Seed Verified Products with Database Fitment Records
  const seedProducts = [
    {
      id: 'prod-01',
      sku: 'BRK-TOY-04465',
      mpn: '04465-33471',
      oemNumber: '04465-33471',
      slug: 'toyota-camry-ceramic-front-brake-pads-04465-33471',
      nameEn: 'Ceramic Front Brake Pads Set',
      nameAr: 'طقم أقمشة فرامل سيراميك أمامية وكالة',
      shortDescriptionEn: 'Genuine OEM ceramic front pads engineered for GCC high temperatures and low dust.',
      shortDescriptionAr: 'أقمشة فرامل أمامية سيراميك أصلية مصممة لتحمل درجات الحرارة العالية في الخليج.',
      categoryId: 'cat-brakes',
      brandId: 'brand-advics',
      qualityGrade: 'GRADE_A',
      condition: 'NEW',
      isOem: true,
      isOriginal: true,
      sellingPrice: 285.00,
      salePrice: 255.00,
      costPrice: 170.00,
      stockQuantity: 42,
      warrantyMonths: 12,
      status: 'PUBLISHED',
      isFeatured: true,
      showOnHomepage: true,
      specs: { 'Axle Position': 'Front Axle', 'Material': 'Ceramic formulation', 'Wear Sensor': 'Included' },
      images: [
        'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
      ],
      fitments: [
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: 'Fits all 2.5L and Hybrid models' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: 'All trims' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2020, note: 'All trims' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2019, note: 'All trims' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2018, note: 'All trims' },
        { makeId: 'make-lexus', modelId: 'model-es350', year: 2021, note: 'Executive & F-Sport' },
        { makeId: 'make-lexus', modelId: 'model-es350', year: 2022, note: 'Executive & F-Sport' }
      ]
    },
    {
      id: 'prod-02',
      sku: 'LGT-TOY-81110',
      mpn: '81110-06D20',
      oemNumber: '81110-06D20',
      slug: 'toyota-camry-led-headlight-assembly-right',
      nameEn: 'Bi-Beam LED Headlamp Assembly (Right / Passenger Side)',
      nameAr: 'شمعة نور أمامي LED يمين أصلية كامري',
      shortDescriptionEn: 'Full Bi-Beam LED original headlight unit with integrated DRL daytime running strip.',
      shortDescriptionAr: 'شمعة إضاءة أمامية ليد يمين مع إضاءة نهارية DRL أصلية وكالة تويوتا.',
      categoryId: 'cat-headlights',
      brandId: 'brand-toyota-oem',
      qualityGrade: 'GRADE_A',
      condition: 'NEW',
      isOem: true,
      isOriginal: true,
      sellingPrice: 1250.00,
      salePrice: 1120.00,
      costPrice: 790.00,
      stockQuantity: 14,
      warrantyMonths: 24,
      status: 'PUBLISHED',
      isFeatured: true,
      showOnHomepage: true,
      specs: { 'Side': 'Right (Passenger Side)', 'Technology': 'Full LED Bi-Beam', 'Integrated DRL': 'Yes' },
      images: [
        'https://images.unsplash.com/photo-1508974239320-0a029497e820?auto=format&fit=crop&w=800&q=80'
      ],
      fitments: [
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: 'GLX, XLE & Grande Models' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: 'GLX, XLE & Grande Models' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2020, note: 'GLX, XLE & Grande Models' }
      ]
    },
    {
      id: 'prod-03',
      sku: 'FLT-TOY-04152',
      mpn: '04152-YZZA1',
      oemNumber: '04152-YZZA1',
      slug: 'genuine-toyota-oil-filter-cartridge-element',
      nameEn: 'Genuine Engine Oil Filter Element with O-Ring',
      nameAr: 'فلتر زيت محرك أصلي تويوتا مع حلقات العزل',
      shortDescriptionEn: 'Micro-pore synthetic filtration trapping down to 10 microns to preserve engine longevity.',
      shortDescriptionAr: 'عنصر ترشيح أصلي دقيق يحافظ على نظافة المحرك ويمنع دخول الرواسب الضارة.',
      categoryId: 'cat-filters',
      brandId: 'brand-toyota-oem',
      qualityGrade: 'GRADE_A',
      condition: 'NEW',
      isOem: true,
      isOriginal: true,
      sellingPrice: 38.00,
      salePrice: null,
      costPrice: 21.00,
      stockQuantity: 180,
      warrantyMonths: 12,
      status: 'PUBLISHED',
      isFeatured: false,
      showOnHomepage: true,
      specs: { 'Type': 'Cartridge insert', 'Height': '67 mm', 'Outer Diameter': '70 mm' },
      images: [
        'https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'
      ],
      fitments: [
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '2.5L Gas & Hybrid' },
        { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '2.0L Engine' },
        { makeId: 'make-lexus', modelId: 'model-es350', year: 2022, note: '3.5L V6' }
      ]
    },
    {
      id: 'prod-04',
      sku: 'RAD-DEN-16400',
      mpn: '16400-F0020',
      oemNumber: '16400-F0020',
      slug: 'denso-aluminum-engine-cooling-radiator',
      nameEn: 'Denso Heavy Duty Aluminum Engine Radiator',
      nameAr: 'رديتر ماء محرك ألمنيوم دينسو الياباني',
      shortDescriptionEn: 'Double-row brazed aluminum core designed for 50C+ Arabian Peninsula extreme summer heat.',
      shortDescriptionAr: 'رديتر ماء محرك مزدوج الطبقات ألمنيوم عالي الكفاءة مخصص لحرارة الصيف الخليجي.',
      categoryId: 'cat-cooling',
      brandId: 'brand-denso',
      qualityGrade: 'GRADE_A',
      condition: 'NEW',
      isOem: true,
      isOriginal: true,
      sellingPrice: 580.00,
      salePrice: 520.00,
      costPrice: 340.00,
      stockQuantity: 22,
      warrantyMonths: 24,
      status: 'PUBLISHED',
      isFeatured: true,
      showOnHomepage: false,
      specs: { 'Material': 'Brazed Aluminum', 'Tank Material': 'Reinforced Polymer', 'Transmission Cooler': 'Integrated' },
      images: [
        'https://images.unsplash.com/photo-1487754180451-c456f719a1fc?auto=format&fit=crop&w=800&q=80'
      ],
      fitments: [
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '2.5L Gas' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2021, note: '2.5L Gas' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2020, note: '2.5L Gas' }
      ]
    },
    {
      id: 'prod-05',
      sku: 'IGN-NGK-90919',
      mpn: '90919-01253',
      oemNumber: '90919-01253',
      slug: 'denso-iridium-spark-plugs-set-of-4',
      nameEn: 'Laser Iridium High Performance Spark Plugs (Pack of 4)',
      nameAr: 'طقم بواجي ليزر إيريديوم ياباني أصلي (4 حبات)',
      shortDescriptionEn: 'Ultra-fine 0.7mm iridium center electrode ensuring instant ignition and fuel economy.',
      shortDescriptionAr: 'شمعات احتراق ليزر إيريديوم فائقة الدقة لعزم أفضل واستهلاك وقود مثالي.',
      categoryId: 'cat-engine',
      brandId: 'brand-denso',
      qualityGrade: 'GRADE_A',
      condition: 'NEW',
      isOem: true,
      isOriginal: true,
      sellingPrice: 165.00,
      salePrice: 145.00,
      costPrice: 95.00,
      stockQuantity: 55,
      warrantyMonths: 12,
      status: 'PUBLISHED',
      isFeatured: false,
      showOnHomepage: true,
      specs: { 'Thread Size': '14mm', 'Reach': '26.5mm', 'Electrode': 'Laser Iridium' },
      images: [
        'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
      ],
      fitments: [
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2022, note: '4-Cyl' },
        { makeId: 'make-toyota', modelId: 'model-corolla', year: 2022, note: '4-Cyl' },
        { makeId: 'make-honda', modelId: 'model-accord', year: 2021, note: '1.5T & 2.0T' }
      ]
    },
    {
      id: 'prod-06',
      sku: 'SHK-KYB-334399',
      mpn: '334399',
      oemNumber: '48510-06830',
      slug: 'kyb-excel-g-front-gas-shock-absorber',
      nameEn: 'KYB Excel-G Front Nitrogen Gas Strut Damper',
      nameAr: 'مساعد هيدروليك أمامي ياباني كي واي بي',
      shortDescriptionEn: 'Twin-tube nitrogen gas pressurized strut restoring factory ride comfort and braking stability.',
      shortDescriptionAr: 'مساعد تعليق أمامي غاز نيتروجين لاستعادة ثبات القيادة والراحة الأصلية.',
      categoryId: 'cat-suspension',
      brandId: 'brand-kyb',
      qualityGrade: 'GRADE_A',
      condition: 'NEW',
      isOem: false,
      isOriginal: true,
      sellingPrice: 340.00,
      salePrice: null,
      costPrice: 215.00,
      stockQuantity: 28,
      warrantyMonths: 24,
      status: 'PUBLISHED',
      isFeatured: false,
      showOnHomepage: false,
      specs: { 'Design': 'Twin-tube gas strut', 'Position': 'Front Left or Right', 'Valving': 'Multi-stage hydraulic' },
      images: [
        'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=800&q=80'
      ],
      fitments: [
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2020, note: 'Front Strut' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2019, note: 'Front Strut' },
        { makeId: 'make-toyota', modelId: 'model-camry', year: 2018, note: 'Front Strut' }
      ]
    }
  ];

  for (const p of seedProducts) {
    await query(`
      INSERT INTO "Product" (
        "id", "sku", "mpn", "oemNumber", "slug", "nameEn", "nameAr",
        "shortDescriptionEn", "shortDescriptionAr", "categoryId", "brandId",
        "qualityGrade", "condition", "isOem", "isOriginal",
        "sellingPrice", "salePrice", "costPrice", "stockQuantity",
        "warrantyMonths", "technicalSpecs", "status", "isFeatured", "showOnHomepage"
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7,
        $8, $9, $10, $11,
        $12, $13, $14, $15,
        $16, $17, $18, $19,
        $20, $21, $22, $23, $24
      )
      ON CONFLICT ("sku") DO UPDATE SET
        "sellingPrice" = EXCLUDED."sellingPrice",
        "stockQuantity" = EXCLUDED."stockQuantity",
        "status" = EXCLUDED."status"
    `, [
      p.id, p.sku, p.mpn, p.oemNumber, p.slug, p.nameEn, p.nameAr,
      p.shortDescriptionEn, p.shortDescriptionAr, p.categoryId, p.brandId,
      p.qualityGrade, p.condition, p.isOem, p.isOriginal,
      p.sellingPrice, p.salePrice, p.costPrice, p.stockQuantity,
      p.warrantyMonths, JSON.stringify(p.specs), p.status, p.isFeatured, p.showOnHomepage
    ]);

    // Images
    for (let i = 0; i < p.images.length; i++) {
      await query(`
        INSERT INTO "ProductImage" ("id", "productId", "url", "isPrimary", "sortOrder")
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT DO NOTHING
      `, [`img-${p.id}-${i}`, p.id, p.images[i], i === 0, i]);
    }

    // Part numbers
    if (p.oemNumber) {
      const norm = p.oemNumber.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      await query(`
        INSERT INTO "PartNumber" ("id", "productId", "type", "numberValue", "normalized")
        VALUES ($1, $2, 'OEM', $3, $4)
        ON CONFLICT DO NOTHING
      `, [`pn-${p.id}-oem`, p.id, p.oemNumber, norm]);
    }

    // Fitments
    for (const fit of p.fitments) {
      await query(`
        INSERT INTO "ProductFitment" ("id", "productId", "makeId", "modelId", "yearNumber", "fitmentNote")
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING
      `, [
        `fit-${p.id}-${fit.makeId}-${fit.modelId}-${fit.year}`,
        p.id,
        fit.makeId,
        fit.modelId,
        fit.year,
        fit.note
      ]);
    }
  }

  console.log('Seeding of dynamic catalog completed successfully!');
}
