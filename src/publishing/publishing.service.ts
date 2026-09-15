import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentMigrationService } from '../documents/services/document-migration.service';
import { WebsitesService } from '../websites/websites.service';
import { CreateLeadDto } from '../leads/dto/lead.dto';
import { WebsiteDocumentV3 } from '../documents/types/document.types';
import { validateContactSubmission } from '../documents/contracts/form-fields';
import { collectDocumentFormFields } from '../documents/services/document-integrity';
import { CmsService } from '../cms/cms.service';

@Injectable()
export class PublishingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly migrationService: DocumentMigrationService,
    private readonly websitesService: WebsitesService,
    private readonly cmsService: CmsService,
  ) {}

  /**
   * Publish a website (promotes draft to live published document, creates version snapshot).
   */
  async publish(websiteId: string, tenantId: string) {
    return this.websitesService.publish(websiteId, tenantId);
  }

  /**
   * Public website resolver:
   * - Tenant slug or website slug: published snapshot only.
   * - Website id (editor /site/:id preview): published snapshot, or draft if never published.
   */
  async getPublicWebsite(slugOrId: string) {
    // 1. Look up by tenant slug first
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: slugOrId },
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
        { allowDraft: false },
      );
    }

    const website = await this.prisma.website.findFirst({
      where: {
        OR: [{ slug: slugOrId }, { id: slugOrId }],
      },
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
      { allowDraft: website.id === slugOrId },
    );
  }

  /**
   * Public contact form submission creating a lead.
   * Visual contact layouts share this same lead pipeline.
   */
  async submitContact(slug: string, dto: CreateLeadDto) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug },
    });

    let tenantId = tenant?.id;
    let website = tenant
      ? await this.prisma.website.findFirst({
          where: { tenantId: tenant.id },
          orderBy: { updatedAt: 'desc' },
        })
      : null;

    if (!tenantId) {
      website = await this.prisma.website.findFirst({
        where: { slug },
      });
      if (!website) {
        throw new NotFoundException('Site not found');
      }
      tenantId = website.tenantId;
    }

    let schema;
    if (website?.publishedDocument) {
      try {
        const doc = this.migrationService.migrateWebsiteDocument(website.publishedDocument);
        const forms = collectDocumentFormFields(doc);
        if (forms.length === 1) schema = forms[0];
      } catch {
        schema = undefined;
      }
    }

    let validated;
    try {
      validated = validateContactSubmission(dto, schema);
    } catch (error: any) {
      throw new BadRequestException({
        code: 'INVALID_CONTACT_SUBMISSION',
        message: error.message,
      });
    }

    const lead = await this.prisma.lead.create({
      data: {
        tenantId,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        message: validated.message,
        source: validated.source,
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
  private async formatPublicResponse(
    tenant: any,
    business: any,
    website: any,
    products: any[],
    pricingPlans: any[],
    options: { allowDraft?: boolean } = {},
  ) {
    // Pretty public URLs never leak draft editor state.
    // /site/:websiteId (editor Preview) may render the draft if unpublished.
    let canonicalDoc: WebsiteDocumentV3 | null = null;

    if (website.publishedDocument) {
      canonicalDoc = this.migrationService.migrateWebsiteDocument(
        website.publishedDocument,
      );
    } else if (website.status === 'PUBLISHED') {
      canonicalDoc = this.migrationService.migrateWebsiteDocument(
        this.migrationService.migrateLegacyRelationalWebsite(
          website,
          website.pages,
          business,
          website.template,
          true,
        ),
      );
    } else if (options.allowDraft && website.draftDocument) {
      canonicalDoc = this.migrationService.migrateWebsiteDocument(
        website.draftDocument,
      );
    }

    if (!canonicalDoc) {
      throw new NotFoundException('Website not found');
    }

    const cms = await this.cmsService.resolvePublishedForWebsite(
      website.id,
      website.tenantId || tenant.id,
      canonicalDoc,
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
            locations: business.locations ?? [],
          }
        : null,
      document: this.stripEditorMetadata(canonicalDoc) as WebsiteDocumentV3,
      website: {
        id: website.id,
        name: website.name,
        slug: website.slug,
        status: website.status,
        schemaVersion: '3.0',
        theme: canonicalDoc.theme,
        seoTitle: website.seoTitle,
        seoDescription: website.seoDescription,
        favicon: website.favicon,
        publishedAt: website.publishedAt,
        pages: (website.pages || []).map((page: any) => ({
          id: page.id,
          title: page.title,
          slug: page.slug,
          type: page.type,
          sections: (page.sections || []).map((section: any) => ({
            id: section.id,
            type: section.type,
            title: section.title,
            config: section.publishedConfig || {},
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
      cms,
    };
  }

  /**
   * Drop draft/editor bookkeeping from the public payload.
   * Semantic editor types (navbar, footer, contact-form, …) are stored on wire as
   * section/stack + props.kdbaEditorType — promote that onto `type` before stripping
   * so public NodeRenderer can dispatch correctly.
   */
  private stripEditorMetadata(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.stripEditorMetadata(item));
    }
    if (value && typeof value === 'object') {
      const source = value as Record<string, unknown>;
      const propsIn =
        source.props && typeof source.props === 'object'
          ? (source.props as Record<string, unknown>)
          : undefined;
      const editorType =
        typeof source.kdbaEditorType === 'string'
          ? source.kdbaEditorType
          : typeof propsIn?.kdbaEditorType === 'string'
            ? String(propsIn.kdbaEditorType)
            : undefined;

      const next: Record<string, unknown> = {};
      for (const [key, nested] of Object.entries(source)) {
        if (
          key === 'kdbaEditorType' ||
          key === 'draftDocument' ||
          key === 'draftConfig' ||
          key === 'documentRevision'
        ) {
          continue;
        }
        next[key] = this.stripEditorMetadata(nested);
      }

      if (editorType && typeof next.type === 'string') {
        next.type = editorType;
        if (next.props && typeof next.props === 'object') {
          const props = { ...(next.props as Record<string, unknown>) };
          delete props.kdbaEditorType;
          next.props = props;
        }
      }
      return next;
    }
    return value;
  }
}
