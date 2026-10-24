import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SupportService } from './support.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Support Tickets')
@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Public()
  @Post('tickets')
  @ApiOperation({ summary: 'Submit a new customer support ticket' })
  async createTicket(
    @Body()
    body: {
      customerName: string;
      customerEmail: string;
      customerPhone?: string;
      orderId?: string;
      category?: 'PAYMENT' | 'DELIVERY' | 'PRODUCT' | 'GENERAL';
      subject: string;
      message: string;
    },
  ) {
    return this.supportService.createTicket(body);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT_STAFF)
  @Get('admin/tickets')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List support tickets by status and category' })
  async findAll(@Query('status') status?: string, @Query('category') category?: string) {
    return this.supportService.findAll({ status, category });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT_STAFF)
  @Get('admin/tickets/:id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get ticket thread with messages and internal notes' })
  async findById(@Param('id') id: string) {
    return this.supportService.findById(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.SUPPORT_STAFF)
  @Post('admin/tickets/:id/reply')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reply to customer ticket or append private internal note' })
  async addReply(
    @Param('id') id: string,
    @CurrentUser('name') staffName: string,
    @Body()
    body: {
      message: string;
      isInternalNote: boolean;
      statusUpdate?: string;
    },
  ) {
    return this.supportService.addMessage(id, {
      senderType: 'STAFF',
      senderName: staffName || 'Ateevibes Concierge',
      message: body.message,
      isInternalNote: body.isInternalNote ?? false,
      statusUpdate: body.statusUpdate,
    });
  }
}
