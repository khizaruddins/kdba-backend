import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWebsiteDto, UpdateWebsiteDto } from './dto';

@Injectable()
export class WebsitesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create a website from a template.
   * Clones template pages and sections into website pages and sections.
   */
  async create(tenantId: string, dto: CreateWebsiteDto) {
    // Verify business belongs to tenant
    const business = await this.prisma.business.findUnique({
      where: { id: dto.businessId },
    });

    if (!business || business.tenantId !== tenantId) {
      throw new ForbiddenException('Business not found or access denied');
    }

    // Get template with pages and sections
    const template = await this.prisma.template.findUnique({
      where: { id: dto.templateId },
      include: {
        pages: {
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!template) {
      throw new NotFoundException('Template not found');
    }

    // Generate unique slug
    const slug = this.generateSlug(dto.name);
    const uniqueSlug = await this.ensureUniqueSlug(tenantId, slug);

    // Create website, pages, and sections in a transaction
    return this.prisma.$transaction(async (tx) => {
      const website = await tx.website.create({
        data: {
          tenantId,
          businessId: dto.businessId,
          templateId: dto.templateId,
          name: dto.name,
          slug: uniqueSlug,
          theme: template.theme as object,
          seoTitle: business.name,
          seoDescription: business.description || `Welcome to ${business.name}`,
        },
      });

      // Clone template pages → website pages
      for (const templatePage of template.pages) {
        const page = await tx.page.create({
          data: {
            websiteId: website.id,
            title: templatePage.title,
            slug: templatePage.slug,
            type: templatePage.type,
            sortOrder: templatePage.sortOrder,
          },
        });

        // Clone template sections → website sections
        for (const templateSection of templatePage.sections) {
          await tx.section.create({
            data: {
              pageId: page.id,
              type: templateSection.type,
              title: templateSection.title,
              draftConfig: templateSection.defaultConfig as object,
              sortOrder: templateSection.sortOrder,
              enabled: templateSection.enabled,
            },
          });
        }
      }

      // Return full website with pages and sections
      return tx.website.findUnique({
        where: { id: website.id },
        include: {
          pages: {
            include: {
              sections: {
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          business: true,
          template: true,
        },
      });
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.website.findMany({
      where: { tenantId },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        template: {
          select: { id: true, name: true, slug: true, category: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const website = await this.prisma.website.findUnique({
      where: { id },
      include: {
        pages: {
          include: {
            sections: {
              orderBy: { sortOrder: 'asc' },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        business: true,
        template: true,
      },
    });

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    if (website.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return website;
  }

  async update(id: string, tenantId: string, dto: UpdateWebsiteDto) {
    await this.findOne(id, tenantId); // Verify ownership

    return this.prisma.website.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.theme !== undefined && { theme: dto.theme as object }),
        ...(dto.favicon !== undefined && { favicon: dto.favicon }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && { seoDescription: dto.seoDescription }),
      },
      include: {
        pages: {
          include: { sections: { orderBy: { sortOrder: 'asc' } } },
          orderBy: { sortOrder: 'asc' },
        },
        business: true,
        template: true,
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

  private async ensureUniqueSlug(tenantId: string, slug: string): Promise<string> {
    const existing = await this.prisma.website.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (!existing) return slug;
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${slug}-${suffix}`;
  }
}
