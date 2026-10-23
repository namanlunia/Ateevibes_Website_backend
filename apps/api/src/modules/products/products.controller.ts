import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto, UpdateProductDto } from './dto/create-product.dto';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@ateevibes/shared';

@ApiTags('Products')
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'List published products with filtering, search, and pagination' })
  async findAll(@Query() query: ProductQueryDto) {
    return this.productsService.findAll(query);
  }

  @Public()
  @Get('curated/bestsellers')
  @ApiOperation({ summary: 'List top best seller products' })
  async findBestsellers(@Query('limit') limit = 8) {
    return this.productsService.findBestsellers(Number(limit) || 8);
  }

  @Public()
  @Get('curated/new-arrivals')
  @ApiOperation({ summary: 'List newly dropped seasonal products' })
  async findNewArrivals(@Query('limit') limit = 8) {
    return this.productsService.findNewArrivals(Number(limit) || 8);
  }

  @Public()
  @Get(':slug')
  @ApiOperation({ summary: 'Get product by unique URL slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.productsService.findBySlug(slug);
  }

  @Public()
  @Get('pno/:pno')
  @ApiOperation({ summary: 'Get product by style code (P.NO)' })
  async findByPno(@Param('pno') pno: string) {
    return this.productsService.findByPno(pno);
  }

  @Public()
  @Get(':id/related')
  @ApiOperation({ summary: 'Get related products within the same category' })
  async findRelated(@Param('id') id: string, @Query('limit') limit = 4) {
    return this.productsService.findRelated(id, Number(limit) || 4);
  }

  // Admin Endpoints
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PRODUCT_MANAGER)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new product with variants and stock (Admin/Product Manager)' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN, Role.PRODUCT_MANAGER)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update product information, pricing, or status' })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Safely archive a product without destroying order history' })
  async archive(@Param('id') id: string) {
    return this.productsService.archive(id);
  }
}
