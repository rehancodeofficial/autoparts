import { Part } from '../types';

export const POPULAR_VEHICLES = [
  { make: 'Toyota', models: ['Camry', 'Land Cruiser', 'Hilux', 'Corolla', 'Yaris', 'RAV4', 'Prado'] },
  { make: 'Nissan', models: ['Patrol', 'Altima', 'Sunny', 'X-Trail', 'Maxima', 'Navara'] },
  { make: 'Hyundai', models: ['Elantra', 'Sonata', 'Tucson', 'Accent', 'Santa Fe'] },
  { make: 'Ford', models: ['F-150', 'Taurus', 'Explorer', 'Expedition', 'Mustang'] },
  { make: 'GMC', models: ['Yukon', 'Sierra', 'Terrain', 'Acadia'] },
  { make: 'Lexus', models: ['LX570', 'LX600', 'ES350', 'RX350', 'IS300'] },
  { make: 'Chevrolet', models: ['Tahoe', 'Suburban', 'Caprice', 'Silverado', 'Malibu'] },
  { make: 'Mercedes-Benz', models: ['C-Class', 'E-Class', 'S-Class', 'G-Class', 'GLE'] }
];

export const YEARS = Array.from({ length: 25 }, (_, i) => 2026 - i);

export const SAMPLE_PARTS: Part[] = [
  {
    id: 'part-01',
    sku: 'BRK-TOY-04465',
    oemNumber: '04465-33471',
    alternateNumbers: ['04465-33450', '04465-06100', '0446533471', 'D1212-8332'],
    nameEn: 'Ceramic Front Brake Pads Set',
    nameAr: 'طقم أقمشة فرامل سيراميك أمامية',
    category: 'Brakes',
    brand: 'Toyota Genuine Parts / Advics',
    condition: 'Genuine Original',
    price: 285.00,
    originalPrice: 340.00,
    stock: 18,
    warehouseLocation: 'Riyadh Central (Bin A-14)',
    rating: 4.9,
    reviewCount: 42,
    images: [
      'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'High-performance OEM genuine ceramic front brake pads. Low dust formulation with anti-squeal shims and hardware included. Engineered specifically for high heat resistance during GCC summer driving.',
    descriptionAr: 'أقمشة فرامل أمامية سيراميك أصلية عالية الأداء. تركيبة منخفضة الغبار مع صفائح مانعة للاهتزاز والصرير. مصممة لتحمل درجات الحرارة العالية لظروف القيادة الصيفية في الخليج.',
    specifications: {
      'Position': 'Front Axle (Left & Right)',
      'Material': 'Ceramic formulation',
      'Wear Warning': 'Acoustic wear sensors included',
      'Certification': 'ISO 9001 / SASO Standard'
    },
    fitments: [
      { make: 'Toyota', model: 'Camry', years: [2018, 2019, 2020, 2021, 2022, 2023, 2024], notes: 'Fits 2.5L 4-Cyl and Hybrid models' },
      { make: 'Toyota', model: 'Avalon', years: [2019, 2020, 2021, 2022], notes: 'All trims' },
      { make: 'Lexus', model: 'ES350', years: [2019, 2020, 2021, 2022, 2023], notes: 'F-Sport & Executive' }
    ],
    warranty: '12 Months / 20,000 KM Warranty',
    deliveryDays: 'Same-day delivery in Riyadh; 24-48h all KSA'
  },
  {
    id: 'part-02',
    sku: 'FLT-TOY-04152',
    oemNumber: '04152-YZZA1',
    alternateNumbers: ['04152YZZA1', '04152-31090', 'HU-7019Z'],
    nameEn: 'Genuine Engine Oil Filter with O-Ring',
    nameAr: 'فلتر زيت محرك أصلي مع الحلقات المطاطية',
    category: 'Filters',
    brand: 'Toyota Genuine Parts',
    condition: 'Genuine Original',
    price: 38.00,
    originalPrice: 48.00,
    stock: 120,
    warehouseLocation: 'Jeddah Coastal Hub (Bin F-02)',
    rating: 4.95,
    reviewCount: 156,
    images: [
      'https://images.unsplash.com/photo-1635770311742-c519541a7d65?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Authentic Toyota oil filter cartridge element with pre-packaged O-ring gasket. High filtering efficiency capturing particles down to 10 microns.',
    descriptionAr: 'فلتر زيت محرك وكالة تويوتا مع مانع تسرب أصلي. كفاءة تنقية عالية تلتقط الجزيئات الدقيقة حتى 10 ميكرون لحماية المحرك من الرواسب.',
    specifications: {
      'Filter Type': 'Cartridge insert',
      'Height': '67 mm',
      'Outer Diameter': '70 mm',
      'Gasket Included': 'Yes (Viton high-temp)'
    },
    fitments: [
      { make: 'Toyota', model: 'Camry', years: [2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022], notes: '2.5L Engine' },
      { make: 'Toyota', model: 'RAV4', years: [2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021], notes: 'Gas & Hybrid' },
      { make: 'Toyota', model: 'Highlander', years: [2014, 2015, 2016, 2017, 2018, 2019, 2020], notes: 'All 3.5L V6 models' }
    ],
    warranty: 'Guaranteed Authentic OEM',
    deliveryDays: 'Same-day Riyadh / 1-2 days Western & Eastern Province'
  },
  {
    id: 'part-03',
    sku: 'IGN-NGK-90919',
    oemNumber: '90919-01253',
    alternateNumbers: ['9091901253', 'SC20HR11', 'ILKAR7B11', '90919-01275'],
    nameEn: 'Laser Iridium Spark Plugs (Pack of 4)',
    nameAr: 'طقم بواجي ليزر إيريديوم (4 حبات)',
    category: 'Engine',
    brand: 'Denso / NGK Japan',
    condition: 'Brand New (OEM)',
    price: 165.00,
    originalPrice: 210.00,
    stock: 35,
    warehouseLocation: 'Dammam Hub (Bin C-09)',
    rating: 4.88,
    reviewCount: 38,
    images: [
      'https://images.unsplash.com/photo-1588702547923-7093a6c3ba33?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: '0.4mm ultra-fine iridium center electrode for optimum ignition performance and fuel efficiency. Lasts up to 100,000 km.',
    descriptionAr: 'شمعات احتراق إيريديوم ليزر برأس دقيق 0.4 مم لتعزيز كفاءة الاحتراق وتوفير استهلاك الوقود. عمر افتراضي حتى 100,000 كم.',
    specifications: {
      'Electrode': 'Iridium 0.4mm',
      'Thread Size': '14 mm',
      'Hex Size': '16 mm (5/8 inch)',
      'Quantity': '4 units per set'
    },
    fitments: [
      { make: 'Toyota', model: 'Corolla', years: [2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022], notes: '1.6L and 2.0L Dual VVT-i' },
      { make: 'Toyota', model: 'Yaris', years: [2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023], notes: '1.5L Engine' },
      { make: 'Toyota', model: 'RAV4', years: [2019, 2020, 2021, 2022, 2023], notes: 'Dynamic Force 2.0L' }
    ],
    warranty: '6 Months Replacement Guarantee',
    deliveryDays: '1–2 Business Days'
  },
  {
    id: 'part-04',
    sku: 'SUS-NIS-54618',
    oemNumber: '54618-1AA0E',
    alternateNumbers: ['546181AA0E', '54618-1AA0A', 'SL-4950'],
    nameEn: 'Front Stabilizer Sway Bar Link (Pair)',
    nameAr: 'مسمار توازن أمامي يمين ويسار (طقم حبتين)',
    category: 'Suspension',
    brand: '555 Japan Sankei',
    condition: 'Premium Aftermarket',
    price: 195.00,
    originalPrice: 245.00,
    stock: 14,
    warehouseLocation: 'Riyadh Central (Bin S-22)',
    rating: 4.85,
    reviewCount: 29,
    images: [
      'https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Heavy duty front sway bar drop links engineered in Japan. Eliminates knocking noises over bumps and restores cornering stability.',
    descriptionAr: 'مسامير توازن أمامية أصلية صناعة يابانية 555. تقضي على أصوات الطقطقة والمطبات وتعيد ثبات وتوازن المركبة عند المنعطفات.',
    specifications: {
      'Origin': 'Made in Japan',
      'Position': 'Front Left & Right',
      'Construction': 'Forged alloy steel with dust boots'
    },
    fitments: [
      { make: 'Nissan', model: 'Patrol', years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023, 2024], notes: 'Y62 V8 & V6 Platforms' },
      { make: 'Nissan', model: 'Altima', years: [2013, 2014, 2015, 2016, 2017, 2018], notes: 'All 2.5L and 3.5L models' }
    ],
    warranty: '12 Months Warranty',
    deliveryDays: 'Same-day Riyadh / Next day KSA'
  },
  {
    id: 'part-05',
    sku: 'CLG-RAD-21410',
    oemNumber: '21410-1EA0A',
    alternateNumbers: ['214101EA0A', 'DPI-13197', 'Koyo-PL022'],
    nameEn: 'Aluminum Heavy Duty Engine Radiator',
    nameAr: 'رديتر ماء محرك ألمنيوم عالي التحمل',
    category: 'Cooling',
    brand: 'KoyoRad Japan / Denso',
    condition: 'Premium Aftermarket',
    price: 640.00,
    originalPrice: 790.00,
    stock: 7,
    warehouseLocation: 'Riyadh Central (Bin R-04)',
    rating: 4.92,
    reviewCount: 19,
    images: [
      'https://images.unsplash.com/photo-1563720223185-11003d516935?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Dual-core heavy-duty brazed aluminum radiator designed for severe desert climate temperatures. Pressure tested to 2.5 bar.',
    descriptionAr: 'رديتر ماء من الألمنيوم المقوى مزدوج الخلايا مصمم للظروف الجوية الحارة في الخليج. مفحوص ومختبر ضد الضغط العالي حتى 2.5 بار.',
    specifications: {
      'Core Material': 'Brazed Aluminum',
      'Transmission Oil Cooler': 'Integrated inside lower tank',
      'Inlet / Outlet': '35 mm'
    },
    fitments: [
      { make: 'Nissan', model: 'Patrol', years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021], notes: 'Y62 VK56VD / VK56DE V8' },
      { make: 'GMC', model: 'Yukon', years: [2015, 2016, 2017, 2018, 2019, 2020], notes: '5.3L EcoTec3 V8' }
    ],
    warranty: '24 Months Replacement Warranty',
    deliveryDays: '1–2 Business Days'
  },
  {
    id: 'part-06',
    sku: 'ELC-ALT-27060',
    oemNumber: '27060-0P241',
    alternateNumbers: ['270600P241', '104210-2100', 'AL-TOY-150A'],
    nameEn: '150A High Output Alternator Generator',
    nameAr: 'دينمو كهرباء عالي السعة 150 أمبير أصلي',
    category: 'Electrical',
    brand: 'Denso OEM',
    condition: 'Genuine Original',
    price: 920.00,
    originalPrice: 1150.00,
    stock: 5,
    warehouseLocation: 'Jeddah Coastal Hub (Bin E-11)',
    rating: 4.97,
    reviewCount: 14,
    images: [
      'https://images.unsplash.com/photo-1541348263662-e0c8de4259ba?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: '150 Amp charging power output with internal regulator and overrunning alternator pulley (OAP) to dampen belt vibration.',
    descriptionAr: 'دينمو كهرباء بسعة شحن 150 أمبير مع منظم شحن داخلي وبكرة امتصاص اهتزازات السير لضمان ثبات التيار الكهربائي.',
    specifications: {
      'Output': '12V, 150 Ampere',
      'Pulley': '6-Groove Clutch Pulley',
      'Connector': '4-Pin oval socket'
    },
    fitments: [
      { make: 'Toyota', model: 'Land Cruiser', years: [2016, 2017, 2018, 2019, 2020, 2021], notes: '4.6L and 5.7L V8' },
      { make: 'Lexus', model: 'LX570', years: [2016, 2017, 2018, 2019, 2020, 2021], notes: '3UR-FE 5.7L V8' }
    ],
    warranty: '12 Months Warranty',
    deliveryDays: 'Fast Courier across KSA'
  },
  {
    id: 'part-07',
    sku: 'FLT-AIR-17801',
    oemNumber: '17801-21060',
    alternateNumbers: ['1780121060', 'WA9748', 'C-24005'],
    nameEn: 'High Flow Engine Air Filter Element',
    nameAr: 'فلتر هواء محرك أصلي عالي التدفق',
    category: 'Filters',
    brand: 'Toyota Genuine Parts',
    condition: 'Genuine Original',
    price: 65.00,
    originalPrice: 85.00,
    stock: 60,
    warehouseLocation: 'Riyadh Central (Bin F-18)',
    rating: 4.9,
    reviewCount: 67,
    images: [
      'https://images.unsplash.com/photo-1486006920555-c77dce18193b?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Micron-pleated air filter that traps fine desert sand dust while maximizing intake airflow for best engine torque and mileage.',
    descriptionAr: 'فلتر هواء وكالة بطيات ميكرونية تعزل ذرات الغبار والرمال مع توفير أعلى تدفق هواء لعزم المحرك وتقليل صرفية البنزين.',
    specifications: {
      'Material': 'Synthetic multi-fiber',
      'Seal': 'Polyurethane tight rim seal'
    },
    fitments: [
      { make: 'Toyota', model: 'Yaris', years: [2014, 2015, 2016, 2017, 2018, 2019, 2020], notes: '1.3L & 1.5L Engines' },
      { make: 'Toyota', model: 'Corolla', years: [2014, 2015, 2016, 2017, 2018, 2019], notes: '1.6L Petrol' }
    ],
    warranty: '100% Genuine Guaranteed',
    deliveryDays: 'Same-day Riyadh'
  },
  {
    id: 'part-08',
    sku: 'BRK-HYU-58101',
    oemNumber: '58101-G3A00',
    alternateNumbers: ['58101G3A00', 'SP-1848', 'D1912'],
    nameEn: 'Hi-Q Premium Front Brake Pad Kit',
    nameAr: 'طقم أقمشة فرامل هاي-كيو كورية أمامية',
    category: 'Brakes',
    brand: 'Sangsin Hi-Q Korea',
    condition: 'Premium Aftermarket',
    price: 135.00,
    originalPrice: 170.00,
    stock: 22,
    warehouseLocation: 'Dammam Hub (Bin B-05)',
    rating: 4.82,
    reviewCount: 51,
    images: [
      'https://images.unsplash.com/photo-1600705723145-6684826f74a0?auto=format&fit=crop&w=800&q=80'
    ],
    descriptionEn: 'Korea premier Sangsin Hi-Q brake pads offering smooth braking modulation with zero rotor disc gouging.',
    descriptionAr: 'فحمات فرامل كورية هاي-كيو درجة أولى توفر توقفاً سلساً وثباتاً عالياً دون تجريح الهوبات.',
    specifications: {
      'Manufacturer': 'Sangsin Brake Co. Ltd (Korea)',
      'Position': 'Front Left & Right'
    },
    fitments: [
      { make: 'Hyundai', model: 'Elantra', years: [2016, 2017, 2018, 2019, 2020], notes: '1.6L and 2.0L' },
      { make: 'Hyundai', model: 'Sonata', years: [2015, 2016, 2017, 2018, 2019], notes: '2.4L Engine' }
    ],
    warranty: '6 Months Warranty',
    deliveryDays: '1–2 Business Days'
  }
];

export const INITIAL_ORDERS: import('../types').Order[] = [
  {
    id: 'ord-9021',
    orderNumber: 'KSA-98241',
    date: '2026-10-13 14:22',
    customerName: 'Sultan Al-Otaibi',
    customerPhone: '+966 50 123 4567',
    city: 'Riyadh',
    address: 'Al Malqa Dist, Anas Ibn Malik Rd, Bldg 42',
    items: [
      { part: SAMPLE_PARTS[0], quantity: 1 },
      { part: SAMPLE_PARTS[1], quantity: 2 }
    ],
    subtotal: 361.00,
    vat: 54.15,
    shipping: 25.00,
    total: 440.15,
    paymentMethod: 'apple_pay',
    paymentStatus: 'Paid',
    deliveryStatus: 'Packed',
    trackingNumber: 'SMSA-882941029',
    carrier: 'SMSA Express',
    zatcaQrString: 'AQZTYXVkaSBBdXRvUGFydHMDFDEwMTIzNDU2NzgwMDAwMwMTMjAyNi0xMC0xM1QxNDoyMjowMFoEBjQ0MC4xNQEFNTQuMTU='
  },
  {
    id: 'ord-9022',
    orderNumber: 'KSA-98242',
    date: '2026-10-13 16:05',
    customerName: 'Fahad Al-Harbi',
    customerPhone: '+966 55 987 6543',
    city: 'Jeddah',
    address: 'Al Rawdah District, Prince Sultan St',
    items: [
      { part: SAMPLE_PARTS[4], quantity: 1 }
    ],
    subtotal: 640.00,
    vat: 96.00,
    shipping: 0.00,
    total: 736.00,
    paymentMethod: 'mada',
    paymentStatus: 'Paid',
    deliveryStatus: 'Processing',
    trackingNumber: 'ARM-551029418',
    carrier: 'Aramex KSA',
    zatcaQrString: 'AQZTYXVkaSBBdXRvUGFydHMDFDEwMTIzNDU2NzgwMDAwMwMTMjAyNi0xMC0xM1QxNjowNTowMFoEBjczNi4wMAEFOTYuMDA='
  }
];
