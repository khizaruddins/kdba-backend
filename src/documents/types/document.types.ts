/**
 * KDBA V2 — Canonical WebsiteDocument Type Definitions
 *
 * Defines the canonical document model:
 * Website -> WebsiteDocument -> Theme | Business | Navigation | Pages -> Sections -> Components / Variants
 */

export const SCHEMA_VERSION = '2.0' as const;
export type SchemaVersion = typeof SCHEMA_VERSION;

// ─── 28 SUPPORTED SECTION TYPES ───────────────────────────────────────────────

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

// ─── THEME ────────────────────────────────────────────────────────────────────

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

// ─── BUSINESS ─────────────────────────────────────────────────────────────────

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
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    linkedin?: string;
    youtube?: string;
    tiktok?: string;
    github?: string;
    [key: string]: string | undefined;
  };
  businessHours?: Record<
    string,
    {
      open: string;
      close: string;
      closed?: boolean;
    }
  >;
}

// ─── NAVIGATION ───────────────────────────────────────────────────────────────

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

// ─── SECTIONS & COMPONENTS ────────────────────────────────────────────────────

export interface SectionContract {
  id: string;
  type: SectionType;
  variant: string;
  enabled: boolean;
  sortOrder: number;
  props: Record<string, unknown>;
  styles?: Record<string, unknown>;
  // Future V3 extensions
  responsive?: Record<string, unknown>;
  animations?: Record<string, unknown>;
  interactions?: Record<string, unknown>;
}

// ─── PAGES ────────────────────────────────────────────────────────────────────

export type PageTypeV2 =
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
}

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

// ─── GLOBAL SEO ───────────────────────────────────────────────────────────────

export interface GlobalSeo {
  metaTitle: string;
  metaDescription: string;
  ogImage?: string;
  canonicalUrl?: string;
  keywords?: string[];
}

// ─── GLOBAL SETTINGS ──────────────────────────────────────────────────────────

export interface SiteSettings {
  analyticsId?: string;
  customDomain?: string;
  enableContactForm: boolean;
  enableLiveChat?: boolean;
  language?: string;
}

// ─── SITE METADATA ────────────────────────────────────────────────────────────

export interface SiteMetadata {
  id?: string;
  name: string;
  businessType: string;
  language: string;
  favicon?: string;
}

// ─── CANONICAL WEBSITE DOCUMENT ───────────────────────────────────────────────

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

// ─── DOCUMENT MUTATION PAYLOADS ───────────────────────────────────────────────

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

// ─── TEMPLATE METADATA ────────────────────────────────────────────────────────

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
