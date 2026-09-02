import { WebsiteDocument } from '../../../documents/types/document.types';

export const architectureStudioTemplate = {
  id: 'architecture-studio',
  name: 'Modern Architecture & Urban Design',
  slug: 'architecture-studio',
  description: 'Minimalist, avant-garde architecture studio portfolio with project case studies, blueprint blueprints, awards, and design philosophy.',
  category: 'CREATIVE',
  previewImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
  style: ['minimal', 'monochrome', 'editorial'],
  version: '1.0',
  document: {
    schemaVersion: '2.0',
    site: {
      name: 'Monoform Architecture & Urbanism',
      businessType: 'architecture-studio',
      language: 'en',
    },
    theme: {
      primaryColor: '#09090b',
      secondaryColor: '#f4f4f5',
      accentColor: '#52525b',
      backgroundColor: '#ffffff',
      textColor: '#09090b',
      headingFont: 'Outfit',
      bodyFont: 'Inter',
      borderRadius: 'none',
      shadows: 'none',
    },
    business: {
      name: 'Monoform Architecture & Urbanism',
      tagline: 'Sculptural forms, sustainable materialities & contextual spaces',
      description: 'International architectural practice delivering sustainable residential complexes, cultural institutions, and civic landmarks.',
      category: 'Architecture & Master Planning',
      email: 'studio@monoformarch.com',
      phone: '+1 (206) 555-4490',
      address: '410 Occidental Ave S, Suite 400',
      city: 'Seattle',
      state: 'WA',
      country: 'US',
      zipCode: '98104',
    },
    navigation: {
      header: [
        { id: 'nav_1', label: 'Index', href: '/' },
        { id: 'nav_2', label: 'Projects', href: '/#projects' },
        { id: 'nav_3', label: 'Philosophy', href: '/#philosophy' },
        { id: 'nav_4', label: 'Recognition', href: '/#awards' },
        { id: 'nav_5', label: 'Inquiries', href: '/#contact' },
      ],
      footer: [
        {
          title: 'Selected Typologies',
          links: [
            { id: 'fl_1', label: 'Civic & Cultural', href: '/#projects' },
            { id: 'fl_2', label: 'Private Residential', href: '/#projects' },
            { id: 'fl_3', label: 'Adaptive Reuse', href: '/#projects' },
          ],
        },
      ],
      ctaButton: {
        label: 'Commission Studio',
        href: '/#contact',
        variant: 'secondary',
      },
    },
    pages: [
      {
        id: 'page_home',
        title: 'Index',
        slug: '/',
        type: 'home',
        sortOrder: 0,
        enabled: true,
        sections: [
          {
            id: 'sec_nav',
            type: 'navbar',
            variant: 'minimal',
            enabled: true,
            sortOrder: 0,
            props: { brandName: 'MONOFORM' },
          },
          {
            id: 'sec_hero',
            type: 'hero',
            variant: 'minimal',
            enabled: true,
            sortOrder: 1,
            props: {
              badge: 'AIA National Architecture Honor 2026',
              headline: 'Architecture as a Dialogue Between Light, Material & Nature',
              subheadline: 'Crafting timeless built environments that harmonize monolithic structure with radical environmental sustainability.',
              primaryCtaText: 'Explore Monograph',
              primaryCtaUrl: '#projects',
            },
          },
          {
            id: 'sec_projects',
            type: 'portfolio',
            variant: 'grid-with-filters',
            enabled: true,
            sortOrder: 2,
            props: {
              badge: 'Selected Works',
              headline: 'Recent Built Typologies',
              items: [
                { title: 'The Cascade Glass Pavilion', category: 'Residential', year: '2025', location: 'San Juan Islands, WA', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&auto=format&fit=crop&q=80' },
                { title: 'Nordic Timber Cultural Center', category: 'Civic', year: '2026', location: 'Oslo, Norway', imageUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=800&auto=format&fit=crop&q=80' },
              ],
            },
          },
          {
            id: 'sec_philosophy',
            type: 'about',
            variant: 'two-column',
            enabled: true,
            sortOrder: 3,
            props: {
              badge: 'Studio Ethos',
              headline: 'Constructing with Purpose & Precision',
              description: 'Every project begins with a rigorous investigation into geography, climate, and human interaction. We utilize mass timber, carbon-neutral concrete, and passive ventilation systems.',
              imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'sec_awards',
            type: 'stats',
            variant: 'inline-bar',
            enabled: true,
            sortOrder: 4,
            props: {
              items: [
                { value: '34', label: 'International Design Awards' },
                { value: '100%', label: 'LEED Platinum or Net-Zero' },
                { value: '16', label: 'Global Monograph Features' },
              ],
            },
          },
          {
            id: 'sec_contact',
            type: 'contact',
            variant: 'simple-form',
            enabled: true,
            sortOrder: 5,
            props: {
              headline: 'Initiate a Project Dialogue',
              subheadline: 'For competition invitations, private commissions, or press inquiries.',
            },
          },
          {
            id: 'sec_footer',
            type: 'footer',
            variant: 'minimal-inline',
            enabled: true,
            sortOrder: 6,
            props: {
              copyright: '© 2026 Monoform Architecture Studio.',
            },
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'Monoform — Contemporary Architecture & Urban Planning',
      metaDescription: 'Award-winning sustainable architecture and urban design studio delivering residential, civic, and cultural monographs.',
      keywords: ['architecture studio', 'sustainable architecture', 'modern architect', 'urban design'],
    },
    settings: {
      enableContactForm: true,
      language: 'en',
    },
  },
} as const;
