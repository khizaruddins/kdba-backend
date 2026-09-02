import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsNumber,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

export class CreateWebsiteDto {
  @ApiProperty({ description: 'Business ID to create website for' })
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @ApiProperty({ description: 'Template ID or slug to use' })
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

export class SaveWebsiteDocumentDto {
  @ApiProperty({ description: 'Full canonical WebsiteDocument JSON payload' })
  @IsObject()
  @IsNotEmpty()
  document: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Expected current revision number for optimistic concurrency control' })
  @IsNumber()
  @IsOptional()
  expectedRevision?: number;
}

export class MutateWebsiteDocumentDto {
  @ApiProperty({
    description: 'Mutation type',
    example: 'UPDATE_THEME',
    enum: [
      'UPDATE_THEME',
      'UPDATE_BUSINESS',
      'UPDATE_NAVIGATION',
      'UPDATE_SEO',
      'UPDATE_SETTINGS',
      'UPDATE_SECTION_PROPS',
      'UPDATE_SECTION_VARIANT',
      'TOGGLE_SECTION',
      'REORDER_SECTIONS',
      'ADD_SECTION',
      'REMOVE_SECTION',
    ],
  })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiPropertyOptional({ description: 'Target Page ID (if applicable)' })
  @IsString()
  @IsOptional()
  pageId?: string;

  @ApiPropertyOptional({ description: 'Target Section ID (if applicable)' })
  @IsString()
  @IsOptional()
  sectionId?: string;

  @ApiProperty({ description: 'Mutation payload object' })
  @IsObject()
  @IsNotEmpty()
  payload: Record<string, unknown>;
}

export class CreateVersionDto {
  @ApiPropertyOptional({ example: 'Pre-holiday redesign', default: 'manual-save' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class RestoreVersionDto {
  @ApiProperty({ description: 'ID of the WebsiteVersion snapshot to restore' })
  @IsString()
  @IsNotEmpty()
  versionId: string;
}
