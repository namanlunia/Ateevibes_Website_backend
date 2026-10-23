import { Controller, Get, Post, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Admin Staff Management')
@Controller('admin/users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Roles(Role.ADMIN)
  @Get()
  @ApiOperation({ summary: 'List all staff users and assigned roles' })
  async findAllStaff() {
    return this.usersService.findAllStaff();
  }

  @Roles(Role.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create new staff member with designated role' })
  async createStaff(
    @Body()
    body: {
      email: string;
      name: string;
      password: string;
      role: Role;
      phone?: string;
    },
  ) {
    return this.usersService.createStaff(body);
  }

  @Roles(Role.ADMIN)
  @Put(':id/status')
  @ApiOperation({ summary: 'Activate or deactivate staff member account' })
  async updateStaffStatus(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    return this.usersService.updateStaffStatus(id, isActive);
  }
}
