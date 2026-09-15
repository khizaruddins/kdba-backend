const HEADING_KEYS = ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] as const;
const BODY_KEYS = ['body', 'caption', 'label', 'button', 'quote'] as const;
const TOKEN_KEYS = [...HEADING_KEYS, ...BODY_KEYS] as const;

const TOKEN_SCALE: Record<
  (typeof TOKEN_KEYS)[number],
  { fontSize: string; fontWeight: number; lineHeight: number; letterSpacing?: string }
> = {
  h1: { fontSize: '48px', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.02em' },
  h2: { fontSize: '36px', fontWeight: 700, lineHeight: 1.2, letterSpacing: '-0.01em' },
  h3: { fontSize: '28px', fontWeight: 600, lineHeight: 1.3 },
  h4: { fontSize: '22px', fontWeight: 600, lineHeight: 1.35 },
  h5: { fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
  h6: { fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
  body: { fontSize: '16px', fontWeight: 400, lineHeight: 1.6 },
  caption: { fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
  label: { fontSize: '14px', fontWeight: 500, lineHeight: 1.4 },
  button: { fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
  quote: { fontSize: '18px', fontWeight: 400, lineHeight: 1.6 },
};

function asFont(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function asCssLength(value: unknown): string | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`;
  }
  if (typeof value === 'string' && value.trim()) {
    return value.trim();
  }
  return undefined;
}

function pickFont(...candidates: unknown[]): string {
  for (const candidate of candidates) {
    const font = asFont(candidate);
    if (font) return font;
  }
  return 'Inter';
}

/**
 * Accept editor / V2 typography (`headingFont` + `bodyFont`) and missing V3 tokens.
 * Canonical stored shape remains h1–h6 / body / caption / label / button / quote.
 */
export function expandThemeTypography(theme: Record<string, unknown>): Record<string, unknown> {
  const raw =
    theme.typography && typeof theme.typography === 'object'
      ? (theme.typography as Record<string, unknown>)
      : {};
  const h1 = raw.h1 && typeof raw.h1 === 'object' ? (raw.h1 as Record<string, unknown>) : {};
  const body = raw.body && typeof raw.body === 'object' ? (raw.body as Record<string, unknown>) : {};

  const headingFont = pickFont(theme.headingFont, raw.headingFont, h1.fontFamily);
  const bodyFont = pickFont(theme.bodyFont, raw.bodyFont, body.fontFamily, headingFont);

  const next: Record<string, unknown> = {};
  for (const key of TOKEN_KEYS) {
    const scale = TOKEN_SCALE[key];
    const existing = raw[key] && typeof raw[key] === 'object' ? (raw[key] as Record<string, unknown>) : {};
    const defaultFamily = (HEADING_KEYS as readonly string[]).includes(key)
      ? headingFont
      : bodyFont;
    next[key] = {
      fontFamily: asFont(existing.fontFamily) || defaultFamily,
      fontSize: asCssLength(existing.fontSize) || scale.fontSize,
      fontWeight: existing.fontWeight ?? scale.fontWeight,
      lineHeight: existing.lineHeight ?? scale.lineHeight,
      letterSpacing: asCssLength(existing.letterSpacing) || scale.letterSpacing,
    };
  }
  return next;
}

export function coerceIncomingTheme(input: unknown): unknown {
  if (!input || typeof input !== 'object') return input;
  const theme = { ...(input as Record<string, unknown>) };
  theme.typography = expandThemeTypography(theme);

  if (!theme.colors || typeof theme.colors !== 'object') {
    theme.colors = {
      primary: theme.primaryColor || '#0f172a',
      secondary: theme.secondaryColor || '#ffffff',
      accent: theme.accentColor || '#6366f1',
      background: theme.backgroundColor || '#ffffff',
      surface: '#f8fafc',
      text: theme.textColor || '#0f172a',
      muted: '#64748b',
      border: '#e2e8f0',
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
    };
  }

  return theme;
}

export function coerceCssLengthInput(value: unknown): unknown {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return `${value}px`;
  }
  return value;
}
