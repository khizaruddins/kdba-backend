import { SectionType } from '../types/document.types';

export interface SectionDefinition {
  type: SectionType;
  displayName: string;
  description: string;
  variants: string[];
  defaultVariant: string;
}

export const SECTION_REGISTRY: Record<SectionType, SectionDefinition> = {
  navbar: {
    type: 'navbar',
    displayName: 'Navigation Bar',
    description: 'Header navigation with branding, links, and action button',
    variants: ['standard', 'sticky', 'transparent', 'centered', 'minimal'],
    defaultVariant: 'standard',
  },
  hero: {
    type: 'hero',
    displayName: 'Hero Header',
    description: 'Prominent header section with headline, CTA, and visual media',
    variants: [
      'centered',
      'split-image',
      'fullscreen',
      'image-background',
      'editorial',
      'minimal',
      'video-bg',
    ],
    defaultVariant: 'split-image',
  },
  about: {
    type: 'about',
    displayName: 'About Us',
    description: 'Company or business narrative, vision, and core capabilities',
    variants: [
      'split-text-image',
      'two-column',
      'story-timeline',
      'stats-highlight',
      'minimal',
    ],
    defaultVariant: 'split-text-image',
  },
  services: {
    type: 'services',
    displayName: 'Services Grid',
    description: 'Showcase of services offered with icons, details, and CTAs',
    variants: ['grid-cards', 'list-detailed', 'carousel', 'icon-boxes', 'tabs'],
    defaultVariant: 'grid-cards',
  },
  features: {
    type: 'features',
    displayName: 'Features List',
    description: 'Product or service key highlights, value propositions, and capabilities',
    variants: ['grid-3-col', 'grid-4-col', 'alternating-rows', 'icon-cards'],
    defaultVariant: 'grid-3-col',
  },
  products: {
    type: 'products',
    displayName: 'Product Catalog',
    description: 'E-commerce or catalog showcase of products with pricing and buy actions',
    variants: ['grid-showcase', 'carousel', 'featured-list', 'minimal-cards'],
    defaultVariant: 'grid-showcase',
  },
  portfolio: {
    type: 'portfolio',
    displayName: 'Portfolio / Projects',
    description: 'Showcase of completed work, client case studies, and gallery',
    variants: ['masonry', 'grid-with-filters', 'carousel', 'minimal'],
    defaultVariant: 'grid-with-filters',
  },
  gallery: {
    type: 'gallery',
    displayName: 'Photo Gallery',
    description: 'Visual media collection with lightboxes or masonry layout',
    variants: ['grid-masonry', 'carousel-lightbox', 'strip', 'fullscreen-modal'],
    defaultVariant: 'grid-masonry',
  },
  team: {
    type: 'team',
    displayName: 'Team Members',
    description: 'Staff profiles, bios, photos, and social links',
    variants: ['grid-cards', 'circular-avatars', 'editorial-list', 'minimal'],
    defaultVariant: 'grid-cards',
  },
  testimonials: {
    type: 'testimonials',
    displayName: 'Customer Reviews',
    description: 'Social proof, client testimonials, ratings, and feedback',
    variants: ['carousel', 'grid-cards', 'single-quote', 'masonry-cards'],
    defaultVariant: 'grid-cards',
  },
  stats: {
    type: 'stats',
    displayName: 'Key Metrics & Stats',
    description: 'Highlighted numbers, achievements, and impact counters',
    variants: ['inline-bar', 'card-grid', 'minimal-counters', 'split-stats'],
    defaultVariant: 'card-grid',
  },
  pricing: {
    type: 'pricing',
    displayName: 'Pricing Tiers',
    description: 'Plan tiers, feature comparison tables, and purchase CTAs',
    variants: ['3-tier-cards', 'toggle-monthly-yearly', 'comparison-table', 'minimal'],
    defaultVariant: '3-tier-cards',
  },
  faq: {
    type: 'faq',
    displayName: 'Frequently Asked Questions',
    description: 'Accordion or categorized questions and answers',
    variants: ['accordion', 'two-column-list', 'grouped-categories', 'card-grid'],
    defaultVariant: 'accordion',
  },
  process: {
    type: 'process',
    displayName: 'Process / How It Works',
    description: 'Step-by-step workflow, timeline, or onboarding roadmap',
    variants: ['step-numbers', 'horizontal-timeline', 'vertical-cards', 'flowchart'],
    defaultVariant: 'step-numbers',
  },
  contact: {
    type: 'contact',
    displayName: 'Contact Form & Info',
    description: 'Inquiry submission form with direct contact channels',
    variants: ['split-form-map', 'card-centered', 'simple-form', 'compact-info'],
    defaultVariant: 'split-form-map',
  },
  map: {
    type: 'map',
    displayName: 'Location Map',
    description: 'Interactive map embed with physical address and directions',
    variants: ['fullwidth-interactive', 'boxed-with-hours', 'split-contact'],
    defaultVariant: 'boxed-with-hours',
  },
  'opening-hours': {
    type: 'opening-hours',
    displayName: 'Business Hours',
    description: 'Operating schedule with live status badge',
    variants: ['table-card', 'minimal-list', 'badge-status'],
    defaultVariant: 'table-card',
  },
  cta: {
    type: 'cta',
    displayName: 'Call to Action',
    description: 'High-conversion banner driving bookings, inquiries, or purchases',
    variants: ['banner-centered', 'split-headline-action', 'floating-card', 'minimal-inline'],
    defaultVariant: 'banner-centered',
  },
  footer: {
    type: 'footer',
    displayName: 'Footer',
    description: 'Bottom navigation, copyright, social icons, and newsletter signup',
    variants: ['multi-column-detailed', 'minimal-inline', 'brand-focused', 'simple-centered'],
    defaultVariant: 'multi-column-detailed',
  },
  'logo-cloud': {
    type: 'logo-cloud',
    displayName: 'Client & Partner Logos',
    description: 'Logos of enterprise clients, press mentions, or tech partners',
    variants: ['inline-row', 'grid-monochrome', 'marquee-slider'],
    defaultVariant: 'inline-row',
  },
  blog: {
    type: 'blog',
    displayName: 'Latest Articles / Blog',
    description: 'Recent news, articles, insights, or recipes',
    variants: ['grid-articles', 'featured-top-list', 'magazine-layout'],
    defaultVariant: 'grid-articles',
  },
  'restaurant-menu': {
    type: 'restaurant-menu',
    displayName: 'Food & Drink Menu',
    description: 'Categorized dishes, pricing, dietary tags, and photos',
    variants: ['categorized-list', 'grid-with-photos', 'two-column-classic', 'tabs-daily-specials'],
    defaultVariant: 'categorized-list',
  },
  'property-grid': {
    type: 'property-grid',
    displayName: 'Real Estate Listings',
    description: 'Filterable real estate properties with specs, price, and inquiry button',
    variants: ['filter-search-grid', 'featured-cards', 'map-integrated'],
    defaultVariant: 'filter-search-grid',
  },
  'doctor-profile': {
    type: 'doctor-profile',
    displayName: 'Physician / Specialist Profile',
    description: 'Doctor credentials, education, specialties, and consultation booking',
    variants: ['credentials-card', 'team-specialists', 'booking-focus'],
    defaultVariant: 'credentials-card',
  },
  'course-grid': {
    type: 'course-grid',
    displayName: 'Courses / Curriculum',
    description: 'Educational programs, modules, certifications, and enrollment',
    variants: ['curriculum-cards', 'video-preview-grid', 'timeline-modules'],
    defaultVariant: 'curriculum-cards',
  },
  'room-grid': {
    type: 'room-grid',
    displayName: 'Hotel Rooms & Suites',
    description: 'Accommodations showcase with amenities, capacity, and booking',
    variants: ['amenities-cards', 'booking-engine-list', 'luxury-suite-split'],
    defaultVariant: 'amenities-cards',
  },
  'trainer-grid': {
    type: 'trainer-grid',
    displayName: 'Fitness Trainers & Coaches',
    description: 'Personal trainer bios, specialties, and session booking',
    variants: ['fitness-coaches-grid', 'schedule-integrated', 'achievement-cards'],
    defaultVariant: 'fitness-coaches-grid',
  },
  'treatment-grid': {
    type: 'treatment-grid',
    displayName: 'Spa & Salon Treatments',
    description: 'Wellness services with durations, benefits, and price points',
    variants: ['spa-menu-cards', 'duration-pricing-list', 'wellness-packages'],
    defaultVariant: 'spa-menu-cards',
  },
};

export function isValidSectionType(type: string): type is SectionType {
  return type in SECTION_REGISTRY;
}

export function isValidVariant(type: SectionType, variant: string): boolean {
  const definition = SECTION_REGISTRY[type];
  if (!definition) return false;
  return definition.variants.includes(variant);
}

export function getSupportedVariants(type: SectionType): string[] {
  return SECTION_REGISTRY[type]?.variants ?? [];
}
