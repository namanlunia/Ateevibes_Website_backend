import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { InventoryService } from '../inventory/inventory.service';
import { OrderStatus } from '@ateevibes/shared';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private inventoryService: InventoryService,
  ) {}

  async findAll(query?: {
    status?: string;
    paymentStatus?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    if (!this.prisma.isConnected) return { items: [], total: 0 };

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.paymentStatus) where.paymentStatus = query.paymentStatus;
    if (query?.search) {
      where.OR = [
        { id: { contains: query.search, mode: 'insensitive' } },
        { shippingAddress: { email: { contains: query.search, mode: 'insensitive' } } },
        { shippingAddress: { phone: { contains: query.search } } },
        { shippingAddress: { fullName: { contains: query.search, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          items: true,
          shippingAddress: true,
          payments: { select: { id: true, amount: true, status: true, gateway: true } },
          shipments: true,
        },
      }),
      this.prisma.order.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findById(id: string) {
    if (!this.prisma.isConnected) return null;

    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        items: true,
        shippingAddress: true,
        payments: true,
        shipments: { include: { events: true } },
        refunds: true,
      },
    });

    if (!order) {
      throw new NotFoundException(`Order with ID '${id}' not found.`);
    }

    return order;
  }

  /**
   * Safe public lookup for tracking without exposing customer sensitive data
   */
  async publicLookup(orderId: string, contact: string) {
    if (!this.prisma.isConnected) return null;

    const cleanId = orderId.trim();
    const cleanContact = contact.trim().toLowerCase();

    const order = await this.prisma.order.findFirst({
      where: {
        id: { equals: cleanId, mode: 'insensitive' },
        shippingAddress: {
          OR: [
            { email: { equals: cleanContact, mode: 'insensitive' } },
            { phone: { contains: cleanContact.replace(/\D/g, '') } },
          ],
        },
      },
      select: {
        id: true,
        status: true,
        paymentStatus: true,
        paymentMethod: true,
        estimatedDeliveryDate: true,
        createdAt: true,
        items: {
          select: {
            productName: true,
            colourName: true,
            size: true,
            quantity: true,
            imageUrl: true,
          },
        },
        shipments: {
          select: {
            courier: true,
            trackingNumber: true,
            status: true,
            dispatchDate: true,
            events: {
              select: { status: true, location: true, timestamp: true },
              orderBy: { timestamp: 'desc' },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('No matching order found for the provided details.');
    }

    return order;
  }

  async findByCustomerEmail(email: string) {
    if (!this.prisma.isConnected) return [];

    return this.prisma.order.findMany({
      where: {
        shippingAddress: { email: { equals: email.trim().toLowerCase(), mode: 'insensitive' } },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        shippingAddress: true,
      },
    });
  }

  async updateStatus(id: string, newStatus: OrderStatus, note?: string) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection required.');
    }

    const order = await this.findById(id);

    // Validated state machine transitions
    const validTransitions: Record<string, string[]> = {
      placed: ['packed', 'cancelled'],
      packed: ['shipped', 'cancelled'],
      shipped: ['out_for_delivery', 'delivered'],
      out_for_delivery: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    const allowed = validTransitions[order.status] || [];
    if (!allowed.includes(newStatus)) {
      throw new BadRequestException(
        `Invalid status transition from '${order.status}' to '${newStatus}'.`,
      );
    }

    // If cancelled, release reserved stock
    if (newStatus === 'cancelled') {
      await this.inventoryService.releaseReservation(order.id);
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: {
        status: newStatus as any,
        notes: note ? `${order.notes ? order.notes + '\n' : ''}[${new Date().toISOString()}] ${note}` : order.notes,
      },
      include: {
        items: true,
        shippingAddress: true,
        shipments: true,
      },
    });

    this.logger.log(`Order ${id} transitioned from ${order.status} to ${newStatus}.`);
    return updated;
  }
}
