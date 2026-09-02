import { Test, TestingModule } from '@nestjs/testing';
import { PublishingService } from '../publishing.service';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentMigrationService } from '../../documents/services/document-migration.service';
import { WebsitesService } from '../../websites/websites.service';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';

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
      ],
    }).compile();

    service = module.get<PublishingService>(PublishingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
