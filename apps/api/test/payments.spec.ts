import { describe, it, expect, beforeEach } from 'vitest';
import { PaymentsService } from '../src/modules/payments/payments.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';

describe('PaymentsService Signature & Webhook Tests', () => {
  let paymentsService: PaymentsService;
  let mockPrisma: any;
  let mockConfigService: ConfigService;
  let mockInventoryService: any;
  let committedOrderId: string | null = null;

  const testSecret = 'secret_key_test_123';

  beforeEach(() => {
    committedOrderId = null;

    mockPrisma = {
      isConnected: true,
      order: {
        update: async () => ({ id: 'ATV-2026-PAY' }),
      },
      payment: {
        findFirst: async ({ where }: any) => ({
          id: 'pay-record-1',
          orderId: where?.orderId,
          gatewayOrderId: where?.gatewayOrderId,
          amount: 129900,
          order: { id: where?.orderId, grandTotal: 129900 },
        }),
        updateMany: async () => ({ count: 1 }),
      },
    };

    mockConfigService = new ConfigService({
      RAZORPAY_KEY_ID: 'rzp_test_123',
      RAZORPAY_KEY_SECRET: testSecret,
      RAZORPAY_WEBHOOK_SECRET: 'webhook_secret_test_456',
    });

    mockInventoryService = {
      commitReservation: async (orderId: string) => {
        committedOrderId = orderId;
      },
    };

    paymentsService = new PaymentsService(mockPrisma, mockConfigService, mockInventoryService);
  });

  it('verifies genuine HMAC SHA-256 signature and commits inventory reservation', async () => {
    const orderId = 'ATV-2026-PAY';
    const razorpayOrderId = 'order_DAFk872Hkd';
    const razorpayPaymentId = 'pay_9821hdjkh2';

    const text = `${razorpayOrderId}|${razorpayPaymentId}`;
    const validSignature = crypto
      .createHmac('sha256', testSecret)
      .update(text)
      .digest('hex');

    const result = await paymentsService.verifyPaymentSignature({
      orderId,
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature: validSignature,
    });

    expect(result.success).toBe(true);
    expect(committedOrderId).toBe(orderId);
  });

  it('rejects tampered or forged payment signature with UnauthorizedException', async () => {
    await expect(
      paymentsService.verifyPaymentSignature({
        orderId: 'ATV-2026-PAY',
        razorpayOrderId: 'order_DAFk872Hkd',
        razorpayPaymentId: 'pay_9821hdjkh2',
        razorpaySignature: 'forged_fake_signature_abc123',
      }),
    ).rejects.toThrow(UnauthorizedException);

    expect(committedOrderId).toBeNull();
  });
});
