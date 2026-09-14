import { DocumentException } from '../errors/document.errors';
import { createDemoWebsiteDocument } from '../fixtures/demo-website-document';
import { DocumentOperationEngine } from '../services/document-operation.engine';
import { DocumentMigrationService } from '../services/document-migration.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { V3DocumentService } from '../services/v3-document.service';
import {
  pruneResponsiveOverrides,
  resolveResponsiveStyles,
} from '../services/responsive';
import {
  canNest,
  getComponentCatalog,
  getComponentMetadata,
} from '../contracts/node-registry';
import { getBuilderCatalog } from '../contracts/builder-catalog';
import {
  SECTION_PRESET_IDS,
  buildSectionPreset,
} from '../presets/section-presets';
import { StyleSchema } from '../schemas/v3.schema';
import { WebsiteDocumentV3 } from '../types/v3.types';

function codeOf(error: unknown): string {
  if (error instanceof DocumentException) {
    return (error.getResponse() as { code: string }).code;
  }
  throw error;
}

describe('Update 2 document engine', () => {
  let engine: DocumentOperationEngine;
  let v3: V3DocumentService;
  let demo: WebsiteDocumentV3;

  beforeEach(() => {
    const v2 = new DocumentValidatorService();
    const migration = new DocumentMigrationService(v2);
    v3 = new V3DocumentService(v2, migration);
    engine = new DocumentOperationEngine();
    demo = v3.validate(createDemoWebsiteDocument());
  });

  describe('responsive inheritance and overrides', () => {
    it('inherits base/desktop styles into tablet and mobile', () => {
      const styles = {
        typography: { fontSize: 48, fontWeight: 600 },
        color: { color: 'primary' },
        spacing: { padding: { top: 80, bottom: 80 } },
      };
      const responsive = {
        tablet: { typography: { fontSize: 32 } },
        mobile: { visibility: { hidden: false }, typography: { fontSize: 24 } },
      };

      const desktop = resolveResponsiveStyles(styles, responsive, 'desktop');
      const tablet = resolveResponsiveStyles(styles, responsive, 'tablet');
      const mobile = resolveResponsiveStyles(styles, responsive, 'mobile');

      expect(desktop.typography?.fontSize).toBe(48);
      expect(desktop.color?.color).toBe('primary');
      expect(tablet.typography?.fontSize).toBe(32);
      expect(tablet.typography?.fontWeight).toBe(600);
      expect(tablet.color?.color).toBe('primary');
      expect(mobile.typography?.fontSize).toBe(24);
      expect(mobile.spacing?.padding?.top).toBe(80);
    });

    it('stores only explicit responsive diffs', () => {
      const pruned = pruneResponsiveOverrides(
        { typography: { fontSize: 48 }, alignment: { textAlign: 'left' } },
        {
          desktop: {},
          tablet: { typography: { fontSize: 48 } },
          mobile: {
            typography: { fontSize: 24 },
            visibility: { hidden: true },
          },
        },
      );

      expect(pruned.desktop).toBeUndefined();
      expect(pruned.tablet).toBeUndefined();
      expect(pruned.mobile?.typography?.fontSize).toBe(24);
      expect(pruned.mobile?.visibility?.hidden).toBe(true);
      expect(pruned.mobile?.alignment).toBeUndefined();
    });

    it('prunes duplicate overrides when saving a document', () => {
      demo.pages[0].root.children[1].responsive = {
        desktop: {},
        tablet: { spacing: { padding: { top: 80 } } },
        mobile: { visibility: { hidden: true } },
      };
      demo.pages[0].root.children[1].styles = {
        spacing: { padding: { top: 80, bottom: 80 } },
      };

      const result = v3.validate(demo);
      const hero = result.pages[0].root.children[1];
      expect(hero.responsive.desktop).toBeUndefined();
      expect(hero.responsive.tablet).toBeUndefined();
      expect(hero.responsive.mobile?.visibility?.hidden).toBe(true);
    });
  });

  describe('style validation', () => {
    it('accepts structured layout, spacing, typography, and theme token colors', () => {
      const parsed = StyleSchema.safeParse({
        layout: { display: 'flex', gap: 16 },
        size: { width: '100%' },
        spacing: { padding: { top: 24, bottom: 24 } },
        typography: { fontSize: 18, fontWeight: 500 },
        color: { color: 'primary' },
        background: { color: 'surface' },
        border: { width: 1, style: 'solid', color: 'border' },
        radius: { topLeft: 8, topRight: 8, bottomRight: 8, bottomLeft: 8 },
        shadow: { x: 0, y: 8, blur: 24, spread: 0, color: 'muted' },
        alignment: { textAlign: 'center' },
        visibility: { hidden: false },
      });
      expect(parsed.success).toBe(true);
    });

    it('rejects malformed style values', () => {
      try {
        engine.applyOperation(demo, {
          type: 'updateStyles',
          nodeId: 'heading_hero',
          styles: {
            typography: { fontSize: 'huge' as unknown as number },
          },
        });
        throw new Error('expected invalid styles');
      } catch (error) {
        expect(['INVALID_NODE', 'DOCUMENT_VALIDATION_FAILED']).toContain(codeOf(error));
      }
    });

    it('rejects arbitrary CSS/JS in style fields', () => {
      try {
        engine.applyOperation(demo, {
          type: 'updateStyles',
          nodeId: 'heading_hero',
          styles: {
            background: { color: 'expression(alert(1))' },
          },
        });
        throw new Error('expected css injection rejection');
      } catch (error) {
        expect(['INVALID_NODE', 'DOCUMENT_VALIDATION_FAILED']).toContain(codeOf(error));
      }
    });
  });

  describe('theme tokens', () => {
    it('normalizes the full color token set and heading/body fonts', () => {
      const result = v3.validate(createDemoWebsiteDocument());
      expect(result.theme.colors).toEqual(
        expect.objectContaining({
          primary: '#5B5FEF',
          secondary: '#111827',
          accent: '#5B5FEF',
          background: '#FFFFFF',
          surface: '#F8FAFC',
          text: '#111827',
          muted: '#6B7280',
          border: '#E5E7EB',
        }),
      );
      expect(result.theme.typography.headingFont).toBe('Inter');
      expect(result.theme.typography.bodyFont).toBe('Inter');
    });

    it('keeps node colors that reference theme tokens', () => {
      const heading = engine.findNode(demo, 'heading_brand')!.node;
      expect(heading.styles.color?.color).toBe('primary');
    });

    it('updates theme tokens through a document operation', () => {
      const next = v3.validate(
        engine.applyOperation(demo, {
          type: 'updateTheme',
          theme: { colors: { accent: '#111111', muted: '#94A3B8' } },
        }),
      );
      expect(next.theme.colors.accent).toBe('#111111');
      expect(next.theme.colors.muted).toBe('#94A3B8');
      expect(next.theme.colors.primary).toBe('#5B5FEF');
    });
  });

  describe('component metadata and capabilities', () => {
    it('exposes a single component catalog', () => {
      const catalog = getComponentCatalog();
      const heading = getComponentMetadata('heading');
      const container = getComponentMetadata('container');
      const image = getComponentMetadata('image');
      const button = getComponentMetadata('button');

      expect(catalog.map((item) => item.type)).toEqual(
        expect.arrayContaining(['heading', 'container', 'image', 'button']),
      );
      expect(heading.capabilities).toEqual(
        expect.arrayContaining(['text', 'typography', 'color', 'spacing']),
      );
      expect(container.capabilities).toEqual(
        expect.arrayContaining(['layout', 'size', 'spacing', 'background', 'border', 'shadow']),
      );
      expect(image.capabilities).toEqual(
        expect.arrayContaining(['media', 'size', 'spacing', 'border', 'radius']),
      );
      expect(button.capabilities).toEqual(
        expect.arrayContaining(['text', 'link', 'typography', 'color', 'background', 'border']),
      );
    });

    it('derives allowed parents from the same registry', () => {
      expect(canNest('page-root', 'heading')).toBe(false);
      expect(canNest('page-root', 'section')).toBe(true);
      expect(canNest('column', 'heading')).toBe(true);
      expect(getComponentMetadata('heading').allowedParents).not.toContain('page-root');
      expect(getComponentMetadata('section').allowedParents).toContain('page-root');
    });

    it('applies registry defaults when adding a node', () => {
      const next = v3.validate(
        engine.applyOperation(demo, {
          type: 'addNode',
          parentId: 'column_hero_copy',
          node: { type: 'heading' },
        }),
      );
      const column = engine.findNode(next, 'column_hero_copy')!.node;
      const added = column.children.find(
        (child) => child.type === 'heading' && child.props.text === 'Heading',
      );
      expect(added?.props.tag).toBe('h2');
      expect(added?.styles.typography?.fontSize).toBe(36);
    });
  });

  describe('section presets', () => {
    it('lists the required presets as valid WebsiteDocument subtrees', () => {
      expect([...SECTION_PRESET_IDS]).toEqual([
        'hero',
        'about',
        'features',
        'services',
        'testimonials',
        'pricing',
        'gallery',
        'faq',
        'cta',
        'contact',
        'footer',
      ]);

      for (const presetId of SECTION_PRESET_IDS) {
        const tree = buildSectionPreset(presetId);
        expect(tree.type).toBe('section');
        const next = v3.validate(
          engine.applyOperation(demo, {
            type: 'insertPreset',
            parentId: 'root_home',
            presetId,
          }),
        );
        const inserted = next.pages[0].root.children.find(
          (child) => child.props.presetId === presetId,
        );
        expect(inserted?.type).toBe('section');
        expect(inserted?.children.length).toBeGreaterThan(0);
      }
    });

    it('inserts a preset through the same operation engine', () => {
      const next = v3.validate(
        engine.applyOperation(demo, {
          type: 'insertPreset',
          parentId: 'page_home',
          presetId: 'testimonials',
        }),
      );
      expect(
        next.pages[0].root.children.some((child) => child.props.presetId === 'testimonials'),
      ).toBe(true);
    });

    it('rejects unknown presets', () => {
      try {
        engine.applyOperation(demo, {
          type: 'insertPreset',
          parentId: 'root_home',
          presetId: 'marketplace',
        });
        throw new Error('expected unknown preset');
      } catch (error) {
        expect(codeOf(error)).toBe('INVALID_OPERATION');
      }
    });
  });

  describe('builder catalog', () => {
    it('exposes components, presets, and theme tokens together', () => {
      const catalog = getBuilderCatalog();
      expect(catalog.schemaVersion).toBe('3.0');
      expect(catalog.components.length).toBeGreaterThan(0);
      expect(catalog.presets.map((preset) => preset.id)).toEqual([...SECTION_PRESET_IDS]);
      expect(catalog.themeTokens.colors).toEqual(
        expect.arrayContaining(['primary', 'surface', 'muted', 'border']),
      );
      expect(catalog.themeTokens.typography).toEqual(['headingFont', 'bodyFont']);
    });
  });

  describe('batch operations', () => {
    it('inserts a preset and updates copy in one transactional batch', () => {
      const next = v3.validate(
        engine.applyOperations(demo, [
          { type: 'insertPreset', parentId: 'root_home', presetId: 'faq' },
          {
            type: 'updateProps',
            nodeId: 'heading_hero',
            props: { text: 'A more precise headline' },
          },
        ]),
      );
      expect(engine.findNode(next, 'heading_hero')?.node.props.text).toBe(
        'A more precise headline',
      );
      expect(next.pages[0].root.children.some((child) => child.props.presetId === 'faq')).toBe(
        true,
      );
    });

    it('does not persist earlier ops when a later op fails', () => {
      try {
        engine.applyOperations(demo, [
          { type: 'insertPreset', parentId: 'root_home', presetId: 'about' },
          { type: 'insertPreset', parentId: 'root_home', presetId: 'not-real' },
        ]);
        throw new Error('expected batch failure');
      } catch (error) {
        expect(codeOf(error)).toBe('INVALID_OPERATION');
      }
      expect(demo.pages[0].root.children.some((child) => child.props.presetId === 'about')).toBe(
        false,
      );
    });
  });
});
