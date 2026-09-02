import { TemplateValidatorService } from '../services/template-validator.service';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';
import { ALL_NICHE_TEMPLATES } from '../data/definitions';

describe('Template Validation Suite (20 Niche Templates)', () => {
  let templateValidator: TemplateValidatorService;

  beforeAll(() => {
    const docValidator = new DocumentValidatorService();
    templateValidator = new TemplateValidatorService(docValidator);
  });

  it('should have exactly 20 canonical niche templates defined', () => {
    expect(ALL_NICHE_TEMPLATES.length).toBe(20);
  });

  it('should validate that ALL 20 templates strictly conform to V2 schema with 0 errors', () => {
    const report = templateValidator.validateAll();

    if (report.invalidCount > 0) {
      console.error(
        'Invalid Templates Found:',
        report.results.filter((r) => !r.isValid),
      );
    }

    expect(report.total).toBe(20);
    expect(report.validCount).toBe(20);
    expect(report.invalidCount).toBe(0);
  });

  it.each(ALL_NICHE_TEMPLATES.map((t) => [t.name, t.slug, t]))(
    'Template [%s (%s)] must contain valid pages, header nav, and safe styling',
    (name, slug, template) => {
      const doc = template.document;
      expect(doc.schemaVersion).toBe('2.0');
      expect(doc.pages.length).toBeGreaterThanOrEqual(1);
      expect(doc.navigation.header.length).toBeGreaterThanOrEqual(1);
      expect(doc.theme.primaryColor).toBeDefined();
      expect(doc.theme.headingFont).toBeDefined();
      expect(doc.theme.bodyFont).toBeDefined();
      expect(doc.business.name).toBeDefined();
    },
  );
});
