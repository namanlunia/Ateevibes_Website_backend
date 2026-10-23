import {
  Controller,
  Get,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, OrderStatus } from '@ateevibes/shared';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Public()
  @Get('lookup')
  @ApiOperation({ summary: 'Customer public order lookup with tracking timeline' })
  async publicLookup(
    @Query('orderId') orderId: string,
    @Query('contact') contact: string,
  ) {
    return this.ordersService.publicLookup(orderId, contact);
  }

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated customer orders' })
  async getMyOrders(@CurrentUser('email') email: string) {
    return this.ordersService.findByCustomerEmail(email);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get order details by order ID' })
  async getOrderById(@Param('id') id: string) {
    return this.ordersService.findById(id);
  }

  // Admin Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FULFILMENT_STAFF, Role.SUPPORT_STAFF, Role.ANALYST)
  @Get('admin/all')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Admin list all orders with filters, search, and pagination' })
  async adminFindAll(
    @Query('status') status?: string,
    @Query('paymentStatus') paymentStatus?: string,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.ordersService.findAll({
      status,
      paymentStatus,
      search,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FULFILMENT_STAFF)
  @Put('admin/:id/status')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order fulfilment and status transition' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: OrderStatus; note?: string },
  ) {
    return this.ordersService.updateStatus(id, body.status, body.note);
  }
}
