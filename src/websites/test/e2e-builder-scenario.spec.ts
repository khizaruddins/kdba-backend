import { ConflictException } from '@nestjs/common';
import { WebsitesService } from '../websites.service';
import { PublishingService } from '../../publishing/publishing.service';
import { TemplatesService } from '../../templates/templates.service';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';
import { DocumentMigrationService } from '../../documents/services/document-migration.service';
import { TreeOperationsService } from '../../documents/services/tree-operations.service';
import { PrismaService } from '../../prisma/prisma.service';
import { dentalClinicTemplate } from '../../templates/data/definitions/dental-clinic';
import { WebsiteDocumentV3 } from '../../documents/types/document.types';

describe('End-to-End Visual Website Builder Scenario (Requirement 66)', () => {
  let websitesService: WebsitesService;
  let publishingService: PublishingService;
  let templatesService: TemplatesService;
  let treeOps: TreeOperationsService;
  let validator: DocumentValidatorService;
  let migrationService: DocumentMigrationService;

  // In-memory mock database state
  let dbWebsites: Map<string, any>;
  let dbVersions: any[];

  beforeEach(() => {
    dbWebsites = new Map();
    dbVersions = [];

    const mockPrisma: any = {
      website: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.id) return dbWebsites.get(where.id) || null;
          if (where.tenantId_slug) {
            for (const site of dbWebsites.values()) {
              if (
                site.tenantId === where.tenantId_slug.tenantId &&
                site.slug === where.tenantId_slug.slug
              ) {
                return site;
              }
            }
          }
          return null;
        }),
        findFirst: jest.fn(async ({ where }) => {
          for (const site of dbWebsites.values()) {
            if (where.slug && site.slug === where.slug) return site;
          }
          return null;
        }),
        create: jest.fn(async ({ data }) => {
          const id = `site_${Date.now()}`;
          const record = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
          dbWebsites.set(id, record);
          return record;
        }),
        update: jest.fn(async ({ where, data }) => {
          const current = dbWebsites.get(where.id);
          if (!current) throw new Error('Not found');
          const updated = { ...current, ...data, updatedAt: new Date() };
          dbWebsites.set(where.id, updated);
          return updated;
        }),
      },
      websiteVersion: {
        create: jest.fn(async ({ data }) => {
          const version = { id: `ver_${Date.now()}`, ...data, createdAt: new Date() };
          dbVersions.push(version);
          return version;
        }),
        findMany: jest.fn(async () => dbVersions),
      },
      business: {
        findUnique: jest.fn(async () => ({
          id: 'biz_123',
          tenantId: 'tenant_test',
          name: 'Apex Dental Care',
          description: 'Premier cosmetic dental practice',
        })),
      },
      template: {
        findFirst: jest.fn(async () => ({
          id: dentalClinicTemplate.id,
          name: dentalClinicTemplate.name,
          slug: dentalClinicTemplate.slug,
          document: dentalClinicTemplate.document,
          category: dentalClinicTemplate.category,
        })),
      },
      tenant: {
        findUnique: jest.fn(async ({ where }) => {
          if (where.slug === 'apex-dental') {
            const site = Array.from(dbWebsites.values())[0];
            return {
              id: 'tenant_test',
              name: 'Apex Dental Tenant',
              slug: 'apex-dental',
              status: 'ACTIVE',
              websites: site ? [site] : [],
              businesses: [{ name: 'Apex Dental Care' }],
              products: [],
              pricingPlans: [],
            };
          }
          return null;
        }),
      },
      $transaction: jest.fn(async (cb) => cb(mockPrisma)),
    };

    validator = new DocumentValidatorService();
    migrationService = new DocumentMigrationService(validator);
    treeOps = new TreeOperationsService();
    templatesService = new TemplatesService(mockPrisma, validator, migrationService);
    websitesService = new WebsitesService(
      mockPrisma,
      validator,
      migrationService,
      treeOps,
      templatesService,
    );
    publishingService = new PublishingService(mockPrisma, migrationService, websitesService);
  });

  it('executes full E2E flow: Create -> Template -> Add Section/Container/Heading -> Edit -> Style -> Move -> Duplicate -> Delete -> Concurrency -> Publish -> Public Fetch', async () => {
    const tenantId = 'tenant_test';
    const businessId = 'biz_123';

    // 1. Create website from template
    const createdSite = await websitesService.create(tenantId, {
      templateId: 'dental-clinic',
      businessId,
      name: 'Apex Dental',
    });
    expect(createdSite.id).toBeDefined();
    expect(createdSite.schemaVersion).toBe('3.0');

    const websiteId = createdSite.id;

    // 2. Fetch canonical V3 draft document
    const initialDocResponse = await websitesService.getDocument(websiteId, tenantId);
    expect(initialDocResponse.schemaVersion).toBe('3.0');
    expect(initialDocResponse.revision).toBe(1);
    expect(initialDocResponse.documentHash).toBeDefined();

    let currentRev = initialDocResponse.revision;

    // 3. Add Section to Page
    const addSectionOp = {
      type: 'addNode' as const,
      pageId: 'page_home',
      parentId: 'root_page_home',
      node: {
        id: 'sec_features_custom',
        type: 'section' as const,
        name: 'Custom Features Section',
        props: { anchorId: 'features-custom' },
      },
    };

    const res1 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [addSectionOp],
    });
    expect(res1.revision).toBe(currentRev + 1);
    currentRev = res1.revision;

    // 4. Add Container into Section
    const addContainerOp = {
      type: 'addNode' as const,
      pageId: 'page_home',
      parentId: 'sec_features_custom',
      node: {
        id: 'container_features_custom',
        type: 'container' as const,
        props: { maxWidth: '1200px' },
      },
    };

    const res2 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [addContainerOp],
    });
    expect(res2.revision).toBe(currentRev + 1);
    currentRev = res2.revision;

    // 5. Add Heading into Container
    const addHeadingOp = {
      type: 'addNode' as const,
      pageId: 'page_home',
      parentId: 'container_features_custom',
      node: {
        id: 'heading_feature_title',
        type: 'heading' as const,
        props: { text: 'Revolutionary Technology', level: 2 },
        styles: { typography: { fontSize: '32px' } },
      },
    };

    const res3 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [addHeadingOp],
    });
    expect(res3.revision).toBe(currentRev + 1);
    currentRev = res3.revision;

    // 6. Edit Heading text (updateProps)
    const editHeadingOp = {
      type: 'updateProps' as const,
      pageId: 'page_home',
      nodeId: 'heading_feature_title',
      props: { text: 'Painless Laser Precision Dentistry' },
    };

    // 7. Change Font and Color (updateStyles)
    const styleHeadingOp = {
      type: 'updateStyles' as const,
      pageId: 'page_home',
      nodeId: 'heading_feature_title',
      styles: {
        typography: {
          fontFamily: 'Plus Jakarta Sans',
          color: '#0ea5e9',
        },
      },
    };

    const res4 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [editHeadingOp, styleHeadingOp],
    });
    expect(res4.revision).toBe(currentRev + 1);
    currentRev = res4.revision;

    // Verify mutations applied
    const headingNode = treeOps.findNode(res4.document.pages[0].root, 'heading_feature_title');
    expect(headingNode?.props?.text).toBe('Painless Laser Precision Dentistry');
    expect(headingNode?.styles?.typography?.color).toBe('#0ea5e9');
    expect(headingNode?.styles?.typography?.fontFamily).toBe('Plus Jakarta Sans');

    // 8. Move Heading to hero section container
    const heroSection = res4.document.pages[0].root.children?.find(
      (s) => s.children?.some((c) => c.type === 'container'),
    );
    const targetContainer = heroSection?.children?.find((c) => c.type === 'container');
    expect(targetContainer).toBeDefined();

    const moveOp = {
      type: 'moveNode' as const,
      pageId: 'page_home',
      nodeId: 'heading_feature_title',
      targetParentId: targetContainer!.id,
      targetIndex: 0,
    };

    const res5 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [moveOp],
    });
    expect(res5.revision).toBe(currentRev + 1);
    currentRev = res5.revision;

    // Verify moved
    const movedTarget = treeOps.findNode(res5.document.pages[0].root, targetContainer!.id);
    expect(movedTarget?.children?.[0].id).toBe('heading_feature_title');

    // 9. Duplicate Section
    const duplicateSecOp = {
      type: 'duplicateNode' as const,
      pageId: 'page_home',
      nodeId: 'sec_features_custom',
    };

    const res6 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [duplicateSecOp],
    });
    expect(res6.revision).toBe(currentRev + 1);
    currentRev = res6.revision;
    expect(res6.document.pages[0].root.children?.length).toBeGreaterThan(2);

    // 10. Delete Section (removeNode)
    const deleteOp = {
      type: 'removeNode' as const,
      pageId: 'page_home',
      nodeId: 'sec_features_custom',
    };

    const res7 = await websitesService.applyOperations(websiteId, tenantId, {
      baseRevision: currentRev,
      operations: [deleteOp],
    });
    expect(res7.revision).toBe(currentRev + 1);
    currentRev = res7.revision;

    expect(treeOps.findNode(res7.document.pages[0].root, 'sec_features_custom')).toBeNull();

    // 11. Concurrency Check: attempting to apply an operation with a stale baseRevision MUST throw 409
    const staleBaseRevision = 1;
    await expect(
      websitesService.applyOperations(websiteId, tenantId, {
        baseRevision: staleBaseRevision,
        operations: [
          {
            type: 'updateTheme',
            theme: { colors: { primary: '#000000' } as any },
          },
        ],
      }),
    ).rejects.toThrow(ConflictException);

    // 12. Transactional batching check: batch containing one invalid target rolls back completely
    await expect(
      websitesService.applyOperations(websiteId, tenantId, {
        baseRevision: currentRev,
        operations: [
          {
            type: 'updateProps',
            pageId: 'page_home',
            nodeId: 'heading_feature_title',
            props: { text: 'Should Not Persist' },
          },
          {
            type: 'removeNode',
            pageId: 'page_home',
            nodeId: 'completely_nonexistent_node',
          },
        ],
      }),
    ).rejects.toThrow();

    // Verify text did not change
    const docAfterFailedBatch = await websitesService.getDocument(websiteId, tenantId);
    const nodeAfterBatch = treeOps.findNode(
      docAfterFailedBatch.document.pages[0].root,
      'heading_feature_title',
    );
    expect(nodeAfterBatch?.props?.text).toBe('Painless Laser Precision Dentistry');

    // 13. Publish website
    const publishResult = await websitesService.publish(websiteId, tenantId);
    expect(publishResult.status).toBe('PUBLISHED');
    expect(publishResult.versionId).toBeDefined();
    expect(publishResult.documentRevision).toBeGreaterThan(currentRev);
    expect(dbVersions.length).toBeGreaterThanOrEqual(1);

    // 14. Retrieve public document
    // Set slug on the website record for lookup
    const currentRecord = dbWebsites.get(websiteId);
    currentRecord.slug = 'apex-dental';
    dbWebsites.set(websiteId, currentRecord);

    const publicData = (await publishingService.getPublicWebsite('apex-dental')) as any;
    expect(publicData).toBeDefined();
    expect(publicData.document).toBeDefined();
    expect(publicData.document.schemaVersion).toBe('3.0');
    expect(publicData.website.status).toBe('PUBLISHED');
  });
});
