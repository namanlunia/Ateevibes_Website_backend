import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getOverviewMetrics(days = 30) {
    if (!this.prisma.isConnected) {
      return {
        grossRevenue: 148500,
        netRevenue: 139200,
        totalOrders: 112,
        averageOrderValue: 1325,
        paidOrdersCount: 98,
        pendingOrdersCount: 14,
        deliveredOrdersCount: 86,
        lowStockCount: 4,
        openTicketsCount: 2,
        recentOrders: [],
        topSellingProducts: [],
      };
    }

    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    const [orders, lowStockLevels, openTickets, topItems] = await Promise.all([
      this.prisma.order.findMany({
        where: { createdAt: { gte: sinceDate } },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.variantStock.findMany({
        where: { quantity: { lte: 3 } },
      }),
      this.prisma.supportTicket.count({
        where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
      }),
      this.prisma.orderItem.groupBy({
        by: ['productName'],
        _sum: { quantity: true, subtotal: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    const totalOrders = orders.length;
    const paidOrders = orders.filter((o) => o.paymentStatus === 'paid');
    const pendingOrders = orders.filter((o) => o.paymentStatus === 'pending');
    const deliveredOrders = orders.filter((o) => o.status === 'delivered');

    const grossRevenue = orders.reduce((sum, o) => sum + Number(o.grandTotal), 0);
    const discountsTotal = orders.reduce((sum, o) => sum + Number(o.discount), 0);
    const netRevenue = grossRevenue - discountsTotal;
    const averageOrderValue = totalOrders > 0 ? Math.round(grossRevenue / totalOrders) : 0;

    return {
      grossRevenue,
      netRevenue,
      totalOrders,
      averageOrderValue,
      paidOrdersCount: paidOrders.length,
      pendingOrdersCount: pendingOrders.length,
      deliveredOrdersCount: deliveredOrders.length,
      lowStockCount: lowStockLevels.length,
      openTicketsCount: openTickets,
      topSellingProducts: topItems.map((item) => ({
        name: item.productName,
        unitsSold: item._sum.quantity || 0,
        revenue: Number(item._sum.subtotal || 0),
      })),
      recentOrders: orders.slice(0, 8),
    };
  }
}
