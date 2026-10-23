import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Customers')
@Controller('admin/customers')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles(Role.ADMIN, Role.SUPPORT_STAFF, Role.ANALYST)
  @Get()
  @ApiOperation({ summary: 'List customer profiles with search and pagination' })
  async findAll(
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.customersService.findAll({
      search,
      page: Number(page) || 1,
      limit: Number(limit) || 20,
    });
  }

  @Roles(Role.ADMIN, Role.SUPPORT_STAFF)
  @Get(':id')
  @ApiOperation({ summary: 'Get customer details, address book, and lifetime order history' })
  async findById(@Param('id') id: string) {
    return this.customersService.findById(id);
  }
}
