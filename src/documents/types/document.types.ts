/**
 * KDBA V3 — Canonical WebsiteDocument Type Definitions
 *
 * Defines the canonical document model:
 * Website -> WebsiteDocument (3.0) -> Theme System | Business | Navigation | Pages -> Hierarchical Nodes -> Elements
 */

export const SCHEMA_VERSION = '3.0' as const;
export const SCHEMA_VERSION_V2 = '2.0' as const;
export type SchemaVersion = typeof SCHEMA_VERSION | typeof SCHEMA_VERSION_V2;

// ─── 28 V2 LEGACY SECTION TYPES (FOR BACKWARD COMPATIBILITY) ───────────────────

export const SECTION_TYPES = [
  'navbar',
  'hero',
  'about',
  'services',
  'features',
  'products',
  'portfolio',
  'gallery',
  'team',
  'testimonials',
  'stats',
  'pricing',
  'faq',
  'process',
  'contact',
  'map',
  'opening-hours',
  'cta',
  'footer',
  'logo-cloud',
  'blog',
  'restaurant-menu',
  'property-grid',
  'doctor-profile',
  'course-grid',
  'room-grid',
  'trainer-grid',
  'treatment-grid',
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

// ─── V3 NODE TYPES ─────────────────────────────────────────────────────────────

export const STRUCTURAL_NODE_TYPES = [
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
  'rich-text',
  'text',
  'button',
  'link',
  'icon',
  'logo',
  'badge',
  'divider',
  'spacer',
  'list',
  'quote',
] as const;

export const MEDIA_NODE_TYPES = [
  'image',
  'video',
  'gallery',
  'carousel',
  'background-media',
] as const;

export const BUSINESS_NODE_TYPES = [
  'form',
  'contact-form',
  'map',
  'opening-hours',
  'pricing',
  'product',
  'testimonial',
  'team',
  'service',
] as const;

export const NAVIGATION_NODE_TYPES = [
  'navbar',
  'navigation',
  'footer',
] as const;

export const ALL_NODE_TYPES = [
  ...STRUCTURAL_NODE_TYPES,
  ...CONTENT_NODE_TYPES,
  ...MEDIA_NODE_TYPES,
  ...BUSINESS_NODE_TYPES,
  ...NAVIGATION_NODE_TYPES,
] as const;

export type StructuralNodeType = (typeof STRUCTURAL_NODE_TYPES)[number];
export type ContentNodeType = (typeof CONTENT_NODE_TYPES)[number];
export type MediaNodeType = (typeof MEDIA_NODE_TYPES)[number];
export type BusinessNodeType = (typeof BUSINESS_NODE_TYPES)[number];
export type NavigationNodeType = (typeof NAVIGATION_NODE_TYPES)[number];
export type NodeType = (typeof ALL_NODE_TYPES)[number];

// ─── V3 STRUCTURED STYLES ──────────────────────────────────────────────────────

export interface BoxSpacing {
  top?: string;
  right?: string;
  bottom?: string;
  left?: string;
}

export interface BorderSide {
  width?: string;
  style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
  color?: string;
}

export interface BorderRadiusDefinition {
  topLeft?: string;
  topRight?: string;
  bottomRight?: string;
  bottomLeft?: string;
  all?: string;
}

export interface ShadowDefinition {
  x: number;
  y: number;
  blur: number;
  spread: number;
  color: string;
  inset?: boolean;
}

export interface GradientColorStop {
  color: string;
  offset: number; // 0 to 100
}

export interface GradientDefinition {
  type: 'linear' | 'radial';
  angle?: number; // e.g. 90, 180
  stops: GradientColorStop[];
}

export interface StyleDefinition {
  layout?: {
    display?: 'flex' | 'grid' | 'block' | 'inline-block' | 'inline-flex' | 'none';
    position?: 'static' | 'relative' | 'absolute' | 'sticky' | 'fixed';
    width?: string;
    height?: string;
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
    top?: string;
    right?: string;
    bottom?: string;
    left?: string;
    zIndex?: number;
    overflow?: 'visible' | 'hidden' | 'scroll' | 'auto';
  };
  flex?: {
    direction?: 'row' | 'row-reverse' | 'column' | 'column-reverse';
    wrap?: 'nowrap' | 'wrap' | 'wrap-reverse';
    justifyContent?:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'baseline' | 'stretch';
    alignContent?:
      | 'flex-start'
      | 'flex-end'
      | 'center'
      | 'space-between'
      | 'space-around'
      | 'stretch';
    gap?: string;
    rowGap?: string;
    columnGap?: string;
    grow?: number;
    shrink?: number;
    basis?: string;
  };
  grid?: {
    columns?: number;
    rows?: number;
    gridTemplateColumns?: string;
    gridTemplateRows?: string;
    columnGap?: string;
    rowGap?: string;
    autoFlow?: 'row' | 'column' | 'dense';
    columnSpan?: number | string; // e.g. 1 to 12
    rowSpan?: number | string;
  };
  size?: {
    width?: string;
    height?: string;
    minWidth?: string;
    maxWidth?: string;
    minHeight?: string;
    maxHeight?: string;
    aspectRatio?: string;
  };
  spacing?: {
    margin?: BoxSpacing;
    padding?: BoxSpacing;
  };
  typography?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: string | number;
    lineHeight?: string | number;
    letterSpacing?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    textDecoration?: 'none' | 'underline' | 'line-through';
    color?: string;
  };
  background?: {
    color?: string;
    gradient?: GradientDefinition;
    image?: string;
    mediaId?: string;
    position?: string;
    size?: 'cover' | 'contain' | 'auto' | string;
    repeat?: 'no-repeat' | 'repeat' | 'repeat-x' | 'repeat-y';
    opacity?: number;
  };
  border?: {
    top?: BorderSide;
    right?: BorderSide;
    bottom?: BorderSide;
    left?: BorderSide;
    width?: string;
    style?: 'solid' | 'dashed' | 'dotted' | 'double' | 'none';
    color?: string;
    radius?: BorderRadiusDefinition;
  };
  effects?: {
    boxShadow?: ShadowDefinition | ShadowDefinition[];
    textShadow?: ShadowDefinition;
    opacity?: number;
    filter?: string;
    backdropFilter?: string;
  };
  transform?: {
    translateX?: string;
    translateY?: string;
    scale?: number;
    scaleX?: number;
    scaleY?: number;
    rotate?: string;
    skewX?: string;
    skewY?: string;
  };
}

export interface BreakpointConfig {
  desktop: number; // e.g. 1200
  tablet: number;  // e.g. 768
  mobile: number;  // e.g. 480
  [customKey: string]: number;
}

export interface ResponsiveStyleDefinition {
  tablet?: StyleDefinition;
  mobile?: StyleDefinition;
  custom?: Record<string, StyleDefinition>;
}

export interface ResponsiveVisibility {
  desktop?: boolean;
  tablet?: boolean;
  mobile?: boolean;
  [customBreakpoint: string]: boolean | undefined;
}

// ─── V3 INTERACTIONS & ANIMATIONS ──────────────────────────────────────────────

export interface InteractionDefinition {
  trigger: 'click' | 'hover' | 'scroll-into-view' | 'load';
  action: 'navigate' | 'scroll-to-anchor' | 'open-modal' | 'toggle-element' | 'custom';
  target?: string;
  payload?: Record<string, unknown>;
}

export interface AnimationDefinition {
  type: 'fade' | 'slide-up' | 'slide-down' | 'zoom' | 'bounce' | 'none';
  duration?: number; // ms
  delay?: number; // ms
  easing?: 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | string;
  trigger?: 'load' | 'scroll' | 'hover';
}

// ─── V3 HIERARCHICAL NODE MODEL ───────────────────────────────────────────────

export interface WebsiteNode {
  id: string;
  type: NodeType;
  name?: string;
  children?: WebsiteNode[];
  props?: Record<string, unknown>;
  styles?: StyleDefinition;
  responsive?: ResponsiveStyleDefinition;
  visibility?: ResponsiveVisibility;
  interactions?: InteractionDefinition[];
  animations?: AnimationDefinition;
  locked?: boolean;
}

// ─── V3 THEME SYSTEM ──────────────────────────────────────────────────────────

export interface TypographyToken {
  fontFamily: string;
  fontSize: string;
  fontWeight: string | number;
  lineHeight: string | number;
  letterSpacing?: string;
}

export interface TypographySystemV3 {
  h1: TypographyToken;
  h2: TypographyToken;
  h3: TypographyToken;
  h4: TypographyToken;
  h5: TypographyToken;
  h6: TypographyToken;
  body: TypographyToken;
  caption: TypographyToken;
  label: TypographyToken;
  button: TypographyToken;
  quote: TypographyToken;
}

export interface ColorTokensV3 {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  custom?: Record<string, string>;
}

export interface ThemeSystemV3 {
  colors: ColorTokensV3;
  typography: TypographySystemV3;
  breakpoints: BreakpointConfig;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'dramatic';
  customCss?: string;
}

// ─── V3 PAGE DOCUMENT ─────────────────────────────────────────────────────────

export type PageType =
  | 'home'
  | 'about'
  | 'services'
  | 'contact'
  | 'pricing'
  | 'portfolio'
  | 'blog'
  | 'custom';

export interface PageSeo {
  title?: string;
  description?: string;
  ogImage?: string;
  noIndex?: boolean;
  canonicalUrl?: string;
}

export interface PageDocumentV3 {
  id: string;
  title: string;
  slug: string;
  type: PageType;
  sortOrder: number;
  enabled: boolean;
  seo?: PageSeo;
  root: WebsiteNode; // Top-level node of type 'page-root' containing sections
}

// ─── GLOBAL COMPONENTS & SETTINGS ─────────────────────────────────────────────

export interface GlobalComponentsV3 {
  headerNode?: WebsiteNode;
  footerNode?: WebsiteNode;
  reusableNodes?: Record<string, WebsiteNode>;
}

export interface SiteSettingsV3 {
  analyticsId?: string;
  customDomain?: string;
  subdomain?: string;
  enableContactForm: boolean;
  enableLiveChat?: boolean;
  language: string;
  limits?: {
    maxNodes?: number;
    maxDepth?: number;
    maxRichTextChars?: number;
  };
}

// ─── SITE METADATA & BUSINESS ─────────────────────────────────────────────────

export interface SiteMetadata {
  id?: string;
  name: string;
  businessType: string;
  language: string;
  favicon?: string;
}

export interface BusinessInfo {
  name: string;
  legalName?: string;
  tagline?: string;
  description?: string;
  category?: string;
  logoUrl?: string;
  email?: string;
  phone?: string;
  whatsapp?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  socialMedia?: Record<string, string | undefined>;
  businessHours?: Record<
    string,
    {
      open: string;
      close: string;
      closed?: boolean;
    }
  >;
}

export interface NavItem {
  id: string;
  label: string;
  href: string;
  pageId?: string;
  target?: '_self' | '_blank';
  children?: Array<{
    id: string;
    label: string;
    href: string;
    target?: '_self' | '_blank';
  }>;
}

export interface FooterColumn {
  title: string;
  links: Array<{
    id: string;
    label: string;
    href: string;
    target?: '_self' | '_blank';
  }>;
}

export interface NavigationConfig {
  header: NavItem[];
  footer: FooterColumn[];
  ctaButton?: {
    label: string;
    href: string;
    variant?: string;
  };
}

export interface GlobalSeo {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string[];
}

// ─── CANONICAL V3 WEBSITE DOCUMENT ────────────────────────────────────────────

export interface WebsiteDocumentV3 {
  schemaVersion: '3.0';
  site: SiteMetadata;
  theme: ThemeSystemV3;
  business: BusinessInfo;
  navigation: NavigationConfig;
  pages: PageDocumentV3[];
  global: GlobalComponentsV3;
  seo: GlobalSeo;
  settings: SiteSettingsV3;
}

// ─── TYPED DOCUMENT OPERATIONS ────────────────────────────────────────────────

export type DocumentOperationType =
  | 'addNode'
  | 'removeNode'
  | 'duplicateNode'
  | 'moveNode'
  | 'updateNode'
  | 'updateProps'
  | 'updateStyles'
  | 'updateResponsive'
  | 'setVisibility'
  | 'changeParent'
  | 'reorderChildren'
  | 'addPage'
  | 'updatePage'
  | 'removePage'
  | 'reorderPages'
  | 'updateTheme'
  | 'updateBusiness'
  | 'updateNavigation'
  | 'updateSeo'
  | 'updateSettings';

export type DocumentOperation =
  | {
      type: 'addNode';
      pageId: string;
      parentId: string;
      node: WebsiteNode;
      index?: number;
    }
  | {
      type: 'removeNode';
      pageId: string;
      nodeId: string;
    }
  | {
      type: 'duplicateNode';
      pageId: string;
      nodeId: string;
      targetParentId?: string;
      index?: number;
    }
  | {
      type: 'moveNode';
      pageId: string;
      nodeId: string;
      targetParentId: string;
      targetIndex: number;
    }
  | {
      type: 'updateNode';
      pageId: string;
      nodeId: string;
      patch: Partial<WebsiteNode>;
    }
  | {
      type: 'updateProps';
      pageId: string;
      nodeId: string;
      props: Record<string, unknown>;
    }
  | {
      type: 'updateStyles';
      pageId: string;
      nodeId: string;
      styles: Partial<StyleDefinition>;
    }
  | {
      type: 'updateResponsive';
      pageId: string;
      nodeId: string;
      responsive: Partial<ResponsiveStyleDefinition>;
    }
  | {
      type: 'setVisibility';
      pageId: string;
      nodeId: string;
      visibility: ResponsiveVisibility;
    }
  | {
      type: 'changeParent';
      pageId: string;
      nodeId: string;
      newParentId: string;
      index?: number;
    }
  | {
      type: 'reorderChildren';
      pageId: string;
      parentId: string;
      childIds: string[];
    }
  | {
      type: 'addPage';
      page: PageDocumentV3;
    }
  | {
      type: 'updatePage';
      pageId: string;
      patch: Partial<PageDocumentV3>;
    }
  | {
      type: 'removePage';
      pageId: string;
    }
  | {
      type: 'reorderPages';
      pageIds: string[];
    }
  | {
      type: 'updateTheme';
      theme: Partial<ThemeSystemV3>;
    }
  | {
      type: 'updateBusiness';
      business: Partial<BusinessInfo>;
    }
  | {
      type: 'updateNavigation';
      navigation: Partial<NavigationConfig>;
    }
  | {
      type: 'updateSeo';
      seo: Partial<GlobalSeo>;
    }
  | {
      type: 'updateSettings';
      settings: Partial<SiteSettingsV3>;
    };

export interface DocumentOperationsPayload {
  baseRevision?: number;
  operations: DocumentOperation[];
}

export interface DocumentOperationsResult {
  websiteId: string;
  revision: number;
  schemaVersion: '3.0';
  documentHash: string;
  updatedAt: Date;
  document: WebsiteDocumentV3;
  operationsApplied: number;
}

// ─── V2 BACKWARD COMPATIBILITY TYPES ──────────────────────────────────────────

export interface ThemeConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  headingFont: string;
  bodyFont: string;
  borderRadius: 'none' | 'sm' | 'md' | 'lg' | 'full';
  shadows: 'none' | 'subtle' | 'medium' | 'dramatic';
  customCss?: string;
}

export interface SectionContract {
  id: string;
  type: SectionType;
  variant: string;
  enabled: boolean;
  sortOrder: number;
  props: Record<string, unknown>;
  styles?: Record<string, unknown>;
  responsive?: Record<string, unknown>;
  animations?: Record<string, unknown>;
  interactions?: Record<string, unknown>;
}

export type PageTypeV2 = PageType;

export interface PageContract {
  id: string;
  title: string;
  slug: string;
  type: PageTypeV2;
  sortOrder: number;
  enabled: boolean;
  seo?: PageSeo;
  sections: SectionContract[];
}

export interface SiteSettings {
  analyticsId?: string;
  customDomain?: string;
  enableContactForm: boolean;
  enableLiveChat?: boolean;
  language?: string;
}

export interface WebsiteDocument {
  schemaVersion: '2.0';
  site: SiteMetadata;
  theme: ThemeConfig;
  business: BusinessInfo;
  navigation: NavigationConfig;
  pages: PageContract[];
  seo: GlobalSeo;
  settings: SiteSettings;
}

export type MutationType =
  | 'UPDATE_THEME'
  | 'UPDATE_BUSINESS'
  | 'UPDATE_NAVIGATION'
  | 'UPDATE_SEO'
  | 'UPDATE_SETTINGS'
  | 'UPDATE_SECTION_PROPS'
  | 'UPDATE_SECTION_VARIANT'
  | 'TOGGLE_SECTION'
  | 'REORDER_SECTIONS'
  | 'ADD_SECTION'
  | 'REMOVE_SECTION'
  | 'ADD_PAGE'
  | 'UPDATE_PAGE'
  | 'REMOVE_PAGE'
  | 'REORDER_PAGES';

export interface DocumentMutation {
  type: MutationType;
  pageId?: string;
  sectionId?: string;
  payload: Record<string, unknown>;
}

export interface TemplateMetadata {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  previewImage: string;
  style: string[];
  version: string;
  schemaVersion: '2.0';
  document: WebsiteDocument;
}
