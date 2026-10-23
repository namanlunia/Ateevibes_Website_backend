import { describe, it, expect, beforeEach } from 'vitest';
import { AuthService } from '../src/modules/auth/auth.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Role } from '@ateevibes/shared';

describe('AuthService Unit Tests', () => {
  let authService: AuthService;
  let mockPrisma: any;
  let jwtService: JwtService;
  let configService: ConfigService;

  beforeEach(() => {
    mockPrisma = {
      isConnected: false,
      user: {
        findUnique: () => null,
        create: (args: any) => ({ id: 'usr-123', ...args.data }),
        update: () => null,
      },
      customerProfile: {
        create: () => null,
      },
      auditLog: {
        create: () => null,
      },
    };

    jwtService = new JwtService({ secret: 'test-secret' });
    configService = new ConfigService({
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'test-refresh-secret',
      JWT_EXPIRES_IN: '1d',
      JWT_REFRESH_EXPIRES_IN: '7d',
    });

    authService = new AuthService(mockPrisma, jwtService, configService);
  });

  it('authenticates initial admin credentials correctly in offline/bootstrap mode', async () => {
    const result = await authService.adminLogin({
      email: 'admin@ateevibes.com',
      password: 'AteevibesAdmin2026!',
    });

    expect(result).toBeDefined();
    expect(result.accessToken).toBeDefined();
    expect(result.refreshToken).toBeDefined();
    expect(result.user.email).toBe('admin@ateevibes.com');
    expect(result.user.role).toBe(Role.OWNER);
  });

  it('rejects invalid admin login credentials', async () => {
    await expect(
      authService.adminLogin({
        email: 'admin@ateevibes.com',
        password: 'WrongPassword!',
      }),
    ).rejects.toThrow('Database offline and credentials do not match bootstrap fallback.');
  });

  it('creates customer account and signs access token', async () => {
    const result = await authService.customerSignup({
      name: 'Naman Lunia',
      email: 'naman@ateevibes.com',
      password: 'CustomerPass2026!',
      phone: '+919876543210',
    });

    expect(result).toBeDefined();
    expect(result.user.role).toBe(Role.CUSTOMER);
    expect(result.user.email).toBe('naman@ateevibes.com');
    expect(result.accessToken).toBeDefined();
  });

  it('refreshes token successfully with valid refresh token', async () => {
    const loginResult = await authService.adminLogin({
      email: 'admin@ateevibes.com',
      password: 'AteevibesAdmin2026!',
    });

    const refreshed = await authService.refreshToken({
      refreshToken: loginResult.refreshToken,
    });

    expect(refreshed.accessToken).toBeDefined();
    expect(refreshed.user.email).toBe('admin@ateevibes.com');
  });
});
