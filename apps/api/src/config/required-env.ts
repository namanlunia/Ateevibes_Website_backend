import { ConfigService } from "@nestjs/config";

export const DEFAULT_JWT_SECRET =
  "ateevibes_jwt_super_secret_key_change_in_production_2026";
export const DEFAULT_JWT_REFRESH_SECRET =
  "ateevibes_jwt_refresh_super_secret_key_change_in_production_2026";

export function getRequiredSecret(
  configService: ConfigService | { get: (key: string) => string | undefined },
  key: string,
  devDefault: string,
): string {
  const isProduction = process.env.NODE_ENV === "production";
  const val = configService.get(key) || process.env[key];
  if (isProduction && (!val || val.trim() === "")) {
    throw new Error("Missing " + key);
  }
  return val || devDefault;
}
