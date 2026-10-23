import { IsString, IsNotEmpty, IsNumber, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { InventoryMovementType } from '@ateevibes/shared';

export class AdjustStockDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 'M' })
  @IsString()
  @IsNotEmpty()
  size!: string;

  @ApiProperty({ example: 5, description: 'Signed quantity change (e.g. +5 or -2)' })
  @IsNumber()
  quantityChange!: number;

  @ApiProperty({ enum: InventoryMovementType, example: InventoryMovementType.ADJUSTMENT })
  @IsString()
  @IsNotEmpty()
  type!: InventoryMovementType;

  @ApiPropertyOptional({ example: 'Physical stocktake adjustment' })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class ReceiveStockDto {
  @ApiProperty({ example: 'variant-uuid' })
  @IsString()
  @IsNotEmpty()
  variantId!: string;

  @ApiProperty({ example: 'L' })
  @IsString()
  @IsNotEmpty()
  size!: string;

  @ApiProperty({ example: 25 })
  @IsNumber()
  quantity!: number;

  @ApiPropertyOptional({ example: 'PO-2026-001' })
  @IsOptional()
  @IsString()
  referencePOId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
