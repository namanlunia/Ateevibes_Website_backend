import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SupportService {
  constructor(private prisma: PrismaService) {}

  async createTicket(data: {
    customerName: string;
    customerEmail: string;
    customerPhone?: string;
    orderId?: string;
    category?: 'PAYMENT' | 'DELIVERY' | 'PRODUCT' | 'GENERAL';
    subject: string;
    message: string;
  }) {
    const ticketNumber = `TCK-${Date.now().toString().slice(-6)}`;

    if (!this.prisma.isConnected) {
      return {
        id: `tck-${Date.now()}`,
        ticketNumber,
        ...data,
        status: 'OPEN',
        createdAt: new Date(),
      };
    }

    return this.prisma.supportTicket.create({
      data: {
        ticketNumber,
        customerName: data.customerName,
        customerEmail: data.customerEmail.toLowerCase(),
        customerPhone: data.customerPhone,
        orderId: data.orderId,
        category: (data.category as any) || 'GENERAL',
        subject: data.subject,
        messages: {
          create: {
            senderType: 'CUSTOMER',
            senderName: data.customerName,
            message: data.message,
            isInternalNote: false,
          },
        },
      },
      include: { messages: true },
    });
  }

  async findAll(query?: { status?: string; category?: string }) {
    if (!this.prisma.isConnected) return [];

    const where: any = {};
    if (query?.status) where.status = query.status;
    if (query?.category) where.category = query.category;

    return this.prisma.supportTicket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });
  }

  async findById(id: string) {
    if (!this.prisma.isConnected) return null;

    const ticket = await this.prisma.supportTicket.findUnique({
      where: { id },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) throw new NotFoundException(`Ticket ${id} not found.`);
    return ticket;
  }

  async addMessage(
    ticketId: string,
    data: {
      senderType: 'STAFF' | 'CUSTOMER';
      senderName: string;
      message: string;
      isInternalNote: boolean;
      statusUpdate?: string;
    },
  ) {
    if (!this.prisma.isConnected) return null;

    const ticket = await this.findById(ticketId);

    const message = await this.prisma.supportMessage.create({
      data: {
        ticketId: ticket.id,
        senderType: data.senderType,
        senderName: data.senderName,
        message: data.message,
        isInternalNote: data.isInternalNote,
      },
    });

    if (data.statusUpdate) {
      await this.prisma.supportTicket.update({
        where: { id: ticket.id },
        data: { status: data.statusUpdate as any },
      });
    }

    return message;
  }
}
