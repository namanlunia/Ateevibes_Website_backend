import { describe, it, expect, beforeEach } from 'vitest';
import { CheckoutService } from '../src/modules/checkout/checkout.service';
import { BadRequestException } from '@nestjs/common';

describe('CheckoutService Unit Tests', () => {
  let checkoutService: CheckoutService;
  let mockPrisma: any;
  let mockInventoryService: any;

  beforeEach(() => {
    mockPrisma = {
      isConnected: false,
    };

    mockInventoryService = {
      reserveStockForOrder: async () => ({ success: true }),
    };

    checkoutService = new CheckoutService(mockPrisma, mockInventoryService);
  });

  it('rejects checkout quotes with empty items list', async () => {
    await expect(
      checkoutService.calculateQuote({
        items: [],
      }),
    ).rejects.toThrow(BadRequestException);
  });

  it('calculates standard shipping (₹79) when subtotal is below ₹1499', async () => {
    const quote = await checkoutService.calculateQuote({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          size: 'M',
          quantity: 1, // unit price 1299
        },
      ],
      isCod: false,
      isExpress: false,
    });

    expect(quote.subtotal).toBe(1299);
    expect(quote.shipping).toBe(79);
    expect(quote.codFee).toBe(0);
    expect(quote.grandTotal).toBe(1299 + 79);
    expect(quote.isFreeShipping).toBe(1499 - 1299);
  });

  it('unlocks free shipping when subtotal is ₹1499 or above', async () => {
    const quote = await checkoutService.calculateQuote({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          size: 'M',
          quantity: 2, // 2 * 1299 = 2598
        },
      ],
      isCod: false,
      isExpress: false,
    });

    expect(quote.subtotal).toBe(2598);
    expect(quote.shipping).toBe(0);
    expect(quote.isFreeShipping).toBe(0);
    expect(quote.grandTotal).toBe(2598);
  });

  it('adds COD fee (₹49) when Cash on Delivery is selected', async () => {
    const quote = await checkoutService.calculateQuote({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          size: 'L',
          quantity: 2, // 2598
        },
      ],
      isCod: true,
      isExpress: false,
    });

    expect(quote.codFee).toBe(49);
    expect(quote.grandTotal).toBe(2598 + 49);
  });

  it('applies VIBE10 promo code with 10% discount', async () => {
    const quote = await checkoutService.calculateQuote({
      items: [
        {
          productId: 'prod-1',
          variantId: 'var-1',
          size: 'M',
          quantity: 2, // 2598
        },
      ],
      promoCode: 'VIBE10',
      isCod: false,
      isExpress: false,
    });

    expect(quote.discount).toBe(Math.round(2598 * 0.1));
    expect(quote.promoApplied).toBe('VIBE10');
    expect(quote.grandTotal).toBe(2598 - quote.discount);
  });
});
