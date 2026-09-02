import { DocumentMigrationService } from '../services/document-migration.service';
import { DocumentValidatorService } from '../services/document-validator.service';

describe('DocumentMigrationService (V1 Relational -> V2 WebsiteDocument)', () => {
  let migrationService: DocumentMigrationService;
  let validator: DocumentValidatorService;

  beforeEach(() => {
    validator = new DocumentValidatorService();
    migrationService = new DocumentMigrationService(validator);
  });

  it('should migrate a legacy relational website structure to valid canonical WebsiteDocument', () => {
    const legacyWebsite = {
      id: 'site_legacy_101',
      name: 'Legacy Artisan Coffee',
      slug: 'legacy-artisan-coffee',
      status: 'PUBLISHED',
      theme: {
        primaryColor: '#2b1e16',
        secondaryColor: '#ffffff',
        accentColor: '#c27803',
        headingFont: 'Outfit',
        bodyFont: 'Inter',
      },
      favicon: 'https://example.com/favicon.ico',
      seoTitle: 'Legacy Artisan Coffee Brooklyn',
      seoDescription: 'Hand roasted coffee in Brooklyn.',
      publishedAt: new Date(),
    };

    const legacyPages = [
      {
        id: 'page_1',
        title: 'Home',
        slug: '/',
        type: 'HOME',
        sortOrder: 0,
        isActive: true,
        sections: [
          {
            id: 'sec_1',
            type: 'NAVBAR',
            sortOrder: 0,
            enabled: true,
            draftConfig: { brandName: 'Legacy Coffee' },
            publishedConfig: { brandName: 'Legacy Coffee' },
          },
          {
            id: 'sec_2',
            type: 'HERO',
            sortOrder: 1,
            enabled: true,
            draftConfig: {
              headline: 'Artisan Brews in Williamsburg',
              subheadline: 'Ethically sourced single-origin coffee.',
            },
            publishedConfig: {
              headline: 'Artisan Brews in Williamsburg',
              subheadline: 'Ethically sourced single-origin coffee.',
            },
          },
        ],
      },
    ];

    const legacyBusiness = {
      name: 'Legacy Artisan Coffee LLC',
      description: 'Specialty coffee roastery in Brooklyn NY.',
      category: 'Cafe',
      email: 'contact@legacycoffee.com',
      phone: '+1 (718) 555-0199',
    };

    const v2Doc = migrationService.migrateLegacyRelationalWebsite(
      legacyWebsite,
      legacyPages,
      legacyBusiness,
    );

    expect(v2Doc).toBeDefined();
    expect(v2Doc.schemaVersion).toBe('2.0');
    expect(v2Doc.site.name).toBe('Legacy Artisan Coffee');
    expect(v2Doc.business.name).toBe('Legacy Artisan Coffee LLC');
    expect(v2Doc.pages.length).toBe(1);
    expect(v2Doc.pages[0].sections.length).toBe(2);
    expect(v2Doc.pages[0].sections[0].type).toBe('navbar');
    expect(v2Doc.pages[0].sections[1].type).toBe('hero');
    expect(v2Doc.pages[0].sections[1].props.headline).toBe('Artisan Brews in Williamsburg');
  });
});
