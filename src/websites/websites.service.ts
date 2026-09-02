import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentValidatorService } from '../documents/services/document-validator.service';
import { DocumentMigrationService } from '../documents/services/document-migration.service';
import { TemplatesService } from '../templates/templates.service';
import {
  CreateWebsiteDto,
  UpdateWebsiteDto,
  SaveWebsiteDocumentDto,
  MutateWebsiteDocumentDto,
} from './dto';
import { WebsiteDocument } from '../documents/types/document.types';

@Injectable()
export class WebsitesService {
  private readonly logger = new Logger(WebsitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: DocumentValidatorService,
    private readonly migrationService: DocumentMigrationService,
    private readonly templatesService: TemplatesService,
  ) {}

  /**
   * Create a new website from a template.
   */
  async create(tenantId: string, dto: CreateWebsiteDto) {
    return this.templatesService.clone(
      dto.templateId,
      tenantId,
      dto.businessId,
      dto.name,
    );
  }

  /**
   * List all websites for tenant.
   */
  async findAll(tenantId: string) {
    return this.prisma.website.findMany({
      where: { tenantId },
      include: {
        business: {
          select: { id: true, name: true, slug: true, logoUrl: true },
        },
        template: {
          select: { id: true, name: true, slug: true, category: true, previewImage: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get single website with draftDocument and relations.
   */
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

    // Auto-migrate legacy website to V2 document if draftDocument is missing
    if (!website.draftDocument) {
      this.logger.log(`Migrating legacy website ${website.id} to V2 WebsiteDocument on read`);
      const migratedDoc = this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      );

      await this.prisma.website.update({
        where: { id: website.id },
        data: {
          draftDocument: migratedDoc as any,
          publishedDocument: website.status === 'PUBLISHED' ? (migratedDoc as any) : null,
          schemaVersion: '2.0',
        },
      });

      return {
        ...website,
        draftDocument: migratedDoc,
        publishedDocument: website.status === 'PUBLISHED' ? migratedDoc : null,
      };
    }

    return website;
  }

  /**
   * Get canonical WebsiteDocument (Draft state) with revision metadata.
   */
  async getDocument(id: string, tenantId: string) {
    const website = await this.findOne(id, tenantId);

    const document = (website.draftDocument ||
      this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      )) as WebsiteDocument;

    return {
      websiteId: website.id,
      name: website.name,
      slug: website.slug,
      status: website.status,
      schemaVersion: website.schemaVersion || '2.0',
      revision: website.documentRevision || 1,
      publishedAt: website.publishedAt,
      updatedAt: website.updatedAt,
      document,
    };
  }

  /**
   * Save full WebsiteDocument draft with schema validation & optimistic concurrency check.
   */
  async updateDocument(
    id: string,
    tenantId: string,
    dto: SaveWebsiteDocumentDto,
  ) {
    const website = await this.findOne(id, tenantId);

    // Optimistic concurrency control
    if (
      dto.expectedRevision !== undefined &&
      dto.expectedRevision !== website.documentRevision
    ) {
      throw new ConflictException({
        message: 'Concurrency conflict: document has been modified in another session',
        currentRevision: website.documentRevision,
        expectedRevision: dto.expectedRevision,
      });
    }

    // Strict schema validation & normalization
    const validatedDoc = this.validator.validate(dto.document);
    const nextRevision = (website.documentRevision || 1) + 1;

    const updated = await this.prisma.website.update({
      where: { id },
      data: {
        draftDocument: validatedDoc as any,
        theme: validatedDoc.theme as any,
        documentRevision: nextRevision,
        name: validatedDoc.site.name || website.name,
        seoTitle: validatedDoc.seo.metaTitle || website.seoTitle,
        seoDescription: validatedDoc.seo.metaDescription || website.seoDescription,
        favicon: validatedDoc.site.favicon || website.favicon,
      },
    });

    return {
      websiteId: updated.id,
      schemaVersion: updated.schemaVersion,
      revision: updated.documentRevision,
      updatedAt: updated.updatedAt,
      document: validatedDoc,
    };
  }

  /**
   * Apply granular mutation to draft document (e.g. update section props, theme, reorder).
   */
  async mutateDocument(
    id: string,
    tenantId: string,
    dto: MutateWebsiteDocumentDto,
  ) {
    const website = await this.findOne(id, tenantId);
    const currentDoc = (website.draftDocument as unknown as WebsiteDocument) ||
      this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      );

    // Apply mutation & re-validate
    const updatedDoc = this.validator.applyMutation(currentDoc, dto);
    const nextRevision = (website.documentRevision || 1) + 1;

    const updated = await this.prisma.website.update({
      where: { id },
      data: {
        draftDocument: updatedDoc as any,
        theme: updatedDoc.theme as any,
        documentRevision: nextRevision,
      },
    });

    return {
      websiteId: updated.id,
      revision: updated.documentRevision,
      updatedAt: updated.updatedAt,
      document: updatedDoc,
    };
  }

  /**
   * Get rendered preview representation of draft document.
   */
  async getPreview(id: string, tenantId: string) {
    const website = await this.findOne(id, tenantId);
    const document = (website.draftDocument ||
      this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      )) as WebsiteDocument;

    return {
      preview: true,
      website: {
        id: website.id,
        name: website.name,
        slug: website.slug,
        status: website.status,
        revision: website.documentRevision,
      },
      document,
    };
  }

  /**
   * Transactionally publish a website:
   * 1. Validates draft document.
   * 2. Normalizes document.
   * 3. Creates snapshot in WebsiteVersion table (reason: 'publish').
   * 4. Copies draftDocument -> publishedDocument.
   * 5. Sets status = 'PUBLISHED', publishedAt = now().
   * 6. Syncs relational pages/sections for backward compatibility.
   */
  async publish(websiteId: string, tenantId: string) {
    const website = await this.findOne(websiteId, tenantId);

    const draftDoc = (website.draftDocument ||
      this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      )) as WebsiteDocument;

    // Validate before publish
    const validatedDoc = this.validator.validate(draftDoc);
    const nextRevision = (website.documentRevision || 1) + 1;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create version snapshot
      const version = await tx.websiteVersion.create({
        data: {
          websiteId: website.id,
          document: validatedDoc as any,
          schemaVersion: '2.0',
          revision: nextRevision,
          reason: 'publish',
        },
      });

      // 2. Update website record
      const published = await tx.website.update({
        where: { id: websiteId },
        data: {
          draftDocument: validatedDoc as any,
          publishedDocument: validatedDoc as any,
          status: 'PUBLISHED',
          publishedAt: new Date(),
          documentRevision: nextRevision,
        },
        include: {
          business: true,
          template: true,
        },
      });

      // 3. Sync relational section configs for backward compatibility in parallel
      const sectionUpdates = (website.pages || []).flatMap((p) =>
        (p.sections || []).map((s) =>
          tx.section.update({
            where: { id: s.id },
            data: {
              publishedConfig: (s.draftConfig as object) || {},
            },
          }),
        ),
      );

      if (sectionUpdates.length > 0) {
        await Promise.all(sectionUpdates);
      }

      return {
        id: published.id,
        name: published.name,
        slug: published.slug,
        status: published.status,
        publishedAt: published.publishedAt,
        documentRevision: published.documentRevision,
        versionId: version.id,
        document: validatedDoc,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  /**
   * List historical version snapshots.
   */
  async getVersions(websiteId: string, tenantId: string) {
    await this.findOne(websiteId, tenantId);

    return this.prisma.websiteVersion.findMany({
      where: { websiteId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        websiteId: true,
        schemaVersion: true,
        revision: true,
        reason: true,
        createdBy: true,
        createdAt: true,
      },
    });
  }

  /**
   * Create a named manual version snapshot.
   */
  async createVersionSnapshot(
    websiteId: string,
    tenantId: string,
    reason = 'manual-save',
    userId?: string,
  ) {
    const website = await this.findOne(websiteId, tenantId);
    const draftDoc = (website.draftDocument ||
      this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      )) as WebsiteDocument;

    const validatedDoc = this.validator.validate(draftDoc);

    return this.prisma.websiteVersion.create({
      data: {
        websiteId: website.id,
        document: validatedDoc as any,
        schemaVersion: '2.0',
        revision: website.documentRevision,
        reason,
        createdBy: userId,
      },
    });
  }

  /**
   * Restore a historical version snapshot to draft.
   */
  async restoreVersion(
    websiteId: string,
    tenantId: string,
    versionId: string,
  ) {
    const website = await this.findOne(websiteId, tenantId);

    const versionRecord = await this.prisma.websiteVersion.findUnique({
      where: { id: versionId },
    });

    if (!versionRecord || versionRecord.websiteId !== website.id) {
      throw new NotFoundException('Version snapshot not found');
    }

    const restoredDoc = this.validator.validate(versionRecord.document);
    const nextRevision = (website.documentRevision || 1) + 1;

    return this.prisma.$transaction(async (tx) => {
      // Record the restore action as a new snapshot
      await tx.websiteVersion.create({
        data: {
          websiteId: website.id,
          document: restoredDoc as any,
          schemaVersion: '2.0',
          revision: nextRevision,
          reason: `restore-from-${versionRecord.revision}`,
        },
      });

      // Update draft document
      const updated = await tx.website.update({
        where: { id: websiteId },
        data: {
          draftDocument: restoredDoc as any,
          theme: restoredDoc.theme as any,
          documentRevision: nextRevision,
        },
      });

      return {
        websiteId: updated.id,
        revision: updated.documentRevision,
        restoredFromVersionId: versionId,
        document: restoredDoc,
      };
    });
  }

  /**
   * Update top-level website settings (legacy API support).
   */
  async update(id: string, tenantId: string, dto: UpdateWebsiteDto) {
    await this.findOne(id, tenantId);

    return this.prisma.website.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.theme !== undefined && {
          theme: dto.theme as Prisma.InputJsonValue,
        }),
        ...(dto.favicon !== undefined && { favicon: dto.favicon }),
        ...(dto.seoTitle !== undefined && { seoTitle: dto.seoTitle }),
        ...(dto.seoDescription !== undefined && {
          seoDescription: dto.seoDescription,
        }),
      },
      include: {
        business: true,
        template: true,
      },
    });
  }

  /**
   * Delete website.
   */
  async delete(id: string, tenantId: string) {
    await this.findOne(id, tenantId);

    return this.prisma.website.delete({
      where: { id },
    });
  }
}
