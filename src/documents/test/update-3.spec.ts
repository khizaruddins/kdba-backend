import { BadRequestException } from '@nestjs/common';
import { TreeOperationsService } from '../services/tree-operations.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { DocumentMigrationService } from '../services/document-migration.service';
import { getComponentManifest, isAllowedChild } from '../contracts/component-registry';
import {
  assertBlockRegistry,
  BLOCK_REGISTRY,
  buildBlockTree,
  LEGACY_PRESET_ALIASES,
  listBlocks,
} from '../contracts/block-registry';
import { getBuilderCatalog } from '../contracts/builder-catalog';
import {
  CONTACT_FORM_VARIANTS,
  normalizeFormFields,
  validateContactSubmission,
} from '../contracts/form-fields';
import { WebsiteDocumentV3, WebsiteNode } from '../types/document.types';
import { DocumentOperationsPayloadSchema } from '../schemas/v3/document-v3.schema';
import { StyleDefinitionSchema, ThemeSystemV3Schema } from '../schemas/v3/style.schema';
import { dentalClinicTemplate } from '../../templates/data/definitions/dental-clinic';

function walk(node: WebsiteNode, visit: (node: WebsiteNode) => void) {
  visit(node);
  for (const child of node.children || []) walk(child, visit);
}

function blankDoc(): WebsiteDocumentV3 {
  return {
    schemaVersion: '3.0',
    site: { name: 'Test Studio', businessType: 'agency', language: 'en' },
    theme: {
      colors: {
        primary: '#0f172a',
        secondary: '#ffffff',
        accent: '#6366f1',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        muted: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        h1: { fontFamily: 'Inter', fontSize: '48px', fontWeight: 700, lineHeight: 1.2 },
        h2: { fontFamily: 'Inter', fontSize: '36px', fontWeight: 700, lineHeight: 1.2 },
        h3: { fontFamily: 'Inter', fontSize: '28px', fontWeight: 600, lineHeight: 1.3 },
        h4: { fontFamily: 'Inter', fontSize: '22px', fontWeight: 600, lineHeight: 1.35 },
        h5: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
        h6: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
        body: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: 1.5 },
        caption: { fontFamily: 'Inter', fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
        label: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 },
        button: { fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
        quote: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 400, lineHeight: 1.6 },
      },
      breakpoints: { desktop: 1200, tablet: 768, mobile: 480 },
      borderRadius: 'md',
      shadows: 'subtle',
    },
    business: { name: 'Test Studio Inc' },
    navigation: { header: [], footer: [] },
    pages: [
      {
        id: 'page_home',
        title: 'Home',
        slug: '/',
        type: 'home',
        sortOrder: 0,
        enabled: true,
        root: {
          id: 'root_page_home',
          type: 'page-root',
          name: 'Page Root',
          children: [],
        },
      },
    ],
    global: { reusableNodes: {} },
    seo: { metaTitle: 'Test', metaDescription: 'Test site' },
    settings: { enableContactForm: true, language: 'en' },
  };
}

describe('Update 3 — blocks, components, and contact variants', () => {
  const treeOps = new TreeOperationsService();
  const validator = new DocumentValidatorService();
  const migration = new DocumentMigrationService(validator);

  describe('component registry', () => {
    it('exposes centralized metadata the editor can discover', () => {
      const heading = getComponentManifest().find((item) => item.type === 'heading');
      expect(heading).toMatchObject({
        name: 'Heading',
        category: 'content',
        icon: expect.any(String),
        version: 1,
      });
      expect(heading?.allowedParents).not.toContain('page-root');
      expect(heading?.editableFields?.length).toBeGreaterThan(0);
      expect(heading?.childRules.max).toBe(0);
      expect(heading?.supportedResponsiveProperties.length).toBeGreaterThan(0);
    });

    it('keeps parent/child rules aligned with the live registry', () => {
      expect(isAllowedChild('page-root', 'section')).toBe(true);
      expect(isAllowedChild('stack', 'form')).toBe(true);
      expect(isAllowedChild('heading', 'button')).toBe(false);
    });
  });

  describe('block registry', () => {
    it('produces valid unlocked WebsiteDocument trees', () => {
      expect(() => assertBlockRegistry()).not.toThrow();
      const ids = listBlocks().map((block) => block.id);
      expect(ids).toEqual(
        expect.arrayContaining([
          'hero-centered',
          'features-bento',
          'services-cards',
          'testimonials-quote',
          'pricing-highlighted-plan',
          'gallery-masonry',
          'faq-accordion',
          'cta-split',
          'footer-centered',
          'contact-simple',
          'contact-full-width',
        ]),
      );
    });

    it('expands blocks into normal nodes instead of locked widgets', () => {
      const tree = buildBlockTree('hero-centered');
      expect(tree.type).toBe('section');
      expect(tree.locked).toBeUndefined();
      const types = new Set<string>();
      walk(tree, (node) => {
        types.add(node.type);
        expect(node.locked).toBeUndefined();
        expect(node.id).toMatch(/^[a-zA-Z0-9_-]+$/);
      });
      expect([...types]).toEqual(expect.arrayContaining(['section', 'container', 'stack', 'heading', 'paragraph', 'button']));
    });

    it('maps legacy preset ids onto block trees', () => {
      expect(LEGACY_PRESET_ALIASES.contact).toBe('contact-simple');
      const legacy = buildBlockTree('contact');
      const named = buildBlockTree('contact-simple');
      expect(legacy.props?.blockId).toBe('contact-simple');
      expect(named.props?.blockId).toBe('contact-simple');
    });
  });

  describe('block insertion', () => {
    it('inserts through the existing operation engine and stays valid', () => {
      const doc = blankDoc();
      const inserted = treeOps.insertBlock(doc, 'page_home', 'root_page_home', 'features-three-column');
      expect(inserted.type).toBe('section');
      const validated = validator.validateV3(doc);
      expect(validated.pages[0].root.children?.[0].id).toBe(inserted.id);

      treeOps.removeNode(doc, 'page_home', inserted.id);
      treeOps.insertPreset(doc, 'page_home', 'root_page_home', 'faq');
      validator.validateV3(doc);
    });

    it('lets the user edit, move, duplicate, and restyle inserted nodes', () => {
      const doc = blankDoc();
      const section = treeOps.insertBlock(doc, 'page_home', 'root_page_home', 'hero-minimal');
      let heading: WebsiteNode | undefined;
      walk(section, (node) => {
        if (!heading && node.type === 'heading') heading = node;
      });
      expect(heading).toBeDefined();

      treeOps.updateProps(doc, 'page_home', heading!.id, { text: 'Owned heading' });
      treeOps.updateStyles(doc, 'page_home', heading!.id, { typography: { fontSize: '40px' } });
      treeOps.updateResponsive(doc, 'page_home', heading!.id, {
        mobile: { typography: { fontSize: '28px' } },
      });
      const duplicated = treeOps.duplicateNode(doc, 'page_home', section.id);
      expect(duplicated.id).not.toBe(section.id);
      validator.validateV3(doc);
    });

    it('rejects unknown blocks and disallowed parents', () => {
      const doc = blankDoc();
      expect(() => treeOps.insertBlock(doc, 'page_home', 'root_page_home', 'marketplace')).toThrow(
        BadRequestException,
      );

      const hero = treeOps.insertBlock(doc, 'page_home', 'root_page_home', 'hero-centered');
      let heading: WebsiteNode | undefined;
      walk(hero, (node) => {
        if (!heading && node.type === 'heading') heading = node;
      });
      expect(() => treeOps.insertBlock(doc, 'page_home', heading!.id, 'cta-minimal')).toThrow(
        BadRequestException,
      );
    });

    it('keeps failed batches from partially writing the document', () => {
      const doc = blankDoc();
      const snapshot = JSON.parse(JSON.stringify(doc));
      expect(() =>
        treeOps.applyOperations(doc, [
          {
            type: 'insertBlock',
            pageId: 'page_home',
            parentId: 'root_page_home',
            blockId: 'about-split',
          },
          {
            type: 'insertBlock',
            pageId: 'page_home',
            parentId: 'root_page_home',
            blockId: 'not-a-block',
          },
        ]),
      ).toThrow(BadRequestException);
      expect(doc.pages[0].root.children).toEqual(snapshot.pages[0].root.children);
    });

    it('accepts insertBlock in the operations contract', () => {
      const parsed = DocumentOperationsPayloadSchema.safeParse({
        baseRevision: 4,
        operations: [
          {
            type: 'insertBlock',
            pageId: 'page_home',
            parentId: 'root_page_home',
            blockId: 'contact-split',
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });
  });

  describe('contact form variants', () => {
    it('uses one shared lead form across all visual layouts', () => {
      const actions = new Set<string>();
      for (const variant of CONTACT_FORM_VARIANTS) {
        const id = variant === 'contact-info' ? 'contact-info' : `contact-${variant}`;
        const tree = buildBlockTree(id);
        const forms: WebsiteNode[] = [];
        walk(tree, (node) => {
          if (node.type === 'form') forms.push(node);
        });
        expect(forms).toHaveLength(1);
        expect(forms[0].props?.action).toBe('leads');
        expect(forms[0].variant).toBe(variant);
        const fields = normalizeFormFields(forms[0].props?.fields);
        expect(fields.map((field) => field.id)).toEqual(
          expect.arrayContaining(['name', 'email', 'message']),
        );
        actions.add(String(forms[0].props?.action));
        validator.validateV3({
          ...blankDoc(),
          pages: [
            {
              ...blankDoc().pages[0],
              root: { ...blankDoc().pages[0].root, children: [tree] },
            },
          ],
        });
      }
      expect([...actions]).toEqual(['leads']);
    });

    it('validates submissions server-side and rejects unsafe input', () => {
      const ok = validateContactSubmission({
        name: 'Ada Lovelace',
        email: 'ada@studio.com',
        company: 'Analytical Engine',
        fields: { phone: '+1 555 0100' },
      });
      expect(ok.name).toBe('Ada Lovelace');
      expect(ok.message).toContain('company: Analytical Engine');

      expect(() =>
        validateContactSubmission({
          name: 'javascript:alert(1)',
          email: 'ada@studio.com',
        }),
      ).toThrow(/unsafe/i);

      expect(() =>
        validateContactSubmission({
          name: 'Ada',
          email: 'not-an-email',
        }),
      ).toThrow(/email/i);
    });
  });

  describe('styles, theme, templates', () => {
    it('rejects unsafe style values and accepts structured responsive styles', () => {
      expect(
        StyleDefinitionSchema.safeParse({
          typography: { color: 'javascript:alert(1)' },
        }).success,
      ).toBe(false);

      const parsed = StyleDefinitionSchema.safeParse({
        spacing: { padding: { top: 24, bottom: 24 } },
        typography: { fontSize: 18 },
      });
      expect(parsed.success).toBe(true);

      const theme = ThemeSystemV3Schema.parse({
        colors: blankDoc().theme.colors,
        typography: { headingFont: 'Playfair Display', bodyFont: 'Inter' },
      });
      expect(theme.headingFont).toBe('Playfair Display');
      expect(theme.tokens?.spacing?.md).toBe('16px');
      expect(theme.tokens?.button?.radius).toBe('md');
    });

    it('exposes blocks, form fields, and theme tokens on the catalog', () => {
      const catalog = getBuilderCatalog();
      expect(catalog.blocks.length).toBeGreaterThan(20);
      expect(catalog.contactVariants).toEqual(expect.arrayContaining(['simple', 'split', 'business']));
      expect(catalog.formFields.map((field) => field.id)).toEqual(
        expect.arrayContaining(['name', 'email', 'select', 'checkbox']),
      );
      expect(catalog.themeTokens.typography).toEqual(['headingFont', 'bodyFont']);
      expect(catalog.operations).toEqual(expect.arrayContaining(['insertBlock', 'insertPreset']));
    });

    it('keeps existing templates valid after migration', () => {
      const migrated = migration.migrateWebsiteDocument(dentalClinicTemplate.document);
      expect(migrated.schemaVersion).toBe('3.0');
      expect(validator.validateV3(migrated).pages[0].root.type).toBe('page-root');
    });

    it('rejects malformed documents', () => {
      const doc = blankDoc();
      doc.pages[0].root.children = [
        { id: 'dup', type: 'section', children: [{ id: 'dup', type: 'heading', props: { text: 'Hi', level: 2 } }] },
      ];
      expect(() => validator.validateV3(doc)).toThrow(BadRequestException);
    });
  });

  describe('nested blocks and registry completeness', () => {
    it('can insert a second block beside the first', () => {
      const next = treeOps.applyOperations(blankDoc(), [
        { type: 'insertBlock', pageId: 'page_home', parentId: 'root_page_home', blockId: 'hero-split' },
        { type: 'insertBlock', pageId: 'page_home', parentId: 'root_page_home', blockId: 'contact-split' },
      ]);
      const validated = validator.validateV3(next);
      expect(validated.pages[0].root.children).toHaveLength(2);
      expect(Object.keys(BLOCK_REGISTRY).length).toBe(listBlocks().length);
    });
  });
});
