import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateLeadDto } from '../leads/dto/lead.dto';

@Injectable()
export class PublishingService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Publish a website:
   * 1. Copies draftConfig -> publishedConfig for all sections across all pages
   * 2. Sets website.status = 'PUBLISHED' and publishedAt = now()
   */
  async publish(websiteId: string, tenantId: string) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
      include: {
        pages: {
          include: {
            sections: true,
          },
        },
      },
    });

    if (!website) {
      throw new NotFoundException('Website not found');
    }

    if (website.tenantId !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    // Atomic transaction to copy draftConfig to publishedConfig
    return this.prisma.$transaction(async (tx) => {
      for (const page of website.pages) {
        for (const section of page.sections) {
          await tx.section.update({
            where: { id: section.id },
            data: {
              publishedConfig: section.draftConfig as object,
            },
          });
        }
      }

      return tx.website.update({
        where: { id: websiteId },
        data: {
          status: 'PUBLISHED',
          publishedAt: new Date(),
        },
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
        },
      });
    });
  }

  /**
   * Public website resolver:
   * Resolves published website data by tenant slug or website slug.
   * Returns clean, public-only configuration including business, pages, published sections, products, and pricing.
   */
  async getPublicWebsite(slug: string) {
    // Look up by tenant slug first, or website slug
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        businesses: {
          take: 1,
        },
        websites: {
          include: {
            pages: {
              where: { isActive: true },
              include: {
                sections: {
                  where: { enabled: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
              orderBy: { sortOrder: 'asc' },
            },
            template: {
              select: {
                id: true,
                name: true,
                slug: true,
                category: true,
              },
            },
          },
          take: 1,
        },
        products: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
        pricingPlans: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!tenant || !tenant.websites || tenant.websites.length === 0) {
      // Fallback check: look for website directly by slug
      const website = await this.prisma.website.findFirst({
        where: { slug },
        include: {
          tenant: {
            include: {
              products: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
              pricingPlans: { where: { isActive: true }, orderBy: { sortOrder: 'asc' } },
            },
          },
          business: true,
          pages: {
            where: { isActive: true },
            include: {
              sections: {
                where: { enabled: true },
                orderBy: { sortOrder: 'asc' },
              },
            },
            orderBy: { sortOrder: 'asc' },
          },
          template: true,
        },
      });

      if (!website) {
        throw new NotFoundException('Website not found');
      }

      if (website.tenant.status === 'BLOCKED' || website.tenant.status === 'SUSPENDED') {
        return {
          isBlocked: true,
          tenantStatus: website.tenant.status,
          blockedReason: website.tenant.blockedReason || 'This website has been suspended by the platform administrator.',
          blockedAt: website.tenant.blockedAt || website.tenant.updatedAt,
          tenant: {
            name: website.tenant.name,
            slug: website.tenant.slug,
          },
        };
      }

      return this.formatPublicResponse(
        website.tenant,
        website.business,
        website,
        website.tenant.products,
        website.tenant.pricingPlans,
      );
    }

    if (tenant.status === 'BLOCKED' || tenant.status === 'SUSPENDED') {
      return {
        isBlocked: true,
        tenantStatus: tenant.status,
        blockedReason: tenant.blockedReason || 'This website has been suspended by the platform administrator.',
        blockedAt: tenant.blockedAt || tenant.updatedAt,
        tenant: {
          name: tenant.name,
          slug: tenant.slug,
        },
      };
    }

    const website = tenant.websites[0];
    const business = tenant.businesses[0] || null;

    return this.formatPublicResponse(
      tenant,
      business,
      website,
      tenant.products,
      tenant.pricingPlans,
    );
  }

  /**
   * Public contact form submission creating a lead
   */
  async submitContact(slug: string, dto: CreateLeadDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    let tenantId = tenant?.id;

    if (!tenantId) {
      const website = await this.prisma.website.findFirst({
        where: { slug },
      });
      if (!website) {
        throw new NotFoundException('Site not found');
      }
      tenantId = website.tenantId;
    }

    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        message: dto.message,
        source: dto.source || 'contact_form',
        status: 'NEW',
      },
    });

    return {
      success: true,
      message: 'Thank you! Your message has been received.',
      leadId: lead.id,
    };
  }

  private formatPublicResponse(
    tenant: any,
    business: any,
    website: any,
    products: any[],
    pricingPlans: any[],
  ) {
    return {
      tenant: {
        name: tenant.name,
        slug: tenant.slug,
      },
      business: business
        ? {
            name: business.name,
            description: business.description,
            category: business.category,
            logoUrl: business.logoUrl,
            email: business.email,
            phone: business.phone,
            whatsapp: business.whatsapp,
            address: business.address,
            city: business.city,
            state: business.state,
            country: business.country,
            zipCode: business.zipCode,
            website: business.website,
            socialMedia: business.socialMedia,
            businessHours: business.businessHours,
          }
        : null,
      website: {
        id: website.id,
        name: website.name,
        slug: website.slug,
        theme: website.theme,
        seoTitle: website.seoTitle,
        seoDescription: website.seoDescription,
        favicon: website.favicon,
        publishedAt: website.publishedAt,
        pages: website.pages.map((page: any) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: page.type,
          sections: page.sections.map((section: any) => ({
            id: section.id,
            type: section.type,
            title: section.title,
            config: section.publishedConfig || section.draftConfig,
            sortOrder: section.sortOrder,
          })),
        })),
      },
      products: products.map((p) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        price: Number(p.price),
        currency: p.currency,
        imageUrl: p.imageUrl,
        category: p.category,
        ctaText: p.ctaText,
        ctaUrl: p.ctaUrl,
      })),
      pricingPlans: pricingPlans.map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        price: Number(plan.price),
        currency: plan.currency,
        billingPeriod: plan.billingPeriod,
        features: plan.features,
        ctaText: plan.ctaText,
        ctaUrl: plan.ctaUrl,
        isRecommended: plan.isRecommended,
      })),
    };
  }
}
