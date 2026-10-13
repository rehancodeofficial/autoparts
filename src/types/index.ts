export interface Vehicle {
  make: string;
  model: string;
  year: number;
  engine?: string;
  trim?: string;
  makeId?: string;
  modelId?: string;
  yearId?: string;
}

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

export interface PartCategory {
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
  subcategories?: PartCategory[];
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

export interface QualityGradeConfig {
  code: string; // 'GRADE_A', 'GRADE_B', 'GRADE_C'
  nameEn: string;
  nameAr: string;
  displayLabel: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  sortOrder: number;
}

export interface PartFitment {
  make: string;
  model: string;
  years: number[];
  engines?: string[];
  notes?: string;
  makeId?: string;
  modelId?: string;
  yearId?: string;
}

export interface Part {
  id: string;
  sku: string;
  mpn?: string;
  oemNumber: string;
  barcode?: string;
  slug?: string;
  alternateNumbers: string[];
  nameEn: string;
  nameAr: string;
  shortDescriptionEn?: string;
  shortDescriptionAr?: string;
  category: string;
  categoryId?: string;
  categorySlug?: string;
  subcategoryId?: string;
  brand: string;
  brandId?: string;
  brandLogoUrl?: string;
  qualityGrade?: 'GRADE_A' | 'GRADE_B' | 'GRADE_C' | string;
  gradeDisplayLabel?: string;
  condition: string;
  isOem?: boolean;
  isOriginal?: boolean;
  testedStatus?: string;
  defectNotes?: string;
  inspectionNotes?: string;
  packagingCondition?: string;
  warrantyMonths?: number;
  returnEligible?: boolean;
  returnWindowDays?: number;
  price: number; // selling price in SAR
  originalPrice?: number;
  salePrice?: number;
  costPrice?: number; // Restricted to admin
  stock: number;
  lowStockThreshold?: number;
  warehouseLocation: string;
  rating: number;
  reviewCount: number;
  images: string[];
  descriptionEn: string;
  descriptionAr: string;
  installationPosition?: string;
  specifications: Record<string, string>;
  technicalSpecs?: Record<string, any>;
  fitments: PartFitment[];
  warranty: string;
  deliveryDays: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'DISABLED' | 'ARCHIVED';
  isFeatured?: boolean;
  showOnHomepage?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  part: Part;
  quantity: number;
}

export type PaymentMethod = 'mada' | 'apple_pay' | 'visa_mastercard' | 'stc_pay' | 'tamara' | 'tabby';

export interface Order {
  id: string;
  orderNumber: string;
  date: string;
  customerName: string;
  customerPhone: string;
  city: string;
  address: string;
  items: CartItem[];
  subtotal: number;
  vat: number; // 15%
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded';
  deliveryStatus: 'Processing' | 'Packed' | 'Shipped' | 'Out for Delivery' | 'Delivered';
  trackingNumber: string;
  carrier: string;
  zatcaQrString: string;
}

export interface PartRequest {
  id: string;
  date: string;
  name: string;
  phone: string;
  email: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: number;
  vinOrPartNumber: string;
  description: string;
  status: 'New' | 'Contacted' | 'Quoted' | 'Closed';
}
