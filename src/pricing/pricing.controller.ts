import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PricingService } from './pricing.service';
import { CreatePricingPlanDto, UpdatePricingPlanDto } from './dto/pricing.dto';
import { CurrentUser, JwtPayload } from '../common/decorators';

@ApiTags('Pricing Plans')
@ApiBearerAuth()
@Controller('pricing-plans')
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new pricing plan' })
  async create(
    @CurrentUser() user: JwtPayload,
    @Body() dto: CreatePricingPlanDto,
  ) {
    return this.pricingService.create(user.tenantId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all pricing plans for current tenant' })
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async findAll(
    @CurrentUser() user: JwtPayload,
    @Query('activeOnly') activeOnly?: string,
  ) {
    return this.pricingService.findAll(
      user.tenantId,
      activeOnly === 'true',
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a pricing plan by ID' })
  async findOne(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pricingService.findOne(id, user.tenantId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a pricing plan' })
  async update(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
    @Body() dto: UpdatePricingPlanDto,
  ) {
    return this.pricingService.update(id, user.tenantId, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a pricing plan' })
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: JwtPayload,
  ) {
    return this.pricingService.delete(id, user.tenantId);
  }
}
