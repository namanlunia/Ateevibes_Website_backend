import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Analytics & Reporting')
@Controller('admin/analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Roles(Role.ADMIN, Role.ANALYST, Role.INVENTORY_MANAGER, Role.PRODUCT_MANAGER)
  @Get('overview')
  @ApiOperation({ summary: 'Authoritative KPI overview, revenue, orders, and inventory metrics' })
  async getOverviewMetrics(@Query('days') days = 30) {
    return this.analyticsService.getOverviewMetrics(Number(days) || 30);
  }
}
