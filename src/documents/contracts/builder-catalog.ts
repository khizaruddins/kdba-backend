import { getComponentManifest } from './component-registry';
import { THEME_COLOR_KEYS } from '../types/v3.types';
import { getSectionPresetCatalog, listSectionPresets } from '../presets/section-presets';

export const RESPONSIVE_RESOLUTION_RULES = {
  breakpoints: ['desktop', 'tablet', 'mobile'] as const,
  base: 'node.styles is the desktop source of truth',
  resolution: [
    'desktop = merge(node.styles, responsive.desktop)',
    'tablet = merge(desktop, responsive.tablet)',
    'mobile = merge(tablet, responsive.mobile)',
  ],
  reset: 'resetResponsive deletes a breakpoint override so the node inherits again',
};

export function getBuilderCatalog() {
  return {
    schemaVersion: '3.0',
    components: getComponentManifest(),
    presets: listSectionPresets(),
    themeTokens: {
      colors: [...THEME_COLOR_KEYS],
      typography: ['headingFont', 'bodyFont'],
    },
    responsive: RESPONSIVE_RESOLUTION_RULES,
    operations: [
      'addNode',
      'removeNode',
      'moveNode',
      'duplicateNode',
      'pasteNode',
      'updateNode',
      'updateProps',
      'updateStyles',
      'updateResponsive',
      'resetResponsive',
      'setVisibility',
      'changeParent',
      'reorderChildren',
      'insertPreset',
      'addPage',
      'updatePage',
      'removePage',
      'reorderPages',
      'duplicatePage',
      'updateTheme',
      'updateBusiness',
      'updateNavigation',
      'updateSeo',
      'updateSettings',
      'updateGlobal',
      'upsertReusable',
      'insertReusable',
      'removeReusable',
    ],
  };
}

export function getBuilderCatalogWithPresetTrees() {
  return {
    ...getBuilderCatalog(),
    presets: getSectionPresetCatalog(),
  };
}
