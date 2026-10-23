import { describe, it, expect, beforeEach } from 'vitest';
import { OrdersService } from '../src/modules/orders/orders.service';
import { BadRequestException } from '@nestjs/common';
import { OrderStatus } from '@ateevibes/shared';

describe('OrdersService Lifecycle Tests', () => {
  let ordersService: OrdersService;
  let mockPrisma: any;
  let mockInventoryService: any;
  let releasedOrderId: string | null = null;

  beforeEach(() => {
    releasedOrderId = null;
    let currentStatus = 'placed';

    mockPrisma = {
      isConnected: true,
      order: {
        findUnique: async () => ({
          id: 'ATV-2026-TEST',
          status: currentStatus,
          subtotal: 1299,
          grandTotal: 1378,
          notes: '',
        }),
        update: async (args: any) => {
          currentStatus = args.data.status;
          return { id: 'ATV-2026-TEST', status: currentStatus };
        },
      },
    };

    mockInventoryService = {
      releaseReservation: async (orderId: string) => {
        releasedOrderId = orderId;
      },
    };

    ordersService = new OrdersService(mockPrisma, mockInventoryService);
  });

  it('allows valid state progression: placed -> packed', async () => {
    const updated = await ordersService.updateStatus('ATV-2026-TEST', OrderStatus.PACKED);
    expect(updated.status).toBe('packed');
  });

  it('rejects illegal status transition: delivered -> placed', async () => {
    // Force current status to delivered
    mockPrisma.order.findUnique = async () => ({
      id: 'ATV-2026-TEST',
      status: 'delivered',
    });

    await expect(
      ordersService.updateStatus('ATV-2026-TEST', OrderStatus.PLACED),
    ).rejects.toThrow(BadRequestException);
  });

  it('releases reserved stock when order is cancelled', async () => {
    mockPrisma.order.findUnique = async () => ({
      id: 'ATV-2026-CANCEL',
      status: 'placed',
    });

    await ordersService.updateStatus('ATV-2026-CANCEL', OrderStatus.CANCELLED);
    expect(releasedOrderId).toBe('ATV-2026-CANCEL');
  });
});
