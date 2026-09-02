import { DocumentValidatorService } from '../services/document-validator.service';
import { WebsiteDocument } from '../types/document.types';
import { BadRequestException } from '@nestjs/common';

describe('DocumentValidatorService', () => {
  let validator: DocumentValidatorService;

  beforeEach(() => {
    validator = new DocumentValidatorService();
  });

  const validDocument: WebsiteDocument = {
    schemaVersion: '2.0',
    site: {
      name: 'Alpha Dental Studio',
      businessType: 'dental',
      language: 'en',
    },
    theme: {
      primaryColor: '#0f172a',
      secondaryColor: '#ffffff',
      accentColor: '#3b82f6',
      backgroundColor: '#ffffff',
      textColor: '#0f172a',
      headingFont: 'Plus Jakarta Sans',
      bodyFont: 'Inter',
      borderRadius: 'md',
      shadows: 'subtle',
    },
    business: {
      name: 'Alpha Dental Studio',
      tagline: 'Precision aesthetic dentistry',
      description: 'Cosmetic smile design and family dental care in Chicago.',
      category: 'Healthcare',
      email: 'hello@alphadental.com',
      phone: '+1 (312) 555-0100',
    },
    navigation: {
      header: [
        { id: 'nav_1', label: 'Home', href: '/' },
        { id: 'nav_2', label: 'Services', href: '/#services' },
      ],
      footer: [
        {
          title: 'Quick Links',
          links: [{ id: 'fl_1', label: 'Services', href: '/#services' }],
        },
      ],
      ctaButton: {
        label: 'Book Consultation',
        href: '/#contact',
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
            props: { brandName: 'ALPHA DENTAL' },
          },
          {
            id: 'sec_hero',
            type: 'hero',
            variant: 'split-image',
            enabled: true,
            sortOrder: 1,
            props: {
              headline: 'Transforming Smiles with Precision & Comfort',
              primaryCtaText: 'Schedule Visit',
              primaryCtaUrl: '/#contact',
            },
          },
        ],
      },
    ],
    seo: {
      metaTitle: 'Alpha Dental Studio — Cosmetic Dentistry Chicago',
      metaDescription: 'Cosmetic dentistry, teeth whitening, and Invisalign in Chicago.',
      keywords: ['chicago dentist', 'cosmetic dental'],
    },
    settings: {
      enableContactForm: true,
      language: 'en',
    },
  };

  it('should validate and normalize a valid canonical WebsiteDocument', () => {
    const result = validator.validate(validDocument);
    expect(result).toBeDefined();
    expect(result.schemaVersion).toBe('2.0');
    expect(result.pages.length).toBe(1);
    expect(result.pages[0].sections.length).toBe(2);
  });

  it('should reject documents with unknown component types', () => {
    const invalidDoc = JSON.parse(JSON.stringify(validDocument));
    invalidDoc.pages[0].sections[0].type = 'unsupported-widget-type';

    expect(() => validator.validate(invalidDoc)).toThrow(BadRequestException);
  });

  it('should reject sections with unsupported variants', () => {
    const invalidDoc = JSON.parse(JSON.stringify(validDocument));
    invalidDoc.pages[0].sections[1].variant = 'unsupported-hero-variant-xyz';

    expect(() => validator.validate(invalidDoc)).toThrow(BadRequestException);
  });

  it('should reject malformed URLs and XSS payloads', () => {
    const invalidDoc = JSON.parse(JSON.stringify(validDocument));
    invalidDoc.navigation.header[0].href = 'javascript:alert(document.cookie)';

    expect(() => validator.validate(invalidDoc)).toThrow(BadRequestException);
  });

  it('should correctly apply UPDATE_THEME mutation', () => {
    const mutated = validator.applyMutation(validDocument, {
      type: 'UPDATE_THEME',
      payload: {
        primaryColor: '#ff0055',
        headingFont: 'Playfair Display',
      },
    });

    expect(mutated.theme.primaryColor).toBe('#ff0055');
    expect(mutated.theme.headingFont).toBe('Playfair Display');
  });

  it('should correctly apply UPDATE_SECTION_PROPS mutation', () => {
    const mutated = validator.applyMutation(validDocument, {
      type: 'UPDATE_SECTION_PROPS',
      sectionId: 'sec_hero',
      payload: {
        props: {
          headline: 'Next-Generation Cosmetic Smile Architecture',
        },
      },
    });

    const hero = mutated.pages[0].sections.find((s) => s.id === 'sec_hero');
    expect(hero?.props.headline).toBe('Next-Generation Cosmetic Smile Architecture');
  });

  it('should correctly apply TOGGLE_SECTION mutation', () => {
    const mutated = validator.applyMutation(validDocument, {
      type: 'TOGGLE_SECTION',
      sectionId: 'sec_hero',
      payload: {},
    });

    const hero = mutated.pages[0].sections.find((s) => s.id === 'sec_hero');
    expect(hero?.enabled).toBe(false);
  });

  it('should correctly apply REORDER_SECTIONS mutation', () => {
    const mutated = validator.applyMutation(validDocument, {
      type: 'REORDER_SECTIONS',
      pageId: 'page_home',
      payload: {
        sectionOrders: [
          { id: 'sec_hero', sortOrder: 0 },
          { id: 'sec_nav', sortOrder: 1 },
        ],
      },
    });

    expect(mutated.pages[0].sections[0].id).toBe('sec_hero');
    expect(mutated.pages[0].sections[1].id).toBe('sec_nav');
  });
});
