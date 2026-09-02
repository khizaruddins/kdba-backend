import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentValidatorService } from '../documents/services/document-validator.service';
import { DocumentMigrationService } from '../documents/services/document-migration.service';
import { ALL_NICHE_TEMPLATES, TEMPLATES_BY_ID, TEMPLATES_BY_SLUG } from './data/definitions';
import { WebsiteDocumentV3 } from '../documents/types/document.types';

@Injectable()
export class TemplatesService {
  private readonly logger = new Logger(TemplatesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: DocumentValidatorService,
    private readonly migrationService: DocumentMigrationService,
  ) {}

  /**
   * Find all active templates with category & style filtering
   */
  async findAll(category?: string, style?: string) {
    const dbTemplates = await this.prisma.template.findMany({
      where: {
        isActive: true,
        ...(category && { category: category.toUpperCase() as any }),
      },
      orderBy: { createdAt: 'desc' },
    });

    if (dbTemplates.length > 0) {
      return dbTemplates.map((t) => ({
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        category: t.category,
        previewImage: t.previewImage,
        style: t.style,
        theme: t.theme,
        version: t.version,
        schemaVersion: t.schemaVersion,
      }));
    }

    // Fallback to in-memory definitions if DB has not been seeded yet
    return ALL_NICHE_TEMPLATES.filter((t) => {
      if (category && t.category.toLowerCase() !== category.toLowerCase()) return false;
      if (style && !t.style.includes(style.toLowerCase())) return false;
      return true;
    }).map((t) => ({
      id: t.id,
      name: t.name,
      slug: t.slug,
      description: t.description,
      category: t.category,
      previewImage: t.previewImage,
      style: t.style,
      theme: t.document.theme,
      version: t.version,
      schemaVersion: '3.0',
    }));
  }

  /**
   * Find single template with its canonical V3 WebsiteDocument by ID or slug
   */
  async findOne(idOrSlug: string) {
    const template = await this.prisma.template.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
    });

    if (template && template.document) {
      const v3Doc = this.migrationService.migrateWebsiteDocument(template.document);
      return {
        id: template.id,
        name: template.name,
        slug: template.slug,
        description: template.description,
        category: template.category,
        previewImage: template.previewImage,
        style: template.style,
        theme: v3Doc.theme,
        version: template.version,
        schemaVersion: '3.0',
        document: v3Doc,
      };
    }

    // Check definitions registry
    const def = TEMPLATES_BY_ID.get(idOrSlug) || TEMPLATES_BY_SLUG.get(idOrSlug);
    if (def) {
      const v3Doc = this.migrationService.migrateWebsiteDocument(def.document);
      return {
        id: def.id,
        name: def.name,
        slug: def.slug,
        description: def.description,
        category: def.category,
        previewImage: def.previewImage,
        style: def.style,
        theme: v3Doc.theme,
        version: def.version,
        schemaVersion: '3.0',
        document: v3Doc,
      };
    }

    throw new NotFoundException(`Template "${idOrSlug}" not found`);
  }

  /**
   * Clone a template directly into a new customer website.
   * Clones the canonical V3 WebsiteDocument into website.draftDocument & website.publishedDocument,
   * creates an initial WebsiteVersion snapshot, and populates business information.
   */
  async clone(
    templateIdOrSlug: string,
    tenantId: string,
    businessId: string,
    name: string,
  ) {
    // 1. Verify business belongs to tenant
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business || business.tenantId !== tenantId) {
      throw new ForbiddenException('Business profile not found or access denied');
    }

    // 2. Resolve template (returns V3 document)
    const template = await this.findOne(templateIdOrSlug);

    // 3. Deep-clone template document & personalize business metadata
    const clonedDoc: WebsiteDocumentV3 = JSON.parse(JSON.stringify(template.document));
    clonedDoc.site.name = name;
    clonedDoc.business.name = business.name;
    if (business.description) clonedDoc.business.description = business.description;
    if (business.category) clonedDoc.business.category = business.category;
    if (business.logoUrl) clonedDoc.business.logoUrl = business.logoUrl;
    if (business.email) clonedDoc.business.email = business.email;
    if (business.phone) clonedDoc.business.phone = business.phone;
    if (business.whatsapp) clonedDoc.business.whatsapp = business.whatsapp;
    if (business.address) clonedDoc.business.address = business.address;
    if (business.city) clonedDoc.business.city = business.city;
    if (business.state) clonedDoc.business.state = business.state;
    if (business.country) clonedDoc.business.country = business.country;
    if (business.zipCode) clonedDoc.business.zipCode = business.zipCode;

    // Validate normalized V3 document
    const normalizedDoc = this.validator.validateV3(clonedDoc);

    // 4. Generate unique slug
    const baseSlug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
    const uniqueSlug = await this.ensureUniqueSlug(tenantId, baseSlug);

    // 5. Ensure template row exists in DB for foreign key relation
    let dbTemplateId = template.id;
    const dbTemplate = await this.prisma.template.findFirst({
      where: { OR: [{ id: template.id }, { slug: template.slug }] },
    });

    if (!dbTemplate) {
      const created = await this.prisma.template.create({
        data: {
          id: template.id,
          name: template.name,
          slug: template.slug,
          description: template.description,
          category: template.category as any,
          previewImage: template.previewImage,
          style: template.style,
          theme: normalizedDoc.theme as any,
          document: normalizedDoc as any,
          schemaVersion: '3.0',
          version: '1.0',
        },
      });
      dbTemplateId = created.id;
    } else {
      dbTemplateId = dbTemplate.id;
    }

    // 6. Transactionally create website and initial V3 snapshot
    return this.prisma.website.create({
      data: {
        tenantId,
        businessId,
        templateId: dbTemplateId,
        name,
        slug: uniqueSlug,
        status: 'DRAFT',
        theme: normalizedDoc.theme as any,
        draftDocument: normalizedDoc as any,
        publishedDocument: normalizedDoc as any,
        schemaVersion: '3.0',
        documentRevision: 1,
        seoTitle: business.name,
        seoDescription: business.description || `Welcome to ${business.name}`,
        versions: {
          create: {
            document: normalizedDoc as any,
            schemaVersion: '3.0',
            revision: 1,
            reason: 'initial-clone',
          },
        },
      },
      include: {
        business: true,
        template: true,
      },
    });
  }

  /**
   * Seed all 20 niche templates into the database with V3 documents.
   */
  async seedTemplates(): Promise<{ seeded: number }> {
    let count = 0;
    for (const t of ALL_NICHE_TEMPLATES) {
      const v3Doc = this.migrationService.migrateWebsiteDocument(t.document);
      const validated = this.validator.validateV3(v3Doc);

      await this.prisma.template.upsert({
        where: { slug: t.slug },
        update: {
          name: t.name,
          description: t.description,
          category: t.category as any,
          previewImage: t.previewImage,
          style: t.style,
          theme: validated.theme as any,
          document: validated as any,
          schemaVersion: '3.0',
          version: t.version,
        },
        create: {
          id: t.id,
          name: t.name,
          slug: t.slug,
          description: t.description,
          category: t.category as any,
          previewImage: t.previewImage,
          style: t.style,
          theme: validated.theme as any,
          document: validated as any,
          schemaVersion: '3.0',
          version: t.version,
        },
      });
      count++;
    }
    this.logger.log(`Successfully seeded ${count} canonical V3 templates`);
    return { seeded: count };
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
