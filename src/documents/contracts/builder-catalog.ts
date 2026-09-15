import { getComponentManifest } from './component-registry';
import { THEME_COLOR_KEYS } from '../types/v3.types';
import { getSectionPresetCatalog, listSectionPresets } from '../presets/section-presets';
import { getBlockCatalog, listBlockCategories, listBlocks, LEGACY_PRESET_ALIASES } from './block-registry';
import { CONTACT_FORM_VARIANTS, listFormFieldCatalog } from './form-fields';
import { DEFAULT_THEME_TOKENS } from '../services/live-coerce';
import { CMS_FIELD_TYPES, BUILTIN_COLLECTION_SLUGS } from '../../cms/cms.types';

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
    presets: listSectionPresets().map((preset) => ({
      ...preset,
      blockId: LEGACY_PRESET_ALIASES[preset.id] || preset.id,
    })),
    blocks: listBlocks(),
    blockCategories: listBlockCategories(),
    formFields: listFormFieldCatalog(),
    contactVariants: [...CONTACT_FORM_VARIANTS],
    themeTokens: {
      colors: [...THEME_COLOR_KEYS, 'success', 'warning', 'error'],
      typography: ['headingFont', 'bodyFont'],
      radius: Object.keys(DEFAULT_THEME_TOKENS.radius),
      shadow: Object.keys(DEFAULT_THEME_TOKENS.shadow),
      spacing: Object.keys(DEFAULT_THEME_TOKENS.spacing),
      button: Object.keys(DEFAULT_THEME_TOKENS.button),
      card: Object.keys(DEFAULT_THEME_TOKENS.card),
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
      'insertBlock',
      'insertSection',
      'replaceSubtree',
      'renameNode',
      'hideNode',
      'setLocked',
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
    cms: {
      fieldTypes: [...CMS_FIELD_TYPES],
      bindingSources: ['collection', 'record', 'business'],
      pageKinds: ['static', 'collection-index', 'collection-item'],
      builtinCollections: [...BUILTIN_COLLECTION_SLUGS],
    },
  };
}

export function getBuilderCatalogWithPresetTrees() {
  return {
    ...getBuilderCatalog(),
    presets: getSectionPresetCatalog().map((preset) => ({
      ...preset,
      blockId: LEGACY_PRESET_ALIASES[preset.id] || preset.id,
    })),
    blocks: getBlockCatalog({ includeTrees: true }),
  };
}
