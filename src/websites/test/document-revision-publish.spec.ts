import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { WebsitesService } from '../websites.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';
import { DocumentMigrationService } from '../../documents/services/document-migration.service';
import { TreeOperationsService } from '../../documents/services/tree-operations.service';
import { TemplatesService } from '../../templates/templates.service';
import { PublishingService } from '../../publishing/publishing.service';
import { CmsService } from '../../cms/cms.service';
import { dentalClinicTemplate } from '../../templates/data/definitions/dental-clinic';

function codeOf(error: unknown): string {
  if (error instanceof ConflictException) {
    const response = error.getResponse() as { code?: string; error?: string };
    return response.code || response.error || error.message;
  }
  throw error;
}

describe('Website document revisions, publish, and authorization', () => {
  let websites: WebsitesService;
  let publishing: PublishingService;

  const tenantId = 'tenant_owner';
  const otherTenantId = 'tenant_intruder';
  const websiteId = 'site_demo';

  const websiteRecord = {
    id: websiteId,
    tenantId,
    name: 'KDBA Studio',
    slug: 'kdba-studio',
    status: 'DRAFT',
    schemaVersion: '3.0',
    documentRevision: 5,
    draftDocument: null,
    publishedDocument: null,
    publishedAt: null,
    updatedAt: new Date('2026-09-14T10:00:00.000Z'),
    seoTitle: null,
    seoDescription: null,
    favicon: null,
    pages: [],
    business: { name: 'KDBA Studio' },
    template: { theme: {} },
  };

  const prisma: Record<string, any> = {
    website: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    websiteVersion: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    tenant: {
      findUnique: jest.fn(),
    },
    $transaction: jest.fn(async (fn: (tx: any) => unknown) => fn(prisma)),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const validator = new DocumentValidatorService();
    const migration = new DocumentMigrationService(validator);
    const treeOps = new TreeOperationsService();
    const draft = migration.migrateWebsiteDocument(dentalClinicTemplate.document);

    prisma.website.findUnique.mockResolvedValue({
      ...websiteRecord,
      draftDocument: draft,
    });
    prisma.website.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...websiteRecord,
      ...data,
      updatedAt: new Date('2026-09-14T10:01:00.000Z'),
    }));
    prisma.websiteVersion.create.mockResolvedValue({ id: 'ver_1' });
    prisma.websiteVersion.findMany.mockResolvedValue([
      { id: 'ver_1', websiteId, schemaVersion: '3.0', revision: 5, reason: 'publish', createdAt: new Date() },
    ]);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WebsitesService,
        PublishingService,
        { provide: PrismaService, useValue: prisma },
        { provide: DocumentValidatorService, useValue: validator },
        { provide: DocumentMigrationService, useValue: migration },
        { provide: TreeOperationsService, useValue: treeOps },
        { provide: TemplatesService, useValue: {} },
        {
          provide: CmsService,
          useValue: { resolvePublishedForWebsite: jest.fn().mockResolvedValue({ collections: [] }) },
        },
      ],
    }).compile();

    websites = module.get(WebsitesService);
    publishing = module.get(PublishingService);
  });

  it('overwrites a stale editor revision on full document save', async () => {
    const validator = new DocumentValidatorService();
    const migration = new DocumentMigrationService(validator);
    const draft = migration.migrateWebsiteDocument(dentalClinicTemplate.document);

    const result = await websites.updateDocument(websiteId, tenantId, {
      document: draft as unknown as Record<string, unknown>,
      expectedRevision: 4,
    });

    expect(result.revision).toBe(6);
    expect(prisma.website.update).toHaveBeenCalled();
  });

  it('rejects stale revisions with DOCUMENT_REVISION_CONFLICT', async () => {
    try {
      await websites.applyOperations(websiteId, tenantId, {
        baseRevision: 4,
        operations: [
          {
            type: 'updateTheme',
            theme: { colors: { accent: '#111111' } },
          } as never,
        ],
      });
      throw new Error('expected revision conflict');
    } catch (error) {
      expect(codeOf(error)).toBe('DOCUMENT_REVISION_CONFLICT');
    }
  });

  it('publishes a validated draft snapshot', async () => {
    prisma.website.update.mockImplementation(async ({ data }: { data: Record<string, unknown> }) => ({
      ...websiteRecord,
      ...data,
      status: 'PUBLISHED',
      publishedAt: new Date('2026-09-14T10:02:00.000Z'),
    }));

    const published = await websites.publish(websiteId, tenantId);
    expect(published.status).toBe('PUBLISHED');
    expect(published.document.schemaVersion).toBe('3.0');
    expect(prisma.websiteVersion.create).toHaveBeenCalled();
  });

  it('forbids access to another tenant website', async () => {
    await expect(websites.getDocument(websiteId, otherTenantId)).rejects.toBeInstanceOf(
      ForbiddenException,
    );
  });

  it('does not return draft documents from the public website API', async () => {
    prisma.tenant.findUnique.mockResolvedValue({
      slug: 'kdba-studio',
      status: 'ACTIVE',
      businesses: [],
      websites: [],
      products: [],
      pricingPlans: [],
    });
    prisma.website.findFirst.mockResolvedValue(null);

    await expect(publishing.getPublicWebsite('kdba-studio')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('renders an unpublished draft when the public URL uses the website id', async () => {
    const validator = new DocumentValidatorService();
    const migration = new DocumentMigrationService(validator);
    const draft = migration.migrateWebsiteDocument(dentalClinicTemplate.document);

    prisma.tenant.findUnique.mockResolvedValue(null);
    prisma.website.findFirst.mockResolvedValue({
      ...websiteRecord,
      status: 'DRAFT',
      draftDocument: draft,
      publishedDocument: null,
      tenant: {
        name: 'KDBA Studio',
        slug: 'kdba-studio',
        status: 'ACTIVE',
        blockedReason: null,
        blockedAt: null,
        updatedAt: new Date(),
        products: [],
        pricingPlans: [],
      },
      pages: [],
    });

    const result = (await publishing.getPublicWebsite(websiteId)) as {
      document: { schemaVersion: string };
      website: { id: string };
    };
    expect(result.document.schemaVersion).toBe('3.0');
    expect(result.website.id).toBe(websiteId);
  });

  it('returns only published data and never draft section config', async () => {
    const validator = new DocumentValidatorService();
    const migration = new DocumentMigrationService(validator);
    const published = migration.migrateWebsiteDocument(dentalClinicTemplate.document);

    prisma.tenant.findUnique.mockResolvedValue({
      name: 'KDBA Studio',
      slug: 'kdba-studio',
      status: 'ACTIVE',
      businesses: [],
      websites: [
        {
          ...websiteRecord,
          status: 'PUBLISHED',
          publishedDocument: published,
          documentRevision: 99,
          pages: [
            {
              id: 'p1',
              title: 'Home',
              slug: '/',
              type: 'home',
              sections: [
                {
                  id: 's1',
                  type: 'hero',
                  title: 'Hero',
                  draftConfig: { secret: 'SECRET_DRAFT' },
                  publishedConfig: { headline: 'Live headline' },
                  sortOrder: 0,
                },
              ],
            },
          ],
        },
      ],
      products: [],
      pricingPlans: [],
    });

    const result = await publishing.getPublicWebsite('kdba-studio');
    expect(result).toEqual(
      expect.objectContaining({
        document: expect.objectContaining({ schemaVersion: '3.0' }),
        website: expect.objectContaining({
          pages: [
            expect.objectContaining({
              sections: [
                expect.objectContaining({
                  config: { headline: 'Live headline' },
                }),
              ],
            }),
          ],
        }),
      }),
    );
    expect(JSON.stringify(result)).not.toContain('SECRET_DRAFT');
    expect(JSON.stringify(result)).not.toContain('"documentRevision"');
  });
});
