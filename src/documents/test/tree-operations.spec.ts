import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TreeOperationsService } from '../services/tree-operations.service';
import { WebsiteDocumentV3, WebsiteNode, PageDocumentV3 } from '../types/document.types';

describe('TreeOperationsService — Visual Tree Engine', () => {
  let treeOps: TreeOperationsService;
  let testDoc: WebsiteDocumentV3;

  const createBlankDoc = (): WebsiteDocumentV3 => ({
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
              styles: { layout: { position: 'relative', width: '100%' } },
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
                      props: { label: 'Explore More', href: '#features' },
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
  });

  beforeEach(() => {
    treeOps = new TreeOperationsService();
    testDoc = createBlankDoc();
  });

  describe('Add Node', () => {
    it('should add a container into a section', () => {
      const newContainer: WebsiteNode = {
        id: 'container_new',
        type: 'container',
        name: 'New Container',
        props: { maxWidth: '1000px' },
      };

      treeOps.addNode(testDoc, 'page_home', 'sec_hero', newContainer);
      const parent = treeOps.findNode(testDoc.pages[0].root, 'sec_hero');
      expect(parent?.children?.length).toBe(2);
      expect(parent?.children?.[1].id).toBe('container_new');
    });

    it('should insert a node at a specific index', () => {
      const paragraph: WebsiteNode = {
        id: 'p_subtitle',
        type: 'paragraph',
        name: 'Subtitle',
        props: { text: 'Subheading text here' },
      };

      // Insert between heading (index 0) and button (index 1)
      treeOps.addNode(testDoc, 'page_home', 'container_hero', paragraph, 1);
      const container = treeOps.findNode(testDoc.pages[0].root, 'container_hero');
      expect(container?.children?.length).toBe(3);
      expect(container?.children?.[1].id).toBe('p_subtitle');
      expect(container?.children?.[2].id).toBe('btn_hero');
    });

    it('should reject adding a child to a leaf node (e.g. heading)', () => {
      const invalidChild: WebsiteNode = {
        id: 'btn_nested',
        type: 'button',
        props: { label: 'Invalid' },
      };

      expect(() =>
        treeOps.addNode(testDoc, 'page_home', 'heading_hero', invalidChild),
      ).toThrow(BadRequestException);
    });

    it('should reject adding an illegal child type according to child constraints (e.g. heading directly under page-root)', () => {
      const invalidHeading: WebsiteNode = {
        id: 'heading_root',
        type: 'heading',
        props: { text: 'Direct Heading' },
      };

      expect(() =>
        treeOps.addNode(testDoc, 'page_home', 'root_page_home', invalidHeading),
      ).toThrow(BadRequestException);
    });
  });

  describe('Remove Node', () => {
    it('should safely remove an element and update parent children array', () => {
      treeOps.removeNode(testDoc, 'page_home', 'btn_hero');
      const container = treeOps.findNode(testDoc.pages[0].root, 'container_hero');
      expect(container?.children?.length).toBe(1);
      expect(container?.children?.[0].id).toBe('heading_hero');
    });

    it('should prevent deleting the page root node', () => {
      expect(() =>
        treeOps.removeNode(testDoc, 'page_home', 'root_page_home'),
      ).toThrow(BadRequestException);
    });

    it('should throw NotFoundException for non-existent nodes', () => {
      expect(() =>
        treeOps.removeNode(testDoc, 'page_home', 'non_existent_id'),
      ).toThrow(NotFoundException);
    });
  });

  describe('Duplicate Node', () => {
    it('should duplicate a node with fresh unique IDs and insert next to source node', () => {
      const duplicated = treeOps.duplicateNode(testDoc, 'page_home', 'heading_hero');

      expect(duplicated.id).not.toBe('heading_hero');
      expect(duplicated.type).toBe('heading');
      expect(duplicated.props?.text).toBe('Next-Gen Architecture');

      const container = treeOps.findNode(testDoc.pages[0].root, 'container_hero');
      expect(container?.children?.length).toBe(3);
      expect(container?.children?.[1].id).toBe(duplicated.id);
    });

    it('should recursively assign new IDs to all descendants when duplicating a section with subtree', () => {
      const duplicatedSec = treeOps.duplicateNode(testDoc, 'page_home', 'sec_hero');

      expect(duplicatedSec.id).not.toBe('sec_hero');
      expect(duplicatedSec.children?.[0].id).not.toBe('container_hero');
      expect(duplicatedSec.children?.[0].children?.[0].id).not.toBe('heading_hero');
    });
  });

  describe('Move Node & Circular Ancestry Prevention', () => {
    it('should move a node from one container to another and respect index', () => {
      // Add second container
      const container2: WebsiteNode = {
        id: 'container_footer_area',
        type: 'container',
        children: [],
      };
      treeOps.addNode(testDoc, 'page_home', 'sec_hero', container2);

      // Move button into second container
      treeOps.moveNode(testDoc, 'page_home', 'btn_hero', 'container_footer_area', 0);

      const oldContainer = treeOps.findNode(testDoc.pages[0].root, 'container_hero');
      const newContainer = treeOps.findNode(testDoc.pages[0].root, 'container_footer_area');

      expect(oldContainer?.children?.some((c) => c.id === 'btn_hero')).toBe(false);
      expect(newContainer?.children?.[0].id).toBe('btn_hero');
    });

    it('should prevent circular moves (cannot move an ancestor into its own descendant)', () => {
      // Trying to move sec_hero into container_hero
      expect(() =>
        treeOps.moveNode(testDoc, 'page_home', 'sec_hero', 'container_hero', 0),
      ).toThrow(BadRequestException);
    });

    it('should prevent moving a node into itself', () => {
      expect(() =>
        treeOps.moveNode(testDoc, 'page_home', 'sec_hero', 'sec_hero', 0),
      ).toThrow(BadRequestException);
    });
  });

  describe('Update Props & Styles & Responsive', () => {
    it('should update props on a heading', () => {
      treeOps.updateProps(testDoc, 'page_home', 'heading_hero', {
        text: 'Updated Digital Experience',
        level: 2,
      });

      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero');
      expect(heading?.props?.text).toBe('Updated Digital Experience');
      expect(heading?.props?.level).toBe(2);
    });

    it('should update structured styles deeply without wiping existing sub-properties', () => {
      treeOps.updateStyles(testDoc, 'page_home', 'heading_hero', {
        typography: { color: '#6366f1' },
      });

      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero');
      expect(heading?.styles?.typography?.color).toBe('#6366f1');
      expect(heading?.styles?.typography?.fontSize).toBe('48px'); // Preserved
    });

    it('should set responsive overrides and visibility', () => {
      treeOps.updateResponsive(testDoc, 'page_home', 'heading_hero', {
        mobile: { typography: { fontSize: '28px' } },
      });
      treeOps.setVisibility(testDoc, 'page_home', 'btn_hero', {
        desktop: true,
        tablet: true,
        mobile: false, // Hide on mobile
      });

      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero');
      const btn = treeOps.findNode(testDoc.pages[0].root, 'btn_hero');

      expect(heading?.responsive?.mobile?.typography?.fontSize).toBe('28px');
      expect(btn?.visibility?.mobile).toBe(false);
    });
  });

  describe('Transactional Batch Operations', () => {
    it('should apply multiple operations in sequence', () => {
      const ops = [
        {
          type: 'updateProps' as const,
          pageId: 'page_home',
          nodeId: 'heading_hero',
          props: { text: 'Grow 10x Faster' },
        },
        {
          type: 'addNode' as const,
          pageId: 'page_home',
          parentId: 'container_hero',
          node: { id: 'badge_new', type: 'badge' as const, props: { text: 'V3 Builder' } },
          index: 0,
        },
      ];

      const result = treeOps.applyOperations(testDoc, ops);
      const heading = treeOps.findNode(result.pages[0].root, 'heading_hero');
      const container = treeOps.findNode(result.pages[0].root, 'container_hero');

      expect(heading?.props?.text).toBe('Grow 10x Faster');
      expect(container?.children?.[0].id).toBe('badge_new');
    });

    it('should roll back completely if any operation in batch fails', () => {
      const ops = [
        {
          type: 'updateProps' as const,
          pageId: 'page_home',
          nodeId: 'heading_hero',
          props: { text: 'Grow 10x Faster' },
        },
        {
          type: 'removeNode' as const,
          pageId: 'page_home',
          nodeId: 'invalid_node_id_will_fail',
        },
      ];

      expect(() => treeOps.applyOperations(testDoc, ops)).toThrow(BadRequestException);

      // Initial document must remain pristine
      const heading = treeOps.findNode(testDoc.pages[0].root, 'heading_hero');
      expect(heading?.props?.text).toBe('Next-Gen Architecture');
    });
  });
});
