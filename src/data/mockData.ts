import { Part } from '../types';

export const POPULAR_VEHICLES = [
  { make: 'Toyota', models: ['Land Cruiser (LC300)', 'Camry', 'Hilux', 'Corolla', 'Yaris', 'RAV4', 'Prado'] },
  { make: 'Nissan', models: ['Patrol Y62', 'Altima', 'Sunny', 'X-Trail', 'Maxima', 'Navara'] },
  { make: 'Ford', models: ['Raptor F-150', 'Taurus', 'Explorer', 'Expedition', 'Mustang'] },
  { make: 'GMC', models: ['Sierra Denali', 'Yukon', 'Terrain', 'Acadia'] },
  { make: 'Lexus', models: ['LX600 / LX570', 'ES350', 'RX350', 'IS300'] },
  { make: 'Hyundai', models: ['Sonata', 'Elantra', 'Tucson', 'Santa Fe'] },
  { make: 'Chevrolet', models: ['Tahoe', 'Suburban', 'Silverado', 'Caprice'] },
  { make: 'Mercedes-Benz', models: ['G63 AMG', 'C-Class', 'E-Class', 'S-Class'] }
];

export const YEARS = Array.from({ length: 25 }, (_, i) => 2026 - i);

export const SAMPLE_PARTS: Part[] = [
  {
    id: 'speed-01',
    sku: 'BRK-BREM-GT6',
    oemNumber: '1N1.9008A',
    alternateNumbers: ['BREM-GT6-RED', 'B380-34'],
    nameEn: 'Brembo GT-R 6-Piston Big Brake Kit',
    nameAr: 'طقم فرامل بريمبو جي تي-آر 6 مكابس عالي الأداء',
    category: 'Braking Systems',
    categorySlug: 'brakes',
    brand: 'Brembo Racing',
    condition: 'Genuine Original',
    price: 4090.00,
    originalPrice: 4600.00,
    stock: 6,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 5.0,
    reviewCount: 38,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Engineered for extreme track and dunes heat rejection. Monobloc radial 6-piston caliper with two-piece slotted floating discs and endurance carbon pads.',
    descriptionAr: 'مصمم لتحمل أعلى درجات حرارة الحلبات والرمال مع أقراص عائمة مهواة وفحمات كربونية عالية الاستجابة.',
    specifications: {
      'Caliper': '6-Piston Forged Monobloc Radial',
      'Rotor Size': '380x34mm 2-Piece Floating Slotted',
      'Piston Finish': 'Stainless Steel Thermal Insert'
    },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] },
      { make: 'Nissan', model: 'Patrol Y62', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
      { make: 'Lexus', model: 'LX600 / LX570', years: [2020, 2021, 2022, 2023, 2024, 2025] }
    ],
    warranty: '24 Months / 40,000 KM Warranty',
    deliveryDays: 'Same-day delivery in Riyadh; 24-48h KSA'
  },
  {
    id: 'speed-02',
    sku: 'EXH-HKS-SS',
    oemNumber: '31019-AT015',
    alternateNumbers: ['HKS-EXH-LC300', 'TI-DUAL-90'],
    nameEn: 'HKS Hi-Power Stainless Steel Dual Exhaust System',
    nameAr: 'شكمان ونظام عادم رياضي HKS ستانلس ستيل مزدوج',
    category: 'Engine Components',
    categorySlug: 'engine-parts',
    brand: 'HKS Racing',
    condition: 'Genuine Original',
    price: 3850.00,
    originalPrice: 4200.00,
    stock: 4,
    warehouseLocation: 'Jeddah Coastal Hub',
    rating: 4.9,
    reviewCount: 24,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'SUS304 mandrel-bent stainless steel cat-back exhaust with burnt titanium tips. Significant flow increases with refined aggressive exhaust note.',
    descriptionAr: 'نظام عادم ستانلس ستيل 304 رياضي كامل مع مخارج تيتانيوم محروقة لتحسين عزم المحرك وصوت نقي.',
    specifications: {
      'Material': 'SUS304 Stainless Steel + Titanium Tips',
      'Pipe Diameter': '76mm to Dual 60mm',
      'Sound Level': '89dB Street Legal'
    },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2022, 2023, 2024, 2025, 2026] },
      { make: 'Ford', model: 'Raptor F-150', years: [2021, 2022, 2023, 2024] }
    ],
    warranty: '36 Months Manufacturer Warranty',
    deliveryDays: '24-48h Express Shipping KSA'
  },
  {
    id: 'speed-03',
    sku: 'OIL-MOTUL-300V',
    oemNumber: '106154',
    alternateNumbers: ['MOTUL-15W50-5L', 'EST-CORE-5L'],
    nameEn: 'Motul 300V Competition 15W-50 Racing Oil (5L)',
    nameAr: 'زيت سباقات موتل 300V كومبتيشن 15W-50 أصلي (5 لتر)',
    category: 'Engine Oils & Fluids',
    categorySlug: 'fluids',
    brand: 'Motul Motorsport',
    condition: 'Genuine Original',
    price: 295.00,
    originalPrice: 340.00,
    stock: 48,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 5.0,
    reviewCount: 112,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: '100% Synthetic Racing 4-stroke lubricant based on ESTER Core technology. Guarantees maximum oil pressure under intense desert and track conditions.',
    descriptionAr: 'زيت تخليقي 100% مخصص لأعلى درجات حرارة المحركات التوربينية والسباقات في ظروف الخليج القاسية.',
    specifications: {
      'Viscosity': '15W-50',
      'Technology': 'ESTER Core Synthetic Formula',
      'Volume': '5 Liters Metal Canister'
    },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] },
      { make: 'Nissan', model: 'Patrol Y62', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] },
      { make: 'Ford', model: 'Raptor F-150', years: [2020, 2021, 2022, 2023, 2024] }
    ],
    warranty: '100% Authentic Factory Sealed',
    deliveryDays: 'Same-day Riyadh, Next day KSA'
  },
  {
    id: 'speed-04',
    sku: 'SPK-NGK-IRID',
    oemNumber: 'LFR6AIX-11',
    alternateNumbers: ['6619-SET8', 'SILFR6A'],
    nameEn: 'NGK Laser Iridium Spark Plug Unit Set (x8)',
    nameAr: 'طقم بواجي ليزر إيريديوم إن جي كي رياضية (8 حبات)',
    category: 'Ignition Plugs & Coils',
    categorySlug: 'ignition',
    brand: 'NGK Spark Plugs',
    condition: 'Genuine Original',
    price: 310.00,
    originalPrice: 380.00,
    stock: 35,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.9,
    reviewCount: 65,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Laser-welded iridium center electrode tip ensures high durability and greater spark intensity for smooth idle and maximum acceleration.',
    descriptionAr: 'بواجي ليزر إيريديوم يابانية تضمن اشتعال مثالي وتوفير في استهلاك الوقود واستجابة سريعة للخانق.',
    specifications: {
      'Electrode': '0.6mm Laser Iridium Tip',
      'Quantity': 'Complete Set of 8 Plugs',
      'Heat Range': '6 Cold Performance'
    },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] },
      { make: 'Nissan', model: 'Patrol Y62', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] }
    ],
    warranty: '100,000 KM Mileage Benchmark',
    deliveryDays: 'Express Dispatch'
  },
  {
    id: 'speed-05',
    sku: 'WHL-VOLK-TE37',
    oemNumber: 'TE37-ULTRA-20',
    alternateNumbers: ['RAYS-TE37-BRZ', '20X10-ET15'],
    nameEn: 'TE37 Ultra Large P.C.D. 20" Forged Bronze Wheel',
    nameAr: 'جنط رياضي فورجد أصلي TE37 ألترا مقاس 20 برونزي',
    category: 'Alloy Wheels & Tires',
    categorySlug: 'wheels',
    brand: 'Rays Volk Racing',
    condition: 'Genuine Original',
    price: 3140.00,
    originalPrice: 3500.00,
    stock: 8,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 5.0,
    reviewCount: 19,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1580273916550-e323be2ae537?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Mold-form forged 1-piece wheel engineered specifically for full-size SUVs. Exceptional strength-to-weight ratio to reduce unsprung mass.',
    descriptionAr: 'جنط فورجد قطعة واحدة عالي الصلابة وخفيف الوزن مصمم خصيصاً لسيارات الدفع الرباعي الكبيرة.',
    specifications: {
      'Size': '20 x 9.5J',
      'PCD': '6x139.7',
      'Offset': '+15mm',
      'Finish': 'Bronze Almite'
    },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] },
      { make: 'Nissan', model: 'Patrol Y62', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025] }
    ],
    warranty: 'Lifetime Structural Warranty',
    deliveryDays: '48h Secured Freight'
  },
  {
    id: 'speed-06',
    sku: 'WHL-METH-314',
    oemNumber: 'MR31489060512',
    alternateNumbers: ['METHOD-314-BLK'],
    nameEn: 'Method Matte Black 17x8.5 MR314 Desert Wheel',
    nameAr: 'جنط ميثود أسود مطفي 17 إنش مخصص للصحراء',
    category: 'Alloy Wheels & Tires',
    categorySlug: 'wheels',
    brand: 'Method Race Wheels',
    condition: 'Genuine Original',
    price: 1150.00,
    originalPrice: 1300.00,
    stock: 16,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.8,
    reviewCount: 31,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Solid A356 aluminum with T6 heat treatment. Patented Bead Grip technology engages tire bead for increased grip at ultra-low tire pressures.',
    descriptionAr: 'تقنية بيد جريب تمنع انزلاق الإطار عند التنسيم في الرمال.',
    specifications: { 'Size': '17x8.5', 'Bolt Pattern': '6x139.7' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: 'Limited Lifetime Structural',
    deliveryDays: 'Immediate Dispatch'
  },
  {
    id: 'speed-07',
    sku: 'TIR-BFG-KO3',
    oemNumber: 'BFG-285-60-20',
    alternateNumbers: ['KO3-ALL-TERRAIN'],
    nameEn: 'All-Terrain T/A KO3 285/60R20 125/122S Tire',
    nameAr: 'كفرات بي إف جودريتش أول تيرين KO3 مقاس 20',
    category: 'Alloy Wheels & Tires',
    categorySlug: 'wheels',
    brand: 'BFGoodrich',
    condition: 'Genuine Original',
    price: 1320.00,
    originalPrice: 1450.00,
    stock: 24,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 5.0,
    reviewCount: 88,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'The legendary off-road tire with CoreGard Technology, engineered to resist split sidewalls and withstand extreme rock crawling and desert temperatures.',
    descriptionAr: 'أقوى إطار لجميع التضاريس مع حماية متطورة للجوانب من التمزق.',
    specifications: { 'Size': '285/60R20', 'Ply Rating': '10-Ply E' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: '50,000 KM Mileage Warranty',
    deliveryDays: 'Same-day Riyadh'
  },
  {
    id: 'speed-08',
    sku: 'TIR-MIC-PILOT',
    oemNumber: 'MIC-275-50-22',
    alternateNumbers: ['PS4-SUV-111Y'],
    nameEn: 'Pilot Sport 4S (275/50R22) Ultra Highway Tire',
    nameAr: 'كفرات ميشلان بايلوت سبورت 4S مقاس 22 سرعات عالية',
    category: 'Alloy Wheels & Tires',
    categorySlug: 'wheels',
    brand: 'Michelin',
    condition: 'Genuine Original',
    price: 1650.00,
    originalPrice: 1850.00,
    stock: 12,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.9,
    reviewCount: 44,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Exceptional dry and wet grip. Dynamic Response technology adapts to road conditions for razor-sharp steering accuracy on high-speed motorways.',
    descriptionAr: 'ثبات فائق على المنعطفات وهدوء تام داخل المقصورة على الطرق السريعة.',
    specifications: { 'Size': '275/50R22', 'Speed Index': 'Y (300 km/h)' },
    fitments: [
      { make: 'Lexus', model: 'LX600 / LX570', years: [2021, 2022, 2023, 2024, 2025] }
    ],
    warranty: '5-Year Michelin Guarantee',
    deliveryDays: 'Same-day Riyadh'
  },
  {
    id: 'speed-09',
    sku: 'WHL-ADVAN-GT',
    oemNumber: 'ADVAN-GT-BEYOND',
    alternateNumbers: ['YOKO-GTB-21'],
    nameEn: 'Advan GT Beyond 21" Forged Hyper Black',
    nameAr: 'جنط يوكوهاما أدفان جي تي بيوند 21 إنش فورجد',
    category: 'Alloy Wheels & Tires',
    categorySlug: 'wheels',
    brand: 'Yokohama Advan',
    condition: 'Genuine Original',
    price: 3600.00,
    originalPrice: 3950.00,
    stock: 4,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 5.0,
    reviewCount: 15,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1542282088-72c9c27ed0cd?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'A-6061-T6 forged aerospace alloy rim with concave spoke profile clearing oversized Brembo calipers.',
    descriptionAr: 'جنط رياضي ألمنيوم طيران فورجد فائق الخفة والجمال.',
    specifications: { 'Size': '21x10.0J', 'Finish': 'Racing Hyper Black' },
    fitments: [
      { make: 'Nissan', model: 'Patrol Y62', years: [2020, 2021, 2022, 2023, 2024] }
    ],
    warranty: 'Authenticity Certificate Included',
    deliveryDays: '24-48h KSA'
  },
  {
    id: 'speed-10',
    sku: 'FLT-TOY-LC300',
    oemNumber: '04152-YZZA4',
    alternateNumbers: ['TOY-OIL-FLT'],
    nameEn: 'Toyota Genuine Twin-Turbo V6 Oil Filter Kit',
    nameAr: 'فلتر زيت محرك تويوتا أصلي للاندكروزر توين تيربو',
    category: 'Routine Service & Filters',
    categorySlug: 'filters',
    brand: 'Toyota Genuine Parts',
    condition: 'Genuine Original',
    price: 38.00,
    originalPrice: 48.00,
    stock: 120,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.9,
    reviewCount: 240,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Factory genuine oil filter element with high-temperature O-rings and crush washer for Land Cruiser 3.5L Twin Turbo.',
    descriptionAr: 'فلتر الزيت المعتمد من وكالة تويوتا مع الربلات الأصلية لضمان عدم التهريب.',
    specifications: { 'Engine': '3.5L Twin Turbo V6 (V35A-FTS)' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: 'Genuine Toyota Guaranteed',
    deliveryDays: 'Same-day dispatch'
  },
  {
    id: 'speed-11',
    sku: 'FLT-AF-HKS',
    oemNumber: '70017-AT128',
    alternateNumbers: ['HKS-LC300-FLT'],
    nameEn: 'High-Flow Hybrid Replacement Engine Air Filter Set',
    nameAr: 'طقم فلاتر هواء رياضية HKS هاي فلو للمحرك',
    category: 'Routine Service & Filters',
    categorySlug: 'filters',
    brand: 'HKS Super Air Filter',
    condition: 'Genuine Original',
    price: 210.00,
    originalPrice: 260.00,
    stock: 32,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.8,
    reviewCount: 52,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: '3-layer dry-type polyurethane filter elements offering reduced intake restriction while preserving optimal dust filtration in desert conditions.',
    descriptionAr: 'طقم فلاتر هواء رياضية تعطي تدفق هواء أعلى بنسبة 25% مع كفاءة تنقية ممتازة.',
    specifications: { 'Type': 'Direct Drop-in Replacement (Dual Set)' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: 'Reusable / Washable',
    deliveryDays: 'Express Dispatch'
  },
  {
    id: 'speed-12',
    sku: 'FLT-CAB-DENSO',
    oemNumber: '87139-58010',
    alternateNumbers: ['DCC-1014'],
    nameEn: 'Anti-Bacterial Active Carbon Cabin AC Filter',
    nameAr: 'فلتر مكيف دينسو ياباني كربون نشط ومضاد للبكتيريا',
    category: 'Routine Service & Filters',
    categorySlug: 'filters',
    brand: 'Denso Japan',
    condition: 'Genuine Original',
    price: 85.00,
    originalPrice: 110.00,
    stock: 55,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.9,
    reviewCount: 78,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1517524008697-84bbe3c3fd98?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Triple-layer electrostatically charged active carbon filter neutralizes sand particles, dust storms, and odors inside the vehicle cabin.',
    descriptionAr: 'فلتر مكيف بتقنية الكربون النشط ينقي الهواء الداخلي من الغبار والروائح تماماً.',
    specifications: { 'Filtration Efficiency': 'PM2.5 Sand & Pollen Microparticles' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: 'OEM Quality Certified',
    deliveryDays: 'Same-day Riyadh'
  },
  {
    id: 'speed-13',
    sku: 'OIL-CAST-5W40',
    oemNumber: 'CAST-EDGE-5L',
    alternateNumbers: ['EDGE-TITANIUM-5W40'],
    nameEn: 'Castrol Edge 5W-40 Advanced Full Synthetic (4L)',
    nameAr: 'زيت كاسترول إيدج 5W-40 تخليقي بالكامل مع تيتانيوم (4 لتر)',
    category: 'Routine Service & Filters',
    categorySlug: 'fluids',
    brand: 'Castrol Edge',
    condition: 'Genuine Original',
    price: 152.00,
    originalPrice: 180.00,
    stock: 60,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 4.9,
    reviewCount: 94,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Boosted with Fluid TITANIUM technology to transform under extreme engine pressure and reduce performance-robbing friction.',
    descriptionAr: 'زيت كاسترول تيتانيوم يحافظ على أداء وثبات لزوجة المحرك في أعلى درجات الحرارة.',
    specifications: { 'Grade': 'API SP / SN Plus, ACEA A3/B4' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: 'Factory Sealed Batch',
    deliveryDays: 'Same-day delivery'
  },
  {
    id: 'speed-14',
    sku: 'CLN-TOY-LLC',
    oemNumber: '08889-80072',
    alternateNumbers: ['TOY-SUPER-LLC-4L'],
    nameEn: 'Toyota Super Long Life Pre-Mixed Pink Coolant (4L)',
    nameAr: 'ماء راديتر تويوتا سوبر طويل الأمد الوردي أصلي (4 لتر)',
    category: 'Routine Service & Filters',
    categorySlug: 'fluids',
    brand: 'Toyota Genuine Parts',
    condition: 'Genuine Original',
    price: 112.00,
    originalPrice: 135.00,
    stock: 45,
    warehouseLocation: 'Riyadh Central Hub',
    rating: 5.0,
    reviewCount: 160,
    qualityGrade: 'GRADE_A',
    images: [
      'https://images.unsplash.com/photo-1600790142055-619df03207e6?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Ethylene glycol base formula pre-diluted 50/50 with deionized water. Prevents corrosion and boil-over up to 132°C under Saudi summer driving.',
    descriptionAr: 'ماء تبريد محرك أصلي جاهز للاستخدام يمنع الصدأ وغليان الراديتر حتى 132 درجة مئوية.',
    specifications: { 'Color': 'Pink 50/50 Pre-Diluted', 'Volume': '4 Liters' },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser (LC300)', years: [2021, 2022, 2023, 2024, 2025, 2026] }
    ],
    warranty: 'Genuine Toyota Guaranteed',
    deliveryDays: 'Same-day Riyadh'
  }
];

export const INITIAL_ORDERS = [];
