import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { ProductQueryDto } from './dto/product-query.dto';
import { CreateProductDto, UpdateProductDto, CreateVariantDto } from './dto/create-product.dto';
import { ProductStatus } from '@ateevibes/shared';

/**
 * DB- and client-side spellings differ: the Postgres enum value is `coming-soon`
 * but the generated Prisma client expects the schema member `coming_soon`.
 */
function toPrismaStatus(input?: string): 'active' | 'coming_soon' | 'archived' {
  if (input === 'coming-soon' || input === 'coming_soon') return 'coming_soon';
  if (input === 'archived') return 'archived';
  return 'active';
}

function fromPrismaStatus(input?: string): string {
  return input === 'coming_soon' ? 'coming-soon' : input || 'active';
}

@Injectable()
export class ProductsService {
  private readonly logger = new Logger(ProductsService.name);

  constructor(private prisma: PrismaService) {}

  async findAll(query: ProductQueryDto) {
    if (!this.prisma.isConnected) {
      return { items: [], total: 0, page: query.page, limit: query.limit };
    }

    const where: any = {};

    // Only active products for storefront unless admin specifies
    where.status = { not: 'archived' };

    if (query.category) {
      where.category = { slug: query.category };
    }

    if (query.subCategory) {
      where.subCategory = { slug: query.subCategory };
    }

    if (query.sleeve) {
      where.sleeve = query.sleeve;
    }

    if (query.neck) {
      where.neck = query.neck;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { pno: { contains: query.search, mode: 'insensitive' } },
        { fabric: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const skip = (query.page - 1) * query.limit;
    const take = query.limit;

    let orderBy: any = { popularity: 'desc' };
    if (query.sort === 'price-asc') orderBy = { mrp: 'asc' };
    if (query.sort === 'price-desc') orderBy = { mrp: 'desc' };
    if (query.sort === 'newest') orderBy = { createdAt: 'desc' };
    if (query.sort === 'rating') orderBy = { rating: 'desc' };

    const [items, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take,
        orderBy,
        include: {
          category: { select: { id: true, slug: true, name: true } },
          subCategory: { select: { id: true, slug: true, name: true } },
          variants: {
            include: {
              stockLevels: true,
            },
          },
          images: { orderBy: { sortOrder: 'asc' } },
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      items: items.map(this.formatProduct),
      total,
      page: query.page,
      limit: query.limit,
      totalPages: Math.ceil(total / query.limit),
    };
  }

  async findBySlug(slug: string) {
    if (!this.prisma.isConnected) return null;

    const product = await this.prisma.product.findUnique({
      where: { slug },
      include: {
        category: true,
        subCategory: true,
        variants: {
          include: { stockLevels: true },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with slug '${slug}' not found.`);
    }

    return this.formatProduct(product);
  }

  async findByPno(pno: string) {
    if (!this.prisma.isConnected) return null;

    const product = await this.prisma.product.findFirst({
      where: { pno },
      include: {
        category: true,
        subCategory: true,
        variants: {
          include: { stockLevels: true },
        },
        images: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!product) {
      throw new NotFoundException(`Product with style code '${pno}' not found.`);
    }

    return this.formatProduct(product);
  }

  async findBestsellers(limit = 8) {
    if (!this.prisma.isConnected) return [];

    const products = await this.prisma.product.findMany({
      where: {
        status: 'active',
        OR: [
          { badges: { has: 'Best Seller' } },
          { popularity: { gte: 85 } },
        ],
      },
      take: limit,
      orderBy: { popularity: 'desc' },
      include: {
        category: true,
        subCategory: true,
        variants: { include: { stockLevels: true } },
      },
    });

    return products.map(this.formatProduct);
  }

  async findNewArrivals(limit = 8) {
    if (!this.prisma.isConnected) return [];

    const products = await this.prisma.product.findMany({
      where: {
        status: 'active',
        badges: { has: 'New' },
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        subCategory: true,
        variants: { include: { stockLevels: true } },
      },
    });

    return products.map(this.formatProduct);
  }

  async findRelated(productId: string, limit = 4) {
    if (!this.prisma.isConnected) return [];

    const current = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!current) return [];

    const products = await this.prisma.product.findMany({
      where: {
        id: { not: productId },
        status: 'active',
        categoryId: current.categoryId,
      },
      take: limit,
      include: {
        category: true,
        subCategory: true,
        variants: { include: { stockLevels: true } },
      },
    });

    return products.map(this.formatProduct);
  }

  async create(dto: CreateProductDto) {
    if (!this.prisma.isConnected) {
      throw new BadRequestException('Database connection required to create products.');
    }

    const existing = await this.prisma.product.findUnique({ where: { slug: dto.slug } });
    if (existing) {
      throw new BadRequestException(`Product with slug '${dto.slug}' already exists.`);
    }

    const created = await this.prisma.product.create({
      data: {
        slug: dto.slug,
        pno: dto.pno,
        name: dto.name,
        categoryId: dto.categoryId,
        subCategoryId: dto.subCategoryId,
        sleeve: dto.sleeve || 'half',
        neck: dto.neck || 'round',
        fabric: dto.fabric,
        printType: dto.printType || 'Solid',
        mrp: dto.mrp,
        compareAtPrice: dto.compareAtPrice,
        priceConfirmed: dto.priceConfirmed ?? true,
        status: toPrismaStatus(dto.status),
        badges: dto.badges || [],
        highlights: dto.highlights || [],
        description: dto.description,
        variants: {
          create: dto.variants.map((v) => ({
            sku: v.sku,
            colourName: v.colourName,
            colourSlug: v.colourSlug,
            hex: v.hex,
            patternImage: v.patternImage,
            images: v.images,
            stockLevels: {
              create: v.stockLevels.map((s) => ({
                size: s.size,
                quantity: s.quantity,
                reserved: 0,
                lowStockThreshold: s.lowStockThreshold || 3,
              })),
            },
          })),
        },
      },
      include: {
        variants: { include: { stockLevels: true } },
      },
    });

    return this.formatProduct(created);
  }

  async update(id: string, dto: UpdateProductDto) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database connection required.');

    const updated = await this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description && { description: dto.description }),
        ...(dto.mrp !== undefined && { mrp: dto.mrp }),
        ...(dto.compareAtPrice !== undefined && { compareAtPrice: dto.compareAtPrice }),
        ...(dto.status && { status: toPrismaStatus(dto.status) }),
        ...(dto.badges && { badges: dto.badges }),
        ...(dto.highlights && { highlights: dto.highlights }),
      },
      include: {
        variants: { include: { stockLevels: true } },
      },
    });

    return this.formatProduct(updated);
  }

  async archive(id: string) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database connection required.');

    // Safe soft delete/archive to protect historical order records
    await this.prisma.product.update({
      where: { id },
      data: { status: 'archived' },
    });

    return { success: true, message: 'Product archived safely.' };
  }

  private formatProduct(raw: any) {
    return {
      id: raw.id,
      slug: raw.slug,
      pno: raw.pno,
      name: raw.name,
      category: raw.category?.slug || raw.categoryId,
      categoryName: raw.category?.name || 'Men’s T-Shirts',
      subCategory: raw.subCategory?.slug || raw.subCategoryId || '',
      subCategoryName: raw.subCategory?.name || '',
      sleeve: raw.sleeve,
      neck: raw.neck,
      fabric: raw.fabric,
      printType: raw.printType,
      mrp: Number(raw.mrp),
      compareAtPrice: raw.compareAtPrice ? Number(raw.compareAtPrice) : null,
      priceConfirmed: raw.priceConfirmed,
      status: fromPrismaStatus(raw.status),
      badges: raw.badges || [],
      highlights: raw.highlights || [],
      description: raw.description,
      rating: Number(raw.rating || 4.8),
      reviewCount: raw.reviewCount || 0,
      popularity: raw.popularity || 80,
      catalogPoster: raw.catalogPoster || null,
      createdAt: raw.createdAt,
      variants: (raw.variants || []).map((v: any) => {
        const stockBySize: Record<string, number> = {};
        (v.stockLevels || []).forEach((sl: any) => {
          stockBySize[sl.size] = Math.max(0, sl.quantity - sl.reserved);
        });
        return {
          id: v.id,
          sku: v.sku,
          colourName: v.colourName,
          colourSlug: v.colourSlug,
          hex: v.hex,
          patternImage: v.patternImage || null,
          images: v.images || [],
          stockBySize,
        };
      }),
      sizes: ['S', 'M', 'L', 'XL'],
    };
  }
}
