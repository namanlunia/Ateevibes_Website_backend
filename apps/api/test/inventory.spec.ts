import { describe, it, expect, beforeEach } from 'vitest';
import { InventoryService } from '../src/modules/inventory/inventory.service';
import { ConflictException } from '@nestjs/common';

describe('InventoryService Concurrency & Reservation Tests', () => {
  let inventoryService: InventoryService;
  let mockPrisma: any;
  let simulatedStock: { quantity: number; reserved: number };
  let simulatedReservations: any[];
  let simulatedMovements: any[];

  beforeEach(() => {
    simulatedStock = { quantity: 10, reserved: 0 };
    simulatedReservations = [];
    simulatedMovements = [];

    mockPrisma = {
      isConnected: true,
      $transaction: async (cb: any) => {
        const tx = {
          variantStock: {
            findUnique: async () => ({ ...simulatedStock }),
            update: async (args: any) => {
              if (args.data.reserved?.increment) {
                simulatedStock.reserved += args.data.reserved.increment;
              }
              if (args.data.reserved?.decrement) {
                simulatedStock.reserved -= args.data.reserved.decrement;
              }
              if (args.data.quantity?.decrement) {
                simulatedStock.quantity -= args.data.quantity.decrement;
              }
              return { ...simulatedStock };
            },
          },
          stockReservation: {
            create: async (args: any) => {
              const rec = { id: `res-${Date.now()}`, ...args.data };
              simulatedReservations.push(rec);
              return rec;
            },
            findMany: async (args: any) => {
              return simulatedReservations.filter(
                (r) => r.orderId === args.where.orderId && r.status === args.where.status,
              );
            },
            update: async (args: any) => {
              const res = simulatedReservations.find((r) => r.id === args.where.id);
              if (res) Object.assign(res, args.data);
              return res;
            },
          },
          inventoryMovement: {
            create: async (args: any) => {
              simulatedMovements.push(args.data);
              return args.data;
            },
          },
        };
        return cb(tx);
      },
    };

    inventoryService = new InventoryService(mockPrisma);
  });

  it('atomically reserves stock for valid quantity and increments reserved quota', async () => {
    const res = await inventoryService.reserveStockForOrder(
      'ORDER-001',
      [{ variantId: 'var-1', size: 'M', quantity: 3 }],
      15,
    );

    expect(res.success).toBe(true);
    expect(simulatedStock.quantity).toBe(10);
    expect(simulatedStock.reserved).toBe(3); // 10 physical, 3 reserved, 7 available to sell
    expect(simulatedReservations.length).toBe(1);
    expect(simulatedReservations[0].status).toBe('ACTIVE');
  });

  it('rejects reservation attempt when requested quantity exceeds available stock', async () => {
    // Current stock has 10 physical, 0 reserved
    // Attempting to reserve 12 units must throw ConflictException
    await expect(
      inventoryService.reserveStockForOrder(
        'ORDER-002',
        [{ variantId: 'var-1', size: 'M', quantity: 12 }],
        15,
      ),
    ).rejects.toThrow(ConflictException);

    expect(simulatedStock.reserved).toBe(0);
  });

  it('commits reservation into permanent physical deduction when order is paid', async () => {
    // First reserve 4 units
    await inventoryService.reserveStockForOrder(
      'ORDER-003',
      [{ variantId: 'var-1', size: 'M', quantity: 4 }],
      15,
    );

    expect(simulatedStock.reserved).toBe(4);

    // Commit upon payment
    await inventoryService.commitReservation('ORDER-003');

    // Physical stock decrements by 4, reservation released
    expect(simulatedStock.quantity).toBe(6);
    expect(simulatedStock.reserved).toBe(0);
    expect(simulatedReservations[0].status).toBe('COMMITTED');
  });

  it('releases reservation back to available pool when order is cancelled or expires', async () => {
    // Reserve 2 units
    await inventoryService.reserveStockForOrder(
      'ORDER-004',
      [{ variantId: 'var-1', size: 'L', quantity: 2 }],
      15,
    );

    expect(simulatedStock.reserved).toBe(2);

    // Release upon cancellation
    await inventoryService.releaseReservation('ORDER-004');

    expect(simulatedStock.quantity).toBe(10); // Physical untouched
    expect(simulatedStock.reserved).toBe(0); // Reserved hold cleared
    expect(simulatedReservations[0].status).toBe('RELEASED');
  });
});
