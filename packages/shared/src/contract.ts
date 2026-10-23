/**
 * SYNC SOURCE: packages/shared/src/contract.ts in Ateevibes_Website_backend — keep identical
 * Authoritative API contract, endpoint mappings, and canonical commerce math.
 */

export const API_ROUTES = {
  auth: {
    customerLogin: "/auth/customer/login",
    customerSignup: "/auth/customer/signup",
    refresh: "/auth/refresh",
    me: "/auth/me",
  },
  products: {
    base: "/products",
    bySlug: (slug: string) => `/products/${slug}`,
    byPno: (pno: string) => `/products/pno/${pno}`,
    related: (id: string) => `/products/${id}/related`,
    bestsellers: "/products/curated/bestsellers",
    newArrivals: "/products/curated/new-arrivals",
  },
  checkout: {
    quote: "/checkout/quote",
    createOrder: "/checkout/create-order",
  },
  payments: {
    createOrder: "/payments/create-order",
    verify: "/payments/verify",
  },
  orders: {
    lookup: "/orders/lookup",
    myOrders: "/orders/my-orders",
    byId: (id: string) => `/orders/${id}`,
  },
} as const;

export interface PromoCodeDefinition {
  name: string;
  pct: number;
  requiresFirstOrder: boolean;
  description: string;
}

export const PROMO_CODES: Record<string, PromoCodeDefinition> = {
  ATEE10: {
    name: "ATEE10",
    pct: 10,
    requiresFirstOrder: false,
    description: "10% off entire order",
  },
  WELCOME15: {
    name: "WELCOME15",
    pct: 15,
    requiresFirstOrder: true,
    description: "15% off first order for new members",
  },
} as const;

export const FREE_SHIPPING_THRESHOLD = 1499;
export const STANDARD_SHIPPING_FEE = 79;
export const EXPRESS_SURCHARGE = 99;
export const COD_FEE = 49;
export const MAX_QTY_PER_LINE = 10;

export const SHOPPING_MODEL = {
  FREE_SHIPPING_THRESHOLD,
  STANDARD_SHIPPING_FEE,
  EXPRESS_SURCHARGE,
  COD_FEE,
  MAX_QTY_PER_LINE,
} as const;

export interface ComputeTotalsInput {
  subtotal: number;
  discount: number;
  isCod: boolean;
  isExpress: boolean;
}

export interface ComputeTotalsResult {
  netSubtotal: number;
  shipping: number;
  codFee: number;
  grandTotal: number;
  amountToFreeShipping: number;
}

export function computeShippingAndTotals(input: ComputeTotalsInput): ComputeTotalsResult {
  const { subtotal, discount, isCod, isExpress } = input;
  const netSubtotal = Math.max(0, subtotal - discount);
  const isFreeStandard = netSubtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = isExpress
    ? (isFreeStandard ? EXPRESS_SURCHARGE : STANDARD_SHIPPING_FEE + EXPRESS_SURCHARGE)
    : (isFreeStandard ? 0 : STANDARD_SHIPPING_FEE);
  const codFee = isCod ? COD_FEE : 0;
  const grandTotal = netSubtotal + shipping + codFee;
  const amountToFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - netSubtotal);

  return {
    netSubtotal,
    shipping,
    codFee,
    grandTotal,
    amountToFreeShipping,
  };
}

export interface CheckoutItemPayload {
  productId: string;
  variantId: string;
  size: "S" | "M" | "L" | "XL" | string;
  quantity: number;
}

export interface ShippingAddressPayload {
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

export interface CreateOrderPayload {
  items: CheckoutItemPayload[];
  shippingAddress: ShippingAddressPayload;
  paymentMethod: "upi" | "card" | "netbanking" | "cod";
  promoCode?: string;
  isCod?: boolean;
  isExpress?: boolean;
}

export interface QuoteRequestPayload {
  items: CheckoutItemPayload[];
  promoCode?: string;
  isCod?: boolean;
  isExpress?: boolean;
}
