import { ConfigService } from "@nestjs/config";

export interface ModeContext {
  prismaConnected: boolean;
}

export function isAuthFallbackEnabled(ctx: ModeContext): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  return ctx.prismaConnected === false;
}

export function isPaymentSimulationEnabled(
  config: ConfigService,
  prismaConnected: boolean,
): boolean {
  if (process.env.NODE_ENV === "production") {
    return false;
  }
  if (!prismaConnected) {
    return true;
  }
  const keyId = config.get<string>("RAZORPAY_KEY_ID");
  const keySecret = config.get<string>("RAZORPAY_KEY_SECRET");
  return (
    !keyId ||
    keyId === "rzp_test_placeholder" ||
    !keySecret ||
    keySecret === "rzp_secret_placeholder"
  );
}
