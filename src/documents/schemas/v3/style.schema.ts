import { z } from 'zod';

// ─── SAFE STRING & NUMBER HELPERS ─────────────────────────────────────────────

const safeCssValue = z.string().trim().max(100);
const safeColor = z
  .string()
  .trim()
  .max(100)
  .regex(
    /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{4}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$|^rgb|^hsl|^var\(--|^transparent$|^inherit$|^currentColor$/i,
    'Invalid CSS color format',
  );

// ─── SPACING SCHEMA ───────────────────────────────────────────────────────────

export const BoxSpacingSchema = z.object({
  top: safeCssValue.optional(),
  right: safeCssValue.optional(),
  bottom: safeCssValue.optional(),
  left: safeCssValue.optional(),
});

// ─── BORDER SCHEMA ────────────────────────────────────────────────────────────

export const BorderSideSchema = z.object({
  width: safeCssValue.optional(),
  style: z.enum(['solid', 'dashed', 'dotted', 'double', 'none']).optional(),
  color: safeColor.optional(),
});

export const BorderRadiusDefinitionSchema = z.object({
  topLeft: safeCssValue.optional(),
  topRight: safeCssValue.optional(),
  bottomRight: safeCssValue.optional(),
  bottomLeft: safeCssValue.optional(),
  all: safeCssValue.optional(),
});

// ─── SHADOW SCHEMA ────────────────────────────────────────────────────────────

export const ShadowDefinitionSchema = z.object({
  x: z.number(),
  y: z.number(),
  blur: z.number().min(0),
  spread: z.number(),
  color: safeColor,
  inset: z.boolean().optional(),
});

// ─── GRADIENT SCHEMA ──────────────────────────────────────────────────────────

export const GradientColorStopSchema = z.object({
  color: safeColor,
  offset: z.number().min(0).max(100),
});

export const GradientDefinitionSchema = z.object({
  type: z.enum(['linear', 'radial']),
  angle: z.number().optional(),
  stops: z.array(GradientColorStopSchema).min(2),
});

// ─── STRUCTURED STYLE DEFINITION SCHEMA ───────────────────────────────────────

export const StyleDefinitionSchema = z.object({
  layout: z
    .object({
      display: z
        .enum(['flex', 'grid', 'block', 'inline-block', 'inline-flex', 'none'])
        .optional(),
      position: z
        .enum(['static', 'relative', 'absolute', 'sticky', 'fixed'])
        .optional(),
      width: safeCssValue.optional(),
      height: safeCssValue.optional(),
      minWidth: safeCssValue.optional(),
      maxWidth: safeCssValue.optional(),
      minHeight: safeCssValue.optional(),
      maxHeight: safeCssValue.optional(),
      top: safeCssValue.optional(),
      right: safeCssValue.optional(),
      bottom: safeCssValue.optional(),
      left: safeCssValue.optional(),
      zIndex: z.number().int().optional(),
      overflow: z.enum(['visible', 'hidden', 'scroll', 'auto']).optional(),
    })
    .optional(),

  flex: z
    .object({
      direction: z.enum(['row', 'row-reverse', 'column', 'column-reverse']).optional(),
      wrap: z.enum(['nowrap', 'wrap', 'wrap-reverse']).optional(),
      justifyContent: z
        .enum([
          'flex-start',
          'flex-end',
          'center',
          'space-between',
          'space-around',
          'space-evenly',
        ])
        .optional(),
      alignItems: z
        .enum(['flex-start', 'flex-end', 'center', 'baseline', 'stretch'])
        .optional(),
      alignContent: z
        .enum([
          'flex-start',
          'flex-end',
          'center',
          'space-between',
          'space-around',
          'stretch',
        ])
        .optional(),
      gap: safeCssValue.optional(),
      rowGap: safeCssValue.optional(),
      columnGap: safeCssValue.optional(),
      grow: z.number().optional(),
      shrink: z.number().optional(),
      basis: safeCssValue.optional(),
    })
    .optional(),

  grid: z
    .object({
      columns: z.number().int().min(1).max(24).optional(),
      rows: z.number().int().min(1).optional(),
      gridTemplateColumns: safeCssValue.optional(),
      gridTemplateRows: safeCssValue.optional(),
      columnGap: safeCssValue.optional(),
      rowGap: safeCssValue.optional(),
      autoFlow: z.enum(['row', 'column', 'dense']).optional(),
      columnSpan: z.union([z.number().int().min(1).max(24), safeCssValue]).optional(),
      rowSpan: z.union([z.number().int().min(1), safeCssValue]).optional(),
    })
    .optional(),

  size: z
    .object({
      width: safeCssValue.optional(),
      height: safeCssValue.optional(),
      minWidth: safeCssValue.optional(),
      maxWidth: safeCssValue.optional(),
      minHeight: safeCssValue.optional(),
      maxHeight: safeCssValue.optional(),
      aspectRatio: safeCssValue.optional(),
    })
    .optional(),

  spacing: z
    .object({
      margin: BoxSpacingSchema.optional(),
      padding: BoxSpacingSchema.optional(),
    })
    .optional(),

  typography: z
    .object({
      fontFamily: safeCssValue.optional(),
      fontSize: safeCssValue.optional(),
      fontWeight: z.union([z.string(), z.number()]).optional(),
      lineHeight: z.union([z.string(), z.number()]).optional(),
      letterSpacing: safeCssValue.optional(),
      textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
      textTransform: z.enum(['none', 'capitalize', 'uppercase', 'lowercase']).optional(),
      textDecoration: z.enum(['none', 'underline', 'line-through']).optional(),
      color: safeColor.optional(),
    })
    .optional(),

  background: z
    .object({
      color: safeColor.optional(),
      gradient: GradientDefinitionSchema.optional(),
      image: z.string().max(2048).optional(),
      mediaId: z.string().max(100).optional(),
      position: safeCssValue.optional(),
      size: safeCssValue.optional(),
      repeat: z.enum(['no-repeat', 'repeat', 'repeat-x', 'repeat-y']).optional(),
      opacity: z.number().min(0).max(1).optional(),
    })
    .optional(),

  border: z
    .object({
      top: BorderSideSchema.optional(),
      right: BorderSideSchema.optional(),
      bottom: BorderSideSchema.optional(),
      left: BorderSideSchema.optional(),
      width: safeCssValue.optional(),
      style: z.enum(['solid', 'dashed', 'dotted', 'double', 'none']).optional(),
      color: safeColor.optional(),
      radius: BorderRadiusDefinitionSchema.optional(),
    })
    .optional(),

  effects: z
    .object({
      boxShadow: z.union([ShadowDefinitionSchema, z.array(ShadowDefinitionSchema)]).optional(),
      textShadow: ShadowDefinitionSchema.optional(),
      opacity: z.number().min(0).max(1).optional(),
      filter: safeCssValue.optional(),
      backdropFilter: safeCssValue.optional(),
    })
    .optional(),

  transform: z
    .object({
      translateX: safeCssValue.optional(),
      translateY: safeCssValue.optional(),
      scale: z.number().optional(),
      scaleX: z.number().optional(),
      scaleY: z.number().optional(),
      rotate: safeCssValue.optional(),
      skewX: safeCssValue.optional(),
      skewY: safeCssValue.optional(),
    })
    .optional(),
});

// ─── RESPONSIVE & BREAKPOINT SCHEMAS ──────────────────────────────────────────

export const BreakpointConfigSchema = z.object({
  desktop: z.number().int().default(1200),
  tablet: z.number().int().default(768),
  mobile: z.number().int().default(480),
}).catchall(z.number().int());

export const ResponsiveStyleDefinitionSchema = z.object({
  tablet: StyleDefinitionSchema.optional(),
  mobile: StyleDefinitionSchema.optional(),
  custom: z.record(z.string(), StyleDefinitionSchema).optional(),
});

export const ResponsiveVisibilitySchema = z.object({
  desktop: z.boolean().optional().default(true),
  tablet: z.boolean().optional().default(true),
  mobile: z.boolean().optional().default(true),
}).catchall(z.boolean().optional());

// ─── THEME SYSTEM SCHEMAS ─────────────────────────────────────────────────────

export const TypographyTokenSchema = z.object({
  fontFamily: safeCssValue.default('Inter'),
  fontSize: safeCssValue,
  fontWeight: z.union([z.string(), z.number()]).default(400),
  lineHeight: z.union([z.string(), z.number()]).default(1.5),
  letterSpacing: safeCssValue.optional(),
});

export const TypographySystemV3Schema = z.object({
  h1: TypographyTokenSchema,
  h2: TypographyTokenSchema,
  h3: TypographyTokenSchema,
  h4: TypographyTokenSchema,
  h5: TypographyTokenSchema,
  h6: TypographyTokenSchema,
  body: TypographyTokenSchema,
  caption: TypographyTokenSchema,
  label: TypographyTokenSchema,
  button: TypographyTokenSchema,
  quote: TypographyTokenSchema,
});

export const ColorTokensV3Schema = z.object({
  primary: safeColor,
  secondary: safeColor,
  accent: safeColor,
  background: safeColor.default('#ffffff'),
  surface: safeColor.default('#f8fafc'),
  text: safeColor.default('#0f172a'),
  muted: safeColor.default('#64748b'),
  border: safeColor.default('#e2e8f0'),
  success: safeColor.default('#10b981'),
  warning: safeColor.default('#f59e0b'),
  error: safeColor.default('#ef4444'),
  custom: z.record(z.string(), safeColor).optional(),
});

export const ThemeSystemV3Schema = z.object({
  colors: ColorTokensV3Schema,
  typography: TypographySystemV3Schema,
  breakpoints: BreakpointConfigSchema.default({
    desktop: 1200,
    tablet: 768,
    mobile: 480,
  }),
  borderRadius: z.enum(['none', 'sm', 'md', 'lg', 'full']).default('md'),
  shadows: z.enum(['none', 'subtle', 'medium', 'dramatic']).default('subtle'),
  customCss: z.string().max(50000).optional(),
});
