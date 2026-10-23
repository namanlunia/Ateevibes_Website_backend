import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  Logger,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as crypto from "crypto";
import { PrismaService } from "../../prisma/prisma.service";
import { InventoryService } from "../inventory/inventory.service";
import { isPaymentSimulationEnabled } from "../../common/mock-mode";

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
    private inventoryService: InventoryService,
  ) {}

  async createRazorpayOrder(orderId: string) {
    if (!this.prisma.isConnected) {
      return {
        id: `order_mock_${Date.now()}`,
        currency: "INR",
        amount: 129900,
        status: "created",
      };
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new BadRequestException(`Order ${orderId} not found.`);
    }

    const keyId = this.configService.get("RAZORPAY_KEY_ID");
    const keySecret = this.configService.get("RAZORPAY_KEY_SECRET");

    // Amount in paise
    const amountInPaise = Math.round(Number(order.grandTotal) * 100);

    // If real credentials are not provided, return transparent sandbox simulation payload
    if (!keyId || keyId === "rzp_test_placeholder") {
      const mockGatewayOrderId = `order_sim_${Date.now()}`;
      await this.prisma.payment.upsert({
        where: { id: `pay-${order.id}` },
        update: { gatewayOrderId: mockGatewayOrderId },
        create: {
          id: `pay-${order.id}`,
          orderId: order.id,
          gateway: "RAZORPAY_SIMULATION",
          gatewayOrderId: mockGatewayOrderId,
          amount: order.grandTotal,
          currency: "INR",
          status: "pending",
        },
      });

      return {
        gatewayOrderId: mockGatewayOrderId,
        amount: amountInPaise,
        currency: "INR",
        keyId: "rzp_test_placeholder",
        isSimulation: true,
      };
    }

    // Call Razorpay API with Basic Auth
    try {
      const authHeader = "Basic " + Buffer.from(`${keyId}:${keySecret}`).toString("base64");
      const res = await fetch("https://api.razorpay.com/v1/orders", {
        method: "POST",
        headers: {
          Authorization: authHeader,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: "INR",
          receipt: order.id,
          notes: { orderId: order.id },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new BadRequestException(data.error?.description || "Gateway error");
      }

      await this.prisma.payment.create({
        data: {
          orderId: order.id,
          gateway: "RAZORPAY",
          gatewayOrderId: data.id,
          amount: order.grandTotal,
          currency: "INR",
          status: "pending",
        },
      });

      return {
        gatewayOrderId: data.id,
        amount: data.amount,
        currency: data.currency,
        keyId,
        isSimulation: false,
      };
    } catch (err: any) {
      this.logger.error(`Razorpay order creation failed: ${err.message}`);
      throw new BadRequestException("Failed to initiate payment gateway transaction.");
    }
  }

  async verifyPaymentSignature(body: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) {
    const isSimulation = isPaymentSimulationEnabled(
      this.configService,
      this.prisma.isConnected,
    );
    const keySecret = this.configService.get("RAZORPAY_KEY_SECRET") || "rzp_secret_placeholder";

    if (this.prisma.isConnected) {
      // Look up payment row by { orderId, gatewayOrderId }
      const paymentRecord = await this.prisma.payment.findFirst({
        where: {
          orderId: body.orderId,
          gatewayOrderId: body.razorpayOrderId,
        },
        include: {
          order: true,
        },
      });

      if (!paymentRecord) {
        if (!isSimulation) {
          throw new BadRequestException("Payment session not found for this order.");
        }
      } else {
        // Verify payment record amount matches the order grandTotal
        const orderGrandTotal = paymentRecord.order ? Number(paymentRecord.order.grandTotal) : null;
        const paymentAmount = Number(paymentRecord.amount);
        if (orderGrandTotal !== null && paymentAmount !== orderGrandTotal) {
          throw new BadRequestException("Payment session amount mismatch with order total.");
        }
      }
    } else if (!isSimulation) {
      throw new BadRequestException("Payment session not found for this order.");
    }

    // Verify HMAC SHA-256 signature
    const text = `${body.razorpayOrderId}|${body.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac("sha256", keySecret)
      .update(text)
      .digest("hex");

    const bufA = Buffer.from(generatedSignature);
    const bufB = Buffer.from(body.razorpaySignature || "");
    const isSignatureMatch =
      bufA.length === bufB.length && crypto.timingSafeEqual(bufA, bufB);

    const isMatch =
      isSignatureMatch ||
      (isSimulation && keySecret === "rzp_secret_placeholder" && body.razorpaySignature === "demo_verified");

    if (!isMatch) {
      throw new UnauthorizedException("Invalid payment signature verification.");
    }

    if (this.prisma.isConnected) {
      // Transition order payment to paid
      await this.prisma.order.update({
        where: { id: body.orderId },
        data: { paymentStatus: "paid" },
      });

      // Update payment record
      await this.prisma.payment.updateMany({
        where: { orderId: body.orderId },
        data: {
          gatewayPaymentId: body.razorpayPaymentId,
          gatewaySignature: body.razorpaySignature,
          status: "paid",
        },
      });

      // Commit inventory reservation into permanent deduction
      await this.inventoryService.commitReservation(body.orderId);
    }

    this.logger.log(`Payment verified for order ${body.orderId}. Inventory reservation committed.`);
    return { success: true, orderId: body.orderId };
  }

  async processWebhook(signature: string, rawBody: string) {
    const isSimulation = isPaymentSimulationEnabled(
      this.configService,
      this.prisma.isConnected,
    );
    const webhookSecret =
      this.configService.get("RAZORPAY_WEBHOOK_SECRET") || "rzp_webhook_secret_placeholder";

    const expectedSignature = crypto
      .createHmac("sha256", webhookSecret)
      .update(rawBody)
      .digest("hex");

    const bufExp = Buffer.from(expectedSignature);
    const bufSig = Buffer.from(signature || "");
    const signatureMatches =
      bufExp.length === bufSig.length && crypto.timingSafeEqual(bufExp, bufSig);

    if (isSimulation) {
      if (webhookSecret !== "rzp_webhook_secret_placeholder" && !signatureMatches) {
        throw new UnauthorizedException("Invalid webhook signature");
      }
    } else {
      // In production, invalid or missing signature ALWAYS throws
      if (!signature || !signatureMatches) {
        throw new UnauthorizedException("Invalid webhook signature");
      }
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;
    this.logger.log(`Received Razorpay webhook event: ${event}`);

    if (event === "payment.captured" && this.prisma.isConnected) {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderId = paymentEntity?.notes?.orderId;
      if (orderId) {
        await this.prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: "paid" },
        });
        await this.inventoryService.commitReservation(orderId);
      }
    }

    return { received: true };
  }
}
