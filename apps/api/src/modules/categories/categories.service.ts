import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    if (!this.prisma.isConnected) return [];

    return this.prisma.category.findMany({
      include: {
        subCategories: true,
        _count: {
          select: { products: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findBySlug(slug: string) {
    if (!this.prisma.isConnected) return null;

    const category = await this.prisma.category.findUnique({
      where: { slug },
      include: {
        subCategories: true,
        products: {
          where: { status: 'active' },
          include: {
            variants: { include: { stockLevels: true } },
            images: true,
          },
        },
      },
    });

    if (!category) {
      throw new NotFoundException(`Category '${slug}' not found.`);
    }

    return category;
  }
}
