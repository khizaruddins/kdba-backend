import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentValidatorService } from '../documents/services/document-validator.service';
import { DocumentMigrationService } from '../documents/services/document-migration.service';
import { TreeOperationsService } from '../documents/services/tree-operations.service';
import { TemplatesService } from '../templates/templates.service';
import {
  CreateWebsiteDto,
  UpdateWebsiteDto,
  SaveWebsiteDocumentDto,
  MutateWebsiteDocumentDto,
  ApplyDocumentOperationsDto,
  DuplicateWebsiteDto,
} from './dto';
import {
  WebsiteDocumentV3,
  DocumentOperationsResult,
} from '../documents/types/document.types';
import { getComponentManifest } from '../documents/contracts/component-registry';
import { DocumentOperationsPayloadSchema } from '../documents/schemas/v3/document-v3.schema';

@Injectable()
export class WebsitesService {
  private readonly logger = new Logger(WebsitesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly validator: DocumentValidatorService,
    private readonly migrationService: DocumentMigrationService,
    private readonly treeOperations: TreeOperationsService,
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
   * Get single website with relations.
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

    // Auto-migrate legacy or V2 website to V3 document if needed
    if (!website.draftDocument || (website.draftDocument as any).schemaVersion !== '3.0') {
      this.logger.log(`Migrating website ${website.id} to V3 WebsiteDocument on read`);
      const migratedDoc = website.draftDocument
        ? this.migrationService.migrateWebsiteDocument(website.draftDocument)
        : this.migrationService.migrateLegacyRelationalWebsite(
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
          schemaVersion: '3.0',
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
   * Get canonical V3 WebsiteDocument (Draft state) with revision metadata and hash.
   */
  async getDocument(id: string, tenantId: string) {
    const website = await this.findOne(id, tenantId);

    const document: WebsiteDocumentV3 = (
      (website.draftDocument as any)?.schemaVersion === '3.0'
        ? website.draftDocument
        : this.migrationService.migrateWebsiteDocument(
            website.draftDocument ||
              this.migrationService.migrateLegacyRelationalWebsite(
                website,
                website.pages,
                website.business,
                website.template,
              ),
          )
    ) as WebsiteDocumentV3;

    const documentHash = this.validator.computeDocumentHash(document);

    return {
      websiteId: website.id,
      name: website.name,
      slug: website.slug,
      status: website.status,
      schemaVersion: '3.0',
      revision: website.documentRevision || 1,
      documentHash,
      publishedAt: website.publishedAt,
      updatedAt: website.updatedAt,
      document,
    };
  }

  /**
   * Apply fine-grained document operations transactionally to draft document.
   * Handles optimistic concurrency checking, circular ancestry validation, child constraints,
   * schema re-validation, and atomic persistence.
   */
  async applyOperations(
    id: string,
    tenantId: string,
    dto: ApplyDocumentOperationsDto,
  ): Promise<DocumentOperationsResult> {
    const website = await this.findOne(id, tenantId);

    // Optimistic concurrency control
    if (
      dto.baseRevision !== undefined &&
      dto.baseRevision !== website.documentRevision
    ) {
      throw new ConflictException({
        statusCode: 409,
        error: 'DOCUMENT_REVISION_CONFLICT',
        message: 'Document revision conflict: document was modified in another session',
        currentRevision: website.documentRevision,
        baseRevision: dto.baseRevision,
      });
    }

    // Validate payload shape
    const parsedPayload = DocumentOperationsPayloadSchema.safeParse(dto);
    if (!parsedPayload.success) {
      throw new BadRequestException({
        message: 'Invalid document operations payload',
        errors: parsedPayload.error.issues.map((i) => ({
          path: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // Resolve current document
    const currentDoc: WebsiteDocumentV3 = (
      (website.draftDocument as any)?.schemaVersion === '3.0'
        ? website.draftDocument
        : this.migrationService.migrateWebsiteDocument(
            website.draftDocument ||
              this.migrationService.migrateLegacyRelationalWebsite(
                website,
                website.pages,
                website.business,
                website.template,
              ),
          )
    ) as WebsiteDocumentV3;

    // Apply operations in memory via TreeOperationsService
    const mutatedDoc = this.treeOperations.applyOperations(
      currentDoc,
      dto.operations,
    );

    // Validate and normalize resulting V3 document
    const validatedDoc = this.validator.validateV3(mutatedDoc);
    const documentHash = this.validator.computeDocumentHash(validatedDoc);
    const nextRevision = (website.documentRevision || 1) + 1;

    // Save to database
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
      revision: updated.documentRevision,
      schemaVersion: '3.0',
      documentHash,
      updatedAt: updated.updatedAt,
      document: validatedDoc,
      operationsApplied: dto.operations.length,
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
    const expected = dto.expectedRevision ?? dto.baseRevision;
    if (
      expected !== undefined &&
      expected !== website.documentRevision
    ) {
      throw new ConflictException({
        statusCode: 409,
        error: 'DOCUMENT_REVISION_CONFLICT',
        message: 'Concurrency conflict: document has been modified in another session',
        currentRevision: website.documentRevision,
        expectedRevision: expected,
      });
    }

    // Auto-migrate if saving a V2 doc, or strictly validate V3 doc
    const validatedDoc = this.migrationService.migrateWebsiteDocument(dto.document);
    const documentHash = this.validator.computeDocumentHash(validatedDoc);
    const nextRevision = (website.documentRevision || 1) + 1;

    const updated = await this.prisma.website.update({
      where: { id },
      data: {
        draftDocument: validatedDoc as any,
        theme: validatedDoc.theme as any,
        documentRevision: nextRevision,
        schemaVersion: '3.0',
        name: validatedDoc.site.name || website.name,
        seoTitle: validatedDoc.seo.metaTitle || website.seoTitle,
        seoDescription: validatedDoc.seo.metaDescription || website.seoDescription,
        favicon: validatedDoc.site.favicon || website.favicon,
      },
    });

    return {
      websiteId: updated.id,
      schemaVersion: '3.0',
      revision: updated.documentRevision,
      documentHash,
      updatedAt: updated.updatedAt,
      document: validatedDoc,
    };
  }

  /**
   * Apply legacy granular mutation (V2 backward compatibility).
   */
  async mutateDocument(
    id: string,
    tenantId: string,
    dto: MutateWebsiteDocumentDto,
  ) {
    const website = await this.findOne(id, tenantId);
    const currentDoc = (website.draftDocument as any) ||
      this.migrationService.migrateLegacyRelationalWebsite(
        website,
        website.pages,
        website.business,
        website.template,
      );

    const updatedDoc = this.validator.applyMutation(currentDoc, dto);
    const v3Doc = this.migrationService.migrateWebsiteDocument(updatedDoc);
    const nextRevision = (website.documentRevision || 1) + 1;
    const documentHash = this.validator.computeDocumentHash(v3Doc);

    const updated = await this.prisma.website.update({
      where: { id },
      data: {
        draftDocument: v3Doc as any,
        theme: v3Doc.theme as any,
        documentRevision: nextRevision,
        schemaVersion: '3.0',
      },
    });

    return {
      websiteId: updated.id,
      revision: updated.documentRevision,
      documentHash,
      updatedAt: updated.updatedAt,
      document: v3Doc,
    };
  }

  /**
   * Get rendered preview representation of draft document.
   */
  async getPreview(id: string, tenantId: string) {
    const website = await this.findOne(id, tenantId);
    const document = (
      (website.draftDocument as any)?.schemaVersion === '3.0'
        ? website.draftDocument
        : this.migrationService.migrateWebsiteDocument(
            website.draftDocument ||
              this.migrationService.migrateLegacyRelationalWebsite(
                website,
                website.pages,
                website.business,
                website.template,
              ),
          )
    ) as WebsiteDocumentV3;

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
   * 1. Validates and normalizes draft document to V3.
   * 2. Sanitizes against XSS and unsafe protocols.
   * 3. Creates snapshot in WebsiteVersion table (reason: 'publish').
   * 4. Copies draftDocument -> publishedDocument.
   * 5. Sets status = 'PUBLISHED', publishedAt = now().
   */
  async publish(websiteId: string, tenantId: string) {
    const website = await this.findOne(websiteId, tenantId);

    const draftDoc = (
      (website.draftDocument as any)?.schemaVersion === '3.0'
        ? website.draftDocument
        : this.migrationService.migrateWebsiteDocument(
            website.draftDocument ||
              this.migrationService.migrateLegacyRelationalWebsite(
                website,
                website.pages,
                website.business,
                website.template,
              ),
          )
    ) as WebsiteDocumentV3;

    // Strict V3 schema validation & normalization
    const validatedDoc = this.validator.validateV3(draftDoc);
    const documentHash = this.validator.computeDocumentHash(validatedDoc);
    const nextRevision = (website.documentRevision || 1) + 1;

    return this.prisma.$transaction(async (tx) => {
      // 1. Create immutable version snapshot
      const version = await tx.websiteVersion.create({
        data: {
          websiteId: website.id,
          document: validatedDoc as any,
          schemaVersion: '3.0',
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
          schemaVersion: '3.0',
        },
        include: {
          business: true,
          template: true,
        },
      });

      return {
        id: published.id,
        name: published.name,
        slug: published.slug,
        status: published.status,
        publishedAt: published.publishedAt,
        documentRevision: published.documentRevision,
        documentHash,
        versionId: version.id,
        document: validatedDoc,
      };
    }, {
      maxWait: 15000,
      timeout: 30000,
    });
  }

  /**
   * Duplicate an entire website: clones website metadata and creates a complete
   * replica of the V3 document with fresh node IDs.
   */
  async duplicateWebsite(
    websiteId: string,
    tenantId: string,
    dto: DuplicateWebsiteDto,
  ) {
    const sourceWebsite = await this.findOne(websiteId, tenantId);

    const sourceDoc: WebsiteDocumentV3 = (
      (sourceWebsite.draftDocument as any)?.schemaVersion === '3.0'
        ? sourceWebsite.draftDocument
        : this.migrationService.migrateWebsiteDocument(
            sourceWebsite.draftDocument ||
              this.migrationService.migrateLegacyRelationalWebsite(
                sourceWebsite,
                sourceWebsite.pages,
                sourceWebsite.business,
                sourceWebsite.template,
              ),
          )
    ) as WebsiteDocumentV3;

    // Deep clone document & assign fresh node IDs
    const clonedDoc: WebsiteDocumentV3 = JSON.parse(JSON.stringify(sourceDoc));
    const newName = dto.name || `Copy of ${sourceWebsite.name}`;
    clonedDoc.site.name = newName;

    clonedDoc.pages.forEach((page) => {
      page.id = `page_${crypto.randomBytes(3).toString('hex')}`;
      page.root = this.treeOperations.cloneSubtreeWithNewIds(page.root);
    });

    const validatedDoc = this.validator.validateV3(clonedDoc);

    const baseSlug = newName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 60);
    const uniqueSlug = await this.ensureUniqueSlug(tenantId, baseSlug);

    return this.prisma.website.create({
      data: {
        tenantId,
        businessId: dto.businessId || sourceWebsite.businessId,
        templateId: sourceWebsite.templateId,
        name: newName,
        slug: uniqueSlug,
        status: 'DRAFT',
        theme: validatedDoc.theme as any,
        draftDocument: validatedDoc as any,
        publishedDocument: Prisma.JsonNull,
        schemaVersion: '3.0',
        documentRevision: 1,
        seoTitle: sourceWebsite.seoTitle,
        seoDescription: sourceWebsite.seoDescription,
        versions: {
          create: {
            document: validatedDoc as any,
            schemaVersion: '3.0',
            revision: 1,
            reason: `cloned-from-${sourceWebsite.id}`,
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
    const draftDoc = (
      (website.draftDocument as any)?.schemaVersion === '3.0'
        ? website.draftDocument
        : this.migrationService.migrateWebsiteDocument(
            website.draftDocument ||
              this.migrationService.migrateLegacyRelationalWebsite(
                website,
                website.pages,
                website.business,
                website.template,
              ),
          )
    ) as WebsiteDocumentV3;

    const validatedDoc = this.validator.validateV3(draftDoc);

    return this.prisma.websiteVersion.create({
      data: {
        websiteId: website.id,
        document: validatedDoc as any,
        schemaVersion: '3.0',
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

    // Migrate version snapshot to V3 if it was recorded in V2
    const restoredDoc = this.migrationService.migrateWebsiteDocument(versionRecord.document);
    const nextRevision = (website.documentRevision || 1) + 1;
    const documentHash = this.validator.computeDocumentHash(restoredDoc);

    return this.prisma.$transaction(async (tx) => {
      // Record restore event as a new version
      await tx.websiteVersion.create({
        data: {
          websiteId: website.id,
          document: restoredDoc as any,
          schemaVersion: '3.0',
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
          schemaVersion: '3.0',
        },
      });

      return {
        websiteId: updated.id,
        revision: updated.documentRevision,
        documentHash,
        restoredFromVersionId: versionId,
        document: restoredDoc,
      };
    });
  }

  /**
   * Expose Component Registry manifest for visual editor tools and AI builders.
   */
  getComponentRegistry() {
    return getComponentManifest();
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

  private async ensureUniqueSlug(tenantId: string, slug: string): Promise<string> {
    const existing = await this.prisma.website.findUnique({
      where: { tenantId_slug: { tenantId, slug } },
    });
    if (!existing) return slug;
    const suffix = crypto.randomBytes(3).toString('hex');
    return `${slug}-${suffix}`;
  }
}
