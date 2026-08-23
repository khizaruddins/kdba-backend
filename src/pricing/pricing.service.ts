import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePricingPlanDto, UpdatePricingPlanDto } from './dto/pricing.dto';

@Injectable()
export class PricingService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreatePricingPlanDto) {
    return this.prisma.pricingPlan.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        currency: dto.currency || 'USD',
        billingPeriod: dto.billingPeriod || 'monthly',
        features: dto.features,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        isRecommended: dto.isRecommended || false,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async findAll(tenantId: string, isActiveOnly = false) {
    return this.prisma.pricingPlan.findMany({
      where: {
        tenantId,
        ...(isActiveOnly ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async findOne(id: string, tenantId: string) {
    const plan = await this.prisma.pricingPlan.findUnique({
      where: { id },
    });

    if (!plan) {
      throw new NotFoundException('Pricing plan not found');
    }

    if (plan.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return plan;
  }

  async update(id: string, tenantId: string, dto: UpdatePricingPlanDto) {
    await this.findOne(id, tenantId);

    return this.prisma.pricingPlan.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.billingPeriod !== undefined && { billingPeriod: dto.billingPeriod }),
        ...(dto.features !== undefined && { features: dto.features }),
        ...(dto.ctaText !== undefined && { ctaText: dto.ctaText }),
        ...(dto.ctaUrl !== undefined && { ctaUrl: dto.ctaUrl }),
        ...(dto.isRecommended !== undefined && { isRecommended: dto.isRecommended }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.pricingPlan.delete({
      where: { id },
    });
  }
}
