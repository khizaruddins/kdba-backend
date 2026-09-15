import { BadRequestException } from '@nestjs/common';
import { TreeOperationsService } from '../services/tree-operations.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { DocumentMigrationService } from '../services/document-migration.service';
import { resolveNodeStyles } from '../services/style-resolve';
import { coerceRichTextProps, htmlToRichText } from '../services/rich-text';
import { getDefaultNode, isAllowedChild, getComponentManifest } from '../contracts/component-registry';
import { getBuilderCatalog } from '../contracts/builder-catalog';
import { WebsiteDocumentV3, WebsiteNode } from '../types/document.types';
import { dentalClinicTemplate } from '../../templates/data/definitions/dental-clinic';
import { businessConsultantTemplate } from '../../templates/data/definitions/business-consultant';
import { DocumentOperationsPayloadSchema } from '../schemas/v3/document-v3.schema';
import { StyleDefinitionSchema } from '../schemas/v3/style.schema';

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
          children: [
            {
              id: 'sec_hero',
              type: 'section',
              name: 'Hero Section',
              props: { anchorId: 'hero' },
              styles: { layout: { position: 'relative', width: '100%', display: 'flex' } },
              children: [
                {
                  id: 'container_hero',
                  type: 'container',
                  name: 'Hero Container',
                  props: { maxWidth: '1200px' },
                  children: [
                    {
                      id: 'heading_hero',
                      type: 'heading',
                      name: 'Hero Headline',
                      props: { text: 'Next-Gen Architecture', level: 1 },
                      styles: { typography: { fontSize: '48px', color: '#0f172a' } },
                    },
                    {
                      id: 'btn_hero',
                      type: 'button',
                      name: 'CTA Button',
                      props: { label: 'Explore More', href: '#features', variant: 'primary' },
                    },
                  ],
                },
              ],
            },
          ],
        },
      },
    ],
    global: { reusableNodes: {} },
    seo: { metaTitle: 'Test Studio', metaDescription: 'Design & Code' },
    settings: { enableContactForm: true, language: 'en' },
  };
}

describe('Milestone 3 — live V3 builder infrastructure', () => {
  let treeOps: TreeOperationsService;
  let validator: DocumentValidatorService;
  let migration: DocumentMigrationService;
  let doc: WebsiteDocumentV3;

  beforeEach(() => {
    treeOps = new TreeOperationsService();
    validator = new DocumentValidatorService();
    migration = new DocumentMigrationService(validator);
    doc = blankDoc();
  });

  describe('schema and registry', () => {
    it('validates a milestone 1/2 compatible blank V3 document', () => {
      const result = validator.validateV3(doc);
      expect(result.schemaVersion).toBe('3.0');
      expect(result.pages[0].isHomepage).toBe(true);
      expect(result.pages[0].root.id).toBe('root_page_home');
    });

    it('exposes centralized component metadata including variants and states', () => {
      const manifest = getComponentManifest();
      const button = manifest.find((item) => item.type === 'button');
      const card = manifest.find((item) => item.type === 'card');
      expect(button?.variants).toEqual(['primary', 'secondary', 'outline', 'ghost']);
      expect(button?.states).toEqual(expect.arrayContaining(['hover', 'disabled']));
      expect(card?.variants).toEqual(['default', 'elevated', 'bordered']);
      expect(isAllowedChild('container', 'card')).toBe(true);
      expect(isAllowedChild('stack', 'grid')).toBe(true);
      expect(isAllowedChild('section', 'section')).toBe(true);
      expect(isAllowedChild('page-root', 'heading')).toBe(false);
    });

    it('accepts structured layout properties and rejects arbitrary CSS injection', () => {
      const valid = StyleDefinitionSchema.safeParse({
        layout: {
          display: 'flex',
          containerWidth: 'wide',
          columns: 12,
          overflow: 'hidden',
          width: '100%',
          minHeight: '480px',
        },
        flex: { direction: 'row', justifyContent: 'center', gap: '24px', wrap: 'wrap' },
      });
      expect(valid.success).toBe(true);

      const unsafe = StyleDefinitionSchema.safeParse({
        layout: { width: 'expression(alert(1))' },
      });
      expect(unsafe.success).toBe(false);
    });
  });

  describe('nesting and operations', () => {
    it('rejects heading as a direct child of page-root', () => {
      expect(() =>
        treeOps.addNode(doc, 'page_home', 'root_page_home', {
          id: 'heading_orphan',
          type: 'heading',
          props: { text: 'Orphan', level: 2 },
        }),
      ).toThrow(BadRequestException);
    });

    it('allows a grid inside a stack', () => {
      const stack = getDefaultNode('stack', 'stack_layout');
      const grid = getDefaultNode('grid', 'grid_in_stack');
      treeOps.addNode(doc, 'page_home', 'container_hero', stack);
      treeOps.addNode(doc, 'page_home', 'stack_layout', grid);
      expect(validator.validateV3(doc).pages[0].root).toBeDefined();
    });

    it('allows a nested section inside a section', () => {
      const inner = getDefaultNode('section', 'sec_nested');
      treeOps.addNode(doc, 'page_home', 'sec_hero', inner);
      expect(validator.validateV3(doc).pages[0].root).toBeDefined();
    });

    it('adds a card with a registered variant', () => {
      const card = getDefaultNode('card', 'card_feature');
      card.variant = 'elevated';
      treeOps.addNode(doc, 'page_home', 'container_hero', card);
      const validated = validator.validateV3(doc);
      const found = treeOps.findNode(validated.pages[0].root, 'card_feature');
      expect(found?.variant).toBe('elevated');
    });

    it('rejects unregistered variants', () => {
      expect(() =>
        treeOps.updateNode(doc, 'page_home', 'btn_hero', { variant: 'neon-glow' }),
      ).toThrow(BadRequestException);
    });

    it('stores constrained hover/disabled states', () => {
      treeOps.updateNode(doc, 'page_home', 'btn_hero', {
        states: { hover: { typography: { color: '#ffffff' } }, disabled: { effects: { opacity: 0.5 } } },
      });
      const validated = validator.validateV3(doc);
      const button = treeOps.findNode(validated.pages[0].root, 'btn_hero');
      expect(button?.states?.hover?.typography?.color).toBe('#ffffff');
      expect(button?.states?.disabled?.effects?.opacity).toBe(0.5);
    });
  });

  describe('responsive inheritance', () => {
    it('resolves mobile <- tablet <- desktop deterministically', () => {
      const base = { typography: { fontSize: '48px', fontWeight: 700 } };
      const responsive = {
        tablet: { typography: { fontSize: '32px' } },
        mobile: { typography: { fontSize: '24px' } },
      };
      expect(resolveNodeStyles(base, responsive, 'desktop').typography?.fontSize).toBe('48px');
      expect(resolveNodeStyles(base, responsive, 'tablet').typography?.fontSize).toBe('32px');
      expect(resolveNodeStyles(base, responsive, 'tablet').typography?.fontWeight).toBe(700);
      expect(resolveNodeStyles(base, responsive, 'mobile').typography?.fontSize).toBe('24px');
      expect(resolveNodeStyles(base, responsive, 'mobile').typography?.fontWeight).toBe(700);
    });

    it('resets a breakpoint override back to inherited styles', () => {
      treeOps.updateResponsive(doc, 'page_home', 'heading_hero', {
        tablet: { typography: { fontSize: '28px' } },
        mobile: { typography: { fontSize: '20px' } },
      });
      treeOps.resetResponsive(doc, 'page_home', 'heading_hero', 'mobile');
      const node = treeOps.findNode(doc.pages[0].root, 'heading_hero');
      expect(node?.responsive?.mobile).toBeUndefined();
      expect(node?.responsive?.tablet?.typography?.fontSize).toBe('28px');
    });
  });

  describe('pages, navigation, duplication', () => {
    it('duplicates a page with a unique slug and new node ids', () => {
      const copy = treeOps.duplicatePage(doc, 'page_home');
      expect(copy.slug).toBe('/copy');
      expect(copy.id).not.toBe('page_home');
      expect(copy.root.id).not.toBe('root_page_home');
      expect(copy.isHomepage).toBe(false);
      const validated = validator.validateV3(doc);
      expect(validated.pages).toHaveLength(2);
      expect(new Set(validated.pages.map((page) => page.slug)).size).toBe(2);
    });

    it('rejects duplicate slugs and broken navigation page refs', () => {
      treeOps.addPage(doc, {
        id: 'page_about',
        title: 'About',
        slug: '/about',
        type: 'about',
        sortOrder: 1,
        enabled: true,
        root: {
          id: 'root_about',
          type: 'page-root',
          children: [],
        },
      });
      expect(() =>
        treeOps.updatePage(doc, 'page_about', { slug: '/' }),
      ).toThrow(BadRequestException);

      doc.navigation.header = [
        { id: 'nav_missing', label: 'Ghost', href: '/missing', kind: 'page', pageId: 'does-not-exist' },
      ];
      expect(() => validator.validateV3(doc)).toThrow(BadRequestException);

      doc.navigation.header = [
        { id: 'nav_about', label: 'About', href: '/about', kind: 'page', pageId: 'page_about', visible: true },
      ];
      expect(validator.validateV3(doc).navigation.header[0].pageId).toBe('page_about');
    });

    it('duplicate and paste generate new subtree ids', () => {
      const duplicated = treeOps.duplicateNode(doc, 'page_home', 'container_hero');
      expect(duplicated.id).not.toBe('container_hero');
      expect(duplicated.children?.[0].id).not.toBe('heading_hero');

      const pasted = treeOps.pasteNode(doc, 'page_home', 'sec_hero', {
        id: 'container_hero',
        type: 'container',
        children: [{ id: 'heading_hero', type: 'heading', props: { text: 'Pasted', level: 2 } }],
      });
      expect(pasted.id).not.toBe('container_hero');
      expect(pasted.children?.[0].id).not.toBe('heading_hero');
      validator.validateV3(doc);
    });
  });

  describe('presets, reusable components, rich text, media', () => {
    it('inserts a section preset into the page root', () => {
      treeOps.insertPreset(doc, 'page_home', 'root_page_home', 'faq');
      const validated = validator.validateV3(doc);
      expect(validated.pages[0].root.children?.some((child) => child.type === 'section')).toBe(true);
      expect(validated.pages[0].root.children?.length).toBeGreaterThan(1);
    });

    it('stores reusable components and rejects circular references', () => {
      const card = getDefaultNode('card', 'reusable_source');
      card.children = [getDefaultNode('heading', 'reusable_heading')];
      treeOps.upsertReusable(doc, 'feature-card', card);
      treeOps.insertReusable(doc, 'page_home', 'container_hero', 'feature-card');
      const validated = validator.validateV3(doc);
      const container = treeOps.findNode(validated.pages[0].root, 'container_hero');
      const instance = container?.children?.find((child) => child.componentRef === 'feature-card');
      expect(instance).toBeDefined();
      expect(instance?.id).not.toBe(validated.global.reusableNodes?.['feature-card'].id);

      const a: WebsiteNode = { id: 'cycle_a', type: 'stack', componentRef: 'comp-b', children: [] };
      const b: WebsiteNode = { id: 'cycle_b', type: 'stack', componentRef: 'comp-a', children: [] };
      treeOps.upsertReusable(doc, 'comp-a', a);
      treeOps.upsertReusable(doc, 'comp-b', b);
      expect(() => validator.validateV3(doc)).toThrow(BadRequestException);
    });

    it('converts legacy HTML rich text into sanitized blocks', () => {
      const coerced = coerceRichTextProps({
        html: '<p>Hello <script>alert(1)</script><strong>world</strong></p>',
      });
      expect(JSON.stringify(coerced.blocks)).not.toMatch(/script/i);
      expect(Array.isArray(coerced.blocks)).toBe(true);
      expect(htmlToRichText('<h2>Safe title</h2>')[0].type).toBe('heading');
    });

    it('rejects image mediaId values that are URLs', () => {
      treeOps.addNode(doc, 'page_home', 'container_hero', {
        id: 'img_bad',
        type: 'image',
        props: {
          alt: 'Tracked',
          mediaId: 'https://evil.example/track.png',
          objectFit: 'cover',
        },
      });
      expect(() => validator.validateV3(doc)).toThrow(BadRequestException);
    });
  });

  describe('catalog, operations contract, template compatibility', () => {
    it('exposes live registry components and presets together', () => {
      const catalog = getBuilderCatalog();
      expect(catalog.schemaVersion).toBe('3.0');
      expect(catalog.components.length).toBeGreaterThan(10);
      expect(catalog.presets.map((preset) => preset.id)).toEqual(
        expect.arrayContaining(['hero', 'faq', 'contact']),
      );
      expect(catalog.responsive.breakpoints).toEqual(['desktop', 'tablet', 'mobile']);
    });

    it('accepts new operation types in the payload schema', () => {
      const parsed = DocumentOperationsPayloadSchema.safeParse({
        baseRevision: 1,
        operations: [
          { type: 'duplicatePage', pageId: 'page_home' },
          {
            type: 'resetResponsive',
            pageId: 'page_home',
            nodeId: 'heading_hero',
            breakpoint: 'mobile',
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });

    it('migrates existing V2 templates without destroying content', () => {
      const dental = migration.migrateWebsiteDocument(dentalClinicTemplate.document);
      expect(dental.schemaVersion).toBe('3.0');
      expect(dental.pages[0].root.type).toBe('page-root');
      expect(dental.pages[0].isHomepage).toBe(true);
      expect(dental.business.name).toBe(dentalClinicTemplate.document.business.name);

      const consulting = migration.migrateWebsiteDocument(businessConsultantTemplate.document);
      expect(consulting.schemaVersion).toBe('3.0');
      expect(consulting.pages[0].root.children?.length).toBeGreaterThan(0);
    });

    it('accepts editor documents with headingFont typography and numeric px styles', () => {
      const numeric = StyleDefinitionSchema.safeParse({
        spacing: { padding: { top: 80, right: 24, bottom: 80, left: 24 } },
        typography: { fontSize: 48, fontWeight: 700 },
      });
      expect(numeric.success).toBe(true);
      if (numeric.success) {
        expect(numeric.data.spacing?.padding?.top).toBe('80px');
        expect(numeric.data.typography?.fontSize).toBe('48px');
      }

      const editorDoc = blankDoc() as unknown as Record<string, unknown>;
      editorDoc.theme = {
        colors: (blankDoc().theme as { colors: unknown }).colors,
        typography: { headingFont: 'Playfair Display', bodyFont: 'Inter' },
        breakpoints: { desktop: 1200, tablet: 768, mobile: 480 },
        borderRadius: 'md',
        shadows: 'subtle',
      };
      const page = (editorDoc.pages as WebsiteDocumentV3['pages'])[0];
      page.root.children![0].styles = {
        spacing: { padding: { top: 96, right: 24, bottom: 96, left: 24 } },
      } as any;
      page.root.children![0].children![0].children![0].styles = {
        typography: { fontSize: 56 },
        spacing: { margin: { bottom: 16 } },
      } as any;
      (editorDoc as { global: { headerNode: unknown } }).global.headerNode = {
        id: 'global_header',
        type: 'navbar',
        styles: { spacing: { padding: { top: 16, right: 24, bottom: 16, left: 24 } } },
        props: { brandName: 'Photography Merkhiz' },
      };

      const result = validator.validateV3(editorDoc);
      expect(result.theme.typography.h1.fontFamily).toBe('Playfair Display');
      expect(result.theme.typography.body.fontFamily).toBe('Inter');
      expect(result.theme.typography.h1.fontSize).toBe('48px');
      expect(result.pages[0].root.children?.[0].styles?.spacing?.padding?.top).toBe('96px');
      expect(
        result.pages[0].root.children?.[0].children?.[0].children?.[0].styles?.typography?.fontSize,
      ).toBe('56px');
      expect(result.global.headerNode?.styles?.spacing?.padding?.top).toBe('16px');
    });
  });
});
