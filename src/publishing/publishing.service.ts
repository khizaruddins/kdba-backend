import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentMigrationService } from '../documents/services/document-migration.service';
import { WebsitesService } from '../websites/websites.service';
import { CreateLeadDto } from '../leads/dto/lead.dto';
import { WebsiteDocumentV3 } from '../documents/types/document.types';

@Injectable()
export class PublishingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly migrationService: DocumentMigrationService,
    private readonly websitesService: WebsitesService,
  ) {}

  /**
   * Publish a website (promotes draft to live published document, creates version snapshot).
   */
  async publish(websiteId: string, tenantId: string) {
    return this.websitesService.publish(websiteId, tenantId);
  }

  /**
   * Public website resolver:
   * Resolves published website data by tenant slug or website slug.
   * Returns clean, public-only configuration including canonical V3 WebsiteDocument,
   * business, pages, products, and pricing.
   */
  async getPublicWebsite(slug: string) {
    // 1. Look up by tenant slug first
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
      include: {
        businesses: { take: 1 },
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
            template: true,
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

    if (tenant && tenant.websites && tenant.websites.length > 0) {
      if (tenant.status === 'BLOCKED' || tenant.status === 'SUSPENDED') {
        return {
          isBlocked: true,
          tenantStatus: tenant.status,
          blockedReason:
            tenant.blockedReason ||
            'This website has been suspended by the platform administrator.',
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

    // 2. Fallback check: look for website directly by slug
    const website = await this.prisma.website.findFirst({
      where: { slug },
      include: {
        tenant: {
          include: {
            products: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
            pricingPlans: {
              where: { isActive: true },
              orderBy: { sortOrder: 'asc' },
            },
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

    if (
      website.tenant.status === 'BLOCKED' ||
      website.tenant.status === 'SUSPENDED'
    ) {
      return {
        isBlocked: true,
        tenantStatus: website.tenant.status,
        blockedReason:
          website.tenant.blockedReason ||
          'This website has been suspended by the platform administrator.',
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

  /**
   * Format public website response delivering canonical V3 WebsiteDocument
   * with complete tenant shielding and CDN cache-friendly structure.
   */
  private formatPublicResponse(
    tenant: any,
    business: any,
    website: any,
    products: any[],
    pricingPlans: any[],
  ) {
    // Resolve published document (migrating to V3 if legacy)
    const rawPublished = website.publishedDocument || website.draftDocument;
    const canonicalDoc: WebsiteDocumentV3 = rawPublished
      ? this.migrationService.migrateWebsiteDocument(rawPublished)
      : this.migrationService.migrateWebsiteDocument(
          this.migrationService.migrateLegacyRelationalWebsite(
            website,
            website.pages,
            business,
            website.template,
            true,
          ),
        );

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
            socialMedia: business.socialMedia,
            businessHours: business.businessHours,
          }
        : null,
      document: canonicalDoc,
      website: {
        id: website.id,
        name: website.name,
        slug: website.slug,
        status: website.status,
        schemaVersion: '3.0',
        documentRevision: website.documentRevision || 1,
        theme: canonicalDoc.theme,
        seoTitle: website.seoTitle,
        seoDescription: website.seoDescription,
        favicon: website.favicon,
        publishedAt: website.publishedAt,
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
