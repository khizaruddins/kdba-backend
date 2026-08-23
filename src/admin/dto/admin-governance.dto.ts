import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsArray,
  IsObject,
} from 'class-validator';
import { TenantStatus, SubscriptionStatus, InvoiceStatus } from '@prisma/client';

export class UpdateTenantStatusDto {
  @ApiProperty({ enum: TenantStatus, example: TenantStatus.BLOCKED })
  @IsEnum(TenantStatus)
  @IsNotEmpty()
  status: TenantStatus;

  @ApiPropertyOptional({ example: 'Payment failure or terms violation' })
  @IsString()
  @IsOptional()
  reason?: string;
}

export class CreateInvoiceDto {
  @ApiProperty({ example: 'clx123tenantid' })
  @IsString()
  @IsNotEmpty()
  tenantId: string;

  @ApiPropertyOptional({ example: 'clx123subid' })
  @IsString()
  @IsOptional()
  subscriptionId?: string;

  @ApiProperty({ example: 79.0 })
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  @ApiPropertyOptional({ example: 'USD' })
  @IsString()
  @IsOptional()
  currency?: string;

  @ApiPropertyOptional({ enum: InvoiceStatus, default: InvoiceStatus.PENDING })
  @IsEnum(InvoiceStatus)
  @IsOptional()
  status?: InvoiceStatus;

  @ApiPropertyOptional({ example: '2026-09-01T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({ example: 'CARD' })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiPropertyOptional({ example: [{ description: 'Custom Design Retainer', amount: 79.0, quantity: 1 }] })
  @IsArray()
  @IsOptional()
  lineItems?: Array<{ description: string; amount: number; quantity?: number }>;

  @ApiPropertyOptional({ example: 'Net 30 terms' })
  @IsString()
  @IsOptional()
  notes?: string;
}

export class UpdateSubscriptionDto {
  @ApiPropertyOptional({ example: 'clx123planid' })
  @IsString()
  @IsOptional()
  planId?: string;

  @ApiPropertyOptional({ enum: SubscriptionStatus })
  @IsEnum(SubscriptionStatus)
  @IsOptional()
  status?: SubscriptionStatus;

  @ApiPropertyOptional({ example: 'MONTHLY' })
  @IsString()
  @IsOptional()
  billingCycle?: string;

  @ApiPropertyOptional({ example: 79.0 })
  @IsNumber()
  @IsOptional()
  amount?: number;

  @ApiPropertyOptional({ example: '2026-12-31T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  currentPeriodEnd?: string;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'Growth Professional' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'professional' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiPropertyOptional({ example: 'For established brands and growing teams' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 79.0 })
  @IsNumber()
  @IsNotEmpty()
  monthlyPrice: number;

  @ApiProperty({ example: 790.0 })
  @IsNumber()
  @IsNotEmpty()
  yearlyPrice: number;

  @ApiProperty({ example: ['Unlimited Websites', 'Full CRM'] })
  @IsArray()
  @IsNotEmpty()
  features: string[];

  @ApiPropertyOptional({ example: 5 })
  @IsNumber()
  @IsOptional()
  maxWebsites?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsNumber()
  @IsOptional()
  maxProducts?: number;

  @ApiPropertyOptional({ example: 10000 })
  @IsNumber()
  @IsOptional()
  maxMediaStorageMb?: number;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isPopular?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
