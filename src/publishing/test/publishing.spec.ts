import { Test, TestingModule } from '@nestjs/testing';
import { PublishingService } from '../publishing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentMigrationService } from '../../documents/services/document-migration.service';
import { WebsitesService } from '../../websites/websites.service';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';
import { CmsService } from '../../cms/cms.service';

describe('PublishingService', () => {
  let service: PublishingService;

  const mockPrismaService = {
    tenant: {
      findUnique: jest.fn(),
    },
    website: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    lead: {
      create: jest.fn(),
    },
  };

  const mockWebsitesService = {
    publish: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const validator = new DocumentValidatorService();
    const migrationService = new DocumentMigrationService(validator);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublishingService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: DocumentMigrationService, useValue: migrationService },
        { provide: WebsitesService, useValue: mockWebsitesService },
        { provide: CmsService, useValue: { resolvePublishedForWebsite: jest.fn().mockResolvedValue({ collections: [] }) } },
      ],
    }).compile();

    service = module.get<PublishingService>(PublishingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('promotes kdbaEditorType onto node.type when stripping public metadata', () => {
    const strip = (
      service as unknown as {
        stripEditorMetadata: (value: unknown) => unknown;
      }
    ).stripEditorMetadata.bind(service);

    const result = strip({
      schemaVersion: '3.0',
      global: {
        headerNode: {
          id: 'global_header',
          type: 'section',
          props: {
            kdbaEditorType: 'navbar',
            brandName: 'Studio',
            sticky: true,
            useSiteNavigation: true,
          },
          children: [],
        },
      },
      draftDocument: { should: 'drop' },
    }) as Record<string, unknown>;

    expect(result.draftDocument).toBeUndefined();
    const header = (result.global as Record<string, unknown>).headerNode as Record<string, unknown>;
    expect(header.type).toBe('navbar');
    expect((header.props as Record<string, unknown>).kdbaEditorType).toBeUndefined();
    expect((header.props as Record<string, unknown>).brandName).toBe('Studio');
  });
});
