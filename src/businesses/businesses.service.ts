import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBusinessDto, UpdateBusinessDto } from './dto';

@Injectable()
export class BusinessesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateBusinessDto) {
    const slug = this.generateSlug(dto.name);
    const uniqueSlug = await this.ensureUniqueSlug(tenantId, slug);

    return this.prisma.business.create({
      data: {
        tenantId,
        name: dto.name,
        slug: uniqueSlug,
        description: dto.description,
        category: dto.category,
        logoUrl: dto.logoUrl,
        email: dto.email,
        phone: dto.phone,
        whatsapp: dto.whatsapp,
        address: dto.address,
        city: dto.city,
        state: dto.state,
        country: dto.country,
        zipCode: dto.zipCode,
        socialMedia: dto.socialMedia as object,
        businessHours: dto.businessHours as object,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.business.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id },
      include: { websites: true },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    if (business.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return business;
  }

  async update(id: string, tenantId: string, dto: UpdateBusinessDto) {
    await this.findOne(id, tenantId); // Verify ownership

    return this.prisma.business.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.category !== undefined && { category: dto.category }),
        ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
        ...(dto.email !== undefined && { email: dto.email }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.whatsapp !== undefined && { whatsapp: dto.whatsapp }),
        ...(dto.address !== undefined && { address: dto.address }),
        ...(dto.city !== undefined && { city: dto.city }),
        ...(dto.state !== undefined && { state: dto.state }),
        ...(dto.country !== undefined && { country: dto.country }),
        ...(dto.zipCode !== undefined && { zipCode: dto.zipCode }),
        ...(dto.website !== undefined && { website: dto.website }),
        ...(dto.socialMedia !== undefined && {
          socialMedia: dto.socialMedia,
        }),
        ...(dto.businessHours !== undefined && {
          businessHours: dto.businessHours as Prisma.InputJsonValue,
        }),
      },
    });
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
  }

  private async ensureUniqueSlug(
    tenantId: string,
    slug: string,
  ): Promise<string> {
    const existing = await this.prisma.business.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (!existing) return slug;
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${slug}-${suffix}`;
  }
}
