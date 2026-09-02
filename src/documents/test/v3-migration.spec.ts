import { DocumentValidatorService } from '../services/document-validator.service';
import { DocumentMigrationService } from '../services/document-migration.service';
import { dentalClinicTemplate } from '../../templates/data/definitions/dental-clinic';
import { WebsiteDocument } from '../types/document.types';

describe('V3 Document Migration Suite (Lossless V1/V2 -> V3)', () => {
  let validator: DocumentValidatorService;
  let migrationService: DocumentMigrationService;

  beforeAll(() => {
    validator = new DocumentValidatorService();
    migrationService = new DocumentMigrationService(validator);
  });

  it('should migrate a complex V2 template (Dental Clinic) into a fully structured V3 tree', () => {
    const v2Doc = dentalClinicTemplate.document as unknown as WebsiteDocument;
    const v3Doc = migrationService.migrateWebsiteDocument(v2Doc);

    expect(v3Doc).toBeDefined();
    expect(v3Doc.schemaVersion).toBe('3.0');
    expect(v3Doc.pages.length).toBe(1);

    const homePage = v3Doc.pages[0];
    expect(homePage.root.type).toBe('page-root');
    expect(homePage.root.children?.length).toBeGreaterThan(0);

    // Verify sections are preserved as V3 section nodes
    const sections = homePage.root.children || [];
    const heroSection = sections.find(
      (s) => s.props?.sectionType === 'hero' || s.name?.includes('HERO'),
    );
    expect(heroSection).toBeDefined();

    // Verify hero section contains container and extracted headline, paragraph, and buttons
    const heroContainer = heroSection?.children?.[0];
    expect(heroContainer).toBeDefined();
    expect(heroContainer?.type).toBe('container');

    const heroHeading = heroContainer?.children?.find((c) => c.type === 'heading');
    expect(heroHeading).toBeDefined();
    expect(heroHeading?.props?.text).toContain('Exceptional Dental Care');

    const heroCta = heroContainer?.children?.find((c) => c.type === 'button');
    expect(heroCta).toBeDefined();
    expect(heroCta?.props?.label).toContain('Schedule');

    // Verify Theme was upgraded to V3 token system
    expect(v3Doc.theme.colors.primary).toBe(v2Doc.theme.primaryColor);
    expect(v3Doc.theme.typography.h1.fontFamily).toBe(v2Doc.theme.headingFont);
    expect(v3Doc.theme.breakpoints.desktop).toBe(1200);

    // Verify Business info was preserved intact
    expect(v3Doc.business.name).toBe(v2Doc.business.name);
    expect(v3Doc.business.email).toBe(v2Doc.business.email);
  });

  it('should migrate a legacy V1 document directly to V3', () => {
    const legacyV1Doc = {
      schemaVersion: '1.0',
      site: { name: 'Dr. Smith Practice' },
      theme: {
        primaryColor: '#0c4a6e',
        fontHeading: 'Plus Jakarta Sans',
        fontBody: 'Inter',
      },
      business: {
        name: 'Dr. Smith Practice LLC',
        email: 'smith@example.com',
      },
      pages: [
        {
          id: 'page_1',
          title: 'Home',
          slug: '/',
          type: 'home',
          sections: [
            {
              id: 's_1',
              type: 'hero',
              variant: 'default',
              props: {
                headline: 'Premier Wellness Clinic',
                subheadline: 'Holistic healthcare for your entire family.',
              },
            },
          ],
        },
      ],
    };

    const v3Doc = migrationService.migrateWebsiteDocument(legacyV1Doc);

    expect(v3Doc.schemaVersion).toBe('3.0');
    expect(v3Doc.site.name).toBe('Dr. Smith Practice');
    expect(v3Doc.business.name).toBe('Dr. Smith Practice LLC');
    expect(v3Doc.pages[0].root.type).toBe('page-root');

    const heading = v3Doc.pages[0].root.children?.[0].children?.[0].children?.find(
      (c) => c.type === 'heading',
    );
    expect(heading?.props?.text).toBe('Premier Wellness Clinic');
  });
});
