import { z } from 'zod';
import { SECTION_REGISTRY, isValidSectionType, isValidVariant } from '../contracts/section-registry';

// ─── SAFE STRING HELPERS ──────────────────────────────────────────────────────

const safeString = (maxLen = 500) =>
  z.string().trim().max(maxLen);

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

// ─── THEME SCHEMA ─────────────────────────────────────────────────────────────

export const ThemeSchema = z.object({
  primaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb|^hsl/, 'Invalid color format'),
  secondaryColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb|^hsl/, 'Invalid color format'),
  accentColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb|^hsl/, 'Invalid color format'),
  backgroundColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb|^hsl/, 'Invalid color format').default('#ffffff'),
  textColor: z.string().regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb|^hsl/, 'Invalid color format').default('#0f172a'),
  headingFont: safeString(100).default('Inter'),
  bodyFont: safeString(100).default('Inter'),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).or(safeString(100)).default('md'),
  shadows: z.enum(['none', 'subtle', 'medium', 'dramatic']).or(safeString(100)).default('subtle'),
  customCss: z.string().max(20000).nullable().optional(),
});

// ─── BUSINESS SCHEMA ──────────────────────────────────────────────────────────

export const BusinessInfoSchema = z.object({
  name: safeString(200),
  legalName: safeString(200).nullable().optional(),
  tagline: safeString(300).nullable().optional(),
  description: safeString(2000).nullable().optional(),
  category: safeString(100).nullable().optional(),
  logoUrl: safeUrl.nullable().optional(),
  email: z.string().email().or(z.literal('')).nullable().optional(),
  phone: safeString(50).nullable().optional(),
  whatsapp: safeString(50).nullable().optional(),
  address: safeString(300).nullable().optional(),
  city: safeString(100).nullable().optional(),
  state: safeString(100).nullable().optional(),
  country: safeString(100).nullable().optional(),
  zipCode: safeString(30).nullable().optional(),
  socialMedia: z
    .record(z.string(), z.string().max(500))
    .nullable()
    .optional()
    .default({}),
  businessHours: z
    .union([
      z.record(
        z.string(),
        z.union([
          z.object({
            open: safeString(20).optional().nullable(),
            close: safeString(20).optional().nullable(),
            closed: z.boolean().optional().nullable(),
          }),
          safeString(100),
          z.any(),
        ]),
      ),
      z.array(z.any()),
    ])
    .nullable()
    .optional()
    .default({}),
});

// ─── NAVIGATION SCHEMA ────────────────────────────────────────────────────────

export const NavItemSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: safeString(100),
    label: safeString(100),
    href: safeUrl,
    pageId: safeString(100).optional(),
    target: z.enum(['_self', '_blank']).default('_self'),
    children: z
      .array(
        z.object({
          id: safeString(100),
          label: safeString(100),
          href: safeUrl,
          target: z.enum(['_self', '_blank']).default('_self'),
        }),
      )
      .optional(),
  }),
);

export const FooterColumnSchema = z.object({
  title: safeString(100),
  links: z.array(
    z.object({
      id: safeString(100),
      label: safeString(100),
      href: safeUrl,
      target: z.enum(['_self', '_blank']).default('_self'),
    }),
  ),
});

export const NavigationSchema = z.object({
  header: z.array(NavItemSchema).default([]),
  footer: z.array(FooterColumnSchema).default([]),
  ctaButton: z
    .object({
      label: safeString(100),
      href: safeUrl,
      variant: safeString(50).optional(),
    })
    .optional(),
});

// ─── SECTION SCHEMA ───────────────────────────────────────────────────────────

export const SectionSchema = z
  .object({
    id: safeString(100),
    type: z.string().refine(isValidSectionType, {
      message: 'Unknown or unsupported section type',
    }),
    variant: safeString(100),
    enabled: z.boolean().default(true),
    sortOrder: z.number().int().default(0),
    props: z.record(z.string(), z.unknown()).default({}),
    styles: z.record(z.string(), z.unknown()).optional().default({}),
    responsive: z.record(z.string(), z.unknown()).optional(),
    animations: z.record(z.string(), z.unknown()).optional(),
    interactions: z.record(z.string(), z.unknown()).optional(),
  })
  .superRefine((val, ctx) => {
    if (isValidSectionType(val.type)) {
      if (!isValidVariant(val.type, val.variant)) {
        const allowed = SECTION_REGISTRY[val.type]?.variants.join(', ');
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['variant'],
          message: `Invalid variant "${val.variant}" for section "${val.type}". Allowed variants: [${allowed}]`,
        });
      }
    }
  });

// ─── PAGE SCHEMA ──────────────────────────────────────────────────────────────

export const PageSchema = z.object({
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
    })
    .nullable()
    .optional(),
  sections: z.array(SectionSchema).default([]),
});

// ─── SEO SCHEMA ───────────────────────────────────────────────────────────────

export const GlobalSeoSchema = z.object({
  metaTitle: safeString(200).nullable().optional().transform((v) => v || ''),
  metaDescription: safeString(500).nullable().optional().transform((v) => v || ''),
  ogImage: safeUrl.nullable().optional(),
  canonicalUrl: safeUrl.nullable().optional(),
  keywords: z.array(safeString(50)).nullable().optional().transform((v) => v || []),
});

// ─── SETTINGS SCHEMA ──────────────────────────────────────────────────────────

export const SiteSettingsSchema = z.object({
  analyticsId: safeString(100).nullable().optional(),
  customDomain: safeString(200).nullable().optional(),
  enableContactForm: z.boolean().default(true),
  enableLiveChat: z.boolean().nullable().optional().default(false),
  language: safeString(10).default('en'),
});

// ─── SITE METADATA SCHEMA ─────────────────────────────────────────────────────

export const SiteMetadataSchema = z.object({
  id: safeString(100).nullable().optional(),
  name: safeString(200),
  businessType: safeString(100).default('business'),
  language: safeString(10).default('en'),
  favicon: safeUrl.nullable().optional(),
});

// ─── FULL CANONICAL WEBSITE DOCUMENT SCHEMA ───────────────────────────────────

export const WebsiteDocumentSchema = z.object({
  schemaVersion: z.literal('2.0'),
  site: SiteMetadataSchema,
  theme: ThemeSchema,
  business: BusinessInfoSchema,
  navigation: NavigationSchema,
  pages: z.array(PageSchema).min(1, 'Website document must contain at least one page'),
  seo: GlobalSeoSchema,
  settings: SiteSettingsSchema,
});

// ─── MUTATION SCHEMA ──────────────────────────────────────────────────────────

export const DocumentMutationSchema = z.object({
  type: z.enum([
    'UPDATE_THEME',
    'UPDATE_BUSINESS',
    'UPDATE_NAVIGATION',
    'UPDATE_SEO',
    'UPDATE_SETTINGS',
    'UPDATE_SECTION_PROPS',
    'UPDATE_SECTION_VARIANT',
    'TOGGLE_SECTION',
    'REORDER_SECTIONS',
    'ADD_SECTION',
    'REMOVE_SECTION',
    'ADD_PAGE',
    'UPDATE_PAGE',
    'REMOVE_PAGE',
    'REORDER_PAGES',
  ]),
  pageId: z.string().optional(),
  sectionId: z.string().optional(),
  payload: z.record(z.string(), z.unknown()),
});
