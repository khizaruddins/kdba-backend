import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWebsiteDto {
  @ApiProperty({ description: 'Business ID to create website for' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'Template ID to use' })
  @IsString()
  @IsNotEmpty()
  templateId: string;

  @ApiProperty({ example: 'My Business Website' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;
}

export class UpdateWebsiteDto {
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional()
  @IsObject()
  @IsOptional()
  theme?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  favicon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(200)
  seoTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @Transform(({ value }) => (value === '' ? undefined : value))
  @MaxLength(500)
  seoDescription?: string;
}
