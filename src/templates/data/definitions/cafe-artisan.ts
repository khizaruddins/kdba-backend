import { WebsiteDocument } from '../../../documents/types/document.types';

export const cafeArtisanTemplate = {
  id: 'cafe-artisan',
  name: 'Artisan Cafe & Roastery',
  slug: 'cafe-artisan',
  description: 'Warm, aesthetic specialty coffee shop featuring single-origin beans, pastries, brewing workshops, and online ordering.',
  category: 'RESTAURANT',
  previewImage: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=800&auto=format&fit=crop&q=80',
  style: ['warm', 'minimal', 'artisanal'],
  version: '1.0',
  document: {
    schemaVersion: '2.0',
    site: {
      name: 'Timber & Bean Specialty Roasters',
      businessType: 'cafe',
      language: 'en',
    },
    theme: {
      primaryColor: '#291b16',
      secondaryColor: '#f7f4ee',
      accentColor: '#c27803',
      backgroundColor: '#fbf9f5',
      textColor: '#2d2724',
      headingFont: 'Outfit',
      bodyFont: 'Plus Jakarta Sans',
      borderRadius: 'md',
      shadows: 'subtle',
    },
    business: {
      name: 'Timber & Bean Specialty Roasters',
      tagline: 'Ethically sourced, precision roasted single-origin coffees',
      description: 'We believe exceptional coffee starts at the farm. Small-batch roasted weekly in Brooklyn.',
      category: 'Specialty Coffee & Roastery',
      email: 'hello@timberandbean.co',
      phone: '+1 (718) 555-3210',
      address: '142 Bedford Avenue',
      city: 'Brooklyn',
      state: 'NY',
      country: 'US',
      zipCode: '11211',
      businessHours: {
        daily: { open: '07:00', close: '18:00' },
      },
    },
    navigation: {
      header: [
        { id: 'nav_1', label: 'Home', href: '/' },
        { id: 'nav_2', label: 'Coffee Menu', href: '/#menu' },
        { id: 'nav_3', label: 'Our Roastery', href: '/#story' },
        { id: 'nav_4', label: 'Visit Us', href: '/#visit' },
      ],
      footer: [
        {
          title: 'Cafe & Beans',
          links: [
            { id: 'fl_1', label: 'Single Origin Beans', href: '/' },
            { id: 'fl_2', label: 'Espresso Blends', href: '/' },
            { id: 'fl_3', label: 'Subscriptions', href: '/' },
          ],
        },
      ],
      ctaButton: {
        label: 'Order Beans',
        href: '/#menu',
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
            variant: 'standard',
            enabled: true,
            sortOrder: 0,
            props: { brandName: 'TIMBER & BEAN' },
          },
          {
            id: 'sec_hero',
            type: 'hero',
            variant: 'split-image',
            enabled: true,
            sortOrder: 1,
            props: {
              badge: 'Micro-Lot Roasters 2026',
              headline: 'Craft Coffee Roasted with Precision & Soul',
              subheadline: 'Handcrafted pour-overs, cold brews, and housemade sourdough pastries in the heart of Williamsburg.',
              primaryCtaText: 'Explore Coffee Menu',
              primaryCtaUrl: '#menu',
              secondaryCtaText: 'Find Location',
              secondaryCtaUrl: '#visit',
              imageUrl: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'sec_menu',
            type: 'restaurant-menu',
            variant: 'grid-with-photos',
            enabled: true,
            sortOrder: 2,
            props: {
              badge: 'Barista Specials',
              headline: 'Daily Brews & Bakery',
              categories: [
                {
                  name: 'Espresso Bar',
                  items: [
                    { name: 'Oat Flat White', description: 'Double shot Ethiopian Yirgacheffe with creamy microfoam', price: '$5.50' },
                    { name: 'Cardamom Honey Latte', description: 'Single origin espresso, wildflower honey, ground green cardamom', price: '$6.25' },
                  ],
                },
                {
                  name: 'Artisan Bakery',
                  items: [
                    { name: 'Almond Twice-Baked Croissant', description: 'Frangipane filling, toasted slivered almonds, sea salt', price: '$5.75' },
                    { name: 'Cardamom Morning Bun', description: 'Laminated sourdough pastry dusted with spiced raw sugar', price: '$5.25' },
                  ],
                },
              ],
            },
          },
          {
            id: 'sec_about',
            type: 'about',
            variant: 'two-column',
            enabled: true,
            sortOrder: 3,
            props: {
              badge: 'Direct Trade Promise',
              headline: 'From High Altitude Farms Straight to Your Cup',
              description: 'We partner directly with family-owned coffee estates in Colombia, Ethiopia, and Guatemala, paying 40% above fair trade minimums.',
              imageUrl: 'https://images.unsplash.com/photo-1442512595331-e89e73853f31?w=800&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'sec_hours',
            type: 'opening-hours',
            variant: 'badge-status',
            enabled: true,
            sortOrder: 4,
            props: {
              headline: 'Open 7 Days a Week',
              hoursText: '7:00 AM – 6:00 PM Daily',
              note: 'Free High-Speed Wi-Fi & Dog Friendly Patio',
            },
          },
          {
            id: 'sec_contact',
            type: 'contact',
            variant: 'card-centered',
            enabled: true,
            sortOrder: 5,
            props: {
              headline: 'Get in Touch with our Roastery Team',
              subheadline: 'Wholesale inquiries, catering, or coffee brewing workshops.',
            },
          },
          {
            id: 'sec_footer',
            type: 'footer',
            variant: 'brand-focused',
            enabled: true,
            sortOrder: 6,
            props: {
              copyright: '© 2026 Timber & Bean Roasters Inc.',
            },
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'Timber & Bean — Specialty Coffee Roasters & Cafe',
      metaDescription: 'Artisanal single-origin coffee and fresh bakery in Brooklyn, NY. Small batch roasted with direct trade ethics.',
      keywords: ['specialty coffee', 'brooklyn cafe', 'artisan roastery', 'espresso', 'pour over'],
    },
    settings: {
      enableContactForm: true,
      language: 'en',
    },
  },
} as const;
