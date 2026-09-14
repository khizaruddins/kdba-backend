import { DocumentException } from '../errors/document.errors';
import { createDemoWebsiteDocument } from '../fixtures/demo-website-document';
import { DocumentMigrationService } from '../services/document-migration.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { V3DocumentService } from '../services/v3-document.service';

function codeOf(error: unknown): string {
  if (error instanceof DocumentException) {
    return (error.getResponse() as { code: string }).code;
  }
  throw error;
}

describe('V3DocumentService', () => {
  let v3: V3DocumentService;
  let v2: DocumentValidatorService;
  let migration: DocumentMigrationService;

  beforeEach(() => {
    v2 = new DocumentValidatorService();
    migration = new DocumentMigrationService(v2);
    v3 = new V3DocumentService(v2, migration);
  });

  it('validates and normalizes the representative demo document', () => {
    const result = v3.validate(createDemoWebsiteDocument());
    expect(result.schemaVersion).toBe('3.0');
    expect(result.pages[0].root.type).toBe('page-root');
    expect(result.pages[0].root.children.map((child) => child.props.name)).toEqual([
      'Navbar',
      'Hero',
      'Features',
      'CTA',
      'Footer',
    ]);
    expect(result.theme.colors.primary).toBe('#5B5FEF');
    expect(result.theme.primaryColor).toBe('#5B5FEF');
  });

  it('maps unknown node types to supported fallbacks', () => {
    const invalid = createDemoWebsiteDocument();
    invalid.pages[0].root.children[0].type = 'carousel' as never;

    const result = v3.validate(invalid);
    expect(result.pages[0].root.children[0].type).toBe('section');
    expect(result.pages[0].root.children[0].props.kdbaEditorType).toBe('carousel');
  });

  it('coerces editor CSS strings and nested theme fonts', () => {
    const draft = createDemoWebsiteDocument() as unknown as Record<string, unknown>;
    const theme = draft.theme as Record<string, unknown>;
    theme.typography = {
      h1: { fontFamily: 'Playfair Display', fontSize: '56px', fontWeight: 700, lineHeight: 1.1 },
      body: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: 1.6 },
    };
    delete theme.headingFont;
    delete theme.bodyFont;

    const hero = (draft.pages as any)[0].root.children[1];
    hero.styles = {
      spacing: { padding: { top: '80px', right: '24px', bottom: '80px', left: '24px' } },
    };

    const result = v3.validate(draft);
    expect(result.theme.typography.headingFont).toBe('Playfair Display');
    expect(result.theme.typography.bodyFont).toBe('Inter');
    expect(result.pages[0].root.children[1].styles.spacing?.padding?.top).toBe(80);
  });

  it('rejects missing node ids', () => {
    const invalid = createDemoWebsiteDocument();
    invalid.pages[0].root.children[0].id = '';

    expect(() => v3.validate(invalid)).toThrow(DocumentException);
  });

  it('rejects invalid nesting: heading inside page-root', () => {
    const invalid = createDemoWebsiteDocument();
    invalid.pages[0].root.children.push({
      id: 'heading_orphan',
      type: 'heading',
      props: { text: 'Nope' },
      styles: {},
      responsive: {},
      children: [],
    });

    try {
      v3.validate(invalid);
      throw new Error('expected invalid parent');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_PARENT');
    }
  });

  it('rejects content nodes with children', () => {
    const invalid = createDemoWebsiteDocument();
    const heading = invalid.pages[0].root.children[1].children[0].children[0].children[0].children[0];
    heading.children = [
      {
        id: 'nested_button',
        type: 'button',
        props: { label: 'x', href: '/' },
        styles: {},
        responsive: {},
        children: [],
      },
    ];

    try {
      v3.validate(invalid);
      throw new Error('expected invalid node');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_NODE');
    }
  });

  it('rejects duplicate ids', () => {
    const invalid = createDemoWebsiteDocument();
    invalid.pages[0].root.children[1].id = 'section_navbar';

    try {
      v3.validate(invalid);
      throw new Error('expected duplicate id');
    } catch (error) {
      expect(codeOf(error)).toBe('INVALID_NODE');
    }
  });

  it('rejects oversized documents', () => {
    const huge = createDemoWebsiteDocument();
    huge.pages[0].root.children.push(
      ...Array.from({ length: 2000 }, (_, index) => ({
        id: `section_extra_${index}`,
        type: 'section' as const,
        props: { name: `Extra ${index}` },
        styles: {},
        responsive: {},
        children: [
          {
            id: `container_extra_${index}`,
            type: 'container' as const,
            props: {},
            styles: {},
            responsive: {},
            children: [],
          },
        ],
      })),
    );

    try {
      v3.validate(huge);
      throw new Error('expected too large');
    } catch (error) {
      expect(codeOf(error)).toBe('DOCUMENT_TOO_LARGE');
    }
  });

  it('keeps structured styles and mobile typography overrides', () => {
    const result = v3.validate(createDemoWebsiteDocument());
    const heading = result.pages[0].root.children[1].children[0].children[0].children[0].children[0];
    expect(heading.styles.typography?.fontSize).toBe(56);
    expect(heading.responsive.mobile?.typography?.fontSize).toBe(36);
  });
});
