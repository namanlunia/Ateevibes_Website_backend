import { Controller, Get, Put, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { HomepageService } from './homepage.service';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Homepage CMS')
@Controller('homepage')
export class HomepageController {
  constructor(private readonly homepageService: HomepageService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get active homepage layout and campaign configuration' })
  async getConfiguration() {
    return this.homepageService.getConfiguration();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PRODUCT_MANAGER)
  @Put('sections/:key')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update homepage section visibility and configuration' })
  async updateSection(
    @Param('key') key: string,
    @Body() body: { title?: string; subtitle?: string; isVisible?: boolean; configJson?: any },
  ) {
    return this.homepageService.updateSection(key, body);
  }
}
