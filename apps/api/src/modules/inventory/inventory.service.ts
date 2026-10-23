import {
  Injectable,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdjustStockDto, ReceiveStockDto } from './dto/inventory.dto';
import { InventoryMovementType, ReservationStatus } from '@ateevibes/shared';

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);

  constructor(private prisma: PrismaService) {}

  async getInventoryLevels(query?: { search?: string; lowStockOnly?: boolean }) {
    if (!this.prisma.isConnected) return [];

    const variants = await this.prisma.productVariant.findMany({
      where: query?.search
        ? {
            OR: [
              { sku: { contains: query.search, mode: 'insensitive' } },
              { colourName: { contains: query.search, mode: 'insensitive' } },
              { product: { name: { contains: query.search, mode: 'insensitive' } } },
            ],
          }
        : undefined,
      include: {
        product: { select: { id: true, name: true, pno: true, status: true } },
        stockLevels: true,
      },
    });

    const results = variants.flatMap((v) =>
      v.stockLevels.map((sl) => {
        const availableToSell = Math.max(0, sl.quantity - sl.reserved);
        const isLowStock = availableToSell <= sl.lowStockThreshold && availableToSell > 0;
        const isOutOfStock = availableToSell === 0;

        return {
          id: sl.id,
          variantId: v.id,
          productId: v.product.id,
          productName: v.product.name,
          pno: v.product.pno,
          sku: v.sku,
          colourName: v.colourName,
          hex: v.hex,
          size: sl.size,
          onHand: sl.quantity,
          reserved: sl.reserved,
          availableToSell,
          lowStockThreshold: sl.lowStockThreshold,
          isLowStock,
          isOutOfStock,
          updatedAt: sl.updatedAt,
        };
      }),
    );

    if (query?.lowStockOnly) {
      return results.filter((r) => r.isLowStock || r.isOutOfStock);
    }

    return results;
  }

  async getMovements(limit = 50) {
    if (!this.prisma.isConnected) return [];

    return this.prisma.inventoryMovement.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        variant: {
          select: {
            sku: true,
            colourName: true,
            product: { select: { name: true, pno: true } },
          },
        },
      },
    });
  }

  async adjustStock(dto: AdjustStockDto, actorId?: string) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection required.');
    }

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.variantStock.findUnique({
        where: {
          variantId_size: {
            variantId: dto.variantId,
            size: dto.size,
          },
        },
      });

      if (!stock) {
        throw new NotFoundException(`Stock record for variant ${dto.variantId} size ${dto.size} not found.`);
      }

      const newQuantity = stock.quantity + dto.quantityChange;
      if (newQuantity < 0) {
        throw new BadRequestException(`Insufficient stock. Current on-hand is ${stock.quantity}.`);
      }

      const updated = await tx.variantStock.update({
        where: { id: stock.id },
        data: { quantity: newQuantity },
      });

      // Audit movement record
      await tx.inventoryMovement.create({
        data: {
          variantId: dto.variantId,
          size: dto.size,
          type: dto.type as any,
          quantity: dto.quantityChange,
          notes: dto.notes,
          actorId,
        },
      });

      return updated;
    });
  }

  async receiveStock(dto: ReceiveStockDto, actorId?: string) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection required.');
    }

    return this.prisma.$transaction(async (tx) => {
      let stock = await tx.variantStock.findUnique({
        where: {
          variantId_size: {
            variantId: dto.variantId,
            size: dto.size,
          },
        },
      });

      if (!stock) {
        stock = await tx.variantStock.create({
          data: {
            variantId: dto.variantId,
            size: dto.size,
            quantity: dto.quantity,
            reserved: 0,
            lowStockThreshold: 3,
          },
        });
      } else {
        stock = await tx.variantStock.update({
          where: { id: stock.id },
          data: { quantity: stock.quantity + dto.quantity },
        });
      }

      await tx.inventoryMovement.create({
        data: {
          variantId: dto.variantId,
          size: dto.size,
          type: 'RECEIVE',
          quantity: dto.quantity,
          referencePOId: dto.referencePOId,
          notes: dto.notes,
          actorId,
        },
      });

      return stock;
    });
  }

  /**
   * Concurrency-safe atomic stock reservation for checkout
   * Ensures availableToSell (quantity - reserved) >= requestedQty
   */
  async reserveStockForOrder(
    orderId: string,
    items: { variantId: string; size: string; quantity: number }[],
    expiresInMinutes = 15,
  ) {
    if (!this.prisma.isConnected) return { success: true };

    const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

    return this.prisma.$transaction(async (tx) => {
      for (const item of items) {
        const stock = await tx.variantStock.findUnique({
          where: {
            variantId_size: {
              variantId: item.variantId,
              size: item.size,
            },
          },
        });

        if (!stock) {
          throw new NotFoundException(`Stock record not found for variant ${item.variantId} (${item.size}).`);
        }

        const available = stock.quantity - stock.reserved;
        if (available < item.quantity) {
          throw new ConflictException(
            `Insufficient stock for variant size ${item.size}. Only ${available} available.`,
          );
        }

        // Atomically increment reserved quantity
        await tx.variantStock.update({
          where: { id: stock.id },
          data: { reserved: { increment: item.quantity } },
        });

        // Create reservation record
        await tx.stockReservation.create({
          data: {
            orderId,
            variantId: item.variantId,
            size: item.size,
            quantity: item.quantity,
            status: 'ACTIVE',
            expiresAt,
          },
        });

        // Record movement
        await tx.inventoryMovement.create({
          data: {
            variantId: item.variantId,
            size: item.size,
            type: 'RESERVE',
            quantity: -item.quantity,
            referenceOrderId: orderId,
            notes: `Checkout reservation for order ${orderId}`,
          },
        });
      }

      return { success: true, expiresAt };
    });
  }

  /**
   * Commit reservation into permanent physical deduction upon payment verification
   */
  async commitReservation(orderId: string) {
    if (!this.prisma.isConnected) return;

    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: { orderId, status: 'ACTIVE' },
      });

      for (const res of reservations) {
        await tx.variantStock.update({
          where: {
            variantId_size: {
              variantId: res.variantId,
              size: res.size,
            },
          },
          data: {
            quantity: { decrement: res.quantity },
            reserved: { decrement: res.quantity },
          },
        });

        await tx.stockReservation.update({
          where: { id: res.id },
          data: { status: 'COMMITTED' },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: res.variantId,
            size: res.size,
            type: 'COMMIT',
            quantity: -res.quantity,
            referenceOrderId: orderId,
            notes: `Committed physical stock for paid order ${orderId}`,
          },
        });
      }
    });
  }

  /**
   * Release reservation upon checkout expiration or payment failure
   */
  async releaseReservation(orderId: string) {
    if (!this.prisma.isConnected) return;

    return this.prisma.$transaction(async (tx) => {
      const reservations = await tx.stockReservation.findMany({
        where: { orderId, status: 'ACTIVE' },
      });

      for (const res of reservations) {
        await tx.variantStock.update({
          where: {
            variantId_size: {
              variantId: res.variantId,
              size: res.size,
            },
          },
          data: {
            reserved: { decrement: res.quantity },
          },
        });

        await tx.stockReservation.update({
          where: { id: res.id },
          data: { status: 'RELEASED' },
        });

        await tx.inventoryMovement.create({
          data: {
            variantId: res.variantId,
            size: res.size,
            type: 'RELEASE',
            quantity: res.quantity,
            referenceOrderId: orderId,
            notes: `Released expired/cancelled reservation for order ${orderId}`,
          },
        });
      }
    });
  }
}
