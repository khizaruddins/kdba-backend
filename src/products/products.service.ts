import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

function money(value: Prisma.Decimal | number | null | undefined): number {
  if (value == null) return 0;
  return Number(value);
}

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateProductDto) {
    return this.prisma.product.create({
      data: {
        tenantId,
        name: dto.name,
        description: dto.description,
        price: dto.price,
        compareAtPrice: dto.compareAtPrice ?? null,
        currency: dto.currency || 'USD',
        imageUrl: dto.imageUrl,
        category: dto.category,
        brand: dto.brand,
        sku: dto.sku,
        stock: dto.stock ?? null,
        ctaText: dto.ctaText,
        ctaUrl: dto.ctaUrl,
        isActive: dto.isActive !== undefined ? dto.isActive : true,
        sortOrder: dto.sortOrder || 0,
      },
    });
  }

  async findAll(tenantId: string, isActiveOnly = false) {
    return this.prisma.product.findMany({
      where: {
        tenantId,
        ...(isActiveOnly ? { isActive: true } : {}),
      },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async getStats(tenantId: string) {
    const products = await this.prisma.product.findMany({
      where: { tenantId },
      select: {
        price: true,
        compareAtPrice: true,
        isActive: true,
        stock: true,
        category: true,
      },
    });

    const byCategory = new Map<string, number>();
    let catalogValue = 0;
    let active = 0;
    let discounted = 0;
    let outOfStock = 0;

    for (const product of products) {
      const price = money(product.price);
      catalogValue += price;
      if (product.isActive) active += 1;
      if (product.compareAtPrice != null && money(product.compareAtPrice) > price) {
        discounted += 1;
      }
      if (product.stock === 0) outOfStock += 1;
      const category = product.category?.trim() || 'Uncategorized';
      byCategory.set(category, (byCategory.get(category) || 0) + 1);
    }

    return {
      total: products.length,
      active,
      inactive: products.length - active,
      catalogValue: Math.round(catalogValue * 100) / 100,
      discounted,
      outOfStock,
      byCategory: Array.from(byCategory.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count),
    };
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return product;
  }

  async update(id: string, tenantId: string, dto: UpdateProductDto) {
    await this.findOne(id, tenantId);

    return this.prisma.product.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.price !== undefined && { price: dto.price }),
        ...(dto.compareAtPrice !== undefined && { compareAtPrice: dto.compareAtPrice }),
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.brand !== undefined && { brand: dto.brand }),
        ...(dto.sku !== undefined && { sku: dto.sku }),
        ...(dto.stock !== undefined && { stock: dto.stock }),
        ...(dto.ctaText !== undefined && { ctaText: dto.ctaText }),
        ...(dto.ctaUrl !== undefined && { ctaUrl: dto.ctaUrl }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
      },
    });
  }

  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.product.delete({
      where: { id },
    });
  }
}
