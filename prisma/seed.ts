import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // 1. Template: Modern Agency
  const agencyTemplate = await prisma.template.upsert({
    where: { slug: 'modern-agency' },
    update: {},
    create: {
      name: 'Modern Agency',
      slug: 'modern-agency',
      category: 'AGENCY',
      description: 'Bold, dark-mode inspired design for creative agencies, design studios, and tech brands.',
      previewImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&auto=format&fit=crop&q=80',
      theme: {
        primaryColor: '#0f172a',
        secondaryColor: '#ffffff',
        accentColor: '#6366f1',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        borderRadius: '8px',
      },
      pages: {
        create: [
          {
            title: 'Home',
            slug: '/',
            type: 'HOME',
            sortOrder: 0,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation Bar',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Agency Studio',
                    logoText: 'AGENCY',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                    ctaText: 'Get a Quote',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'HERO',
                  title: 'Hero Header',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Next-Gen Digital Branding',
                    headline: 'We Build Digital Products That Scale Brands Fast',
                    subheadline: 'Full-service digital agency creating exceptional web experiences, brand identities, and high-conversion marketing funnels.',
                    primaryCtaText: 'Explore Services',
                    primaryCtaUrl: '#services',
                    secondaryCtaText: 'Contact Us',
                    secondaryCtaUrl: '/contact',
                    alignment: 'center',
                    imageUrl: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&auto=format&fit=crop&q=80',
                  },
                },
                {
                  type: 'ABOUT',
                  title: 'About Preview',
                  sortOrder: 2,
                  defaultConfig: {
                    badge: 'About Our Firm',
                    headline: 'Crafting Remarkable Digital Identities Since 2018',
                    description: 'We believe that powerful design combined with cutting-edge engineering produces unmatched business growth. Our team of designers and engineers work hand-in-hand to elevate your brand.',
                    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
                    features: [
                      'Data-driven creative strategy',
                      'Human-centered design systems',
                      'Performance-first cloud engineering',
                      'Dedicated growth advisors',
                    ],
                  },
                },
                {
                  type: 'SERVICES',
                  title: 'Core Services',
                  sortOrder: 3,
                  defaultConfig: {
                    badge: 'What We Do',
                    headline: 'Comprehensive Digital Solutions',
                    subheadline: 'End-to-end capabilities tailored to high-growth businesses and enterprise innovators.',
                    items: [
                      {
                        title: 'Brand Strategy & Identity',
                        description: 'Logos, design systems, and brand guidelines that differentiate you in competitive markets.',
                        icon: 'Palette',
                      },
                      {
                        title: 'Custom Web & App Engineering',
                        description: 'Fast, secure, responsive web applications engineered for speed and conversion.',
                        icon: 'Code',
                      },
                      {
                        title: 'Growth Marketing & SEO',
                        description: 'Organic search optimization, funnel optimization, and scalable acquisition strategies.',
                        icon: 'TrendingUp',
                      },
                    ],
                  },
                },
                {
                  type: 'TESTIMONIALS',
                  title: 'Client Reviews',
                  sortOrder: 4,
                  defaultConfig: {
                    badge: 'Social Proof',
                    headline: 'Trusted by Leaders Globally',
                    items: [
                      {
                        quote: 'KDBA helped us completely reinvent our online presence. Our inbound leads grew by 240% within 60 days.',
                        author: 'Sarah Jenkins',
                        role: 'VP Marketing',
                        company: 'Aura Cloud Tech',
                        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
                      },
                      {
                        quote: 'The level of craftsmanship and attention to detail was beyond anything we experienced with previous agencies.',
                        author: 'Marcus Vance',
                        role: 'CEO & Founder',
                        company: 'Vanguard Retail',
                        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
                      },
                    ],
                  },
                },
                {
                  type: 'CTA',
                  title: 'Call to Action',
                  sortOrder: 5,
                  defaultConfig: {
                    headline: 'Ready to Transform Your Digital Brand?',
                    subheadline: 'Let’s discuss your vision and build something extraordinary together.',
                    primaryCtaText: 'Schedule a Consultation',
                    primaryCtaUrl: '/contact',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 6,
                  defaultConfig: {
                    copyright: '© 2026 Agency Studio. All rights reserved.',
                    tagline: 'Empowering ambitious brands with world-class digital design.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About Us', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'About',
            slug: '/about',
            type: 'ABOUT',
            sortOrder: 1,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation Bar',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Agency Studio',
                    logoText: 'AGENCY',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                    ctaText: 'Get a Quote',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'ABOUT',
                  title: 'Company Mission',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Our Mission & Vision',
                    headline: 'We Bridge Creativity and Technology for Modern Brands',
                    description: 'Founded with the conviction that quality speaks louder than words, we partner with visionary brands to deliver work that leaves a lasting legacy.',
                    imageUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=800&auto=format&fit=crop&q=80',
                    features: [
                      '100% in-house senior talent',
                      'Transparent sprint-based delivery',
                      'Commitment to design excellence',
                    ],
                  },
                },
                {
                  type: 'TEAM',
                  title: 'Leadership Team',
                  sortOrder: 2,
                  defaultConfig: {
                    badge: 'Our People',
                    headline: 'Meet the Minds Behind the Magic',
                    items: [
                      {
                        name: 'Alex Rivera',
                        role: 'Design Director',
                        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
                      },
                      {
                        name: 'Elena Rostova',
                        role: 'Chief Technology Officer',
                        avatar: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=300&auto=format&fit=crop&q=80',
                      },
                      {
                        name: 'David Chen',
                        role: 'Head of Growth',
                        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
                      },
                    ],
                  },
                },
                {
                  type: 'CTA',
                  title: 'Contact Callout',
                  sortOrder: 3,
                  defaultConfig: {
                    headline: 'Work With Our Award-Winning Team',
                    subheadline: 'Tell us about your upcoming project and timeline.',
                    primaryCtaText: 'Get in Touch',
                    primaryCtaUrl: '/contact',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 4,
                  defaultConfig: {
                    copyright: '© 2026 Agency Studio. All rights reserved.',
                    tagline: 'Empowering ambitious brands with world-class digital design.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About Us', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'Contact',
            slug: '/contact',
            type: 'CONTACT',
            sortOrder: 2,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation Bar',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Agency Studio',
                    logoText: 'AGENCY',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                    ctaText: 'Get a Quote',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'CONTACT',
                  title: 'Contact & Inquiries',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Let’s Connect',
                    headline: 'Send Us a Message',
                    subheadline: 'Fill out the form below and our team will get back to you within 24 hours.',
                    email: 'hello@agencystudio.com',
                    phone: '+1 (555) 234-5678',
                    address: '750 Innovation Way, Suite 400, San Francisco, CA 94107',
                    businessHours: 'Mon - Fri: 9:00 AM - 6:00 PM PST',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 2,
                  defaultConfig: {
                    copyright: '© 2026 Agency Studio. All rights reserved.',
                    tagline: 'Empowering ambitious brands with world-class digital design.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About Us', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 2. Template: Culinary Craft (Restaurant)
  const restaurantTemplate = await prisma.template.upsert({
    where: { slug: 'culinary-craft' },
    update: {},
    create: {
      name: 'Culinary Craft',
      slug: 'culinary-craft',
      category: 'RESTAURANT',
      description: 'Elegant, warm, and inviting layout for fine dining, bistros, cafes, and gourmet eateries.',
      previewImage: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&auto=format&fit=crop&q=80',
      theme: {
        primaryColor: '#1c1917',
        secondaryColor: '#fffbeb',
        accentColor: '#ea580c',
        headingFont: 'Playfair Display',
        bodyFont: 'Inter',
        borderRadius: '12px',
      },
      pages: {
        create: [
          {
            title: 'Home',
            slug: '/',
            type: 'HOME',
            sortOrder: 0,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Culinary Craft Bistro',
                    logoText: 'CULINARY',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Our Story', url: '/about' },
                      { label: 'Reservations', url: '/contact' },
                    ],
                    ctaText: 'Book Table',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'HERO',
                  title: 'Hero Banner',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Artisanal Dining Experience',
                    headline: 'An Unforgettable Journey of Flavor & Passion',
                    subheadline: 'Locally sourced seasonal ingredients, wood-fired specialties, and handcrafted pairings prepared by Master Chefs.',
                    primaryCtaText: 'Reserve a Table',
                    primaryCtaUrl: '/contact',
                    secondaryCtaText: 'View Menu',
                    secondaryCtaUrl: '#products',
                    alignment: 'center',
                    imageUrl: 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=1200&auto=format&fit=crop&q=80',
                  },
                },
                {
                  type: 'ABOUT',
                  title: 'Our Story',
                  sortOrder: 2,
                  defaultConfig: {
                    badge: 'Farm to Table',
                    headline: 'Honoring Traditional Craft with Modern Flair',
                    description: 'Our kitchen takes inspiration from Mediterranean coastlines and local organic farms. Every plate is crafted with purpose, seasonality, and love.',
                    imageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&auto=format&fit=crop&q=80',
                    features: [
                      'Certified 100% organic local produce',
                      'House-cured meats & artisan cheeses',
                      'Sommelier-curated wine cellar',
                    ],
                  },
                },
                {
                  type: 'PRODUCTS',
                  title: 'Featured Menu Items',
                  sortOrder: 3,
                  defaultConfig: {
                    badge: 'Chef’s Specialties',
                    headline: 'Signature Culinary Creations',
                    subheadline: 'Hand-selected dishes that represent our culinary heritage and craft.',
                  },
                },
                {
                  type: 'GALLERY',
                  title: 'Atmosphere & Dishes',
                  sortOrder: 4,
                  defaultConfig: {
                    badge: 'The Experience',
                    headline: 'A Feast for All Senses',
                    images: [
                      'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1559339352-11d035aa65de?w=600&auto=format&fit=crop&q=80',
                    ],
                  },
                },
                {
                  type: 'CONTACT',
                  title: 'Reservations & Hours',
                  sortOrder: 5,
                  defaultConfig: {
                    badge: 'Visit Us',
                    headline: 'Book Your Table Today',
                    subheadline: 'We recommend reserving at least 48 hours in advance for weekend dinners.',
                    email: 'reservations@culinarycraft.com',
                    phone: '+1 (555) 987-6543',
                    address: '42 Gourmet Boulevard, New York, NY 10013',
                    businessHours: 'Tue - Sun: 5:00 PM - 11:00 PM',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 6,
                  defaultConfig: {
                    copyright: '© 2026 Culinary Craft Bistro. All rights reserved.',
                    tagline: 'Exceptional dining, memorable moments.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Our Story', url: '/about' },
                      { label: 'Reservations', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'About',
            slug: '/about',
            type: 'ABOUT',
            sortOrder: 1,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Culinary Craft Bistro',
                    logoText: 'CULINARY',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Our Story', url: '/about' },
                      { label: 'Reservations', url: '/contact' },
                    ],
                    ctaText: 'Book Table',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'ABOUT',
                  title: 'Our Heritage',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'The Philosophy',
                    headline: 'Pure Ingredients. Passionate Craftsmanship.',
                    description: 'Starting from a small neighborhood supper club, Culinary Craft has evolved into a premier culinary destination celebrated for authentic taste and hospitality.',
                    imageUrl: 'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?w=800&auto=format&fit=crop&q=80',
                    features: [
                      'Zero food-waste kitchen philosophy',
                      'Direct partnerships with heirloom growers',
                      'Handmade pasta and daily stone-ground breads',
                    ],
                  },
                },
                {
                  type: 'GALLERY',
                  title: 'Our Kitchen',
                  sortOrder: 2,
                  defaultConfig: {
                    badge: 'Behind the Scenes',
                    headline: 'Inside the Kitchen',
                    images: [
                      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&auto=format&fit=crop&q=80',
                      'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&auto=format&fit=crop&q=80',
                    ],
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 3,
                  defaultConfig: {
                    copyright: '© 2026 Culinary Craft Bistro. All rights reserved.',
                    tagline: 'Exceptional dining, memorable moments.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Our Story', url: '/about' },
                      { label: 'Reservations', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'Contact',
            slug: '/contact',
            type: 'CONTACT',
            sortOrder: 2,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Culinary Craft Bistro',
                    logoText: 'CULINARY',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Our Story', url: '/about' },
                      { label: 'Reservations', url: '/contact' },
                    ],
                    ctaText: 'Book Table',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'CONTACT',
                  title: 'Reserve & Locate',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Reservations',
                    headline: 'Join Us for Dinner',
                    subheadline: 'Questions regarding private dining, events, or dietary restrictions? Leave us a note.',
                    email: 'reservations@culinarycraft.com',
                    phone: '+1 (555) 987-6543',
                    address: '42 Gourmet Boulevard, New York, NY 10013',
                    businessHours: 'Tue - Sun: 5:00 PM - 11:00 PM',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 2,
                  defaultConfig: {
                    copyright: '© 2026 Culinary Craft Bistro. All rights reserved.',
                    tagline: 'Exceptional dining, memorable moments.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'Our Story', url: '/about' },
                      { label: 'Reservations', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 3. Template: Apex Corporate (Professional Business)
  const businessTemplate = await prisma.template.upsert({
    where: { slug: 'apex-corporate' },
    update: {},
    create: {
      name: 'Apex Corporate',
      slug: 'apex-corporate',
      category: 'BUSINESS',
      description: 'Clean, authoritative corporate template for consultancies, financial firms, and B2B services.',
      previewImage: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800&auto=format&fit=crop&q=80',
      theme: {
        primaryColor: '#0c4a6e',
        secondaryColor: '#f0f9ff',
        accentColor: '#0284c7',
        headingFont: 'Inter',
        bodyFont: 'Inter',
        borderRadius: '6px',
      },
      pages: {
        create: [
          {
            title: 'Home',
            slug: '/',
            type: 'HOME',
            sortOrder: 0,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Apex Advisory',
                    logoText: 'APEX',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                    ctaText: 'Client Portal',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'HERO',
                  title: 'Hero Banner',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Strategic Advisory & Growth',
                    headline: 'Empowering Enterprise Growth with Actionable Intelligence',
                    subheadline: 'We help global executives navigate financial transformation, strategic mergers, and risk management.',
                    primaryCtaText: 'Schedule Briefing',
                    primaryCtaUrl: '/contact',
                    secondaryCtaText: 'Our Services',
                    secondaryCtaUrl: '#services',
                    alignment: 'left',
                    imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&auto=format&fit=crop&q=80',
                  },
                },
                {
                  type: 'SERVICES',
                  title: 'Practice Areas',
                  sortOrder: 2,
                  defaultConfig: {
                    badge: 'Practice Areas',
                    headline: 'Strategic Capabilities',
                    subheadline: 'Proven methodologies delivering measurable outcomes across key industry sectors.',
                    items: [
                      {
                        title: 'Capital Markets & M&A',
                        description: 'Transaction advisory, business valuation, and capital allocation frameworks.',
                        icon: 'Briefcase',
                      },
                      {
                        title: 'Corporate Strategy & Ops',
                        description: 'Operational restructuring, supply chain resilience, and growth planning.',
                        icon: 'Compass',
                      },
                      {
                        title: 'Enterprise Risk Management',
                        description: 'Regulatory compliance, cybersecurity oversight, and audit mitigation.',
                        icon: 'ShieldCheck',
                      },
                    ],
                  },
                },
                {
                  type: 'PRICING',
                  title: 'Advisory Retainers',
                  sortOrder: 3,
                  defaultConfig: {
                    badge: 'Engagements',
                    headline: 'Transparent Advisory Models',
                    subheadline: 'Flexible engagement models designed for startups, mid-market, and enterprise organizations.',
                  },
                },
                {
                  type: 'TEAM',
                  title: 'Senior Partners',
                  sortOrder: 4,
                  defaultConfig: {
                    badge: 'Our Leadership',
                    headline: 'Led by Seasoned Industry Leaders',
                    items: [
                      {
                        name: 'Jonathan Sterling',
                        role: 'Managing Partner',
                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
                      },
                      {
                        name: 'Claire Thornton',
                        role: 'Head of Strategic M&A',
                        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
                      },
                    ],
                  },
                },
                {
                  type: 'CTA',
                  title: 'Contact Callout',
                  sortOrder: 5,
                  defaultConfig: {
                    headline: 'Partner with Apex Advisory Today',
                    subheadline: 'Schedule a confidential discovery session with one of our senior partners.',
                    primaryCtaText: 'Request Discovery Call',
                    primaryCtaUrl: '/contact',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 6,
                  defaultConfig: {
                    copyright: '© 2026 Apex Advisory Partners LLC. All rights reserved.',
                    tagline: 'Delivering strategic clarity for modern business leaders.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'About',
            slug: '/about',
            type: 'ABOUT',
            sortOrder: 1,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Apex Advisory',
                    logoText: 'APEX',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                    ctaText: 'Client Portal',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'ABOUT',
                  title: 'Firm Overview',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Who We Are',
                    headline: 'Over Two Decades of Strategic Excellence',
                    description: 'Apex Advisory was established to provide uncompromised advisory services to institutions navigating turbulent markets and rapid technological transitions.',
                    imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&auto=format&fit=crop&q=80',
                    features: [
                      '$10B+ in transaction value advised',
                      'Global presence across 4 major financial hubs',
                      'Unbiased, independent fiduciary focus',
                    ],
                  },
                },
                {
                  type: 'TEAM',
                  title: 'Executive Partners',
                  sortOrder: 2,
                  defaultConfig: {
                    badge: 'The Partners',
                    headline: 'Executive Leadership',
                    items: [
                      {
                        name: 'Jonathan Sterling',
                        role: 'Managing Partner',
                        avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=300&auto=format&fit=crop&q=80',
                      },
                      {
                        name: 'Claire Thornton',
                        role: 'Head of Strategic M&A',
                        avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=300&auto=format&fit=crop&q=80',
                      },
                    ],
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 3,
                  defaultConfig: {
                    copyright: '© 2026 Apex Advisory Partners LLC. All rights reserved.',
                    tagline: 'Delivering strategic clarity for modern business leaders.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
          {
            title: 'Contact',
            slug: '/contact',
            type: 'CONTACT',
            sortOrder: 2,
            sections: {
              create: [
                {
                  type: 'NAVBAR',
                  title: 'Navigation',
                  sortOrder: 0,
                  defaultConfig: {
                    brandName: 'Apex Advisory',
                    logoText: 'APEX',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                    ctaText: 'Client Portal',
                    ctaUrl: '/contact',
                  },
                },
                {
                  type: 'CONTACT',
                  title: 'Get in Touch',
                  sortOrder: 1,
                  defaultConfig: {
                    badge: 'Global Offices',
                    headline: 'Contact Our Advisory Team',
                    subheadline: 'Direct communications with our offices in New York, London, and Singapore.',
                    email: 'inquiries@apexadvisory.com',
                    phone: '+1 (212) 555-0199',
                    address: '350 Park Avenue, 28th Floor, New York, NY 10022',
                    businessHours: 'Mon - Fri: 8:30 AM - 6:30 PM EST',
                  },
                },
                {
                  type: 'FOOTER',
                  title: 'Footer',
                  sortOrder: 2,
                  defaultConfig: {
                    copyright: '© 2026 Apex Advisory Partners LLC. All rights reserved.',
                    tagline: 'Delivering strategic clarity for modern business leaders.',
                    links: [
                      { label: 'Home', url: '/' },
                      { label: 'About', url: '/about' },
                      { label: 'Contact', url: '/contact' },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    },
  });

  // 4. Platform Plans for SaaS Subscriptions
  console.log('💳 Seeding Platform Plans...');
  const starterPlan = await prisma.platformPlan.upsert({
    where: { slug: 'starter' },
    update: {},
    create: {
      name: 'Starter Launch',
      slug: 'starter',
      description: 'Ideal for independent consultants, local cafes, and emerging small businesses.',
      monthlyPrice: 29.0,
      yearlyPrice: 290.0,
      currency: 'USD',
      features: [
        '1 Production Website',
        'Up to 15 Product/Menu Items',
        '1 GB High-Speed CDN Media Storage',
        'Custom Domain Support & SSL',
        'Standard Email & CRM Leads Capture',
      ],
      maxWebsites: 1,
      maxProducts: 15,
      maxMediaStorageMb: 1000,
      isPopular: false,
      sortOrder: 1,
    },
  });

  const proPlan = await prisma.platformPlan.upsert({
    where: { slug: 'professional' },
    update: {},
    create: {
      name: 'Growth Professional',
      slug: 'professional',
      description: 'High-performance suite for established brands, multi-location bistros, and agencies.',
      monthlyPrice: 79.0,
      yearlyPrice: 790.0,
      currency: 'USD',
      features: [
        'Up to 5 Production Websites',
        'Unlimited Products & Digital Catalog',
        '10 GB High-Speed CDN Media Storage',
        'Full SEO & Performance Customizer',
        'Advanced CRM Leads Pipeline & Analytics',
        'Priority 24/7 Concierge Support',
      ],
      maxWebsites: 5,
      maxProducts: 100,
      maxMediaStorageMb: 10000,
      isPopular: true,
      sortOrder: 2,
    },
  });

  const enterprisePlan = await prisma.platformPlan.upsert({
    where: { slug: 'enterprise' },
    update: {},
    create: {
      name: 'Enterprise Scale',
      slug: 'enterprise',
      description: 'Dedicated enterprise infrastructure, custom workflows, and white-labeling.',
      monthlyPrice: 199.0,
      yearlyPrice: 1990.0,
      currency: 'USD',
      features: [
        'Unlimited Live Websites',
        'Unlimited Catalog & E-Commerce Items',
        '50 GB CDN Storage & Video Hosting',
        'Multi-User Team Role Permissions',
        'Custom Webhooks & API Access',
        'Dedicated SLA & Strategic Account Manager',
      ],
      maxWebsites: 50,
      maxProducts: 1000,
      maxMediaStorageMb: 50000,
      isPopular: false,
      sortOrder: 3,
    },
  });

  // 5. Super Admin Root User
  console.log('👑 Seeding Super Admin Account...');
  const bcrypt = await import('bcrypt');
  const superAdminPassword = await bcrypt.hash('Admin@123456', 12);

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@kdba.agency' },
    update: {
      isSuperAdmin: true,
    },
    create: {
      email: 'superadmin@kdba.agency',
      password: superAdminPassword,
      firstName: 'Khizar',
      lastName: 'SuperAdmin',
      isSuperAdmin: true,
      emailVerified: true,
    },
  });

  console.log('✅ Seed completed successfully:');
  console.log(`- Template 1: ${agencyTemplate.name}`);
  console.log(`- Template 2: ${restaurantTemplate.name}`);
  console.log(`- Template 3: ${businessTemplate.name}`);
  console.log(`- Platform Plans: ${starterPlan.name}, ${proPlan.name}, ${enterprisePlan.name}`);
  console.log(`- Super Admin: ${superAdmin.email} (Password: Admin@123456)`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
