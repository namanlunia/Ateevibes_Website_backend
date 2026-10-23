import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class ShipmentsService {
  constructor(private prisma: PrismaService) {}

  async createShipment(data: {
    orderId: string;
    courier: string;
    trackingNumber: string;
    estimatedDelivery?: string;
    notes?: string;
  }) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection required.');
    }

    const order = await this.prisma.order.findUnique({ where: { id: data.orderId } });
    if (!order) throw new NotFoundException(`Order ${data.orderId} not found.`);

    const shipment = await this.prisma.shipment.create({
      data: {
        orderId: data.orderId,
        courier: data.courier,
        trackingNumber: data.trackingNumber,
        dispatchDate: new Date(),
        estimatedDelivery: data.estimatedDelivery ? new Date(data.estimatedDelivery) : undefined,
        status: 'SHIPPED',
        notes: data.notes,
        events: {
          create: {
            status: 'DISPATCHED',
            location: 'Surat Atelier Hub',
            notes: `Dispatched via ${data.courier} (AWB: ${data.trackingNumber})`,
          },
        },
      },
      include: { events: true },
    });

    // Update order status to shipped
    await this.prisma.order.update({
      where: { id: data.orderId },
      data: { status: 'shipped' },
    });

    return shipment;
  }

  async addEvent(shipmentId: string, data: { status: string; location?: string; notes?: string }) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database connection required.');

    const event = await this.prisma.shipmentEvent.create({
      data: {
        shipmentId,
        status: data.status,
        location: data.location,
        notes: data.notes,
      },
    });

    await this.prisma.shipment.update({
      where: { id: shipmentId },
      data: { status: data.status },
    });

    return event;
  }

  async track(trackingNumber: string) {
    if (!this.prisma.isConnected) return null;

    const shipment = await this.prisma.shipment.findFirst({
      where: { trackingNumber: { equals: trackingNumber.trim(), mode: 'insensitive' } },
      include: {
        events: { orderBy: { timestamp: 'desc' } },
        order: {
          select: {
            id: true,
            status: true,
            estimatedDeliveryDate: true,
          },
        },
      },
    });

    if (!shipment) {
      throw new NotFoundException(`Shipment with tracking number '${trackingNumber}' not found.`);
    }

    return shipment;
  }
}
