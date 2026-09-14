import { THEME_COLOR_KEYS } from '../types/v3.types';
import { getComponentCatalog } from '../contracts/node-registry';
import { getSectionPresetCatalog, listSectionPresets } from '../presets/section-presets';

export function getBuilderCatalog() {
  return {
    schemaVersion: '3.0',
    components: getComponentCatalog(),
    presets: listSectionPresets(),
    themeTokens: {
      colors: [...THEME_COLOR_KEYS],
      typography: ['headingFont', 'bodyFont'],
    },
  };
}

export function getBuilderCatalogWithPresetTrees() {
  return {
    ...getBuilderCatalog(),
    presets: getSectionPresetCatalog(),
  };
}
