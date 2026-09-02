import { Injectable, Logger } from '@nestjs/common';
import * as crypto from 'crypto';
import {
  WebsiteDocument,
  WebsiteDocumentV3,
  SectionType,
  PageContract,
  SectionContract,
  WebsiteNode,
  PageDocumentV3,
  ThemeSystemV3,
} from '../types/document.types';
import { SECTION_REGISTRY, isValidSectionType } from '../contracts/section-registry';
import { DocumentValidatorService } from './document-validator.service';

@Injectable()
export class DocumentMigrationService {
  private readonly logger = new Logger(DocumentMigrationService.name);

  constructor(private readonly validator: DocumentValidatorService) {}

  /**
   * Migrate any document (V1.0, V2.0, or V3.0) to canonical V3.0.
   */
  migrateWebsiteDocument(rawDocument: any): WebsiteDocumentV3 {
    if (!rawDocument || typeof rawDocument !== 'object') {
      throw new Error('Cannot migrate empty or invalid document');
    }

    const version = String(rawDocument.schemaVersion || '1.0');

    if (version === '3.0') {
      return this.validator.validateV3(rawDocument);
    }

    if (version === '2.0') {
      const v2Validated = this.validator.validateV2(rawDocument);
      return this.migrateV2ToV3(v2Validated);
    }

    // Version 1.0 or legacy
    this.logger.log(`Migrating document from legacy v${version} to 3.0`);
    const v2Doc = this.migrateFromV1(rawDocument);
    return this.migrateV2ToV3(v2Doc);
  }

  /**
   * Convert a canonical V2.0 section-based WebsiteDocument into a canonical V3.0 hierarchical node document.
   */
  migrateV2ToV3(v2Doc: WebsiteDocument): WebsiteDocumentV3 {
    const rawTheme = v2Doc.theme || ({} as any);

    // Build V3 Theme System
    const v3Theme: ThemeSystemV3 = {
      colors: {
        primary: rawTheme.primaryColor || '#0f172a',
        secondary: rawTheme.secondaryColor || '#ffffff',
        accent: rawTheme.accentColor || '#6366f1',
        background: rawTheme.backgroundColor || '#ffffff',
        surface: '#f8fafc',
        text: rawTheme.textColor || '#0f172a',
        muted: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        h1: {
          fontFamily: rawTheme.headingFont || 'Inter',
          fontSize: '48px',
          fontWeight: 800,
          lineHeight: 1.15,
          letterSpacing: '-0.02em',
        },
        h2: {
          fontFamily: rawTheme.headingFont || 'Inter',
          fontSize: '36px',
          fontWeight: 700,
          lineHeight: 1.2,
          letterSpacing: '-0.01em',
        },
        h3: {
          fontFamily: rawTheme.headingFont || 'Inter',
          fontSize: '28px',
          fontWeight: 600,
          lineHeight: 1.3,
        },
        h4: {
          fontFamily: rawTheme.headingFont || 'Inter',
          fontSize: '22px',
          fontWeight: 600,
          lineHeight: 1.35,
        },
        h5: {
          fontFamily: rawTheme.headingFont || 'Inter',
          fontSize: '18px',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        h6: {
          fontFamily: rawTheme.headingFont || 'Inter',
          fontSize: '16px',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        body: {
          fontFamily: rawTheme.bodyFont || 'Inter',
          fontSize: '16px',
          fontWeight: 400,
          lineHeight: 1.6,
        },
        caption: {
          fontFamily: rawTheme.bodyFont || 'Inter',
          fontSize: '13px',
          fontWeight: 400,
          lineHeight: 1.5,
        },
        label: {
          fontFamily: rawTheme.bodyFont || 'Inter',
          fontSize: '14px',
          fontWeight: 500,
          lineHeight: 1.4,
        },
        button: {
          fontFamily: rawTheme.bodyFont || 'Inter',
          fontSize: '15px',
          fontWeight: 600,
          lineHeight: 1.4,
        },
        quote: {
          fontFamily: rawTheme.bodyFont || 'Inter',
          fontSize: '18px',
          fontWeight: 400,
          lineHeight: 1.6,
        },
      },
      breakpoints: {
        desktop: 1200,
        tablet: 768,
        mobile: 480,
      },
      borderRadius: rawTheme.borderRadius || 'md',
      shadows: rawTheme.shadows || 'subtle',
      customCss: rawTheme.customCss || '',
    };

    // Convert pages
    const v3Pages: PageDocumentV3[] = (v2Doc.pages || []).map((page, pIdx) => {
      const pageId = page.id || `page_${pIdx + 1}`;
      const pageRoot: WebsiteNode = {
        id: `root_${pageId}`,
        type: 'page-root',
        name: 'Page Root',
        props: {},
        styles: { layout: { display: 'flex', position: 'relative', width: '100%', minHeight: '100vh' } },
        children: [],
      };

      // Convert V2 sections into V3 section nodes with hierarchical children
      (page.sections || []).forEach((sec, sIdx) => {
        const sectionNode = this.convertSectionToNode(sec, pageId, sIdx);
        pageRoot.children!.push(sectionNode);
      });

      return {
        id: pageId,
        title: page.title,
        slug: page.slug,
        type: page.type,
        sortOrder: page.sortOrder ?? pIdx,
        enabled: page.enabled !== false,
        seo: page.seo,
        root: pageRoot,
      };
    });

    const v3Doc: WebsiteDocumentV3 = {
      schemaVersion: '3.0',
      site: {
        id: v2Doc.site?.id,
        name: v2Doc.site?.name || 'My Website',
        businessType: v2Doc.site?.businessType || 'business',
        language: v2Doc.site?.language || 'en',
        favicon: v2Doc.site?.favicon,
      },
      theme: v3Theme,
      business: v2Doc.business,
      navigation: v2Doc.navigation,
      pages: v3Pages,
      global: {
        reusableNodes: {},
      },
      seo: v2Doc.seo,
      settings: {
        analyticsId: v2Doc.settings?.analyticsId,
        customDomain: v2Doc.settings?.customDomain,
        enableContactForm: v2Doc.settings?.enableContactForm !== false,
        enableLiveChat: Boolean(v2Doc.settings?.enableLiveChat),
        language: v2Doc.settings?.language || 'en',
        limits: {
          maxNodes: 2000,
          maxDepth: 32,
          maxRichTextChars: 50000,
        },
      },
    };

    return this.validator.validateV3(v3Doc);
  }

  /**
   * Convert a single V2 SectionContract into a structured V3 Section node with nested Container, Grid, and Elements.
   */
  private convertSectionToNode(
    sec: SectionContract,
    pageId: string,
    index: number,
  ): WebsiteNode {
    const secId = sec.id || `sec_${index + 1}_${crypto.randomBytes(3).toString('hex')}`;
    const props = sec.props || {};

    // Base Section node
    const sectionNode: WebsiteNode = {
      id: secId,
      type: 'section',
      name: `${sec.type.toUpperCase()} Section`,
      props: {
        sectionType: sec.type,
        variant: sec.variant,
        anchorId: props.anchorId || sec.type,
      },
      styles: {
        layout: { position: 'relative', width: '100%' },
        spacing: { padding: { top: '64px', bottom: '64px', left: '24px', right: '24px' } },
        background: { color: 'transparent' },
        ...(sec.styles || {}),
      },
      children: [],
    };

    // Special handling for standalone header/footer sections
    if (sec.type === 'navbar') {
      sectionNode.children = [
        {
          id: `navbar_${secId}`,
          type: 'navbar',
          name: 'Navigation Bar',
          props: {
            brandName: props.brandName || 'Brand',
            sticky: true,
            links: props.links || [],
            ctaText: props.ctaText || 'Contact Us',
            ctaHref: props.ctaHref || '#contact',
          },
          styles: { layout: { width: '100%' } },
        },
      ];
      return sectionNode;
    }

    if (sec.type === 'footer') {
      sectionNode.children = [
        {
          id: `footer_${secId}`,
          type: 'footer',
          name: 'Footer',
          props: {
            copyright: props.copyright || '© 2026 All Rights Reserved.',
            columns: props.columns || [],
          },
          styles: { layout: { width: '100%' } },
        },
      ];
      return sectionNode;
    }

    // Inside Section: Add Container
    const containerNode: WebsiteNode = {
      id: `container_${secId}`,
      type: 'container',
      name: 'Content Container',
      props: { maxWidth: '1200px', centered: true },
      styles: {
        layout: { position: 'relative', width: '100%' },
        size: { maxWidth: '1200px' },
        spacing: { margin: { left: 'auto', right: 'auto' } },
      },
      children: [],
    };

    // Extract Badge if present
    if (props.badge) {
      containerNode.children!.push({
        id: `badge_${secId}`,
        type: 'badge',
        name: 'Badge',
        props: { text: String(props.badge), variant: 'subtle' },
        styles: {},
      });
    }

    // Extract Headline as Heading node
    if (props.headline || props.title) {
      containerNode.children!.push({
        id: `heading_${secId}`,
        type: 'heading',
        name: 'Headline',
        props: {
          text: String(props.headline || props.title),
          level: sec.type === 'hero' ? 1 : 2,
        },
        styles: {
          typography: {
            fontSize: sec.type === 'hero' ? '44px' : '32px',
            fontWeight: 700,
            lineHeight: 1.2,
          },
          spacing: { margin: { bottom: '16px' } },
        },
      });
    }

    // Extract Subheadline as Paragraph node
    if (props.subheadline || props.subtitle || props.description) {
      containerNode.children!.push({
        id: `paragraph_${secId}`,
        type: 'paragraph',
        name: 'Description',
        props: {
          text: String(props.subheadline || props.subtitle || props.description),
        },
        styles: {
          typography: { fontSize: '16px', lineHeight: 1.6 },
          spacing: { margin: { bottom: '24px' } },
        },
      });
    }

    // Extract CTAs
    if (props.primaryCtaText || props.ctaLabel) {
      containerNode.children!.push({
        id: `btn_${secId}`,
        type: 'button',
        name: 'Call to Action',
        props: {
          label: String(props.primaryCtaText || props.ctaLabel),
          href: String(props.primaryCtaUrl || props.ctaHref || '#contact'),
          variant: 'primary',
        },
        styles: {},
      });
    }

    // Extract Image if present
    if (props.imageUrl || props.src) {
      containerNode.children!.push({
        id: `img_${secId}`,
        type: 'image',
        name: 'Section Image',
        props: {
          src: String(props.imageUrl || props.src),
          alt: String(props.headline || 'Section image'),
          objectFit: 'cover',
        },
        styles: {
          layout: { width: '100%' },
          border: { radius: { all: '12px' } },
          spacing: { margin: { top: '24px' } },
        },
      });
    }

    // Extract Form if type is contact
    if (sec.type === 'contact') {
      containerNode.children!.push({
        id: `form_${secId}`,
        type: 'contact-form',
        name: 'Contact Form',
        props: {
          headline: 'Send a Message',
          fields: ['name', 'email', 'phone', 'message'],
        },
        styles: {},
      });
    }

    // Extract Pricing if type is pricing
    if (sec.type === 'pricing' && Array.isArray(props.plans)) {
      const gridNode: WebsiteNode = {
        id: `grid_${secId}`,
        type: 'grid',
        name: 'Pricing Grid',
        props: { columns: props.plans.length },
        styles: {
          layout: { display: 'grid', width: '100%' },
          grid: {
            columns: props.plans.length,
            columnGap: '24px',
            rowGap: '24px',
          },
        },
        children: props.plans.map((plan: any, pIdx: number) => ({
          id: `pricing_${secId}_${pIdx + 1}`,
          type: 'pricing',
          name: plan.name || `Plan ${pIdx + 1}`,
          props: {
            planName: plan.name || 'Plan',
            price: plan.price || '$0',
            billingPeriod: plan.billingPeriod || 'month',
            description: plan.description || '',
            features: plan.features || [],
            ctaLabel: plan.ctaText || 'Get Started',
            ctaHref: plan.ctaUrl || '#contact',
            isPopular: Boolean(plan.isRecommended || plan.isPopular),
          },
          styles: {},
        })),
      };
      containerNode.children!.push(gridNode);
    }

    // Extract Testimonials if type is testimonials
    if (sec.type === 'testimonials' && Array.isArray(props.items)) {
      const gridNode: WebsiteNode = {
        id: `grid_${secId}`,
        type: 'grid',
        name: 'Testimonials Grid',
        props: { columns: Math.min(3, props.items.length) },
        styles: {
          layout: { display: 'grid', width: '100%' },
          grid: {
            columns: Math.min(3, props.items.length),
            columnGap: '24px',
            rowGap: '24px',
          },
        },
        children: props.items.map((item: any, tIdx: number) => ({
          id: `testimonial_${secId}_${tIdx + 1}`,
          type: 'testimonial',
          name: `Testimonial ${tIdx + 1}`,
          props: {
            quote: item.quote || '',
            author: item.author || '',
            role: item.role || '',
            rating: item.rating || 5,
            avatarUrl: item.avatarUrl || '',
          },
          styles: {},
        })),
      };
      containerNode.children!.push(gridNode);
    }

    sectionNode.children!.push(containerNode);
    return sectionNode;
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

    return this.validator.validateV2(canonicalDoc);
  }

  private migrateLegacyPage(rawPage: any, index: number): PageContract {
    const rawType = String(rawPage.type || 'custom').toLowerCase();
    const type = [
      'home',
      'about',
      'services',
      'contact',
      'pricing',
      'portfolio',
      'blog',
      'custom',
    ].includes(rawType)
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
   * Migrate a legacy relational Website record into a canonical V3 WebsiteDocument.
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

    const rawDoc: WebsiteDocument = {
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

    return this.validator.validateV2(rawDoc);
  }
}
