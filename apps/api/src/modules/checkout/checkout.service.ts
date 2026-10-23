import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { QuoteCheckoutDto, CreateOrderDto } from './dto/checkout.dto';
import { PaymentMethod } from '@ateevibes/shared';

const FREE_SHIPPING_THRESHOLD = 1499;
const STANDARD_SHIPPING_FEE = 79;
const EXPRESS_SURCHARGE = 99;
const COD_FEE = 49;

@Injectable()
export class CheckoutService {
  private readonly logger = new Logger(CheckoutService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async calculateQuote(dto: QuoteCheckoutDto) {
    if (!dto.items || dto.items.length === 0) {
      throw new BadRequestException('Checkout items cannot be empty.');
    }

    let subtotal = 0;
    const resolvedItems = [];

    for (const item of dto.items) {
      if (this.prisma.isConnected) {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: {
            variants: {
              where: { id: item.variantId },
              include: { stockLevels: { where: { size: item.size } } },
            },
          },
        });

        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found.`);
        }

        const variant = product.variants[0];
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
      } else {
        // Fallback for mocked mode
        const price = 1299;
        const lineTotal = price * item.quantity;
        subtotal += lineTotal;
        resolvedItems.push({
          productId: item.productId,
          variantId: item.variantId,
          productName: 'Ateevibes T-Shirt',
          colourName: 'Signature',
          size: item.size,
          unitPrice: price,
          quantity: item.quantity,
          lineTotal,
        });
      }
    }

    // Promo calculation
    let discount = 0;
    const cleanPromo = (dto.promoCode || '').trim().toUpperCase();
    if (cleanPromo === 'VIBE10') {
      discount = Math.round(subtotal * 0.1);
    } else if (cleanPromo === 'FLAT200' && subtotal >= 1000) {
      discount = 200;
    }

    const discountedSubtotal = Math.max(0, subtotal - discount);
    const shipping =
      discountedSubtotal >= FREE_SHIPPING_THRESHOLD
        ? dto.isExpress
          ? EXPRESS_SURCHARGE
          : 0
        : dto.isExpress
        ? STANDARD_SHIPPING_FEE + EXPRESS_SURCHARGE
        : STANDARD_SHIPPING_FEE;

    const codFee = dto.isCod ? COD_FEE : 0;
    const grandTotal = discountedSubtotal + shipping + codFee;
    const isFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - discountedSubtotal);

    return {
      subtotal,
      discount,
      shipping,
      codFee,
      grandTotal,
      isFreeShipping,
      items: resolvedItems,
      promoApplied: discount > 0 ? cleanPromo : null,
    };
  }

  async createOrder(dto: CreateOrderDto, customerId?: string) {
    const isCod = dto.paymentMethod === PaymentMethod.COD;
    const quote = await this.calculateQuote({
      items: dto.items,
      promoCode: dto.promoCode,
      isCod,
      isExpress: dto.isExpress,
    });

    const orderId = `ATV-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;

    // Calculate delivery date estimate
    const deliveryDate = new Date();
    deliveryDate.setDate(deliveryDate.getDate() + (dto.isExpress ? 3 : 5));
    const estimatedDeliveryDate = deliveryDate.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
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
        status: 'placed',
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shipping,
        codFee: quote.codFee,
        grandTotal: quote.grandTotal,
        paymentMethod: dto.paymentMethod,
        paymentStatus: isCod ? 'pending' : 'paid',
        estimatedDeliveryDate,
        items: quote.items,
      };
    }

    const order = await this.prisma.order.create({
      data: {
        id: orderId,
        customerId,
        status: 'placed',
        subtotal: quote.subtotal,
        discount: quote.discount,
        shippingFee: quote.shipping,
        codFee: quote.codFee,
        grandTotal: quote.grandTotal,
        promoCode: quote.promoApplied,
        paymentMethod: dto.paymentMethod as any,
        paymentStatus: isCod ? 'pending' : 'pending',
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
            currency: 'INR',
            status: 'pending',
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
  }
}
