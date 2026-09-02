import { Injectable, Logger } from '@nestjs/common';
import {
  WebsiteDocument,
  SectionType,
  PageContract,
  SectionContract,
} from '../types/document.types';
import { SECTION_REGISTRY, isValidSectionType } from '../contracts/section-registry';
import { DocumentValidatorService } from './document-validator.service';

@Injectable()
export class DocumentMigrationService {
  private readonly logger = new Logger(DocumentMigrationService.name);

  constructor(private readonly validator: DocumentValidatorService) {}

  /**
   * Migrate any arbitrary document to the canonical latest version (2.0).
   */
  migrateWebsiteDocument(rawDocument: any): WebsiteDocument {
    if (!rawDocument || typeof rawDocument !== 'object') {
      throw new Error('Cannot migrate empty or invalid document');
    }

    const version = rawDocument.schemaVersion || '1.0';

    if (version === '2.0') {
      return this.validator.validate(rawDocument);
    }

    if (version === '1.0') {
      return this.migrateFromV1(rawDocument);
    }

    this.logger.warn(`Unknown schema version "${version}", attempting best-effort migration to 2.0`);
    return this.migrateFromV1(rawDocument);
  }

  /**
   * Migrate a legacy V1 JSON document structure to canonical V2.0
   */
  private migrateFromV1(v1Doc: any): WebsiteDocument {
    const rawTheme = v1Doc.theme || {};
    const rawBusiness = v1Doc.business || {};
    const rawSite = v1Doc.site || {};

    const migratedTheme = {
      primaryColor: rawTheme.primaryColor || '#0f172a',
      secondaryColor: rawTheme.secondaryColor || '#ffffff',
      accentColor: rawTheme.accentColor || '#6366f1',
      backgroundColor: rawTheme.backgroundColor || '#ffffff',
      textColor: rawTheme.textColor || '#0f172a',
      headingFont: rawTheme.headingFont || rawTheme.fontHeading || 'Inter',
      bodyFont: rawTheme.bodyFont || rawTheme.fontBody || 'Inter',
      borderRadius: (['none', 'sm', 'md', 'lg', 'full'].includes(rawTheme.borderRadius)
        ? rawTheme.borderRadius
        : 'md') as any,
      shadows: (['none', 'subtle', 'medium', 'dramatic'].includes(rawTheme.shadows)
        ? rawTheme.shadows
        : 'subtle') as any,
      customCss: rawTheme.customCss || '',
    };

    const migratedBusiness = {
      name: rawBusiness.name || rawSite.name || 'My Business',
      legalName: rawBusiness.legalName || '',
      tagline: rawBusiness.tagline || '',
      description: rawBusiness.description || '',
      category: rawBusiness.category || 'Business',
      logoUrl: rawBusiness.logoUrl || '',
      email: rawBusiness.email || '',
      phone: rawBusiness.phone || '',
      whatsapp: rawBusiness.whatsapp || '',
      address: rawBusiness.address || '',
      city: rawBusiness.city || '',
      state: rawBusiness.state || '',
      country: rawBusiness.country || '',
      zipCode: rawBusiness.zipCode || '',
      socialMedia: rawBusiness.socialMedia || {},
      businessHours: rawBusiness.businessHours || {},
    };

    const migratedPages: PageContract[] = Array.isArray(v1Doc.pages)
      ? v1Doc.pages.map((p: any, pIdx: number) => this.migrateLegacyPage(p, pIdx))
      : [
          {
            id: 'page_home_1',
            title: 'Home',
            slug: '/',
            type: 'home',
            sortOrder: 0,
            enabled: true,
            sections: [],
          },
        ];

    // Build header navigation from pages
    const headerNav = migratedPages.map((p) => ({
      id: `nav_${p.id}`,
      label: p.title,
      href: p.slug,
      pageId: p.id,
      target: '_self' as const,
    }));

    const canonicalDoc: WebsiteDocument = {
      schemaVersion: '2.0',
      site: {
        id: rawSite.id || undefined,
        name: rawSite.name || migratedBusiness.name,
        businessType: rawSite.businessType || migratedBusiness.category || 'business',
        language: rawSite.language || 'en',
        favicon: rawSite.favicon || v1Doc.favicon || undefined,
      },
      theme: migratedTheme,
      business: migratedBusiness,
      navigation: {
        header: v1Doc.navigation?.header || headerNav,
        footer: v1Doc.navigation?.footer || [
          {
            title: 'Quick Links',
            links: headerNav.map((n) => ({ id: `fl_${n.id}`, label: n.label, href: n.href })),
          },
        ],
        ctaButton: v1Doc.navigation?.ctaButton || {
          label: 'Contact Us',
          href: '/contact',
          variant: 'primary',
        },
      },
      pages: migratedPages,
      seo: {
        metaTitle: v1Doc.seo?.metaTitle || v1Doc.seoTitle || migratedBusiness.name,
        metaDescription:
          v1Doc.seo?.metaDescription || v1Doc.seoDescription || migratedBusiness.description,
        ogImage: v1Doc.seo?.ogImage || undefined,
        canonicalUrl: v1Doc.seo?.canonicalUrl || undefined,
        keywords: v1Doc.seo?.keywords || [],
      },
      settings: {
        analyticsId: v1Doc.settings?.analyticsId || undefined,
        customDomain: v1Doc.settings?.customDomain || undefined,
        enableContactForm: v1Doc.settings?.enableContactForm !== false,
        enableLiveChat: Boolean(v1Doc.settings?.enableLiveChat),
        language: v1Doc.settings?.language || 'en',
      },
    };

    return this.validator.validate(canonicalDoc);
  }

  /**
   * Migrate a single legacy page structure
   */
  private migrateLegacyPage(rawPage: any, index: number): PageContract {
    const rawType = String(rawPage.type || 'custom').toLowerCase();
    const type = ['home', 'about', 'services', 'contact', 'pricing', 'portfolio', 'blog', 'custom'].includes(
      rawType,
    )
      ? (rawType as any)
      : 'custom';

    const rawSections = Array.isArray(rawPage.sections) ? rawPage.sections : [];
    const sections: SectionContract[] = rawSections.map((s: any, sIdx: number) =>
      this.migrateLegacySection(s, sIdx),
    );

    return {
      id: rawPage.id || `page_${index + 1}`,
      title: rawPage.title || (type === 'home' ? 'Home' : `Page ${index + 1}`),
      slug: rawPage.slug ? (rawPage.slug.startsWith('/') ? rawPage.slug : `/${rawPage.slug}`) : '/',
      type,
      sortOrder: typeof rawPage.sortOrder === 'number' ? rawPage.sortOrder : index,
      enabled: rawPage.isActive !== false && rawPage.enabled !== false,
      seo: rawPage.seo || undefined,
      sections,
    };
  }

  /**
   * Migrate a single legacy section structure
   */
  private migrateLegacySection(rawSection: any, index: number): SectionContract {
    const rawTypeStr = String(rawSection.type || 'hero')
      .toLowerCase()
      .replace(/_/g, '-');

    const type: SectionType = isValidSectionType(rawTypeStr) ? rawTypeStr : 'hero';
    const definition = SECTION_REGISTRY[type];

    let variant = rawSection.variant;
    if (!variant || !definition.variants.includes(variant)) {
      variant = definition.defaultVariant;
    }

    const props =
      rawSection.props ||
      rawSection.draftConfig ||
      rawSection.publishedConfig ||
      rawSection.defaultConfig ||
      {};

    return {
      id: rawSection.id || `sec_${index + 1}`,
      type,
      variant,
      enabled: rawSection.enabled !== false,
      sortOrder: typeof rawSection.sortOrder === 'number' ? rawSection.sortOrder : index,
      props,
      styles: rawSection.styles || {},
    };
  }

  /**
   * Migrate a legacy relational Website record (with nested pages, sections, business, and template)
   * into a canonical V2 WebsiteDocument.
   */
  migrateLegacyRelationalWebsite(
    website: any,
    pages: any[],
    business?: any,
    template?: any,
    usePublishedConfig = false,
  ): WebsiteDocument {
    const rawTheme = website.theme || template?.theme || {};

    const migratedPages: PageContract[] = (pages || []).map((page, pIdx) => {
      const pageSections: SectionContract[] = (page.sections || []).map(
        (sec: any, sIdx: number) => {
          const rawTypeStr = String(sec.type || 'HERO')
            .toLowerCase()
            .replace(/_/g, '-');

          const type: SectionType = isValidSectionType(rawTypeStr) ? rawTypeStr : 'hero';
          const definition = SECTION_REGISTRY[type];
          const variant = definition.defaultVariant;

          const config = usePublishedConfig
            ? sec.publishedConfig || sec.draftConfig || {}
            : sec.draftConfig || sec.publishedConfig || {};

          return {
            id: sec.id,
            type,
            variant,
            enabled: sec.enabled !== false,
            sortOrder: sec.sortOrder ?? sIdx,
            props: config,
            styles: {},
          };
        },
      );

      return {
        id: page.id,
        title: page.title,
        slug: page.slug.startsWith('/') ? page.slug : `/${page.slug}`,
        type: (page.type?.toLowerCase() || 'custom') as any,
        sortOrder: page.sortOrder ?? pIdx,
        enabled: page.isActive !== false,
        sections: pageSections,
      };
    });

    const headerNav = migratedPages.map((p) => ({
      id: `nav_${p.id}`,
      label: p.title,
      href: p.slug,
      pageId: p.id,
      target: '_self' as const,
    }));

    const rawDoc = {
      schemaVersion: '2.0',
      site: {
        id: website.id,
        name: website.name,
        businessType: business?.category || 'business',
        language: 'en',
        favicon: website.favicon || undefined,
      },
      theme: {
        primaryColor: rawTheme.primaryColor || '#0f172a',
        secondaryColor: rawTheme.secondaryColor || '#ffffff',
        accentColor: rawTheme.accentColor || '#6366f1',
        backgroundColor: '#ffffff',
        textColor: '#0f172a',
        headingFont: rawTheme.headingFont || 'Inter',
        bodyFont: rawTheme.bodyFont || 'Inter',
        borderRadius: 'md',
        shadows: 'subtle',
      },
      business: {
        name: business?.name || website.name,
        description: business?.description || '',
        category: business?.category || '',
        logoUrl: business?.logoUrl || '',
        email: business?.email || '',
        phone: business?.phone || '',
        whatsapp: business?.whatsapp || '',
        address: business?.address || '',
        city: business?.city || '',
        state: business?.state || '',
        country: business?.country || '',
        zipCode: business?.zipCode || '',
        socialMedia: business?.socialMedia || {},
        businessHours: business?.businessHours || {},
      },
      navigation: {
        header: headerNav,
        footer: [
          {
            title: 'Navigation',
            links: headerNav.map((n) => ({ id: `fl_${n.id}`, label: n.label, href: n.href })),
          },
        ],
        ctaButton: {
          label: 'Contact Us',
          href: '/contact',
          variant: 'primary',
        },
      },
      pages: migratedPages,
      seo: {
        metaTitle: website.seoTitle || website.name,
        metaDescription: website.seoDescription || business?.description || '',
      },
      settings: {
        enableContactForm: true,
        enableLiveChat: false,
        language: 'en',
      },
    };

    return this.validator.validate(rawDoc);
  }
}
