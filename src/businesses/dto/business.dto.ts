import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  MaxLength,
  IsObject,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateBusinessDto {
  @ApiProperty({ example: 'Royal Furniture' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({ example: 'Premium furniture store' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional({ example: 'furniture' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional({ example: 'https://example.com/logo.png' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  logoUrl?: string;

  @ApiPropertyOptional({ example: 'info@royal.com' })
  @ValidateIf((o, v) => v != null && v !== '')
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  email?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional({ example: '123 Main Street' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional({ example: 'New York' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ example: 'NY' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional({ example: 'US' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({ example: '10001' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  socialMedia?: Record<string, string>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, unknown>;
}

export class UpdateBusinessDto {
  @ApiPropertyOptional({ example: 'Royal Furniture Updated' })
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(2000)
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  category?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  logoUrl?: string;

  @ApiPropertyOptional()
  @ValidateIf((o, v) => v != null && v !== '')
  @IsEmail()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  email?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(20)
  whatsapp?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(500)
  address?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  state?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(20)
  zipCode?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  website?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  socialMedia?: Record<string, string>;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  businessHours?: Record<string, unknown>;
}
