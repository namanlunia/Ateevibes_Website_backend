import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CustomersService {
  constructor(private prisma: PrismaService) {}

  async findAll(query?: { search?: string; page?: number; limit?: number }) {
    if (!this.prisma.isConnected) return { items: [], total: 0 };

    const page = query?.page || 1;
    const limit = query?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query?.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.customerProfile.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          addresses: true,
        },
      }),
      this.prisma.customerProfile.count({ where }),
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

    const customer = await this.prisma.customerProfile.findUnique({
      where: { id },
      include: {
        addresses: true,
      },
    });

    if (!customer) throw new NotFoundException(`Customer ${id} not found.`);

    // Fetch order history for customer email
    const orders = await this.prisma.order.findMany({
      where: { shippingAddress: { email: customer.email } },
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });

    return {
      ...customer,
      orders,
      totalOrders: orders.length,
      totalSpent: orders.reduce((sum, o) => sum + Number(o.grandTotal), 0),
    };
  }
}
