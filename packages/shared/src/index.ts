export enum Role {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  PRODUCT_MANAGER = 'PRODUCT_MANAGER',
  INVENTORY_MANAGER = 'INVENTORY_MANAGER',
  FULFILMENT_STAFF = 'FULFILMENT_STAFF',
  SUPPORT_STAFF = 'SUPPORT_STAFF',
  ANALYST = 'ANALYST',
  CUSTOMER = 'CUSTOMER',
}

export enum OrderStatus {
  PLACED = 'placed',
  PACKED = 'packed',
  SHIPPED = 'shipped',
  OUT_FOR_DELIVERY = 'out_for_delivery',
  DELIVERED = 'delivered',
  CANCELLED = 'cancelled',
}

export enum PaymentStatus {
  PENDING = 'pending',
  PAID = 'paid',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

export enum PaymentMethod {
  UPI = 'upi',
  CARD = 'card',
  NETBANKING = 'netbanking',
  COD = 'cod',
}

export enum InventoryMovementType {
  RECEIVE = 'RECEIVE',
  RESERVE = 'RESERVE',
  RELEASE = 'RELEASE',
  COMMIT = 'COMMIT',
  ADJUSTMENT = 'ADJUSTMENT',
  RETURN_RESTOCK = 'RETURN_RESTOCK',
  DAMAGED = 'DAMAGED',
}

export enum ReservationStatus {
  ACTIVE = 'ACTIVE',
  COMMITTED = 'COMMITTED',
  EXPIRED = 'EXPIRED',
  RELEASED = 'RELEASED',
}

export enum ProductStatus {
  ACTIVE = 'active',
  COMING_SOON = 'coming-soon',
  ARCHIVED = 'archived',
}

export type SleeveType = 'half' | 'full';
export type NeckType = 'round' | 'polo';
export type SizeType = 'S' | 'M' | 'L' | 'XL';

export interface AddressDto {
  fullName: string;
  phone: string;
  email: string;
  addressLine1: string;
  addressLine2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CheckoutItemDto {
  productId: string;
  variantId: string;
  size: SizeType | string;
  quantity: number;
}

export interface CreateCheckoutDto {
  items: CheckoutItemDto[];
  shippingAddress: AddressDto;
  paymentMethod: PaymentMethod;
  promoCode?: string;
}

export interface PriceBreakdownResult {
  subtotal: number;
  discount: number;
  shipping: number;
  codFee: number;
  grandTotal: number;
  isFreeShipping: number;
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
}

export * from "./contract";
