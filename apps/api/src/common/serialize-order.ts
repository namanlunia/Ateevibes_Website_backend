/**
 * Prisma DECIMAL(10,2) columns are surfaced as Decimal objects that JSON-serialize
 * to strings ("1598"). The shared contract and every consumer (storefront, admin)
 * expect plain numbers, so every money field is coerced explicitly.
 */
const ORDER_MONEY_FIELDS = ["subtotal", "discount", "shippingFee", "codFee", "grandTotal"] as const;

export function serializeOrder<T extends Record<string, any>>(order: T | null): any {
  if (!order) return order;

  const out: Record<string, any> = { ...order };
  for (const field of ORDER_MONEY_FIELDS) {
    if (out[field] != null) out[field] = Number(out[field]);
  }

  if (Array.isArray(out.items)) {
    out.items = out.items.map((item: Record<string, any>) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      subtotal: Number(item.subtotal),
    }));
  }

  if (Array.isArray(out.payments)) {
    out.payments = out.payments.map((payment: Record<string, any>) => ({
      ...payment,
      amount: Number(payment.amount),
    }));
  }

  if (Array.isArray(out.refunds)) {
    out.refunds = out.refunds.map((refund: Record<string, any>) => ({
      ...refund,
      amount: Number(refund.amount),
    }));
  }

  return out;
}
