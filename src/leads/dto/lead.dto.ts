import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsEmail,
  IsEnum,
  MaxLength,
} from 'class-validator';

export enum LeadStatusEnum {
  NEW = 'NEW',
  CONTACTED = 'CONTACTED',
  QUALIFIED = 'QUALIFIED',
  CONVERTED = 'CONVERTED',
  LOST = 'LOST',
}

export class CreateLeadDto {
  @ApiProperty({ example: 'Alice Smith' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @ApiProperty({ example: 'alice@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiPropertyOptional({ example: '+1234567890' })
  @IsString()
  @IsOptional()
  @MaxLength(30)
  phone?: string;

  @ApiPropertyOptional({
    example: 'I would like to inquire about your services.',
  })
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  message?: string;

  @ApiPropertyOptional({ example: 'contact_form' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  source?: string;
}

export class UpdateLeadDto {
  @ApiPropertyOptional({ enum: LeadStatusEnum })
  @IsEnum(LeadStatusEnum)
  @IsOptional()
  status?: LeadStatusEnum;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  @MaxLength(3000)
  message?: string;
}
