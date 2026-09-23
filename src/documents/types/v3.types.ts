import {
  BusinessInfo,
  GlobalSeo,
  NavigationConfig,
  PageSeo,
  PageTypeV2,
  SectionContract,
  SiteSettings,
  ThemeConfig,
} from './document.types';

export const SCHEMA_VERSION_V3 = '3.0' as const;
export type SchemaVersionV3 = typeof SCHEMA_VERSION_V3;

export const STRUCTURE_NODE_TYPES = [
  'page-root',
  'section',
  'container',
  'row',
  'column',
  'grid',
  'stack',
] as const;

export const CONTENT_NODE_TYPES = [
  'heading',
  'paragraph',
  'text',
  'button',
  'link',
  'image',
  'divider',
  'spacer',
] as const;

/** Opaque V2 section wrapper so existing templates keep rendering after upgrade. */
export const COMPAT_NODE_TYPES = ['legacy-section'] as const;

export const NODE_TYPES = [
  ...STRUCTURE_NODE_TYPES,
  ...CONTENT_NODE_TYPES,
  ...COMPAT_NODE_TYPES,
] as const;

export type StructureNodeType = (typeof STRUCTURE_NODE_TYPES)[number];
export type ContentNodeType = (typeof CONTENT_NODE_TYPES)[number];
export type CompatNodeType = (typeof COMPAT_NODE_TYPES)[number];
export type NodeType = (typeof NODE_TYPES)[number];

export const RESPONSIVE_BREAKPOINTS = ['desktop', 'tablet', 'mobile'] as const;
export type ResponsiveBreakpoint = (typeof RESPONSIVE_BREAKPOINTS)[number];

export interface BoxEdges {
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
}

export interface LayoutStyles {
  display?: 'flex' | 'grid' | 'block' | 'inline-flex' | 'none';
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  gap?: number;
  rowGap?: number;
  columnGap?: number;
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  flexWrap?: 'nowrap' | 'wrap';
  columns?: number;
}

export interface AlignmentStyles {
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch' | 'baseline';
  justifyContent?:
    | 'flex-start'
    | 'center'
    | 'flex-end'
    | 'space-between'
    | 'space-around'
    | 'space-evenly';
  alignSelf?: 'auto' | 'flex-start' | 'center' | 'flex-end' | 'stretch';
}

export interface VisibilityStyles {
  hidden?: boolean;
}

export interface SizeStyles {
  width?: string | number;
  height?: string | number;
  minWidth?: string | number;
  minHeight?: string | number;
  maxWidth?: string | number;
  maxHeight?: string | number;
}

export interface SpacingStyles {
  margin?: BoxEdges;
  padding?: BoxEdges;
}

export interface TypographyStyles {
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  textTransform?: 'none' | 'uppercase' | 'lowercase' | 'capitalize';
}

export interface ColorStyles {
  color?: string;
}

export interface BackgroundStyles {
  color?: string;
  mediaId?: string;
  src?: string;
  fit?: 'cover' | 'contain' | 'fill' | 'none';
  position?: string;
}

export interface BorderStyles {
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted' | 'none';
  color?: string;
}

export interface RadiusStyles {
  topLeft?: number;
  topRight?: number;
  bottomRight?: number;
  bottomLeft?: number;
}

export interface ShadowStyles {
  x?: number;
  y?: number;
  blur?: number;
  spread?: number;
  color?: string;
}

export interface StyleModel {
  layout?: LayoutStyles;
  size?: SizeStyles;
  spacing?: SpacingStyles;
  typography?: TypographyStyles;
  alignment?: AlignmentStyles;
  visibility?: VisibilityStyles;
  color?: ColorStyles;
  background?: BackgroundStyles;
  border?: BorderStyles;
  radius?: RadiusStyles;
  shadow?: ShadowStyles;
}

export type ResponsiveOverrides = Partial<
  Record<ResponsiveBreakpoint, StyleModel>
>;

export interface VisualNode {
  id: string;
  type: NodeType;
  props: Record<string, unknown>;
  styles: StyleModel;
  responsive: ResponsiveOverrides;
  children: VisualNode[];
  enabled?: boolean;
}

export const THEME_COLOR_KEYS = [
  'primary',
  'secondary',
  'accent',
  'background',
  'surface',
  'text',
  'muted',
  'border',
] as const;

export type ThemeColorKey = (typeof THEME_COLOR_KEYS)[number];

export interface ThemeTokens {
  colors: {
    primary: string;
    secondary: string;
    accent: string;
    background: string;
    surface: string;
    text: string;
    muted: string;
    border: string;
  };
  typography: {
    headingFont: string;
    bodyFont: string;
  };
  tokens: Record<string, unknown>;
}

export interface ThemeConfigV3 extends ThemeConfig, ThemeTokens {}

export interface SiteMetadataV3 {
  id?: string | null;
  name: string;
  businessType: string;
  language: string;
  favicon?: string | null;
  settings?: SiteSettings;
}

export interface PageContractV3 {
  id: string;
  name: string;
  title: string;
  slug: string;
  type: PageTypeV2;
  sortOrder: number;
  enabled: boolean;
  seo?: PageSeo;
  root: VisualNode;
  /** V2 projection for legacy renderers. Derived from `legacy-section` nodes. */
  sections?: SectionContract[];
}

export interface WebsiteDocumentV3 {
  schemaVersion: SchemaVersionV3;
  site: SiteMetadataV3;
  theme: ThemeConfigV3;
  business: BusinessInfo;
  navigation: NavigationConfig;
  pages: PageContractV3[];
  seo: GlobalSeo;
  settings: SiteSettings;
}

export const DOCUMENT_OPERATION_TYPES = [
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
] as const;

export type DocumentOperationType = (typeof DOCUMENT_OPERATION_TYPES)[number];

export interface AddNodeOperation {
  type: 'addNode';
  parentId: string;
  index?: number;
  node: Partial<VisualNode> & { type: NodeType | string };
}

export interface RemoveNodeOperation {
  type: 'removeNode';
  nodeId: string;
}

export interface MoveNodeOperation {
  type: 'moveNode';
  nodeId: string;
  parentId: string;
  index?: number;
}

export interface DuplicateNodeOperation {
  type: 'duplicateNode';
  nodeId: string;
}

export interface UpdateNodeOperation {
  type: 'updateNode';
  nodeId: string;
  changes: {
    props?: Record<string, unknown>;
    styles?: StyleModel;
    responsive?: ResponsiveOverrides;
    enabled?: boolean;
  };
}

export interface UpdatePropsOperation {
  type: 'updateProps';
  nodeId: string;
  props: Record<string, unknown>;
}

export interface UpdateStylesOperation {
  type: 'updateStyles';
  nodeId: string;
  styles: StyleModel;
}

export interface UpdateResponsiveOperation {
  type: 'updateResponsive';
  nodeId: string;
  breakpoint: ResponsiveBreakpoint;
  styles: StyleModel;
}

export interface ReorderChildrenOperation {
  type: 'reorderChildren';
  parentId: string;
  childIds: string[];
}

export interface UpdateThemeOperation {
  type: 'updateTheme';
  theme: Partial<ThemeConfigV3> & Record<string, unknown>;
}

export interface UpdateSiteOperation {
  type: 'updateSite';
  site: Partial<SiteMetadataV3> & Record<string, unknown>;
}

export interface InsertPresetOperation {
  type: 'insertPreset';
  parentId: string;
  presetId: string;
  index?: number;
}

export type DocumentOperation =
  | AddNodeOperation
  | RemoveNodeOperation
  | MoveNodeOperation
  | DuplicateNodeOperation
  | UpdateNodeOperation
  | UpdatePropsOperation
  | UpdateStylesOperation
  | UpdateResponsiveOperation
  | ReorderChildrenOperation
  | UpdateThemeOperation
  | UpdateSiteOperation
  | InsertPresetOperation;

export const DOCUMENT_LIMITS = {
  maxNodes: 2000,
  maxDepth: 16,
  maxBytes: 750_000,
  maxBatchOperations: 50,
  maxPropString: 5000,
} as const;
