import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private prisma: PrismaService) {}

  async getPublicSettings() {
    return {
      storeName: 'Ateevibes',
      tagline: 'Feel the Vibes — Same Print, Different Vibes',
      currency: 'INR',
      freeShippingThreshold: 1499,
      standardShippingFee: 79,
      codFee: 49,
      atelierOrigin: 'Surat, Gujarat, India',
      returnPolicy: 'Atelier batch production. Sales final unless transit damage reported within 48 hours.',
    };
  }

  async getAdminSettings() {
    if (!this.prisma.isConnected) {
      return this.getPublicSettings();
    }

    const settings = await this.prisma.storeSettings.findMany();
    const map: Record<string, string> = {};
    settings.forEach((s) => (map[s.key] = s.value));

    return {
      ...await this.getPublicSettings(),
      ...map,
    };
  }

  async getAuditLogs(limit = 50) {
    if (!this.prisma.isConnected) return [];

    return this.prisma.auditLog.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
    });
  }
}
