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
  /** Optional country of origin shown on the manufacturer grid. */
  country?: string | null;
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
  /** Derived: true when salePrice undercuts sellingPrice. */
  isDeal?: boolean;
  /** Derived: the "17% OFF" badge the deals sections render. */
  dealBadge?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CartItem {
  part: Part;
  quantity: number;
}

export type PaymentMethod = 'mada' | 'apple_pay' | 'visa_mastercard' | 'stc_pay' | 'tamara' | 'tabby';

export type OrderStatus =
  | 'PENDING_PAYMENT' | 'PAID' | 'APPROVED' | 'REJECTED' | 'PROCESSING'
  | 'DISPATCHED' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED' | 'PAYMENT_FAILED'
  | 'EXPIRED' | 'RETURN_REQUESTED' | 'RETURNED' | 'REFUNDED';

export interface OrderItemRecord {
  id: string;
  productId: string;
  productSlug?: string | null;
  sku: string | null;
  nameEn: string;
  nameAr: string;
  brandName: string | null;
  imageUrl: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  currentStock?: number | null;
}

export interface PaymentRecord {
  id: string;
  provider: string;
  providerPaymentId: string | null;
  method: string;
  status: string;
  amount: number;
  refunded: number;
  currency: string;
  isTestMode: boolean;
  failureReason: string | null;
  verifiedAt: string | null;
  createdAt: string;
}

export interface RefundRecord {
  id: string;
  paymentId: string;
  amount: number;
  currency: string;
  status: string;
  reason: string | null;
  providerRefundId: string | null;
  createdAt: string;
}

export interface OrderEventRecord {
  id: string;
  eventType: string;
  from: string | null;
  to: string | null;
  message: string | null;
  isInternal: boolean;
  actorName: string | null;
  metadata: any;
  createdAt: string;
}

/**
 * An order as the API returns it. Money is in SAR; the database stores
 * integer halalas and converts at the boundary.
 */
export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  date?: string;
  customerName: string;
  customerEmail: string | null;
  customerPhone: string | null;
  city: string;
  district?: string | null;
  address: string;
  postalCode?: string | null;
  country?: string;
  addressNotes?: string | null;
  isGuest?: boolean;
  userId?: string | null;

  items?: CartItem[];
  itemCount?: number;
  unitCount?: number;

  subtotal: number;
  discount?: number;
  discountCode?: string | null;
  vat: number;
  vatPercent?: number;
  shipping: number;
  total: number;
  refunded?: number;
  currency?: string;

  paymentMethod: PaymentMethod | string;
  paymentStatus: 'Paid' | 'Pending' | 'Failed' | 'Refunded' | 'Partially Refunded' | 'Cancelled' | string;
  deliveryStatus: string;
  trackingNumber: string | null;
  trackingToken?: string;
  carrier: string | null;
  zatcaQrString?: string | null;
  internalNotes?: string | null;
  cancellationReason?: string | null;
  stockCommitted?: boolean;

  createdAt?: string;
  updatedAt?: string;
  paidAt?: string | null;
  dispatchedAt?: string | null;
  shippedAt?: string | null;
  deliveredAt?: string | null;
  cancelledAt?: string | null;

  allowedTransitions?: OrderStatus[];
}

export interface OrderDetail {
  order: Order;
  items: OrderItemRecord[];
  payments: PaymentRecord[];
  refunds: RefundRecord[];
  events: OrderEventRecord[];
}

export interface Discount {
  id: string;
  code: string;
  descriptionEn: string | null;
  descriptionAr: string | null;
  type: 'PERCENT' | 'FIXED';
  value: number;
  minOrderAmount: number;
  maxDiscountAmount: number | null;
  startsAt: string | null;
  endsAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  perCustomerLimit: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface OrderStats {
  totalOrders: number;
  paidOrders: number;
  pendingPayment: number;
  failedPayment: number;
  awaitingApproval: number;
  inFulfilment: number;
  inTransit: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  grossPaidRevenue: number;
  refundedAmount: number;
  netRevenue: number;
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
