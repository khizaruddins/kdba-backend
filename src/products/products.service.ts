import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './dto/product.dto';

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
        currency: dto.currency || 'USD',
        imageUrl: dto.imageUrl,
        category: dto.category,
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
        ...(dto.currency !== undefined && { currency: dto.currency }),
        ...(dto.imageUrl !== undefined && { imageUrl: dto.imageUrl }),
        ...(dto.category !== undefined && { category: dto.category }),
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
