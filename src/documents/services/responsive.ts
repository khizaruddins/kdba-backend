import { ResponsiveBreakpoint, RESPONSIVE_BREAKPOINTS, StyleModel } from '../types/v3.types';

function isEmptyValue(value: unknown): boolean {
  if (value === undefined || value === null || value === '') return true;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value as object).length === 0;
  return false;
}

function pruneObject<T extends Record<string, unknown>>(value: T): Partial<T> {
  const next: Record<string, unknown> = {};
  for (const [key, nested] of Object.entries(value)) {
    if (nested && typeof nested === 'object' && !Array.isArray(nested)) {
      const pruned = pruneObject(nested as Record<string, unknown>);
      if (!isEmptyValue(pruned)) next[key] = pruned;
    } else if (!isEmptyValue(nested)) {
      next[key] = nested;
    }
  }
  return next as Partial<T>;
}

export function mergeStyles(base: StyleModel = {}, incoming: StyleModel = {}): StyleModel {
  return pruneEmptyStyles({
    layout: { ...(base.layout || {}), ...(incoming.layout || {}) },
    size: { ...(base.size || {}), ...(incoming.size || {}) },
    spacing: {
      margin: {
        ...(base.spacing?.margin || {}),
        ...(incoming.spacing?.margin || {}),
      },
      padding: {
        ...(base.spacing?.padding || {}),
        ...(incoming.spacing?.padding || {}),
      },
    },
    typography: { ...(base.typography || {}), ...(incoming.typography || {}) },
    alignment: { ...(base.alignment || {}), ...(incoming.alignment || {}) },
    visibility: { ...(base.visibility || {}), ...(incoming.visibility || {}) },
    color: { ...(base.color || {}), ...(incoming.color || {}) },
    background: { ...(base.background || {}), ...(incoming.background || {}) },
    border: { ...(base.border || {}), ...(incoming.border || {}) },
    radius: { ...(base.radius || {}), ...(incoming.radius || {}) },
    shadow: { ...(base.shadow || {}), ...(incoming.shadow || {}) },
  });
}

export function pruneEmptyStyles(styles: StyleModel = {}): StyleModel {
  return pruneObject(styles as Record<string, unknown>) as StyleModel;
}

export function resolveResponsiveStyles(
  styles: StyleModel = {},
  responsive: Partial<Record<ResponsiveBreakpoint, StyleModel>> = {},
  breakpoint: ResponsiveBreakpoint = 'desktop',
): StyleModel {
  let resolved = pruneEmptyStyles(styles);
  if (responsive.desktop) {
    resolved = mergeStyles(resolved, responsive.desktop);
  }
  if (breakpoint === 'tablet' || breakpoint === 'mobile') {
    resolved = mergeStyles(resolved, responsive.tablet || {});
  }
  if (breakpoint === 'mobile') {
    resolved = mergeStyles(resolved, responsive.mobile || {});
  }
  return resolved;
}

function styleEquals(a: unknown, b: unknown): boolean {
  return JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
}

function diffStyleValue(base: unknown, incoming: unknown): unknown {
  if (
    incoming &&
    typeof incoming === 'object' &&
    !Array.isArray(incoming) &&
    base &&
    typeof base === 'object' &&
    !Array.isArray(base)
  ) {
    const groupDiff: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(incoming as Record<string, unknown>)) {
      const nested = diffStyleValue((base as Record<string, unknown>)[key], value);
      if (nested !== undefined && nested !== null && !isEmptyValue(nested)) {
        groupDiff[key] = nested;
      }
    }
    return Object.keys(groupDiff).length ? groupDiff : undefined;
  }
  if (styleEquals(base, incoming)) return undefined;
  return incoming;
}

export function pruneResponsiveOverrides(
  base: StyleModel = {},
  responsive: Partial<Record<ResponsiveBreakpoint, StyleModel>> = {},
): Partial<Record<ResponsiveBreakpoint, StyleModel>> {
  const next: Partial<Record<ResponsiveBreakpoint, StyleModel>> = {};
  let inherited = pruneEmptyStyles(base);

  for (const breakpoint of RESPONSIVE_BREAKPOINTS) {
    const override = pruneEmptyStyles(responsive[breakpoint] || {});
    const unique = diffStyleValue(inherited, override);
    const pruned = pruneEmptyStyles((unique || {}) as StyleModel);
    if (Object.keys(pruned).length) {
      next[breakpoint] = pruned;
      inherited = mergeStyles(inherited, pruned);
    }
  }

  return next;
}
