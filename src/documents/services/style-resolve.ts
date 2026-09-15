import { ResponsiveStyleDefinition, StyleDefinition } from '../types/document.types';

export type LayoutBreakpoint = 'desktop' | 'tablet' | 'mobile';

/**
 * Deterministic responsive resolution for V3 styles.
 *
 * Base `node.styles` is the desktop source of truth.
 * Optional `responsive.desktop` may further override desktop.
 * Tablet inherits desktop, then applies `responsive.tablet`.
 * Mobile inherits tablet (which already includes desktop), then applies `responsive.mobile`.
 *
 * Resolution chain:
 *   mobile  = merge(base, desktopOverride, tabletOverride, mobileOverride)
 *   tablet  = merge(base, desktopOverride, tabletOverride)
 *   desktop = merge(base, desktopOverride)
 */
export function resolveNodeStyles(
  base: StyleDefinition = {},
  responsive: ResponsiveStyleDefinition = {},
  breakpoint: LayoutBreakpoint = 'desktop',
): StyleDefinition {
  let resolved = mergeStyleDefinitions(base, responsive.desktop || {});
  if (breakpoint === 'tablet' || breakpoint === 'mobile') {
    resolved = mergeStyleDefinitions(resolved, responsive.tablet || {});
  }
  if (breakpoint === 'mobile') {
    resolved = mergeStyleDefinitions(resolved, responsive.mobile || {});
  }
  return resolved;
}

export function mergeStyleDefinitions(
  base: StyleDefinition = {},
  incoming: StyleDefinition = {},
): StyleDefinition {
  return {
    layout: { ...(base.layout || {}), ...(incoming.layout || {}) },
    flex: { ...(base.flex || {}), ...(incoming.flex || {}) },
    grid: { ...(base.grid || {}), ...(incoming.grid || {}) },
    size: { ...(base.size || {}), ...(incoming.size || {}) },
    spacing: {
      margin: { ...(base.spacing?.margin || {}), ...(incoming.spacing?.margin || {}) },
      padding: { ...(base.spacing?.padding || {}), ...(incoming.spacing?.padding || {}) },
    },
    typography: { ...(base.typography || {}), ...(incoming.typography || {}) },
    background: { ...(base.background || {}), ...(incoming.background || {}) },
    border: { ...(base.border || {}), ...(incoming.border || {}) },
    effects: { ...(base.effects || {}), ...(incoming.effects || {}) },
    transform: { ...(base.transform || {}), ...(incoming.transform || {}) },
  };
}

export function isEmptyStyleDefinition(styles: StyleDefinition | undefined): boolean {
  if (!styles) return true;
  return JSON.stringify(styles) === '{}' || JSON.stringify(styles) === undefined;
}
