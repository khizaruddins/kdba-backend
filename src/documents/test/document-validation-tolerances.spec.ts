import { DocumentValidatorService } from '../services/document-validator.service';

describe('Document Validation Tolerances (Real-World & Database Document Schema Validation)', () => {
  let validator: DocumentValidatorService;

  beforeEach(() => {
    validator = new DocumentValidatorService();
  });

  it('should successfully validate and normalize a document with null business/SEO fields, array businessHours, custom border radius, and node labels', () => {
    const rawDocument: any = {
      schemaVersion: '3.0',
      site: {
        id: 'site_123',
        name: 'Test Coffee Roasters',
        businessType: 'cafe',
        language: 'en',
        favicon: null, // Null from database
      },
      theme: {
        colors: {
          primary: '#111827',
          secondary: '#f9fafb',
          accent: '#f59e0b',
          background: '#ffffff',
          surface: '#f3f4f6',
          text: '#1f2937',
          muted: '#6b7280',
          border: '#e5e7eb',
          success: '#10b981',
          warning: '#f59e0b',
          error: '#ef4444',
        },
        typography: {
          h1: { fontFamily: 'Inter', fontSize: '48px', fontWeight: 700, lineHeight: 1.2 },
          h2: { fontFamily: 'Inter', fontSize: '36px', fontWeight: 700, lineHeight: 1.2 },
          h3: { fontFamily: 'Inter', fontSize: '28px', fontWeight: 600, lineHeight: 1.3 },
          h4: { fontFamily: 'Inter', fontSize: '22px', fontWeight: 600, lineHeight: 1.35 },
          h5: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
          h6: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
          body: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: 1.6 },
          caption: { fontFamily: 'Inter', fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
          label: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 },
          button: { fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
          quote: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 400, lineHeight: 1.6 },
        },
        breakpoints: { desktop: 1200, tablet: 768, mobile: 480 },
        borderRadius: '12px', // Custom pixel radius from builder
        shadows: 'subtle',
        customCss: null,
      },
      business: {
        name: 'Test Coffee Roasters',
        legalName: null,
        tagline: null,
        description: null,
        category: null,
        logoUrl: null,
        email: null,
        phone: null,
        whatsapp: null,
        address: null,
        city: null,
        state: null,
        country: null,
        zipCode: null,
        socialMedia: {},
        businessHours: [
          { days: 'Monday - Friday', hours: '7:00 AM - 6:00 PM' },
          { days: 'Saturday - Sunday', hours: '8:00 AM - 5:00 PM' },
        ], // Array format from templates/DB
      },
      navigation: {
        header: [{ id: 'nav_1', label: 'Home', href: '/' }],
        footer: [],
      },
      pages: [
        {
          id: 'page_home',
          title: 'Home',
          slug: 'home', // Missing leading / from editor or DB
          type: 'HOME', // Uppercase enum from Prisma DB
          sortOrder: 0,
          enabled: true,
          seo: {
            title: null,
            description: null,
            ogImage: null,
            noIndex: false,
            canonicalUrl: null,
          },
          root: {
            id: 'root_home',
            type: 'page-root',
            name: 'Page Root',
            label: 'Home Root', // M3.1 node label
            children: [
              {
                id: 'hero_sec',
                type: 'section',
                name: 'Hero Section',
                label: 'Main Hero',
                props: { title: 'Welcome' },
                styles: {
                  layout: { display: 'flex', width: '100%' },
                },
                animations: {
                  preset: 'fade-up',
                  trigger: 'on-load',
                  duration: 600,
                  direction: 'up',
                  repeat: 1,
                },
              },
            ],
          },
        },
      ],
      seo: {
        metaTitle: null,
        metaDescription: null,
        ogImage: null,
        canonicalUrl: null,
        keywords: null,
      },
      settings: {
        analyticsId: null,
        customDomain: null,
        enableContactForm: true,
        enableLiveChat: null,
        language: 'en',
      },
    };

    expect(() => validator.validateV3(rawDocument)).not.toThrow();

    const validated = validator.validateV3(rawDocument);
    expect(validated.schemaVersion).toBe('3.0');
    expect(validated.pages[0].slug).toBe('/home'); // Auto-prepended leading /
    expect(validated.pages[0].type).toBe('home'); // Lowercase normalized
    expect(validated.pages[0].root.label).toBe('Home Root');
    expect(validated.pages[0].root.children![0].animations?.repeat).toBe(1);
    expect(validated.theme.borderRadius).toBe('12px');
    expect(Array.isArray(validated.business.businessHours)).toBe(true);
  });
});
