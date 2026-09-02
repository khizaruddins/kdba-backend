import { WebsiteDocument } from '../../../documents/types/document.types';

export const travelAgencyTemplate = {
  id: 'travel-agency',
  name: 'Bespoke Luxury Travel & Expeditions',
  slug: 'travel-agency',
  description: 'High-end luxury travel curator template featuring bespoke safari itineraries, private jet charter journeys, and custom trip planners.',
  category: 'BUSINESS',
  previewImage: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800&auto=format&fit=crop&q=80',
  style: ['luxury', 'adventurous', 'warm'],
  version: '1.0',
  document: {
    schemaVersion: '2.0',
    site: {
      name: 'Nomad & Silk Luxury Expeditions',
      businessType: 'travel-agency',
      language: 'en',
    },
    theme: {
      primaryColor: '#1c1917',
      secondaryColor: '#fafaf9',
      accentColor: '#d97706',
      backgroundColor: '#fdfbf7',
      textColor: '#292524',
      headingFont: 'Playfair Display',
      bodyFont: 'Plus Jakarta Sans',
      borderRadius: 'md',
      shadows: 'subtle',
    },
    business: {
      name: 'Nomad & Silk Luxury Expeditions',
      tagline: 'Unrivaled bespoke journeys, private jet safaris & arctic exploration',
      description: 'Handcrafted luxury itineraries across 7 continents with 24/7 dedicated expedition concierges and VIP permits.',
      category: 'Bespoke Luxury Travel & Safari Advisory',
      email: 'expeditions@nomadandsilk.com',
      phone: '+1 (800) 555-8120',
      address: '45 Rockefeller Plaza, Suite 2000',
      city: 'New York',
      state: 'NY',
      country: 'US',
      zipCode: '10111',
    },
    navigation: {
      header: [
        { id: 'nav_1', label: 'Journeys', href: '/#destinations' },
        { id: 'nav_2', label: 'Experiences', href: '/#experiences' },
        { id: 'nav_3', label: 'About Us', href: '/#about' },
        { id: 'nav_4', label: 'Plan a Trip', href: '/#contact' },
      ],
      footer: [
        {
          title: 'Featured Expeditions',
          links: [
            { id: 'fl_1', label: 'Serengeti Private Safari', href: '/#destinations' },
            { id: 'fl_2', label: 'Patagonia Glaciers & Heli-Skiing', href: '/#destinations' },
            { id: 'fl_3', label: 'Kyoto Ryokan Cultural Immersion', href: '/#destinations' },
          ],
        },
      ],
      ctaButton: {
        label: 'Design Custom Trip',
        href: '/#contact',
        variant: 'primary',
      },
    },
    pages: [
      {
        id: 'page_home',
        title: 'Home',
        slug: '/',
        type: 'home',
        sortOrder: 0,
        enabled: true,
        sections: [
          {
            id: 'sec_nav',
            type: 'navbar',
            variant: 'transparent',
            enabled: true,
            sortOrder: 0,
            props: { brandName: 'NOMAD & SILK' },
          },
          {
            id: 'sec_hero',
            type: 'hero',
            variant: 'fullscreen',
            enabled: true,
            sortOrder: 1,
            props: {
              badge: 'Virtuoso Ultraluxe Certified Travel Designer',
              headline: 'Tailored Expeditions to the World’s Most Extraordinary Corners',
              subheadline: 'Private island buyouts, exclusive wildlife conservation access, and bespoke flight itineraries designed around you.',
              primaryCtaText: 'Explore Curated Itineraries',
              primaryCtaUrl: '#destinations',
              imageUrl: 'https://images.unsplash.com/photo-1516426122078-c23e76319801?w=1200&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'sec_destinations',
            type: 'services',
            variant: 'grid-cards',
            enabled: true,
            sortOrder: 2,
            props: {
              badge: 'Handcrafted Itineraries',
              headline: 'Iconic Global Expeditions',
              items: [
                { title: 'The Great Migration by Helicopter', description: 'Tanzania & Kenya: Private mobile luxury camps with aerial wildlife tracking and Maasai guides.' },
                { title: 'Antarctica Superyacht Voyage', description: '7-star polar expedition vessel with zodiac whale excursions, submarine dives, and naturalist lectures.' },
                { title: 'Bhutan Sacred Monasteries', description: 'Private audience with high lamas, luxury mountain lodges, and helicopter transfers to Tiger’s Nest.' },
              ],
            },
          },
          {
            id: 'sec_stats',
            type: 'stats',
            variant: 'card-grid',
            enabled: true,
            sortOrder: 3,
            props: {
              items: [
                { value: '118', label: 'Countries Explored' },
                { value: '100%', label: 'Custom Tailored Itineraries' },
                { value: '24/7', label: 'Global Dedicated Concierge' },
                { value: '99.7%', label: 'Traveler Satisfaction' },
              ],
            },
          },
          {
            id: 'sec_contact',
            type: 'contact',
            variant: 'split-form-map',
            enabled: true,
            sortOrder: 4,
            props: {
              headline: 'Plan Your Next Extraordinary Journey',
              subheadline: 'Connect with a Private Expedition Director to craft your custom itinerary.',
            },
          },
          {
            id: 'sec_footer',
            type: 'footer',
            variant: 'multi-column-detailed',
            enabled: true,
            sortOrder: 5,
            props: {
              copyright: '© 2026 Nomad & Silk Luxury Expeditions LLC.',
            },
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'Nomad & Silk — Bespoke Luxury Travel & Private Jet Safaris',
      metaDescription: 'Handcrafted luxury travel itineraries, private safaris, and polar expeditions with Nomad & Silk.',
      keywords: ['luxury travel agency', 'bespoke safari', 'private jet travel', 'virtuoso travel designer'],
    },
    settings: {
      enableContactForm: true,
      language: 'en',
    },
  },
} as const;
