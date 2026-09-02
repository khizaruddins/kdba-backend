import { WebsiteDocument } from '../../../documents/types/document.types';

export const restaurantModernTemplate: {
  id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  previewImage: string;
  style: string[];
  version: string;
  document: WebsiteDocument;
} = {
  id: 'restaurant-modern',
  name: 'Modern Restaurant',
  slug: 'restaurant-modern',
  description: 'Sophisticated culinary design with online reservations, interactive menu showcase, chef story, and dining ambiance.',
  category: 'RESTAURANT',
  previewImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
  style: ['modern', 'luxury', 'editorial'],
  version: '1.0',
  document: {
    schemaVersion: '2.0',
    site: {
      name: 'L’Osteria Modern Dining',
      businessType: 'restaurant',
      language: 'en',
    },
    theme: {
      primaryColor: '#1a1a1a',
      secondaryColor: '#ffffff',
      accentColor: '#d97706',
      backgroundColor: '#0c0a09',
      textColor: '#f5f5f4',
      headingFont: 'Playfair Display',
      bodyFont: 'Plus Jakarta Sans',
      borderRadius: 'sm',
      shadows: 'subtle',
    },
    business: {
      name: 'L’Osteria Modern Dining',
      tagline: 'Artisanal gastronomy crafted with passion and local heritage',
      description: 'Experience contemporary fine dining where traditional European flavors meet modern culinary artistry in an intimate ambiance.',
      category: 'Fine Dining & Wine Bar',
      logoUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=200&auto=format&fit=crop&q=80',
      email: 'reservations@losteriamodern.com',
      phone: '+1 (415) 555-7890',
      whatsapp: '+1 (415) 555-7890',
      address: '742 Montgomery Street',
      city: 'San Francisco',
      state: 'CA',
      country: 'US',
      zipCode: '94111',
      socialMedia: {
        instagram: 'https://instagram.com/losteriamodern',
        facebook: 'https://facebook.com/losteriamodern',
      },
      businessHours: {
        mon_thu: { open: '17:00', close: '22:30' },
        fri_sat: { open: '17:00', close: '23:30' },
        sun: { open: '16:30', close: '21:30' },
      },
    },
    navigation: {
      header: [
        { id: 'nav_1', label: 'Home', href: '/' },
        { id: 'nav_2', label: 'Menu', href: '/menu' },
        { id: 'nav_3', label: 'Story', href: '/about' },
        { id: 'nav_4', label: 'Reservations', href: '/contact' },
      ],
      footer: [
        {
          title: 'Dining Experience',
          links: [
            { id: 'fl_1', label: 'Tasting Menu', href: '/menu' },
            { id: 'fl_2', label: 'Wine Pairings', href: '/menu' },
            { id: 'fl_3', label: 'Private Dining', href: '/contact' },
          ],
        },
        {
          title: 'Information',
          links: [
            { id: 'fl_4', label: 'Location & Parking', href: '/contact' },
            { id: 'fl_5', label: 'Dress Code & FAQ', href: '/about' },
            { id: 'fl_6', label: 'Gift Vouchers', href: '/contact' },
          ],
        },
      ],
      ctaButton: {
        label: 'Book a Table',
        href: '/contact',
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
            props: {
              brandName: 'L’OSTERIA',
              transparentOnTop: true,
            },
          },
          {
            id: 'sec_hero',
            type: 'hero',
            variant: 'editorial',
            enabled: true,
            sortOrder: 1,
            props: {
              badge: 'Michelin Guide 2026 Recommended',
              headline: 'A Symphony of Taste, Craft & Elegance',
              subheadline: 'Immerse your senses in seasonal tasting menus curated by Chef Antonio Varga.',
              primaryCtaText: 'Reserve Your Table',
              primaryCtaUrl: '/contact',
              secondaryCtaText: 'View Dinner Menu',
              secondaryCtaUrl: '/menu',
              imageUrl: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=1200&auto=format&fit=crop&q=80',
            },
          },
          {
            id: 'sec_about',
            type: 'about',
            variant: 'split-text-image',
            enabled: true,
            sortOrder: 2,
            props: {
              badge: 'Culinary Philosophy',
              headline: 'Rooted in Tradition, Elevated by Innovation',
              description: 'We source exclusively from sustainable California organic farms and boutique European vineyards to deliver unforgettable dining moments.',
              imageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80',
              features: ['Zero-waste seasonal kitchen', 'Sommelier-curated cellars', 'Private chef tasting table'],
            },
          },
          {
            id: 'sec_menu',
            type: 'restaurant-menu',
            variant: 'categorized-list',
            enabled: true,
            sortOrder: 3,
            props: {
              badge: 'Featured Selections',
              headline: 'Seasonal Highlights',
              categories: [
                {
                  name: 'Primi & Starters',
                  items: [
                    { name: 'Wild Truffle Risotto', description: 'Acquerello rice, aged Parmigiano Reggiano, shaved Umbrian black truffle', price: '$36' },
                    { name: 'Hamachi Crudo', description: 'Citrus ponzu, blood orange gel, Oscietra caviar, micro herbs', price: '$28' },
                  ],
                },
                {
                  name: 'Secondi & Mains',
                  items: [
                    { name: 'Dry-Aged Wagyu Ribeye', description: 'A5 Miyazaki beef, roasted bone marrow jus, smoked sunchoke purée', price: '$85' },
                    { name: 'Pan-Seared Mediterranean Sea Bass', description: 'Saffron emulsion, fennel pollen, baby artichokes', price: '$52' },
                  ],
                },
              ],
            },
          },
          {
            id: 'sec_testimonials',
            type: 'testimonials',
            variant: 'grid-cards',
            enabled: true,
            sortOrder: 4,
            props: {
              badge: 'Guest Praises',
              headline: 'Acclaimed by Critics and Patrons',
              items: [
                {
                  quote: 'An extraordinary culinary journey. The 7-course tasting menu was transcendent.',
                  author: 'Jonathan Gold Review',
                  role: 'Epicurean Critic',
                },
                {
                  quote: 'The service is flawless and every plate looks like a Renaissance masterpiece.',
                  author: 'Clara Delacroix',
                  role: 'Verified Patron',
                },
              ],
            },
          },
          {
            id: 'sec_hours',
            type: 'opening-hours',
            variant: 'table-card',
            enabled: true,
            sortOrder: 5,
            props: {
              headline: 'Dining Hours & Service',
              schedule: [
                { day: 'Monday - Thursday', hours: '5:00 PM - 10:30 PM' },
                { day: 'Friday - Saturday', hours: '5:00 PM - 11:30 PM' },
                { day: 'Sunday', hours: '4:30 PM - 9:30 PM' },
              ],
            },
          },
          {
            id: 'sec_cta',
            type: 'cta',
            variant: 'banner-centered',
            enabled: true,
            sortOrder: 6,
            props: {
              headline: 'Join Us for an Unforgettable Evening',
              subheadline: 'Tables book up fast. Secure your reservation online today.',
              primaryCtaText: 'Make a Reservation',
              primaryCtaUrl: '/contact',
            },
          },
          {
            id: 'sec_footer',
            type: 'footer',
            variant: 'multi-column-detailed',
            enabled: true,
            sortOrder: 7,
            props: {
              copyright: '© 2026 L’Osteria Modern Dining. All rights reserved.',
            },
          },
        ],
      },
      {
        id: 'page_menu',
        title: 'Full Menu',
        slug: '/menu',
        type: 'services',
        sortOrder: 1,
        enabled: true,
        sections: [
          {
            id: 'sec_menu_hero',
            type: 'hero',
            variant: 'minimal',
            enabled: true,
            sortOrder: 0,
            props: {
              headline: 'Our Artisanal Menu',
              subheadline: 'Crafted fresh daily with the finest seasonal produce.',
            },
          },
          {
            id: 'sec_menu_full',
            type: 'restaurant-menu',
            variant: 'categorized-list',
            enabled: true,
            sortOrder: 1,
            props: {
              headline: 'A La Carte & Tasting Journeys',
              categories: [
                {
                  name: 'Antipasti',
                  items: [
                    { name: 'Burrata di Puglia', description: 'Heirloom tomatoes, basil oil, aged Modena balsamic reduction', price: '$24' },
                    { name: 'Crispy Calamari & Rock Shrimp', description: 'Calabrian chili aioli, grilled lemon', price: '$26' },
                  ],
                },
                {
                  name: 'Pasta Fatta in Casa',
                  items: [
                    { name: 'Handmade Tagliolini al Tartufo', description: 'Normandy butter, 36-month Parmigiano, freshly shaved black truffle', price: '$42' },
                    { name: 'Lobster Ravioli', description: 'Maine lobster, bisque emulsion, tarragon oil, chives', price: '$48' },
                  ],
                },
              ],
            },
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'L’Osteria — Modern Fine Dining & Tasting Experience',
      metaDescription: 'Book your table at L’Osteria. Michelin recommended modern Italian & Mediterranean gastronomy in San Francisco.',
      keywords: ['fine dining', 'san francisco restaurant', 'tasting menu', 'wine bar', 'italian restaurant'],
    },
    settings: {
      enableContactForm: true,
      enableLiveChat: false,
      language: 'en',
    },
  },
};
