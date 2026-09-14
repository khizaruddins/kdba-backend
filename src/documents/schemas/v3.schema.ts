import { z } from 'zod';
import {
  BusinessInfoSchema,
  GlobalSeoSchema,
  NavigationSchema,
  SiteMetadataSchema,
  SiteSettingsSchema,
  ThemeSchema,
} from './document.schema';
import { NODE_TYPES } from '../types/v3.types';
import { isValidSectionType } from '../contracts/section-registry';

const hexOrToken = z
  .string()
  .trim()
  .min(1)
  .max(80)
  .refine(
    (val) =>
      /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(val) ||
      /^(rgb|hsl)a?\(/.test(val) ||
      /^[a-zA-Z][a-zA-Z0-9._-]*$/.test(val),
    { message: 'Invalid color value' },
  );

const boxEdges = z.object({
  top: z.number().max(400).optional(),
  right: z.number().max(400).optional(),
  bottom: z.number().max(400).optional(),
  left: z.number().max(400).optional(),
});

export const StyleSchema = z.object({
  layout: z
    .object({
      display: z.enum(['flex', 'grid', 'block', 'inline-flex', 'none']).optional(),
      direction: z.enum(['row', 'column', 'row-reverse', 'column-reverse']).optional(),
      gap: z.number().min(0).max(200).optional(),
      rowGap: z.number().min(0).max(200).optional(),
      columnGap: z.number().min(0).max(200).optional(),
      alignItems: z
        .enum(['flex-start', 'center', 'flex-end', 'stretch', 'baseline'])
        .optional(),
      justifyContent: z
        .enum([
          'flex-start',
          'center',
          'flex-end',
          'space-between',
          'space-around',
          'space-evenly',
        ])
        .optional(),
      flexWrap: z.enum(['nowrap', 'wrap']).optional(),
      columns: z.number().int().min(1).max(12).optional(),
    })
    .optional(),
  alignment: z
    .object({
      textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
      alignItems: z
        .enum(['flex-start', 'center', 'flex-end', 'stretch', 'baseline'])
        .optional(),
      justifyContent: z
        .enum([
          'flex-start',
          'center',
          'flex-end',
          'space-between',
          'space-around',
          'space-evenly',
        ])
        .optional(),
      alignSelf: z.enum(['auto', 'flex-start', 'center', 'flex-end', 'stretch']).optional(),
    })
    .optional(),
  visibility: z
    .object({
      hidden: z.boolean().optional(),
    })
    .optional(),
  size: z
    .object({
      width: z.union([z.string().max(40), z.number()]).optional(),
      height: z.union([z.string().max(40), z.number()]).optional(),
      minWidth: z.union([z.string().max(40), z.number()]).optional(),
      minHeight: z.union([z.string().max(40), z.number()]).optional(),
      maxWidth: z.union([z.string().max(40), z.number()]).optional(),
      maxHeight: z.union([z.string().max(40), z.number()]).optional(),
    })
    .optional(),
  spacing: z
    .object({
      margin: boxEdges.optional(),
      padding: boxEdges.optional(),
    })
    .optional(),
  typography: z
    .object({
      fontFamily: z.string().trim().max(80).optional(),
      fontSize: z.number().min(8).max(160).optional(),
      fontWeight: z.number().min(100).max(900).optional(),
      lineHeight: z.number().min(0.8).max(3).optional(),
      letterSpacing: z.number().min(-5).max(20).optional(),
      textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
      textTransform: z.enum(['none', 'uppercase', 'lowercase', 'capitalize']).optional(),
    })
    .optional(),
  color: z
    .object({
      color: hexOrToken.optional(),
    })
    .optional(),
  background: z
    .object({
      color: hexOrToken.optional(),
      mediaId: z.string().trim().max(100).optional(),
      src: z.string().trim().max(2000).optional(),
      fit: z.enum(['cover', 'contain', 'fill', 'none']).optional(),
      position: z.string().trim().max(40).optional(),
    })
    .optional(),
  border: z
    .object({
      width: z.number().min(0).max(40).optional(),
      style: z.enum(['solid', 'dashed', 'dotted', 'none']).optional(),
      color: hexOrToken.optional(),
    })
    .optional(),
  radius: z
    .object({
      topLeft: z.number().min(0).max(200).optional(),
      topRight: z.number().min(0).max(200).optional(),
      bottomRight: z.number().min(0).max(200).optional(),
      bottomLeft: z.number().min(0).max(200).optional(),
    })
    .optional(),
  shadow: z
    .object({
      x: z.number().min(-40).max(40).optional(),
      y: z.number().min(-40).max(40).optional(),
      blur: z.number().min(0).max(80).optional(),
      spread: z.number().min(-40).max(40).optional(),
      color: hexOrToken.optional(),
    })
    .optional(),
});

export const ResponsiveSchema = z.object({
  desktop: StyleSchema.optional(),
  tablet: StyleSchema.optional(),
  mobile: StyleSchema.optional(),
});

export const NodeIdSchema = z
  .string()
  .trim()
  .min(2)
  .max(100)
  .regex(/^[a-zA-Z][a-zA-Z0-9_-]*$/, 'Node IDs must be stable alphanumeric identifiers');

export const VisualNodeSchema: z.ZodType<any> = z.lazy(() =>
  z.object({
    id: NodeIdSchema,
    type: z.string().refine((value) => (NODE_TYPES as readonly string[]).includes(value), {
      message: 'Unknown or unsupported node type',
    }),
    props: z.record(z.string(), z.unknown()).optional().default({}),
    styles: StyleSchema.optional(),
    responsive: ResponsiveSchema.optional(),
    children: z.array(VisualNodeSchema).optional().default([]),
    enabled: z.boolean().optional().default(true),
  }),
);

export const ThemeSchemaV3 = ThemeSchema.extend({
  colors: z
    .object({
      primary: hexOrToken,
      secondary: hexOrToken,
      accent: hexOrToken,
      background: hexOrToken,
      text: hexOrToken,
      surface: hexOrToken.optional(),
      muted: hexOrToken.optional(),
      border: hexOrToken.optional(),
    })
    .optional(),
  typography: z
    .object({
      headingFont: z.string().trim().max(100),
      bodyFont: z.string().trim().max(100),
    })
    .optional(),
  tokens: z.record(z.string(), z.unknown()).optional().default({}),
});

export const SiteMetadataSchemaV3 = SiteMetadataSchema.extend({
  settings: SiteSettingsSchema.optional(),
});

export const PageSchemaV3 = z.object({
  id: NodeIdSchema,
  name: z.string().trim().max(150).optional(),
  title: z.string().trim().max(150),
  slug: z
    .string()
    .trim()
    .regex(/^(\/|\/[a-z0-9-_/]*)$/, 'Invalid page slug format (must begin with /)'),
  type: z
    .enum(['home', 'about', 'services', 'contact', 'pricing', 'portfolio', 'blog', 'custom'])
    .default('custom'),
  sortOrder: z.number().int().default(0),
  enabled: z.boolean().default(true),
  seo: z
    .object({
      title: z.string().trim().max(200).optional(),
      description: z.string().trim().max(500).optional(),
      ogImage: z.string().trim().max(2000).optional(),
      noIndex: z.boolean().optional(),
    })
    .optional(),
  root: VisualNodeSchema,
  sections: z
    .array(
      z.object({
        id: NodeIdSchema,
        type: z.string().refine(isValidSectionType, {
          message: 'Unknown or unsupported section type',
        }),
        variant: z.string().trim().max(100),
        enabled: z.boolean().default(true),
        sortOrder: z.number().int().default(0),
        props: z.record(z.string(), z.unknown()).default({}),
        styles: z.record(z.string(), z.unknown()).optional().default({}),
        responsive: z.record(z.string(), z.unknown()).optional(),
      }),
    )
    .optional()
    .default([]),
});

export const WebsiteDocumentV3Schema = z.object({
  schemaVersion: z.literal('3.0'),
  site: SiteMetadataSchemaV3,
  theme: ThemeSchemaV3,
  business: BusinessInfoSchema,
  navigation: NavigationSchema,
  pages: z.array(PageSchemaV3).min(1, 'Website document must contain at least one page'),
  seo: GlobalSeoSchema,
  settings: SiteSettingsSchema,
});

export const DocumentOperationSchema = z.object({
  type: z.enum([
    'addNode',
    'removeNode',
    'moveNode',
    'duplicateNode',
    'updateNode',
    'updateProps',
    'updateStyles',
    'updateResponsive',
    'reorderChildren',
    'updateTheme',
    'updateSite',
    'insertPreset',
  ]),
});
