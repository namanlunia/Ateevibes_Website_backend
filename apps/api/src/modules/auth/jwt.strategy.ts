import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";
import { getRequiredSecret, DEFAULT_JWT_SECRET } from "../../config/required-env";

export interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getRequiredSecret(configService, "JWT_SECRET", DEFAULT_JWT_SECRET),
    });
  }

  async validate(payload: JwtPayload) {
    if (!payload || !payload.sub) {
      throw new UnauthorizedException("Invalid authentication token.");
    }

    if (this.prisma.isConnected) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, name: true, role: true, isActive: true },
      });

      if (!user || !user.isActive) {
        throw new UnauthorizedException("User account not found or deactivated.");
      }
      return user;
    }

    // Fallback if running with mock/in-memory adapter
    return {
      id: payload.sub,
      email: payload.email,
      name: payload.name,
      role: payload.role,
      isActive: true,
    };
  }
}
