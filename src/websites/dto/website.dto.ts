import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsObject,
  IsNumber,
  IsArray,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { DocumentOperation } from '../../documents/types/document.types';

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
  @ApiProperty({ description: 'Full canonical WebsiteDocument JSON payload (V3.0 or V2.0)' })
  @IsObject()
  @IsNotEmpty()
  document: Record<string, unknown>;

  @ApiPropertyOptional({ description: 'Expected current revision number for optimistic concurrency control' })
  @IsNumber()
  @IsOptional()
  expectedRevision?: number;

  @ApiPropertyOptional({ description: 'Base revision alias for optimistic concurrency control' })
  @IsNumber()
  @IsOptional()
  baseRevision?: number;
}

export class ApplyDocumentOperationsDto {
  @ApiPropertyOptional({ description: 'Base revision the client edited against for optimistic concurrency' })
  @IsNumber()
  @IsOptional()
  baseRevision?: number;

  @ApiProperty({
    description: 'Array of typed visual document operations to apply transactionally',
    example: [
      {
        type: 'updateProps',
        pageId: 'page_home',
        nodeId: 'heading_123',
        props: { text: 'Grow Your Business' },
      },
    ],
  })
  @IsArray()
  @IsNotEmpty()
  operations: DocumentOperation[];
}

export class DuplicateWebsiteDto {
  @ApiPropertyOptional({ description: 'New name for duplicated website', example: 'Duplicate - My Website' })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ description: 'Target business profile ID (optional, defaults to current)' })
  @IsString()
  @IsOptional()
  businessId?: string;
}

export class MutateWebsiteDocumentDto {
  @ApiProperty({
    description: 'Mutation type (V2 legacy)',
    example: 'UPDATE_THEME',
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
