import { canNest, isNodeType, NODE_REGISTRY } from '../contracts/node-registry';
import { NodeType } from '../types/v3.types';

const EDITOR_TYPE_KEY = 'kdbaEditorType';

const TYPE_FALLBACK: Record<string, NodeType> = {
  navbar: 'section',
  footer: 'section',
  navigation: 'stack',
  badge: 'text',
  'rich-text': 'paragraph',
  quote: 'paragraph',
  list: 'paragraph',
  'contact-form': 'stack',
  form: 'stack',
  testimonial: 'stack',
  team: 'stack',
  service: 'stack',
  pricing: 'stack',
  product: 'stack',
  video: 'image',
  gallery: 'grid',
  carousel: 'grid',
  icon: 'text',
  logo: 'text',
  map: 'stack',
  'opening-hours': 'stack',
  'background-media': 'stack',
};

const LAYOUT_DISPLAY = new Set(['flex', 'grid', 'block', 'inline-flex', 'none']);
const FLEX_DIRECTION = new Set(['row', 'column', 'row-reverse', 'column-reverse']);
const ALIGN_ITEMS = new Set(['flex-start', 'center', 'flex-end', 'stretch', 'baseline']);
const JUSTIFY = new Set([
  'flex-start',
  'center',
  'flex-end',
  'space-between',
  'space-around',
  'space-evenly',
]);

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function parseCssNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed === 'auto' || trimmed === 'inherit' || trimmed === 'unset') {
    return undefined;
  }
  const match = trimmed.match(/^(-?\d+(?:\.\d+)?)(px|rem|em)?$/);
  if (!match) return undefined;
  let amount = parseFloat(match[1]);
  if (match[2] === 'rem' || match[2] === 'em') amount *= 16;
  return Number.isFinite(amount) ? amount : undefined;
}

function bounded(value: unknown, min: number, max: number): number | undefined {
  const parsed = parseCssNumber(value);
  if (parsed === undefined) return undefined;
  return clamp(parsed, min, max);
}

function lineHeight(value: unknown): number | undefined {
  const parsed = parseCssNumber(value);
  if (parsed === undefined) return undefined;
  const unitless = parsed > 3 ? parsed / 16 : parsed;
  return clamp(unitless, 0.8, 3);
}

function fontWeight(value: unknown): number | undefined {
  if (value === 'bold' || value === 'bolder') return 700;
  if (value === 'normal' || value === 'lighter') return 400;
  const parsed = parseCssNumber(value);
  if (parsed === undefined) return undefined;
  return clamp(Math.round(parsed / 100) * 100, 100, 900);
}

function boxEdges(input: unknown): Record<string, number> | undefined {
  if (!input || typeof input !== 'object') return undefined;
  const source = input as Record<string, unknown>;
  const next: Record<string, number> = {};
  for (const side of ['top', 'right', 'bottom', 'left'] as const) {
    const value = bounded(source[side], 0, 400);
    if (value !== undefined) next[side] = value;
  }
  return Object.keys(next).length ? next : undefined;
}

function coerceStyles(styles: unknown): Record<string, unknown> | undefined {
  if (!styles || typeof styles !== 'object') return undefined;
  const source = styles as Record<string, unknown>;
  const layoutIn = (source.layout || {}) as Record<string, unknown>;
  const flexIn = (source.flex || {}) as Record<string, unknown>;
  const gridIn = (source.grid || {}) as Record<string, unknown>;
  const sizeIn = (source.size || {}) as Record<string, unknown>;
  const typographyIn = (source.typography || {}) as Record<string, unknown>;
  const backgroundIn = (source.background || {}) as Record<string, unknown>;
  const borderIn = (source.border || {}) as Record<string, unknown>;
  const radiusIn = (source.radius || (borderIn.radius as object) || {}) as Record<string, unknown>;
  const shadowIn = (source.shadow ||
    (source.effects as Record<string, unknown> | undefined)?.boxShadow ||
    {}) as Record<string, unknown>;
  const colorIn = (source.color || {}) as Record<string, unknown>;
  const alignmentIn = (source.alignment || {}) as Record<string, unknown>;
  const visibilityIn = (source.visibility || {}) as Record<string, unknown>;

  const displayRaw = layoutIn.display;
  const display =
    typeof displayRaw === 'string' && LAYOUT_DISPLAY.has(displayRaw)
      ? displayRaw
      : displayRaw === 'inline-block'
        ? 'block'
        : undefined;

  const directionRaw = flexIn.direction || layoutIn.direction;
  const direction =
    typeof directionRaw === 'string' && FLEX_DIRECTION.has(directionRaw) ? directionRaw : undefined;

  const alignRaw = flexIn.alignItems || layoutIn.alignItems;
  const justifyRaw = flexIn.justifyContent || layoutIn.justifyContent;
  const wrapRaw = flexIn.wrap || layoutIn.flexWrap;

  const layout: Record<string, unknown> = {};
  if (display) layout.display = display;
  if (direction) layout.direction = direction;
  const gap = bounded(flexIn.gap ?? layoutIn.gap ?? gridIn.columnGap, 0, 200);
  const rowGap = bounded(flexIn.rowGap ?? layoutIn.rowGap ?? gridIn.rowGap, 0, 200);
  const columnGap = bounded(flexIn.columnGap ?? layoutIn.columnGap ?? gridIn.columnGap, 0, 200);
  if (gap !== undefined) layout.gap = gap;
  if (rowGap !== undefined) layout.rowGap = rowGap;
  if (columnGap !== undefined) layout.columnGap = columnGap;
  if (typeof alignRaw === 'string' && ALIGN_ITEMS.has(alignRaw)) layout.alignItems = alignRaw;
  if (typeof justifyRaw === 'string' && JUSTIFY.has(justifyRaw)) layout.justifyContent = justifyRaw;
  if (wrapRaw === 'nowrap' || wrapRaw === 'wrap') layout.flexWrap = wrapRaw;
  const columns = bounded(gridIn.columns ?? layoutIn.columns, 1, 12);
  if (columns !== undefined) layout.columns = Math.round(columns);

  const size: Record<string, unknown> = {};
  for (const key of ['width', 'height', 'minWidth', 'minHeight', 'maxWidth', 'maxHeight'] as const) {
    const value = sizeIn[key] ?? layoutIn[key];
    if (value !== undefined && value !== null && value !== '') size[key] = value;
  }

  const spacingIn = (source.spacing || {}) as Record<string, unknown>;
  const spacing: Record<string, unknown> = {};
  const margin = boxEdges(spacingIn.margin);
  const padding = boxEdges(spacingIn.padding);
  if (margin) spacing.margin = margin;
  if (padding) spacing.padding = padding;

  const typography: Record<string, unknown> = {};
  if (typeof typographyIn.fontFamily === 'string') {
    typography.fontFamily = typographyIn.fontFamily.slice(0, 80);
  }
  const fontSize = bounded(typographyIn.fontSize, 8, 160);
  if (fontSize !== undefined) typography.fontSize = fontSize;
  const weight = fontWeight(typographyIn.fontWeight);
  if (weight !== undefined) typography.fontWeight = weight;
  const lh = lineHeight(typographyIn.lineHeight);
  if (lh !== undefined) typography.lineHeight = lh;
  const tracking = bounded(typographyIn.letterSpacing, -5, 20);
  if (tracking !== undefined) typography.letterSpacing = tracking;
  if (
    typographyIn.textAlign === 'left' ||
    typographyIn.textAlign === 'center' ||
    typographyIn.textAlign === 'right' ||
    typographyIn.textAlign === 'justify'
  ) {
    typography.textAlign = typographyIn.textAlign;
  }
  if (
    typographyIn.textTransform === 'none' ||
    typographyIn.textTransform === 'uppercase' ||
    typographyIn.textTransform === 'lowercase' ||
    typographyIn.textTransform === 'capitalize'
  ) {
    typography.textTransform = typographyIn.textTransform;
  }

  const colorValue =
    (typeof colorIn.color === 'string' && colorIn.color) ||
    (typeof typographyIn.color === 'string' && typographyIn.color) ||
    undefined;

  const background: Record<string, unknown> = {};
  if (typeof backgroundIn.color === 'string') background.color = backgroundIn.color.slice(0, 80);
  if (typeof backgroundIn.mediaId === 'string') background.mediaId = backgroundIn.mediaId;
  if (typeof backgroundIn.src === 'string') background.src = backgroundIn.src;
  else if (typeof backgroundIn.image === 'string') background.src = backgroundIn.image;
  if (
    backgroundIn.fit === 'cover' ||
    backgroundIn.fit === 'contain' ||
    backgroundIn.fit === 'fill' ||
    backgroundIn.fit === 'none'
  ) {
    background.fit = backgroundIn.fit;
  } else if (
    backgroundIn.size === 'cover' ||
    backgroundIn.size === 'contain' ||
    backgroundIn.size === 'fill' ||
    backgroundIn.size === 'none'
  ) {
    background.fit = backgroundIn.size;
  }
  if (typeof backgroundIn.position === 'string') background.position = backgroundIn.position.slice(0, 40);

  const border: Record<string, unknown> = {};
  const borderWidth = bounded(borderIn.width, 0, 40);
  if (borderWidth !== undefined) border.width = borderWidth;
  if (
    borderIn.style === 'solid' ||
    borderIn.style === 'dashed' ||
    borderIn.style === 'dotted' ||
    borderIn.style === 'none'
  ) {
    border.style = borderIn.style;
  } else if (borderIn.style === 'double') {
    border.style = 'solid';
  }
  if (typeof borderIn.color === 'string') border.color = borderIn.color.slice(0, 80);

  const radius: Record<string, unknown> = {};
  const allRadius = bounded(radiusIn.all, 0, 200);
  for (const corner of ['topLeft', 'topRight', 'bottomRight', 'bottomLeft'] as const) {
    const value = bounded(radiusIn[corner], 0, 200) ?? allRadius;
    if (value !== undefined) radius[corner] = value;
  }

  const shadow: Record<string, unknown> = {};
  const shadowSource = Array.isArray(shadowIn) ? (shadowIn[0] as Record<string, unknown>) : shadowIn;
  const sx = bounded(shadowSource.x, -40, 40);
  const sy = bounded(shadowSource.y, -40, 40);
  const blur = bounded(shadowSource.blur, 0, 80);
  const spread = bounded(shadowSource.spread, -40, 40);
  if (sx !== undefined) shadow.x = sx;
  if (sy !== undefined) shadow.y = sy;
  if (blur !== undefined) shadow.blur = blur;
  if (spread !== undefined) shadow.spread = spread;
  if (typeof shadowSource.color === 'string') shadow.color = shadowSource.color.slice(0, 80);

  const alignment: Record<string, unknown> = {};
  if (
    alignmentIn.textAlign === 'left' ||
    alignmentIn.textAlign === 'center' ||
    alignmentIn.textAlign === 'right' ||
    alignmentIn.textAlign === 'justify'
  ) {
    alignment.textAlign = alignmentIn.textAlign;
  }
  if (typeof alignmentIn.alignItems === 'string' && ALIGN_ITEMS.has(alignmentIn.alignItems)) {
    alignment.alignItems = alignmentIn.alignItems;
  }
  if (typeof alignmentIn.justifyContent === 'string' && JUSTIFY.has(alignmentIn.justifyContent)) {
    alignment.justifyContent = alignmentIn.justifyContent;
  }
  if (
    alignmentIn.alignSelf === 'auto' ||
    alignmentIn.alignSelf === 'flex-start' ||
    alignmentIn.alignSelf === 'center' ||
    alignmentIn.alignSelf === 'flex-end' ||
    alignmentIn.alignSelf === 'stretch'
  ) {
    alignment.alignSelf = alignmentIn.alignSelf;
  }

  const visibility: Record<string, unknown> = {};
  if (typeof visibilityIn.hidden === 'boolean') visibility.hidden = visibilityIn.hidden;

  const next: Record<string, unknown> = {};
  if (Object.keys(layout).length) next.layout = layout;
  if (Object.keys(size).length) next.size = size;
  if (Object.keys(spacing).length) next.spacing = spacing;
  if (Object.keys(typography).length) next.typography = typography;
  if (Object.keys(alignment).length) next.alignment = alignment;
  if (Object.keys(visibility).length) next.visibility = visibility;
  if (colorValue) next.color = { color: colorValue.slice(0, 80) };
  if (Object.keys(background).length) next.background = background;
  if (Object.keys(border).length) next.border = border;
  if (Object.keys(radius).length) next.radius = radius;
  if (Object.keys(shadow).length) next.shadow = shadow;
  return Object.keys(next).length ? next : undefined;
}

function coerceResponsive(responsive: unknown): Record<string, unknown> | undefined {
  if (!responsive || typeof responsive !== 'object') return undefined;
  const source = responsive as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const breakpoint of ['desktop', 'tablet', 'mobile'] as const) {
    const styles = coerceStyles(source[breakpoint]);
    if (styles) next[breakpoint] = styles;
  }
  return Object.keys(next).length ? next : undefined;
}

function sanitizeId(value: unknown, fallbackPrefix: string): string {
  if (typeof value !== 'string') return `${fallbackPrefix}_n`;
  if (!value.trim()) return value;
  const cleaned = value.trim().replace(/[^a-zA-Z0-9_-]/g, '_');
  const withLetter = /^[a-zA-Z]/.test(cleaned) ? cleaned : `${fallbackPrefix}_${cleaned}`;
  const id = withLetter.slice(0, 100);
  return id.length >= 2 ? id : value;
}

function resolveType(rawType: unknown, parentType: NodeType | null): NodeType {
  const original = typeof rawType === 'string' ? rawType : '';
  if (isNodeType(original)) return original;

  let mapped: NodeType =
    TYPE_FALLBACK[original] || (parentType === 'page-root' ? 'section' : 'stack');

  if (parentType && !canNest(parentType, mapped)) {
    if (parentType === 'page-root') mapped = 'section';
    else if (parentType === 'section') mapped = 'stack';
    else if (parentType === 'row') mapped = 'column';
    else mapped = NODE_REGISTRY[parentType].allowedChildren[0] || mapped;
  }

  return mapped;
}

function coerceNode(
  node: Record<string, unknown>,
  parentType: NodeType | null,
): Record<string, unknown> {
  const originalType = typeof node.type === 'string' ? node.type : '';
  const type = resolveType(node.type, parentType);
  const props = {
    ...((node.props as Record<string, unknown>) || {}),
  };
  if (typeof node.name === 'string' && props.name === undefined) {
    props.name = node.name;
  }
  if (originalType && originalType !== type) {
    props[EDITOR_TYPE_KEY] = originalType;
  }

  const rawChildren = Array.isArray(node.children) ? node.children : [];
  const children = rawChildren
    .filter((child) => child && typeof child === 'object')
    .map((child) => coerceNode(child as Record<string, unknown>, type));

  return {
    id: sanitizeId(node.id, 'node'),
    type,
    props,
    styles: coerceStyles(node.styles) || {},
    responsive: coerceResponsive(node.responsive) || {},
    children,
    enabled: node.enabled !== false,
  };
}

function fontFromToken(value: unknown): string | undefined {
  if (!value || typeof value !== 'object') return undefined;
  const family = (value as { fontFamily?: unknown }).fontFamily;
  return typeof family === 'string' && family.trim() ? family : undefined;
}

export function coerceV3Document(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const document = cloneJson(input) as Record<string, unknown>;
  const theme = { ...((document.theme as Record<string, unknown>) || {}) };
  const colors = { ...((theme.colors as Record<string, string>) || {}) };

  if (!theme.primaryColor && colors.primary) theme.primaryColor = colors.primary;
  if (!theme.secondaryColor && colors.secondary) theme.secondaryColor = colors.secondary;
  if (!theme.accentColor && colors.accent) theme.accentColor = colors.accent;
  if (!theme.backgroundColor && colors.background) theme.backgroundColor = colors.background;
  if (!theme.textColor && colors.text) theme.textColor = colors.text;

  theme.primaryColor = theme.primaryColor || '#4F46E5';
  theme.secondaryColor = theme.secondaryColor || '#0F172A';
  theme.accentColor = theme.accentColor || '#6366F1';
  theme.backgroundColor = theme.backgroundColor || '#FFFFFF';
  theme.textColor = theme.textColor || '#0F172A';
  theme.colors = {
    primary: colors.primary || theme.primaryColor,
    secondary: colors.secondary || theme.secondaryColor,
    accent: colors.accent || theme.accentColor,
    background: colors.background || theme.backgroundColor,
    surface: colors.surface || '#F8FAFC',
    text: colors.text || theme.textColor,
    muted: colors.muted || '#6B7280',
    border: colors.border || '#E5E7EB',
  };

  const rawTypography = (theme.typography as Record<string, unknown>) || {};
  const headingFont =
    (typeof theme.headingFont === 'string' && theme.headingFont) ||
    (typeof rawTypography.headingFont === 'string' && rawTypography.headingFont) ||
    fontFromToken(rawTypography.h1) ||
    'Inter';
  const bodyFont =
    (typeof theme.bodyFont === 'string' && theme.bodyFont) ||
    (typeof rawTypography.bodyFont === 'string' && rawTypography.bodyFont) ||
    fontFromToken(rawTypography.body) ||
    'Inter';

  theme.headingFont = headingFont;
  theme.bodyFont = bodyFont;
  theme.typography = { headingFont, bodyFont };
  theme.tokens = theme.tokens || {};
  document.theme = theme;

  const pages = Array.isArray(document.pages) ? document.pages : [];
  document.pages = pages.map((page) => {
    if (!page || typeof page !== 'object') return page;
    const next = { ...(page as Record<string, unknown>) };
    if (typeof next.slug === 'string') {
      const slug = next.slug.trim() || '/';
      next.slug = slug.startsWith('/') ? slug : `/${slug}`;
    }
    if (typeof next.id === 'string') {
      next.id = sanitizeId(next.id, 'page');
    }
    if (typeof next.type === 'string') {
      next.type = next.type.toLowerCase();
    }
    if (typeof next.title !== 'string' && typeof next.name === 'string') {
      next.title = next.name;
    }
    if (typeof next.name !== 'string' && typeof next.title === 'string') {
      next.name = next.title;
    }
    if (next.root && typeof next.root === 'object') {
      next.root = coerceNode(next.root as Record<string, unknown>, null);
    }
    return next;
  });

  return document;
}
