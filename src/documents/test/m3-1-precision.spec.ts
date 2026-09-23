import { BadRequestException } from '@nestjs/common';
import { TreeOperationsService } from '../services/tree-operations.service';
import { ResponsiveResolverService } from '../services/responsive-resolver.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import {
  WebsiteDocumentV3,
  WebsiteNode,
} from '../types/document.types';
import {
  getComponentManifest,
  getNodeCapabilities,
} from '../contracts/component-registry';
import {
  StyleDefinitionSchema,
} from '../schemas/v3/style.schema';
import {
  AnimationDefinitionSchema,
  ComponentStatesDefinitionSchema,
} from '../schemas/v3/node.schema';

describe('KDBA M3.1 — Editor Precision & Wix-Level Customization Engine', () => {
  let treeOps: TreeOperationsService;
  let responsiveResolver: ResponsiveResolverService;
  let validator: DocumentValidatorService;
  let testDoc: WebsiteDocumentV3;

  const createTestDoc = (): WebsiteDocumentV3 => ({
    schemaVersion: '3.0',
    site: { name: 'Precision Studio', businessType: 'design-agency', language: 'en' },
    theme: {
      colors: {
        primary: '#0f172a',
        secondary: '#6366f1',
        accent: '#ec4899',
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
        h2: { fontFamily: 'Inter', fontSize: '36px', fontWeight: 700, lineHeight: 1.25 },
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
    business: { name: 'Precision Studio Corp' },
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
              props: { sectionType: 'hero', variant: 'split-image', anchorId: 'hero' },
              styles: {
                layout: { position: 'relative', width: '100%' },
                spacing: { padding: { top: '64px', bottom: '64px', left: '24px', right: '24px' } },
                background: {
                  color: '#ffffff',
                  overlay: { color: '#000000', opacity: 0.2 },
                },
              },
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
                      name: 'Main Headline',
                      props: { text: 'Next-Gen Visual Craftsmanship', level: 1 },
                      styles: {
                        typography: { fontSize: '48px', fontWeight: 700, lineHeight: 1.2, color: '#0f172a' },
                        spacing: { margin: { bottom: '16px' } },
                      },
                    },
                    {
                      id: 'p_hero',
                      type: 'paragraph',
                      name: 'Hero Description',
                      props: { text: 'Granular backend precision delivering pixel-perfect Wix-level authoring.' },
                      styles: {
                        typography: { fontSize: '18px', lineHeight: 1.6, color: '#64748b' },
                        spacing: { margin: { bottom: '24px' } },
                      },
                    },
                    {
                      id: 'btn_hero',
                      type: 'button',
                      name: 'Get Started CTA',
                      props: { label: 'Start Building', href: '#features', variant: 'primary' },
                      styles: {
                        typography: { fontSize: '16px', fontWeight: 600, color: '#ffffff' },
                        background: { color: '#6366f1' },
                        border: { radius: { all: '8px' } },
                        spacing: { padding: { top: '12px', bottom: '12px', left: '24px', right: '24px' } },
                      },
                    },
                    {
                      id: 'img_hero',
                      type: 'image',
                      name: 'Hero Visual',
                      props: {
                        src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200',
                        alt: 'Studio Workspace',
                        aspectRatio: '16/9',
                        objectFit: 'cover',
                        objectPosition: 'center',
                        crop: { x: 0, y: 0, width: 100, height: 100 },
                        focalPoint: { x: 50, y: 50 },
                      },
                      styles: {
                        size: { width: '100%', maxWidth: '800px', aspectRatio: '16/9' },
                        border: { radius: { all: '12px' } },
                      },
                    },
                  ],
                },
              ],
            },
            {
              id: 'sec_features',
              type: 'section',
              name: 'Features Section',
              props: { sectionType: 'features', variant: 'grid-3-col', anchorId: 'features' },
              styles: {
                layout: { position: 'relative', width: '100%' },
                spacing: { padding: { top: '64px', bottom: '64px', left: '24px', right: '24px' } },
              },
              children: [
                {
                  id: 'container_features',
                  type: 'container',
                  name: 'Features Container',
                  props: { maxWidth: '1200px' },
                  children: [
                    {
                      id: 'features_heading',
                      type: 'heading',
                      name: 'Features Title',
                      props: { text: 'Key Architectural Advantages', level: 2 },
                    },
                    {
                      id: 'features_sub',
                      type: 'paragraph',
                      name: 'Features Subtitle',
                      props: { text: 'Engineered for reliability, velocity, and complete designer autonomy.' },
                    },
                    {
                      id: 'features_grid',
                      type: 'grid',
                      name: 'Features 3-Col Grid',
                      props: { columns: 3, gap: '24px' },
                      styles: {
                        grid: {
                          columns: 3,
                          gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                          columnGap: '24px',
                          rowGap: '24px',
                        },
                      },
                      children: [
                        {
                          id: 'card_1',
                          type: 'container',
                          name: 'Card 1',
                          children: [
                            {
                              id: 'h_card_1',
                              type: 'heading',
                              props: { text: 'Precision Styling', level: 3 },
                            },
                            {
                              id: 'p_card_1',
                              type: 'paragraph',
                              props: { text: 'Configure sizes, margins, paddings, and colors per element.' },
                            },
                          ],
                        },
                        {
                          id: 'card_2',
                          type: 'container',
                          name: 'Card 2',
                          children: [
                            {
                              id: 'h_card_2',
                              type: 'heading',
                              props: { text: 'Responsive Cascade', level: 3 },
                            },
                            {
                              id: 'p_card_2',
                              type: 'paragraph',
                              props: { text: 'Inherit desktop values and override tablet and mobile cleanly.' },
                            },
                          ],
                        },
                        {
                          id: 'card_3',
                          type: 'container',
                          name: 'Card 3',
                          children: [
                            {
                              id: 'h_card_3',
                              type: 'heading',
                              props: { text: 'Document Safety', level: 3 },
                            },
                            {
                              id: 'p_card_3',
                              type: 'paragraph',
                              props: { text: 'All operations remain validated within canonical WebsiteDocument.' },
                            },
                          ],
                        },
                      ],
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
    seo: { metaTitle: 'Precision Studio', metaDescription: 'Wix-level precision visual builder' },
    settings: { enableContactForm: true, language: 'en' },
  });

  beforeEach(() => {
    treeOps = new TreeOperationsService();
    responsiveResolver = new ResponsiveResolverService();
    validator = new DocumentValidatorService();
    testDoc = createTestDoc();
  });

  // ─── 1. GRANULAR NODE CAPABILITIES ──────────────────────────────────────────
  describe('1. Granular Node Capabilities Metadata', () => {
    it('should expose structured capabilities in component manifest for all nodes', () => {
      const manifest = getComponentManifest();
      expect(manifest.length).toBeGreaterThan(25);

      const headingDef = manifest.find((m) => m.type === 'heading');
      expect(headingDef).toBeDefined();
      expect(headingDef?.capabilities.granular).toBeDefined();
      expect(headingDef?.capabilities.granular?.typography?.fontSize).toBe(true);
      expect(headingDef?.capabilities.granular?.content?.level).toBe(true);
      expect(headingDef?.capabilities.granular?.states).toContain('hover');

      const imageDef = manifest.find((m) => m.type === 'image');
      expect(imageDef?.capabilities.granular?.size?.aspectRatio).toBe(true);
      expect(imageDef?.capabilities.granular?.content?.crop).toBe(true);
      expect(imageDef?.capabilities.granular?.content?.focalPoint).toBe(true);

      const buttonDef = manifest.find((m) => m.type === 'button');
      expect(buttonDef?.capabilities.granular?.states).toEqual([
        'hover',
        'active',
        'focus',
        'disabled',
      ]);
      expect(buttonDef?.capabilities.granular?.content?.variant).toBe(true);
    });

    it('should retrieve granular capabilities via getNodeCapabilities helper', () => {
      const sectionCaps = getNodeCapabilities('section');
      expect(sectionCaps.granular?.appearance?.backgroundOverlay).toBe(true);
      expect(sectionCaps.granular?.size?.minHeight).toBe(true);
      expect(sectionCaps.granular?.layout?.display).toBe(true);
    });
  });

  // ─── 2. GRANULAR STYLE MODEL ────────────────────────────────────────────────
  describe('2. Granular Style Model & Overlay Support', () => {
    it('should validate and persist background overlay and fine-grained borders', () => {
      const validStyle = {
        background: {
          color: '#1e1b4b',
          overlay: { color: '#000000', opacity: 0.4 },
        },
        border: {
          top: { width: '2px', style: 'solid' as const, color: '#6366f1' },
          radius: { all: '16px' },
        },
        size: {
          width: '100%',
          maxWidth: '1200px',
          minHeight: '400px',
        },
        spacing: {
          margin: { top: '0px', bottom: '40px' },
          padding: { top: '32px', bottom: '32px', left: '20px', right: '20px' },
        },
      };

      const parsed = StyleDefinitionSchema.safeParse(validStyle);
      expect(parsed.success).toBe(true);

      treeOps.updateStyles(testDoc, 'page_home', 'sec_hero', validStyle);
      const sec = treeOps.findNode(testDoc.pages[0].root, 'sec_hero');
      expect(sec?.styles?.background?.overlay?.color).toBe('#000000');
      expect(sec?.styles?.background?.overlay?.opacity).toBe(0.4);
    });

    it('should reject unsafe CSS values in styles', () => {
      const maliciousStyle = {
        background: {
          color: 'javascript:alert(1)',
        },
      };
      const parsed = StyleDefinitionSchema.safeParse(maliciousStyle);
      expect(parsed.success).toBe(false);
    });
  });

  // ─── 3. RESPONSIVE INHERITANCE, OVERRIDE & RESET ─────────────────────────────
  describe('3. Responsive Override & Inheritance System', () => {
    it('should support setting mobile overrides and computing inheritance analysis', () => {
      // Desktop: fontSize = '48px', color = '#0f172a'
      // Set Mobile override: fontSize = '32px'
      treeOps.updateResponsive(testDoc, 'page_home', 'heading_hero', {
        mobile: {
          typography: { fontSize: '32px' },
        },
      });

      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero')!;
      const analysis = responsiveResolver.analyzeNodeResponsive(heading, 'mobile');

      expect(analysis.hasOverrides).toBe(true);
      expect(analysis.properties['typography.fontSize'].status).toBe('overridden');
      expect(analysis.properties['typography.fontSize'].desktopValue).toBe('48px');
      expect(analysis.properties['typography.fontSize'].overrideValue).toBe('32px');
      expect(analysis.properties['typography.fontSize'].effectiveValue).toBe('32px');

      // typography.color was not overridden on mobile, so it is inherited from desktop
      expect(analysis.properties['typography.color'].status).toBe('inherited');
      expect(analysis.properties['typography.color'].effectiveValue).toBe('#0f172a');
    });

    it('should reset specific property back to desktop via resetResponsive operation', () => {
      treeOps.updateResponsive(testDoc, 'page_home', 'heading_hero', {
        mobile: {
          typography: { fontSize: '32px', color: '#ef4444' },
        },
      });

      // Reset only typography.fontSize on mobile
      treeOps.resetResponsive(testDoc, 'page_home', 'heading_hero', 'mobile', [
        'typography.fontSize',
      ]);

      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero')!;
      const analysis = responsiveResolver.analyzeNodeResponsive(heading, 'mobile');

      // fontSize is now inherited again
      expect(analysis.properties['typography.fontSize'].status).toBe('inherited');
      expect(analysis.properties['typography.fontSize'].effectiveValue).toBe('48px');

      // color remains overridden
      expect(analysis.properties['typography.color'].status).toBe('overridden');
      expect(analysis.properties['typography.color'].overrideValue).toBe('#ef4444');
    });

    it('should reset entire breakpoint override when no propertyPaths provided', () => {
      treeOps.updateResponsive(testDoc, 'page_home', 'heading_hero', {
        mobile: {
          typography: { fontSize: '28px' },
          spacing: { margin: { bottom: '8px' } },
        },
      });

      treeOps.resetResponsive(testDoc, 'page_home', 'heading_hero', 'mobile');
      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero')!;
      expect(heading.responsive?.mobile).toBeUndefined();

      const analysis = responsiveResolver.analyzeNodeResponsive(heading, 'mobile');
      expect(analysis.hasOverrides).toBe(false);
      expect(analysis.properties['typography.fontSize'].status).toBe('inherited');
    });
  });

  // ─── 4. COMPONENT STATES ────────────────────────────────────────────────────
  describe('4. Component States (Hover, Active, Focus, Disabled)', () => {
    it('should apply and update hover and active states on a button', () => {
      const hoverStyles = {
        background: { color: '#4338ca' },
        effects: { boxShadow: { x: 0, y: 8, blur: 16, spread: 0, color: 'rgba(99,102,241,0.3)' } },
      };

      const activeStyles = {
        transform: { scale: 0.98 },
      };

      treeOps.updateState(testDoc, 'page_home', 'btn_hero', 'hover', hoverStyles);
      treeOps.updateState(testDoc, 'page_home', 'btn_hero', 'active', activeStyles);

      const btn = treeOps.findNode(testDoc.pages[0].root, 'btn_hero');
      expect(btn?.states?.hover?.background?.color).toBe('#4338ca');
      expect(btn?.states?.active?.transform?.scale).toBe(0.98);

      // Validate schema
      const stateValidation = ComponentStatesDefinitionSchema.safeParse(btn?.states);
      expect(stateValidation.success).toBe(true);
    });

    it('should remove a component state when passed null', () => {
      treeOps.updateState(testDoc, 'page_home', 'btn_hero', 'hover', {
        background: { color: '#4338ca' },
      });
      expect(testDoc.pages[0].root.children![0].children![0].children![2].states?.hover).toBeDefined();

      treeOps.updateState(testDoc, 'page_home', 'btn_hero', 'hover', null);
      const btn = treeOps.findNode(testDoc.pages[0].root, 'btn_hero');
      expect(btn?.states?.hover).toBeUndefined();
    });
  });

  // ─── 5. STRUCTURED ANIMATION MODEL ──────────────────────────────────────────
  describe('5. Structured Animation Model', () => {
    it('should configure preset animations with trigger, duration, direction, distance, and intensity', () => {
      const animConfig = {
        preset: 'fade-up',
        trigger: 'on-scroll' as const,
        duration: 800,
        delay: 150,
        easing: 'ease-out',
        direction: 'up' as const,
        distance: '24px',
        intensity: 'medium' as const,
      };

      treeOps.updateAnimation(testDoc, 'page_home', 'heading_hero', animConfig);
      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero');
      expect(heading?.animations?.preset).toBe('fade-up');
      expect(heading?.animations?.trigger).toBe('on-scroll');
      expect(heading?.animations?.duration).toBe(800);
      expect(heading?.animations?.intensity).toBe('medium');

      // Validate schema
      const parsed = AnimationDefinitionSchema.safeParse(heading?.animations);
      expect(parsed.success).toBe(true);
    });

    it('should remove animation when set to none or null', () => {
      treeOps.updateAnimation(testDoc, 'page_home', 'heading_hero', { preset: 'scale' });
      expect(treeOps.findNode(testDoc.pages[0].root, 'heading_hero')?.animations).toBeDefined();

      treeOps.updateAnimation(testDoc, 'page_home', 'heading_hero', { preset: 'none' });
      expect(treeOps.findNode(testDoc.pages[0].root, 'heading_hero')?.animations).toBeUndefined();
    });
  });

  // ─── 6. IMAGE CONFIGURATION & FOCAL POINT ───────────────────────────────────
  describe('6. Image Configuration & Focal Point / Crop', () => {
    it('should support crop, focal-point, aspect ratio, and objectFit on image nodes', () => {
      treeOps.updateProps(testDoc, 'page_home', 'img_hero', {
        focalPoint: { x: 75, y: 30 },
        crop: { x: 10, y: 10, width: 80, height: 80 },
        aspectRatio: '4/3',
        objectFit: 'contain',
      });

      const img = treeOps.findNode(testDoc.pages[0].root, 'img_hero');
      expect(img?.props?.focalPoint).toEqual({ x: 75, y: 30 });
      expect(img?.props?.crop).toEqual({ x: 10, y: 10, width: 80, height: 80 });
      expect(img?.props?.aspectRatio).toBe('4/3');
      expect(img?.props?.objectFit).toBe('contain');
    });
  });

  // ─── 7. GRID & FLEX CONFIGURATION ───────────────────────────────────────────
  describe('7. Grid & Flex / Stack Configuration', () => {
    it('should update grid columns and gap properties', () => {
      treeOps.updateStyles(testDoc, 'page_home', 'features_grid', {
        grid: {
          columns: 4,
          gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
          columnGap: '32px',
          rowGap: '32px',
        },
      });

      const grid = treeOps.findNode(testDoc.pages[0].root, 'features_grid');
      expect(grid?.styles?.grid?.columns).toBe(4);
      expect(grid?.styles?.grid?.columnGap).toBe('32px');
    });
  });

  // ─── 8. COPY / PASTE & DUPLICATION ──────────────────────────────────────────
  describe('8. Document-Safe Copy / Paste & Duplication', () => {
    it('should duplicate a card subtree with fresh unique IDs and preserved styles', () => {
      const initialCount = treeOps.countNodes(testDoc.pages[0].root);

      const duplicated = treeOps.duplicateNode(
        testDoc,
        'page_home',
        'card_1',
        'features_grid',
      );

      expect(duplicated.id).not.toBe('card_1');
      expect(duplicated.name).toBe('Card 1 (Copy)');
      expect(duplicated.children![0].id).not.toBe('h_card_1');

      const currentCount = treeOps.countNodes(testDoc.pages[0].root);
      expect(currentCount).toBe(initialCount + treeOps.countNodes(duplicated));
    });

    it('should paste a node subtree into a container with fresh IDs', () => {
      const nodeToPaste: WebsiteNode = {
        id: 'btn_external',
        type: 'button',
        name: 'Explore Button',
        props: { label: 'Explore Ecosystem' },
        styles: { typography: { color: '#ffffff' } },
        states: { hover: { background: { color: '#4338ca' } } },
        animations: { preset: 'fade-right' },
      };

      const pasted = treeOps.pasteNode(
        testDoc,
        'page_home',
        'container_hero',
        nodeToPaste,
      );

      expect(pasted.id).not.toBe('btn_external');
      expect(pasted.name).toBe('Explore Button (Copy)');
      expect(pasted.states?.hover?.background?.color).toBe('#4338ca');
      expect(pasted.animations?.preset).toBe('fade-right');

      const found = treeOps.findNode(testDoc.pages[0].root, pasted.id);
      expect(found).toBeDefined();
    });
  });

  // ─── 9. CHANGE LAYOUT ───────────────────────────────────────────────────────
  describe('9. Change Layout Operation', () => {
    it('should transform a container/stack layout without losing children', () => {
      // Convert features_grid to a stack
      treeOps.changeLayout(testDoc, 'page_home', 'features_grid', 'stack', {
        direction: 'column',
        gap: '20px',
      });

      const transformed = treeOps.findNode(testDoc.pages[0].root, 'features_grid');
      expect(transformed?.type).toBe('stack');
      expect(transformed?.styles?.layout?.display).toBe('flex');
      expect(transformed?.styles?.flex?.direction).toBe('column');
      expect(transformed?.styles?.flex?.gap).toBe('20px');
      // All 3 cards remain intact
      expect(transformed?.children?.length).toBe(3);
      expect(transformed?.children?.[0].id).toBe('card_1');
    });
  });

  // ─── 10. REPLACE SECTION ────────────────────────────────────────────────────
  describe('10. Replace Section Operation with Content Preservation', () => {
    it('should replace features 3-column section with a Bento variant preserving text and headings', () => {
      const originalHeading = 'Key Architectural Advantages';
      const originalSub = 'Engineered for reliability, velocity, and complete designer autonomy.';

      const replaced = treeOps.replaceSection(
        testDoc,
        'page_home',
        'sec_features',
        'bento',
        'features',
        true, // preserveContent
      );

      expect(replaced.id).toBe('sec_features');
      expect(replaced.props?.variant).toBe('bento');

      // Verify original content was migrated into the new bento structure
      const newHeading = treeOps.findNode(replaced, replaced.children![0].children![0].id);
      expect(newHeading?.props?.text).toBe(originalHeading);

      const newSub = treeOps.findNode(replaced, replaced.children![0].children![1].id);
      expect(newSub?.props?.text).toBe(originalSub);
    });
  });

  // ─── 11. NODE LABELS ────────────────────────────────────────────────────────
  describe('11. Node Labels', () => {
    it('should update friendly editor label without changing internal node ID', () => {
      treeOps.setNodeLabel(testDoc, 'page_home', 'sec_hero', 'Prime Showcase Banner');
      const sec = treeOps.findNode(testDoc.pages[0].root, 'sec_hero');
      expect(sec?.name).toBe('Prime Showcase Banner');
      expect(sec?.id).toBe('sec_hero');
    });
  });

  // ─── 12. VISIBILITY & NODE LOCKING ──────────────────────────────────────────
  describe('12. Visibility & Node Locking', () => {
    it('should toggle responsive visibility on nodes', () => {
      treeOps.setVisibility(testDoc, 'page_home', 'img_hero', {
        desktop: true,
        tablet: true,
        mobile: false, // hidden on mobile
      });

      const img = treeOps.findNode(testDoc.pages[0].root, 'img_hero');
      expect(img?.visibility?.mobile).toBe(false);
      expect(img?.visibility?.desktop).toBe(true);
    });

    it('should lock a node and reject editing operations until unlocked', () => {
      // Lock the button
      treeOps.setLock(testDoc, 'page_home', 'btn_hero', true);
      const btn = treeOps.findNode(testDoc.pages[0].root, 'btn_hero');
      expect(btn?.locked).toBe(true);

      // Attempting to update props on locked node must throw BadRequestException
      expect(() =>
        treeOps.updateProps(testDoc, 'page_home', 'btn_hero', { label: 'Should Fail' }),
      ).toThrow(BadRequestException);

      // Attempting to update styles on locked node must throw BadRequestException
      expect(() =>
        treeOps.updateStyles(testDoc, 'page_home', 'btn_hero', {
          typography: { fontSize: '20px' },
        }),
      ).toThrow(BadRequestException);

      // Attempting to delete locked node must throw BadRequestException
      expect(() =>
        treeOps.removeNode(testDoc, 'page_home', 'btn_hero'),
      ).toThrow(BadRequestException);

      // Unlock button and verify modifications succeed
      treeOps.setLock(testDoc, 'page_home', 'btn_hero', false);
      treeOps.updateProps(testDoc, 'page_home', 'btn_hero', { label: 'Unlocked Success' });
      expect(treeOps.findNode(testDoc.pages[0].root, 'btn_hero')?.props?.label).toBe('Unlocked Success');
    });

    it('should prevent modifying child nodes when ancestor is locked', () => {
      // Lock container_hero
      treeOps.setLock(testDoc, 'page_home', 'container_hero', true);

      // Attempting to modify child heading_hero must throw
      expect(() =>
        treeOps.updateProps(testDoc, 'page_home', 'heading_hero', { text: 'Child update' }),
      ).toThrow(BadRequestException);
    });
  });

  // ─── 13. BATCH OPERATIONS & REVISIONS ───────────────────────────────────────
  describe('13. Batch Operations & Transactional Integrity', () => {
    it('should execute a multi-operation batch atomically', () => {
      const batchOperations: any[] = [
        {
          type: 'updateProps',
          pageId: 'page_home',
          nodeId: 'heading_hero',
          props: { text: 'Batch Modified Heading' },
        },
        {
          type: 'updateStyles',
          pageId: 'page_home',
          nodeId: 'heading_hero',
          styles: { typography: { fontSize: '56px' } },
        },
        {
          type: 'updateState',
          pageId: 'page_home',
          nodeId: 'btn_hero',
          state: 'hover',
          styles: { background: { color: '#000000' } },
        },
        {
          type: 'setNodeLabel',
          pageId: 'page_home',
          nodeId: 'sec_hero',
          label: 'Hero Main',
        },
      ];

      const updatedDoc = treeOps.applyOperations(testDoc, batchOperations);
      const heading = treeOps.findNode(updatedDoc.pages[0].root, 'heading_hero');
      const btn = treeOps.findNode(updatedDoc.pages[0].root, 'btn_hero');
      const sec = treeOps.findNode(updatedDoc.pages[0].root, 'sec_hero');

      expect(heading?.props?.text).toBe('Batch Modified Heading');
      expect(heading?.styles?.typography?.fontSize).toBe('56px');
      expect(btn?.states?.hover?.background?.color).toBe('#000000');
      expect(sec?.name).toBe('Hero Main');
    });

    it('should roll back entire batch if any operation in sequence fails', () => {
      const originalText = testDoc.pages[0].root.children![0].children![0].children![0].props?.text;

      const failingBatch: any[] = [
        {
          type: 'updateProps',
          pageId: 'page_home',
          nodeId: 'heading_hero',
          props: { text: 'Temporary Uncommitted Change' },
        },
        {
          type: 'removeNode',
          pageId: 'page_home',
          nodeId: 'non_existent_node_12345', // FAILS HERE
        },
      ];

      expect(() => treeOps.applyOperations(testDoc, failingBatch)).toThrow(BadRequestException);

      // Initial document was not modified
      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero');
      expect(heading?.props?.text).toBe(originalText);
    });
  });

  // ─── 14. DOCUMENT VALIDATION & SANITIZATION ─────────────────────────────────
  describe('14. Document Validation & Security Sanitization', () => {
    it('should validate and normalize a document with M3.1 precision features', () => {
      const normalized = validator.validateV3(testDoc);
      expect(normalized.schemaVersion).toBe('3.0');
      expect(normalized.pages[0].root.children![0].styles?.background?.overlay?.color).toBe('#000000');
    });

    it('should sanitize XSS script injection in props during validation', () => {
      testDoc.pages[0].root.children![0].children![0].children![0].props = {
        text: 'Malicious <script>alert("XSS")</script> copy',
      };

      const normalized = validator.validateV3(testDoc);
      const cleanHeading = normalized.pages[0].root.children![0].children![0].children![0];
      expect(cleanHeading.props?.text).not.toContain('<script>');
      expect(cleanHeading.props?.text).toBe('Malicious  copy');
    });
  });
});
