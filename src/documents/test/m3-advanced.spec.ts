import { BadRequestException } from '@nestjs/common';
import { TreeOperationsService } from '../services/tree-operations.service';
import { DocumentValidatorService } from '../services/document-validator.service';
import { getComponentManifest } from '../contracts/component-registry';
import { DocumentOperationsPayloadSchema } from '../schemas/v3/document-v3.schema';
import { WebsiteDocumentV3 } from '../types/document.types';
import { validateContactSubmission } from '../contracts/form-fields';
import { getDefaultNode } from '../contracts/component-registry';

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
    business: { name: 'Studio' },
    navigation: { header: [], footer: [] },
    pages: [
      {
        id: 'page_home',
        title: 'Home',
        slug: '/',
        type: 'home',
        sortOrder: 0,
        enabled: true,
        isHomepage: true,
        showInNavigation: true,
        root: {
          id: 'root_page_home',
          type: 'page-root',
          children: [
            {
              id: 'sec_hero',
              type: 'section',
              name: 'Hero',
              children: [{ id: 'heading_hero', type: 'heading', props: { text: 'Hello', level: 1 } }],
            },
          ],
        },
      },
    ],
    global: { reusableNodes: {} },
    seo: { metaTitle: 'Test', metaDescription: 'Test' },
    settings: { enableContactForm: true, language: 'en' },
  };
}

describe('M3 advanced builder operations', () => {
  const treeOps = new TreeOperationsService();
  const validator = new DocumentValidatorService();

  describe('pages and navigation', () => {
    it('creates, reorders, duplicates, hides from nav, and deletes pages', () => {
      const doc = blankDoc();
      treeOps.addPage(doc, {
        id: 'page_about',
        title: 'About',
        slug: '/about',
        type: 'about',
        sortOrder: 1,
        enabled: true,
        root: { id: 'root_about', type: 'page-root', children: [] },
      });
      doc.navigation.header = [
        { id: 'nav_home', label: 'Home', href: '/', kind: 'page', pageId: 'page_home', visible: true },
        { id: 'nav_about', label: 'About', href: '/about', kind: 'page', pageId: 'page_about', visible: true },
        {
          id: 'nav_more',
          label: 'More',
          href: '#',
          kind: 'url',
          children: [
            { id: 'nav_nested', label: 'About nested', href: '/about', kind: 'page', pageId: 'page_about' },
          ],
        },
      ];

      treeOps.updatePage(doc, 'page_about', { title: 'Our story', showInNavigation: false });
      expect(doc.pages.find((page) => page.id === 'page_about')?.title).toBe('Our story');
      expect(doc.navigation.header.find((item) => item.id === 'nav_about')?.visible).toBe(false);

      treeOps.reorderPages(doc, ['page_about', 'page_home']);
      expect(doc.pages.map((page) => page.id)).toEqual(['page_about', 'page_home']);

      treeOps.updatePage(doc, 'page_about', { isHomepage: true });
      expect(doc.pages.find((page) => page.id === 'page_about')?.isHomepage).toBe(true);
      expect(doc.pages.find((page) => page.id === 'page_home')?.isHomepage).toBe(false);

      const copy = treeOps.duplicatePage(doc, 'page_about');
      expect(copy.slug).toBe('/about-copy');
      expect(copy.isHomepage).toBe(false);

      treeOps.removePage(doc, 'page_about');
      expect(doc.pages.some((page) => page.id === 'page_about')).toBe(false);
      expect(doc.navigation.header.some((item) => item.pageId === 'page_about')).toBe(false);
      expect(doc.navigation.header[1].children?.some((item) => item.pageId === 'page_about')).toBe(false);
      validator.validateV3(doc);
    });
  });

  describe('replace, rename, hide, lock', () => {
    it('replaces a subtree with new ids at the same position', () => {
      const doc = blankDoc();
      const replacement = treeOps.replaceSubtree(doc, 'page_home', 'sec_hero', {
        id: 'sec_hero',
        type: 'section',
        name: 'Replaced hero',
        children: [{ id: 'heading_hero', type: 'heading', props: { text: 'New hero', level: 1 } }],
      });
      expect(replacement.id).not.toBe('sec_hero');
      expect(replacement.children?.[0].id).not.toBe('heading_hero');
      expect(doc.pages[0].root.children?.[0].id).toBe(replacement.id);
      validator.validateV3(doc);
    });

    it('renames and hides nodes, and blocks edits while locked', () => {
      const doc = blankDoc();
      treeOps.renameNode(doc, 'page_home', 'sec_hero', 'Opening');
      treeOps.hideNode(doc, 'page_home', 'heading_hero', true);
      expect(treeOps.findNode(doc.pages[0].root, 'sec_hero')?.name).toBe('Opening');
      expect(treeOps.findNode(doc.pages[0].root, 'heading_hero')?.visibility?.mobile).toBe(false);

      treeOps.setLocked(doc, 'page_home', 'heading_hero', true);
      expect(() => treeOps.updateProps(doc, 'page_home', 'heading_hero', { text: 'Nope' })).toThrow(
        BadRequestException,
      );
      expect(() => treeOps.removeNode(doc, 'page_home', 'heading_hero')).toThrow(BadRequestException);

      treeOps.setLocked(doc, 'page_home', 'heading_hero', false);
      treeOps.updateProps(doc, 'page_home', 'heading_hero', { text: 'Yes' });
      expect(treeOps.findNode(doc.pages[0].root, 'heading_hero')?.props?.text).toBe('Yes');
    });

    it('inserts sections through insertSection and paste with new ids', () => {
      const next = treeOps.applyOperations(blankDoc(), [
        {
          type: 'insertSection',
          pageId: 'page_home',
          parentId: 'root_page_home',
          blockId: 'cta-minimal',
        },
      ]);
      expect(next.pages[0].root.children?.length).toBeGreaterThan(1);
      const pasted = treeOps.pasteNode(next, 'page_home', 'root_page_home', {
        id: 'sec_hero',
        type: 'section',
        locked: true,
        children: [{ id: 'heading_hero', type: 'heading', props: { text: 'Pasted', level: 2 } }],
      });
      expect(pasted.id).not.toBe('sec_hero');
      expect(pasted.locked).toBeUndefined();
      validator.validateV3(next);
    });
  });

  describe('inspector metadata and form fields', () => {
    it('exposes heading, image, and button inspector fields', () => {
      const manifest = getComponentManifest();
      const image = manifest.find((item) => item.type === 'image');
      const button = manifest.find((item) => item.type === 'button');
      expect(image?.editableFields.map((field) => field.key)).toEqual(
        expect.arrayContaining(['mediaId', 'alt', 'aspectRatio', 'objectFit']),
      );
      expect(button?.editableFields.map((field) => field.key)).toEqual(
        expect.arrayContaining(['label', 'href', 'variant', 'size']),
      );
    });

    it('validates number and date fields server-side', () => {
      const ok = validateContactSubmission(
        { name: 'Ada', email: 'ada@studio.com', fields: { quantity: 3, preferredDate: '2026-09-15' } },
        [
          { id: 'name', type: 'name', label: 'Name', required: true },
          { id: 'email', type: 'email', label: 'Email', required: true },
          { id: 'number', type: 'number', name: 'quantity', label: 'Quantity', validation: { min: 1, max: 10 } },
          { id: 'date', type: 'date', name: 'preferredDate', label: 'Date' },
        ],
      );
      expect(ok.message).toContain('quantity: 3');
      expect(() =>
        validateContactSubmission(
          { name: 'Ada', email: 'ada@studio.com', fields: { quantity: 99 } },
          [{ id: 'number', type: 'number', name: 'quantity', label: 'Quantity', validation: { max: 10 } }],
        ),
      ).toThrow(/maximum/i);
    });

    it('accepts the new operation types', () => {
      const parsed = DocumentOperationsPayloadSchema.safeParse({
        operations: [
          { type: 'renameNode', pageId: 'page_home', nodeId: 'sec_hero', name: 'Hero' },
          { type: 'hideNode', pageId: 'page_home', nodeId: 'sec_hero', hidden: true },
          { type: 'setLocked', pageId: 'page_home', nodeId: 'sec_hero', locked: true },
          {
            type: 'replaceSubtree',
            pageId: 'page_home',
            nodeId: 'sec_hero',
            node: getDefaultNode('section', 'sec_next'),
          },
        ],
      });
      expect(parsed.success).toBe(true);
    });
  });
});
