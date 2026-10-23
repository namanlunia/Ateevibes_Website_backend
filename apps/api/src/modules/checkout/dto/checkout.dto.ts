import {
  IsString,
  IsNotEmpty,
  IsArray,
  IsNumber,
  IsOptional,
  IsBoolean,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  PaymentMethod,
  CreateOrderPayload,
  QuoteRequestPayload,
  CheckoutItemPayload,
  ShippingAddressPayload,
} from "@ateevibes/shared";

export class CheckoutItemDto implements CheckoutItemPayload {
  @ApiProperty({ example: "prod-uuid" })
  @IsString()
  @IsNotEmpty()
  productId!: string;

  @ApiProperty({ example: "variant-uuid" })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: "M" })
  @IsString()
  @IsNotEmpty()
  size!: string;

  @ApiProperty({ example: 1 })
  @IsNumber()
  @Min(1)
  quantity!: number;
}

export class ShippingAddressDto implements ShippingAddressPayload {
  @ApiProperty({ example: "Naman Lunia" })
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @ApiProperty({ example: "9876543210" })
  @IsString()
  @IsNotEmpty()
  phone!: string;

  @ApiProperty({ example: "naman@ateevibes.com" })
  @IsString()
  @IsNotEmpty()
  email!: string;

  @ApiProperty({ example: "Flat 402, Royal Palms" })
  @IsString()
  @IsNotEmpty()
  addressLine1!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  addressLine2?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  landmark?: string;

  @ApiProperty({ example: "Surat" })
  @IsString()
  @IsNotEmpty()
  city!: string;

  @ApiProperty({ example: "Gujarat" })
  @IsString()
  @IsNotEmpty()
  state!: string;

  @ApiProperty({ example: "395007" })
  @IsString()
  @IsNotEmpty()
  pincode!: string;
}

export class QuoteCheckoutDto implements QuoteRequestPayload {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiPropertyOptional({ example: "ATEE10" })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCod?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;
}

export class CreateOrderDto implements CreateOrderPayload {
  @ApiProperty({ type: [CheckoutItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CheckoutItemDto)
  items!: CheckoutItemDto[];

  @ApiProperty({ type: ShippingAddressDto })
  @ValidateNested()
  @Type(() => ShippingAddressDto)
  shippingAddress!: ShippingAddressDto;

  @ApiProperty({ enum: PaymentMethod, example: PaymentMethod.UPI })
  @IsString()
  @IsNotEmpty()
  paymentMethod!: PaymentMethod;

  @ApiPropertyOptional({ example: "ATEE10" })
  @IsOptional()
  @IsString()
  promoCode?: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isCod?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isExpress?: boolean;
}
