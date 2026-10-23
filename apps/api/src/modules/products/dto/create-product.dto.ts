import {
  IsString,
  IsNotEmpty,
  IsNumber,
  IsArray,
  IsOptional,
  IsBoolean,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VariantStockDto {
  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size!: string;

  @ApiProperty({ example: 15 })
  @IsNumber()
  @Min(0)
  quantity!: number;

  @ApiPropertyOptional({ example: 3 })
  @IsOptional()
  @IsNumber()
  lowStockThreshold?: number;
}

export class CreateVariantDto {
  @ApiProperty({ example: 'SKU-CJ-BLU-01' })
  @IsString()
  @IsNotEmpty()
  sku!: string;

  @ApiProperty({ example: 'Midnight Cobalt' })
  @IsString()
  @IsNotEmpty()
  colourName!: string;

  @ApiProperty({ example: 'midnight-cobalt' })
  @IsString()
  @IsNotEmpty()
  colourSlug!: string;

  @ApiProperty({ example: '#1e293b' })
  @IsString()
  @IsNotEmpty()
  hex!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  patternImage?: string;

  @ApiProperty({ example: ['/products/1007/blue.jpg'] })
  @IsArray()
  images!: string[];

  @ApiProperty({ type: [VariantStockDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => VariantStockDto)
  stockLevels!: VariantStockDto[];
}

export class CreateProductDto {
  @ApiProperty({ example: 'china-jacquard-knit-tshirt' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: '1007' })
  @IsString()
  @IsNotEmpty()
  pno!: string;

  @ApiProperty({ example: "China Jacquard Knit T-Shirt" })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'cat-jacquard' })
  @IsString()
  @IsNotEmpty()
  categoryId!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  subCategoryId?: string;

  @ApiPropertyOptional({ example: 'half' })
  @IsOptional()
  @IsString()
  sleeve?: string;

  @ApiPropertyOptional({ example: 'round' })
  @IsOptional()
  @IsString()
  neck?: string;

  @ApiProperty({ example: 'China Jacquard Knit' })
  @IsString()
  @IsNotEmpty()
  fabric!: string;

  @ApiPropertyOptional({ example: 'Jacquard Weave' })
  @IsOptional()
  @IsString()
  printType?: string;

  @ApiProperty({ example: 1299 })
  @IsNumber()
  @Min(0)
  mrp!: number;

  @ApiPropertyOptional({ example: 1599 })
  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  priceConfirmed?: boolean;

  @ApiPropertyOptional({ example: 'active' })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: ['Best Seller'] })
  @IsOptional()
  @IsArray()
  badges?: string[];

  @ApiPropertyOptional({ example: ['Breathable', 'Zero Shrinkage'] })
  @IsOptional()
  @IsArray()
  highlights?: string[];

  @ApiProperty({ example: 'Signature China jacquard weave crafted with precision.' })
  @IsString()
  @IsNotEmpty()
  description!: string;

  @ApiProperty({ type: [CreateVariantDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateVariantDto)
  variants!: CreateVariantDto[];
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  mrp?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  compareAtPrice?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  badges?: string[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsArray()
  highlights?: string[];
}
