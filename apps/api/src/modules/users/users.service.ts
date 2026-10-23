import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@ateevibes/shared';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllStaff() {
    if (!this.prisma.isConnected) {
      return [
        {
          id: 'admin-owner-default',
          email: 'admin@ateevibes.com',
          name: 'Atelier Director',
          role: Role.OWNER,
          isActive: true,
          createdAt: new Date(),
        },
      ];
    }

    return this.prisma.user.findMany({
      where: { role: { not: 'CUSTOMER' } },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createStaff(data: { email: string; name: string; password: string; role: Role; phone?: string }) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database connection required.');

    const cleanEmail = data.email.trim().toLowerCase();
    const existing = await this.prisma.user.findUnique({ where: { email: cleanEmail } });
    if (existing) throw new ConflictException(`User with email '${cleanEmail}' already exists.`);

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    return this.prisma.user.create({
      data: {
        email: cleanEmail,
        passwordHash,
        name: data.name.trim(),
        role: data.role as any,
        phone: data.phone?.trim(),
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });
  }

  async updateStaffStatus(id: string, isActive: boolean) {
    if (!this.prisma.isConnected) throw new BadRequestException('Database connection required.');

    return this.prisma.user.update({
      where: { id },
      data: { isActive },
      select: { id: true, email: true, name: true, role: true, isActive: true },
    });
  }
}
