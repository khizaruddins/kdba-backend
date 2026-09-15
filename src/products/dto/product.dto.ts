import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsInt,
  IsBoolean,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @ApiProperty({ example: 'Modern Ergonomic Chair' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'High-back ergonomic mesh office chair' })
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiProperty({ example: 299.99 })
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  price: number;

  @ApiPropertyOptional({ example: 'USD', default: 'USD' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({ example: 'https://images.unsplash.com/...' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 'Furniture' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'Acme' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional({ example: 'SKU-1001' })
  @IsString()
  @IsOptional()
  @MaxLength(80)
  sku?: string;

  @ApiPropertyOptional({ example: 349.99 })
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  compareAtPrice?: number | null;

  @ApiPropertyOptional({ example: 24, description: 'Leave empty to skip stock tracking' })
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  stock?: number | null;

  @ApiPropertyOptional({ example: 'Buy Now' })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ctaText?: string;

  @ApiPropertyOptional({ example: '#contact' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  ctaUrl?: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}

export class UpdateProductDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(100)
  brand?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(80)
  sku?: string;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== null)
  @IsNumber()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  compareAtPrice?: number | null;

  @ApiPropertyOptional()
  @ValidateIf((_, value) => value !== null)
  @IsInt()
  @Type(() => Number)
  @Min(0)
  @IsOptional()
  stock?: number | null;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(50)
  ctaText?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(500)
  ctaUrl?: string;

  @ApiPropertyOptional()
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional()
  @IsNumber()
  @IsOptional()
  sortOrder?: number;
}
