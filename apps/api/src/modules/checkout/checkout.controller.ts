import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CheckoutService } from './checkout.service';
import { QuoteCheckoutDto, CreateOrderDto } from './dto/checkout.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Checkout & Pricing')
@Controller('checkout')
export class CheckoutController {
  constructor(private readonly checkoutService: CheckoutService) {}

  @Public()
  @Post('quote')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Calculate authoritative prices, discounts, taxes, and shipping' })
  @ApiResponse({ status: 200, description: 'Price breakdown' })
  async calculateQuote(@Body() dto: QuoteCheckoutDto) {
    return this.checkoutService.calculateQuote(dto);
  }

  @Public()
  @Post('create-order')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Atomically reserve stock and create a new checkout order' })
  @ApiResponse({ status: 201, description: 'Order created with active stock reservation' })
  async createOrder(
    @Body() dto: CreateOrderDto,
    @CurrentUser('id') customerId?: string,
  ) {
    return this.checkoutService.createOrder(dto, customerId);
  }
}
