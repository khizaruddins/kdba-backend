import { z } from 'zod';
import { WebsiteNodeSchema } from './node.schema';
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
  slug: z.string().trim().regex(/^(\/|\/[a-z0-9-_/]*)$/, 'Invalid page slug format (must begin with /)'),
  type: z
    .enum(['home', 'about', 'services', 'contact', 'pricing', 'portfolio', 'blog', 'custom'])
    .default('custom'),
  sortOrder: z.number().int().default(0),
  enabled: z.boolean().default(true),
  seo: z
    .object({
      title: safeString(200).optional(),
      description: safeString(500).optional(),
      ogImage: safeUrl.optional(),
      noIndex: z.boolean().optional(),
      canonicalUrl: safeUrl.optional(),
    })
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
  analyticsId: safeString(100).optional(),
  customDomain: safeString(200).optional(),
  subdomain: safeString(100).optional(),
  enableContactForm: z.boolean().default(true),
  enableLiveChat: z.boolean().optional().default(false),
  language: safeString(10).default('en'),
  limits: z
    .object({
      maxNodes: z.number().int().default(2000),
      maxDepth: z.number().int().default(32),
      maxRichTextChars: z.number().int().default(50000),
    })
    .optional(),
});

// ─── CANONICAL V3 WEBSITE DOCUMENT SCHEMA ─────────────────────────────────────

export const WebsiteDocumentV3Schema = z.object({
  schemaVersion: z.literal('3.0'),
  site: SiteMetadataSchema,
  theme: ThemeSystemV3Schema,
  business: BusinessInfoSchema,
  navigation: NavigationSchema,
  pages: z.array(PageDocumentV3Schema).min(1, 'Website document must contain at least one page'),
  global: GlobalComponentsV3Schema.default({ reusableNodes: {} }),
  seo: GlobalSeoSchema,
  settings: SiteSettingsV3Schema,
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
  operations: z.array(DocumentOperationSchema).min(1, 'At least one operation is required'),
});
