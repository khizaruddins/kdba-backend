import { WebsiteDocument } from '../../../documents/types/document.types';

export const hotelBoutiqueTemplate = {
  id: 'hotel-boutique',
  name: 'Boutique Hotel & Historic Villa',
  slug: 'hotel-boutique',
  description: 'Charming boutique hotel template featuring room/suite showcases, property amenities, dining reservations, and direct booking engine.',
  category: 'RESTAURANT',
  previewImage: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&auto=format&fit=crop&q=80',
  style: ['luxury', 'warm', 'editorial'],
  version: '1.0',
  document: {
    schemaVersion: '2.0',
    site: {
      name: 'Villa Bellissima Boutique Resort',
      businessType: 'hotel',
      language: 'en',
    },
    theme: {
      primaryColor: '#1e293b',
      secondaryColor: '#fafaf9',
      accentColor: '#c27803',
      backgroundColor: '#fefefe',
      textColor: '#334155',
      headingFont: 'Playfair Display',
      bodyFont: 'Plus Jakarta Sans',
      borderRadius: 'sm',
      shadows: 'subtle',
    },
    business: {
      name: 'Villa Bellissima Boutique Resort',
      tagline: 'Timeless Italian Riviera elegance overlooking the Mediterranean',
      description: 'An exclusive 18-suite private cliffside villa in Positano featuring infinity seawater pools, Michelin-starred dining, and private yacht charters.',
      category: 'Luxury Boutique Resort & Suites',
      email: 'stay@villabellissimaresort.com',
      phone: '+39 089 555-1200',
      address: 'Via Cristoforo Colombo 88',
      city: 'Positano',
      state: 'Salerno',
      country: 'IT',
      zipCode: '84017',
    },
    navigation: {
      header: [
        { id: 'nav_1', label: 'Suites', href: '/#suites' },
        { id: 'nav_2', label: 'Dining', href: '/#dining' },
        { id: 'nav_3', label: 'Experiences', href: '/#experiences' },
        { id: 'nav_4', label: 'Reservations', href: '/#contact' },
      ],
      footer: [
        {
          title: 'Accommodations',
          links: [
            { id: 'fl_1', label: 'Cliffside Infinity Suite', href: '/#suites' },
            { id: 'fl_2', label: 'The Penthouse Terrace', href: '/#suites' },
            { id: 'fl_3', label: 'Private Villa Buyout', href: '/#contact' },
          ],
        },
      ],
      ctaButton: {
        label: 'Check Availability',
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
            props: { brandName: 'VILLA BELLISSIMA' },
          },
          {
            id: 'sec_hero',
            type: 'hero',
            variant: 'fullscreen',
            enabled: true,
            sortOrder: 1,
            props: {
              badge: 'Condé Nast Traveler Gold List 2026',
              headline: 'An Unforgettable Cliffside Escape in Positano',
              subheadline: 'Breathtaking panoramic views of the Amalfi Coast, private sun terraces, and Michelin-starred dining.',
              primaryCtaText: 'Reserve Your Suite',
              primaryCtaUrl: '#contact',
              imageUrl: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=1200&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'sec_suites',
            type: 'room-grid',
            variant: 'amenities-cards',
            enabled: true,
            sortOrder: 2,
            props: {
              badge: 'Bespoke Accommodations',
              headline: 'Exclusive Suites & Penthouses',
              rooms: [
                { title: 'The Master Cliffside Terrace Suite', rate: 'From €1,450 / night', specs: 'King Bed • 85 m² • Private Plunge Pool', description: 'Panoramic coastal views, hand-painted Majolica tiles, freestanding soaking tub, and private butler service.', imageUrl: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&auto=format&fit=crop&q=80' },
                { title: 'The Amalfi Sunset Penthouse', rate: 'From €2,200 / night', specs: 'King Bed • 130 m² • 360° Wrap Terrace', description: 'Duplex layout with private rooftop jacuzzi, outdoor dining pergola, and dedicated Riva yacht excursion.', imageUrl: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&auto=format&fit=crop&q=80' },
              ],
            },
          },
          {
            id: 'sec_amenities',
            type: 'features',
            variant: 'grid-3-col',
            enabled: true,
            sortOrder: 3,
            props: {
              badge: 'Villa Privileges',
              headline: 'Curated Guest Amenities',
              items: [
                { title: 'Seawater Infinity Plunge Pool', description: 'Perched 300 meters above the bay with direct cliffside sunset vantage.' },
                { title: 'Private Riva Yacht Excursions', description: 'Complimentary half-day yacht excursions along Capri and the Faraglioni rocks.' },
                { title: 'Cliffside Sommelier Wine Cellar', description: 'Featuring over 2,400 rare vintage bottles from Campania and Tuscany.' },
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
              headline: 'Inquire Availability & Bespoke Stays',
              subheadline: 'Our concierge will tailor your arrival, helicopter transfers, and dietary preferences.',
            },
          },
          {
            id: 'sec_footer',
            type: 'footer',
            variant: 'multi-column-detailed',
            enabled: true,
            sortOrder: 5,
            props: {
              copyright: '© 2026 Villa Bellissima Boutique Resort SRL.',
            },
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'Villa Bellissima — Luxury Boutique Hotel Positano Amalfi Coast',
      metaDescription: 'Exclusive 18-suite luxury boutique resort in Positano with private plunge pools, panoramic Amalfi views, and yacht charters.',
      keywords: ['positano hotel', 'amalfi luxury resort', 'boutique hotel italy', 'luxury suites positano'],
    },
    settings: {
      enableContactForm: true,
      language: 'en',
    },
  },
} as const;
