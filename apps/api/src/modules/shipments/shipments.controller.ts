import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ShipmentsService } from './shipments.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Shipments & Tracking')
@Controller('shipments')
export class ShipmentsController {
  constructor(private readonly shipmentsService: ShipmentsService) {}

  @Public()
  @Get('track/:trackingNumber')
  @ApiOperation({ summary: 'Public shipment tracking lookup' })
  async track(@Param('trackingNumber') trackingNumber: string) {
    return this.shipmentsService.track(trackingNumber);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FULFILMENT_STAFF)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create shipment record with AWB tracking number' })
  async createShipment(
    @Body()
    body: {
      orderId: string;
      courier: string;
      trackingNumber: string;
      estimatedDelivery?: string;
      notes?: string;
    },
  ) {
    return this.shipmentsService.createShipment(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.FULFILMENT_STAFF)
  @Put(':id/events')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Add carrier delivery milestone event' })
  async addEvent(
    @Param('id') id: string,
    @Body() body: { status: string; location?: string; notes?: string },
  ) {
    return this.shipmentsService.addEvent(id, body);
  }
}
