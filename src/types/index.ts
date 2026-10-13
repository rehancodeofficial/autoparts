export interface Vehicle {
  make: string;
  model: string;
  year: number;
  engine?: string;
  trim?: string;
}

export interface PartFitment {
  make: string;
  model: string;
  years: number[]; // e.g. [2018, 2019, 2020, 2021, 2022]
  engines?: string[];
  notes?: string;
}

export interface Part {
  id: string;
  sku: string;
  oemNumber: string;
  alternateNumbers: string[];
  nameEn: string;
  nameAr: string;
  category: 'Brakes' | 'Engine' | 'Suspension' | 'Filters' | 'Electrical' | 'Body Parts' | 'Transmission' | 'Cooling';
  brand: string;
  condition: 'Brand New (OEM)' | 'Premium Aftermarket' | 'Genuine Original';
  price: number; // in SAR
  originalPrice?: number;
  stock: number;
  warehouseLocation: string;
  rating: number;
  reviewCount: number;
  images: string[];
  descriptionEn: string;
  descriptionAr: string;
  specifications: Record<string, string>;
  fitments: PartFitment[];
  warranty: string;
  deliveryDays: string;
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
