import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto, ReceiveStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@ateevibes/shared';

@ApiTags('Inventory Management')
@Controller('admin/inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Roles(Role.ADMIN, Role.INVENTORY_MANAGER, Role.PRODUCT_MANAGER, Role.ANALYST)
  @Get()
  @ApiOperation({ summary: 'List variant inventory levels with available-to-sell, on-hand, and low-stock indicators' })
  async getInventoryLevels(
    @Query('search') search?: string,
    @Query('lowStockOnly') lowStockOnly?: string,
  ) {
    return this.inventoryService.getInventoryLevels({
      search,
      lowStockOnly: lowStockOnly === 'true',
    });
  }

  @Roles(Role.ADMIN, Role.INVENTORY_MANAGER, Role.ANALYST)
  @Get('movements')
  @ApiOperation({ summary: 'Audit history of all stock movements and reservations' })
  async getMovements(@Query('limit') limit = 50) {
    return this.inventoryService.getMovements(Number(limit) || 50);
  }

  @Roles(Role.ADMIN, Role.INVENTORY_MANAGER)
  @Post('adjust')
  @ApiOperation({ summary: 'Make manual stock adjustment with required reason' })
  async adjustStock(
    @Body() dto: AdjustStockDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.inventoryService.adjustStock(dto, actorId);
  }

  @Roles(Role.ADMIN, Role.INVENTORY_MANAGER)
  @Post('receive')
  @ApiOperation({ summary: 'Receive incoming stock shipment from purchase orders' })
  async receiveStock(
    @Body() dto: ReceiveStockDto,
    @CurrentUser('id') actorId: string,
  ) {
    return this.inventoryService.receiveStock(dto, actorId);
  }
}
