import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { QuoteCheckoutDto, CreateOrderDto } from "./dto/checkout.dto";
import {
  PaymentMethod,
  PROMO_CODES,
  computeShippingAndTotals,
} from "@ateevibes/shared";

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async calculateQuote(dto: QuoteCheckoutDto, customerId?: string) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException("Checkout items cannot be empty.");
    }

    let subtotal = 0;
    const resolvedItems: any[] = [];

    if (this.prisma.isConnected) {
      const productIds = Array.from(new Set(dto.items.map((i) => i.productId)));
      const products = await this.prisma.product.findMany({
        where: { id: { in: productIds } },
        include: {
          variants: {
            include: { stockLevels: true },
          },
        },
      });

      const productMap = new Map<string, (typeof products)[number]>(
        products.map((p) => [p.id, p] as const),
      );

      for (const item of dto.items) {
        const product = productMap.get(item.productId);
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found.`);
        }

        const variant = product.variants.find((v) => v.id === item.variantId);
        if (!variant) {
          throw new NotFoundException(`Variant ${item.variantId} not found.`);
        }

        const price = Number(product.mrp);
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;

        resolvedItems.push({
          productId: product.id,
          variantId: variant.id,
          productName: product.name,
          colourName: variant.colourName,
          size: item.size,
          unitPrice: price,
          quantity: item.quantity,
          lineTotal,
        });
      }
    } else {
      // Fallback for mocked mode
      for (const item of dto.items) {
        const price = 1299;
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;
        resolvedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: "Ateevibes T-Shirt",
          colourName: "Signature",
          size: item.size,
          unitPrice: price,
          quantity: item.quantity,
          lineTotal,
        });
      }
    }

    // Promo calculation using canonical PROMO_CODES
    let discount = 0;
    let promoApplied: string | null = null;
    const cleanPromo = (dto.promoCode || "").trim().toUpperCase();
    const promoDef = PROMO_CODES[cleanPromo];
    if (promoDef) {
      let isEligible = true;
      if (promoDef.requiresFirstOrder && customerId && this.prisma.isConnected) {
        const orderCount = await this.prisma.order.count({
          where: { customerId },
        });
        if (orderCount > 0) {
          isEligible = false;
        }
      }

      if (isEligible) {
        discount = Math.round((subtotal * promoDef.pct) / 100);
        promoApplied = cleanPromo;
      }
    }

    const totals = computeShippingAndTotals({
      subtotal,
      discount,
      isCod: Boolean(dto.isCod),
      isExpress: Boolean(dto.isExpress),
    });

    return {
      subtotal,
      discount,
      shipping: totals.shipping,
      codFee: totals.codFee,
      grandTotal: totals.grandTotal,
      isFreeShipping: totals.amountToFreeShipping,
      items: resolvedItems,
      promoApplied,
    };
  }

  async createOrder(dto: CreateOrderDto, customerId?: string) {
    const isCod = dto.paymentMethod === PaymentMethod.COD;
    const quote = await this.calculateQuote(
      {
        items: dto.items,
        promoCode: dto.promoCode,
        isCod,
        isExpress: dto.isExpress,
      },
      customerId,
    );

    const orderId = `ATV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Calculate delivery date estimate
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (dto.isExpress ? 3 : 5));
    const estimatedDeliveryDate = deliveryDate.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

    // Concurrency-safe atomic stock reservation
    await this.inventoryService.reserveStockForOrder(
      orderId,
      dto.items.map((i) => ({
        variantId: i.variantId,
        size: i.size,
        quantity: i.quantity,
      })),
      15, // 15 minutes reservation window
    );

    if (!this.prisma.isConnected) {
      // Mocked response for demo when db not connected
      return {
        id: orderId,
        status: "placed",
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shipping,
        codFee: quote.codFee,
        grandTotal: quote.grandTotal,
        paymentMethod: dto.paymentMethod,
        paymentStatus: isCod ? "pending" : "paid",
        estimatedDeliveryDate,
        items: quote.items,
      };
    }

    try {
      const order = await this.prisma.order.create({
        data: {
          id: orderId,
          customerId,
          status: "placed",
          subtotal: quote.subtotal,
          discount: quote.discount,
          shippingFee: quote.shipping,
          codFee: quote.codFee,
          grandTotal: quote.grandTotal,
          promoCode: quote.promoApplied,
          paymentMethod: dto.paymentMethod as any,
          paymentStatus: "pending",
          estimatedDeliveryDate,
          shippingAddress: {
            create: {
              fullName: dto.shippingAddress.fullName,
              phone: dto.shippingAddress.phone,
              email: dto.shippingAddress.email,
              addressLine1: dto.shippingAddress.addressLine1,
              addressLine2: dto.shippingAddress.addressLine2,
              landmark: dto.shippingAddress.landmark,
              city: dto.shippingAddress.city,
              state: dto.shippingAddress.state,
              pincode: dto.shippingAddress.pincode,
            },
          },
          items: {
            create: quote.items.map((i: any) => ({
              productId: i.productId,
              variantId: i.variantId,
              sku: `${i.productId}-${i.size}`,
              productName: i.productName,
              colourName: i.colourName,
              size: i.size,
              unitPrice: i.unitPrice,
              quantity: i.quantity,
              subtotal: i.lineTotal,
            })),
          },
          payments: {
            create: {
              amount: quote.grandTotal,
              currency: "INR",
              status: "pending",
            },
          },
        },
        include: {
          items: true,
          shippingAddress: true,
        },
      });

      this.logger.log(`Order ${order.id} created with atomic stock reservations for ${dto.items.length} items.`);
      return order;
    } catch (err: any) {
      this.logger.error(`Order creation failed for ${orderId}: ${err.message}. Rolling back stock reservation.`);
      await this.inventoryService.releaseReservationForCreatedOrder(orderId);
      throw err;
    }
  }
}
