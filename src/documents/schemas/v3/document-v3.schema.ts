import { z } from 'zod';
import { WebsiteNodeSchema, AnimationDefinitionSchema } from './node.schema';
import { ThemeSystemV3Schema, StyleDefinitionSchema, ResponsiveStyleDefinitionSchema, ResponsiveVisibilitySchema } from './style.schema';
import {
  BusinessInfoSchema,
  NavigationSchema,
  GlobalSeoSchema,
  SiteMetadataSchema,
} from '../document.schema';

const safeString = (maxLen = 500) => z.string().trim().max(maxLen);
const safeUrl = z
  .string()
  .trim()
  .refine(
    (val) =>
      val === '' ||
      val.startsWith('/') ||
      val.startsWith('#') ||
      val.startsWith('mailto:') ||
      val.startsWith('tel:') ||
      val.startsWith('https://') ||
      val.startsWith('http://'),
    {
      message: 'Invalid URL scheme. Must be relative, anchor, tel, mailto, or http(s)',
    },
  );

// ─── PAGE V3 SCHEMA ───────────────────────────────────────────────────────────

export const PageDocumentV3Schema = z.object({
  id: safeString(100),
  title: safeString(150),
  slug: z
    .string()
    .trim()
    .transform((val) => {
      if (!val || val === '') return '/';
      return val.startsWith('/') ? val : `/${val}`;
    })
    .refine((val) => /^(\/|\/[a-zA-Z0-9-_/]*)$/.test(val), {
      message: 'Invalid page slug format',
    }),
  type: z
    .string()
    .transform((val) => val.toLowerCase())
    .pipe(
      z.enum(['home', 'about', 'services', 'contact', 'pricing', 'portfolio', 'blog', 'custom']).or(z.string()),
    )
    .default('custom'),
  sortOrder: z.number().int().default(0),
  enabled: z.boolean().default(true),
  seo: z
    .object({
      title: safeString(200).nullable().optional(),
      description: safeString(500).nullable().optional(),
      ogImage: safeUrl.nullable().optional(),
      noIndex: z.boolean().nullable().optional(),
      canonicalUrl: safeUrl.nullable().optional(),
    })
    .nullable()
    .optional(),
  root: WebsiteNodeSchema.refine((node) => node.type === 'page-root', {
    message: 'Page root node must be of type "page-root"',
  }),
});

// ─── GLOBAL COMPONENTS V3 SCHEMA ──────────────────────────────────────────────

export const GlobalComponentsV3Schema = z.object({
  headerNode: WebsiteNodeSchema.optional(),
  footerNode: WebsiteNodeSchema.optional(),
  reusableNodes: z.record(z.string(), WebsiteNodeSchema).optional().default({}),
});

// ─── SITE SETTINGS V3 SCHEMA ──────────────────────────────────────────────────

export const SiteSettingsV3Schema = z.object({
  analyticsId: safeString(100).nullable().optional(),
  customDomain: safeString(200).nullable().optional(),
  subdomain: safeString(100).nullable().optional(),
  enableContactForm: z.boolean().default(true),
  enableLiveChat: z.boolean().nullable().optional().default(false),
  language: safeString(10).default('en'),
  limits: z
    .object({
      maxNodes: z.number().int().default(2000),
      maxDepth: z.number().int().default(32),
      maxRichTextChars: z.number().int().default(50000),
    })
    .nullable()
    .optional(),
});

// ─── CANONICAL V3 WEBSITE DOCUMENT SCHEMA ─────────────────────────────────────

export const WebsiteDocumentV3Schema = z.object({
  schemaVersion: z.literal('3.0'),
  site: SiteMetadataSchema,
  theme: ThemeSystemV3Schema,
  business: BusinessInfoSchema.optional().default({ name: 'My Website' }),
  navigation: NavigationSchema.optional().default({ header: [], footer: [] }),
  pages: z.array(PageDocumentV3Schema).min(1, 'Website document must contain at least one page'),
  global: GlobalComponentsV3Schema.optional().default({ reusableNodes: {} }),
  seo: GlobalSeoSchema.optional().default({ metaTitle: '', metaDescription: '', keywords: [] }),
  settings: SiteSettingsV3Schema.optional().default({ enableContactForm: true, enableLiveChat: false, language: 'en' }),
});

// ─── TYPED DOCUMENT OPERATIONS SCHEMA ─────────────────────────────────────────

export const DocumentOperationSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('addNode'),
    pageId: safeString(100),
    parentId: safeString(100),
    node: WebsiteNodeSchema,
    index: z.number().int().min(0).optional(),
  }),
  z.object({
    type: z.literal('removeNode'),
    pageId: safeString(100),
    nodeId: safeString(100),
  }),
  z.object({
    type: z.literal('duplicateNode'),
    pageId: safeString(100),
    nodeId: safeString(100),
    targetParentId: safeString(100).optional(),
    index: z.number().int().min(0).optional(),
  }),
  z.object({
    type: z.literal('moveNode'),
    pageId: safeString(100),
    nodeId: safeString(100),
    targetParentId: safeString(100),
    targetIndex: z.number().int().min(0),
  }),
  z.object({
    type: z.literal('updateNode'),
    pageId: safeString(100),
    nodeId: safeString(100),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('updateProps'),
    pageId: safeString(100),
    nodeId: safeString(100),
    props: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('updateStyles'),
    pageId: safeString(100),
    nodeId: safeString(100),
    styles: StyleDefinitionSchema,
  }),
  z.object({
    type: z.literal('updateResponsive'),
    pageId: safeString(100),
    nodeId: safeString(100),
    responsive: ResponsiveStyleDefinitionSchema,
  }),
  z.object({
    type: z.literal('updateState'),
    pageId: safeString(100),
    nodeId: safeString(100),
    state: z.enum(['hover', 'active', 'focus', 'disabled']),
    styles: StyleDefinitionSchema.nullable(),
  }),
  z.object({
    type: z.literal('updateAnimation'),
    pageId: safeString(100),
    nodeId: safeString(100),
    animation: AnimationDefinitionSchema.nullable(),
  }),
  z.object({
    type: z.literal('resetResponsive'),
    pageId: safeString(100),
    nodeId: safeString(100),
    breakpoint: safeString(50),
    propertyPaths: z.array(safeString(100)).optional(),
  }),
  z.object({
    type: z.literal('setNodeLabel'),
    pageId: safeString(100),
    nodeId: safeString(100),
    label: safeString(150),
  }),
  z.object({
    type: z.literal('setLock'),
    pageId: safeString(100),
    nodeId: safeString(100),
    locked: z.boolean(),
  }),
  z.object({
    type: z.literal('pasteNode'),
    pageId: safeString(100),
    targetParentId: safeString(100),
    node: WebsiteNodeSchema,
    index: z.number().int().min(0).optional(),
  }),
  z.object({
    type: z.literal('changeLayout'),
    pageId: safeString(100),
    nodeId: safeString(100),
    layoutType: safeString(50),
    options: z
      .object({
        columns: z.number().int().min(1).max(24).optional(),
        gap: safeString(50).optional(),
        direction: z.enum(['row', 'row-reverse', 'column', 'column-reverse']).optional(),
        wrap: z.enum(['nowrap', 'wrap', 'wrap-reverse']).optional(),
        alignItems: safeString(50).optional(),
        justifyContent: safeString(50).optional(),
        preserveContent: z.boolean().optional(),
      })
      .optional(),
  }),
  z.object({
    type: z.literal('replaceSection'),
    pageId: safeString(100),
    sectionId: safeString(100),
    targetVariant: safeString(100),
    targetSectionType: safeString(50).optional(),
    preserveContent: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('setVisibility'),
    pageId: safeString(100),
    nodeId: safeString(100),
    visibility: ResponsiveVisibilitySchema,
  }),
  z.object({
    type: z.literal('changeParent'),
    pageId: safeString(100),
    nodeId: safeString(100),
    newParentId: safeString(100),
    index: z.number().int().min(0).optional(),
  }),
  z.object({
    type: z.literal('reorderChildren'),
    pageId: safeString(100),
    parentId: safeString(100),
    childIds: z.array(safeString(100)),
  }),
  z.object({
    type: z.literal('addPage'),
    page: PageDocumentV3Schema,
  }),
  z.object({
    type: z.literal('updatePage'),
    pageId: safeString(100),
    patch: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('removePage'),
    pageId: safeString(100),
  }),
  z.object({
    type: z.literal('reorderPages'),
    pageIds: z.array(safeString(100)),
  }),
  z.object({
    type: z.literal('updateTheme'),
    theme: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('updateBusiness'),
    business: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('updateNavigation'),
    navigation: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('updateSeo'),
    seo: z.record(z.string(), z.unknown()),
  }),
  z.object({
    type: z.literal('updateSettings'),
    settings: z.record(z.string(), z.unknown()),
  }),
]);

export const DocumentOperationsPayloadSchema = z.object({
  baseRevision: z.number().int().min(0).optional(),
  batchName: safeString(150).optional(),
  operations: z.array(DocumentOperationSchema).min(1, 'At least one operation is required'),
});
