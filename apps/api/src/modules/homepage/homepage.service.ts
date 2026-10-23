import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HomepageService {
  constructor(private prisma: PrismaService) {}

  async getConfiguration() {
    if (!this.prisma.isConnected) {
      return {
        hero: {
          eyebrow: '2026 Small Batch Collection',
          headline: 'Modern Luxury in Motion',
          subheadline: 'Architectural knitwear and precision garment construction straight from our Surat atelier.',
          ctaText: 'Explore Collection',
          ctaLink: '/shop',
          imageUrl: '/products/1007/green.jpg',
        },
        sections: [],
      };
    }

    const sections = await this.prisma.homepageSection.findMany({
      where: { isVisible: true },
      orderBy: { sortOrder: 'asc' },
    });

    const heroSection = sections.find((s) => s.sectionKey === 'hero');

    return {
      hero: heroSection?.configJson || {
        eyebrow: '2026 Small Batch Collection',
        headline: 'Modern Luxury in Motion',
        subheadline: 'Architectural knitwear and precision garment construction straight from our Surat atelier.',
        ctaText: 'Explore Collection',
        ctaLink: '/shop',
        imageUrl: '/products/1007/green.jpg',
      },
      sections,
    };
  }

  async updateSection(key: string, data: { title?: string; subtitle?: string; isVisible?: boolean; configJson?: any }) {
    if (!this.prisma.isConnected) return data;

    return this.prisma.homepageSection.upsert({
      where: { sectionKey: key },
      update: {
        ...(data.title && { title: data.title }),
        ...(data.subtitle && { subtitle: data.subtitle }),
        ...(data.isVisible !== undefined && { isVisible: data.isVisible }),
        ...(data.configJson && { configJson: data.configJson }),
      },
      create: {
        sectionKey: key,
        title: data.title || key,
        subtitle: data.subtitle,
        isVisible: data.isVisible ?? true,
        configJson: data.configJson,
      },
    });
  }
}
