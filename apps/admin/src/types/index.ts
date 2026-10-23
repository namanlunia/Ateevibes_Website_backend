export type Role =
  | 'OWNER'
  | 'ADMIN'
  | 'PRODUCT_MANAGER'
  | 'INVENTORY_MANAGER'
  | 'FULFILMENT_STAFF'
  | 'SUPPORT_STAFF'
  | 'ANALYST'
  | 'CUSTOMER';

export interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: Role;
  phone?: string;
  isActive?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  colourName: string;
  colourSlug: string;
  hex: string;
  patternImage?: string;
  images: string[];
  stockBySize: Record<string, number>;
}

export interface Product {
  id: string;
  slug: string;
  pno: string;
  name: string;
  category: string;
  categoryName: string;
  subCategory?: string;
  subCategoryName?: string;
  sleeve: string;
  neck: string;
  fabric: string;
  printType: string;
  mrp: number;
  compareAtPrice?: number | null;
  priceConfirmed: boolean;
  status: 'active' | 'coming-soon' | 'archived';
  badges: string[];
  highlights: string[];
  description: string;
  variants: ProductVariant[];
  sizes: string[];
  rating: number;
  reviewCount: number;
  popularity: number;
  catalogPoster?: string;
  createdAt: string;
}

export interface InventoryLevel {
  id: string;
  variantId: string;
  productId: string;
  productName: string;
  pno: string;
  sku: string;
  colourName: string;
  hex: string;
  size: string;
  onHand: number;
  reserved: number;
  availableToSell: number;
  lowStockThreshold: number;
  isLowStock: boolean;
  isOutOfStock: boolean;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  variantId: string;
  size: string;
  type: string;
  quantity: number;
  notes?: string;
  referenceOrderId?: string;
  referencePOId?: string;
  createdAt: string;
  variant?: {
    sku: string;
    colourName: string;
    product: { name: string; pno: string };
  };
}

export interface OrderItem {
  id: string;
  productId: string;
  variantId: string;
  sku: string;
  productName: string;
  colourName: string;
  size: string;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  imageUrl?: string;
}

export interface OrderAddress {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
}

export interface Order {
  id: string;
  status: 'placed' | 'packed' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled';
  subtotal: number;
  discount: number;
  shippingFee: number;
  codFee: number;
  grandTotal: number;
  promoCode?: string;
  paymentMethod: 'upi' | 'card' | 'netbanking' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  estimatedDeliveryDate: string;
  notes?: string;
  createdAt: string;
  items: OrderItem[];
  shippingAddress?: OrderAddress;
}

export interface Customer {
  id: string;
  email: string;
  name: string;
  phone?: string;
  totalOrders: number;
  totalSpent: number;
  createdAt: string;
  addresses: OrderAddress[];
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  orderId?: string;
  category: 'PAYMENT' | 'DELIVERY' | 'PRODUCT' | 'GENERAL';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';
  subject: string;
  createdAt: string;
  messages: {
    id: string;
    senderType: string;
    senderName: string;
    message: string;
    isInternalNote: boolean;
    createdAt: string;
  }[];
}

export interface AnalyticsSummary {
  grossRevenue: number;
  netRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  paidOrdersCount: number;
  pendingOrdersCount: number;
  deliveredOrdersCount: number;
  lowStockCount: number;
  openTicketsCount: number;
  topSellingProducts: { name: string; unitsSold: number; revenue: number }[];
  recentOrders: Order[];
}
