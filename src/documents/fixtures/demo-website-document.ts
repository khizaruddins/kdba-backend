import { WebsiteDocumentV3 } from '../types/v3.types';
import { VisualNode } from '../types/v3.types';

function node(
  id: string,
  type: VisualNode['type'],
  props: Record<string, unknown> = {},
  children: VisualNode[] = [],
  styles: VisualNode['styles'] = {},
  responsive: VisualNode['responsive'] = {},
): VisualNode {
  return {
    id,
    type,
    props,
    styles,
    responsive,
    children,
    enabled: true,
  };
}

export function createDemoWebsiteDocument(): WebsiteDocumentV3 {
  const navbar = node(
    'section_navbar',
    'section',
    { name: 'Navbar' },
    [
      node(
        'container_navbar',
        'container',
        { maxWidth: '1200px' },
        [
          node(
            'row_navbar',
            'row',
            {},
            [
              node('column_brand', 'column', { span: 4 }, [
                node(
                  'heading_brand',
                  'heading',
                  { text: 'KDBA Studio', tag: 'h1' },
                  [],
                  {
                    typography: { fontSize: 22, fontWeight: 700, letterSpacing: 0.4 },
                    color: { color: 'primary' },
                  },
                ),
              ]),
              node('column_nav_links', 'column', { span: 5 }, [
                node(
                  'stack_nav_links',
                  'stack',
                  {},
                  [
                    node('link_nav_home', 'link', { label: 'Home', href: '/' }),
                    node('link_nav_features', 'link', { label: 'Features', href: '/#features' }),
                    node('link_nav_contact', 'link', { label: 'Contact', href: '/#cta' }),
                  ],
                  { layout: { display: 'flex', direction: 'row', gap: 24, alignItems: 'center' } },
                ),
              ]),
              node('column_nav_cta', 'column', { span: 3 }, [
                node('button_nav_cta', 'button', {
                  label: 'Get Started',
                  href: '/#cta',
                  variant: 'primary',
                }),
              ]),
            ],
            { layout: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24 } },
          ),
        ],
      ),
    ],
    { spacing: { padding: { top: 20, bottom: 20 } }, background: { color: '#FFFFFF' } },
  );

  const hero = node(
    'section_hero',
    'section',
    { name: 'Hero' },
    [
      node(
        'container_hero',
        'container',
        { maxWidth: '1200px' },
        [
          node(
            'row_hero',
            'row',
            {},
            [
              node('column_hero_copy', 'column', { span: 6 }, [
                node(
                  'heading_hero',
                  'heading',
                  { text: 'Grow Your Business', tag: 'h1' },
                  [],
                  {
                    typography: {
                      fontFamily: 'Inter',
                      fontSize: 56,
                      fontWeight: 600,
                      lineHeight: 1.1,
                      textAlign: 'left',
                    },
                    color: { color: '#111111' },
                  },
                  {
                    mobile: {
                      typography: { fontSize: 36 },
                    },
                  },
                ),
                node(
                  'paragraph_hero',
                  'paragraph',
                  {
                    text: 'Launch a premium brand website with a structured visual document that editors, renderers, and AI all share.',
                  },
                  [],
                  {
                    typography: { fontSize: 18, lineHeight: 1.6 },
                    spacing: { margin: { top: 16, bottom: 24 } },
                    color: { color: '#4B5563' },
                  },
                ),
                node('button_hero', 'button', {
                  label: 'Book a Strategy Call',
                  href: '/#cta',
                  variant: 'primary',
                }),
              ]),
              node('column_hero_media', 'column', { span: 6 }, [
                node('image_hero', 'image', {
                  src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80',
                  alt: 'Founders collaborating in a bright studio',
                  fit: 'cover',
                  position: 'center',
                }),
              ]),
            ],
            { layout: { display: 'flex', direction: 'row', gap: 48, alignItems: 'center' } },
          ),
        ],
      ),
    ],
    { spacing: { padding: { top: 72, bottom: 72 } }, background: { color: '#F8FAFC' } },
  );

  const features = node(
    'section_features',
    'section',
    { name: 'Features' },
    [
      node(
        'container_features',
        'container',
        { maxWidth: '1200px' },
        [
          node(
            'heading_features',
            'heading',
            { text: 'Everything a modern brand site needs', tag: 'h2' },
            [],
            {
              typography: { fontSize: 36, fontWeight: 600, textAlign: 'center' },
              spacing: { margin: { bottom: 40 } },
            },
          ),
          node(
            'grid_features',
            'grid',
            { columns: 3 },
            [
              node('stack_feature_1', 'stack', {}, [
                node('heading_feature_1', 'heading', { text: 'Visual editing', tag: 'h3' }),
                node('paragraph_feature_1', 'paragraph', {
                  text: 'Structured nodes, not blobs of HTML, so every change is validated and reversible.',
                }),
              ]),
              node('stack_feature_2', 'stack', {}, [
                node('heading_feature_2', 'heading', { text: 'Draft and live', tag: 'h3' }),
                node('paragraph_feature_2', 'paragraph', {
                  text: 'Editors work on a draft document. The public site only ever sees a published snapshot.',
                }),
              ]),
              node('stack_feature_3', 'stack', {}, [
                node('heading_feature_3', 'heading', { text: 'AI-ready operations', tag: 'h3' }),
                node('paragraph_feature_3', 'paragraph', {
                  text: 'The same add, move, and style operations power humans today and assistants later.',
                }),
              ]),
            ],
            { layout: { display: 'grid', columns: 3, gap: 24 } },
          ),
        ],
      ),
    ],
  );

  const cta = node(
    'section_cta',
    'section',
    { name: 'CTA' },
    [
      node(
        'container_cta',
        'container',
        { maxWidth: '800px' },
        [
          node(
            'heading_cta',
            'heading',
            { text: 'Ready to publish something you are proud of?', tag: 'h2' },
            [],
            { typography: { fontSize: 32, fontWeight: 600, textAlign: 'center' } },
          ),
          node(
            'paragraph_cta',
            'paragraph',
            { text: 'Start from a validated WebsiteDocument and ship with confidence.' },
            [],
            {
              typography: { textAlign: 'center' },
              spacing: { margin: { top: 12, bottom: 24 } },
            },
          ),
          node('button_cta', 'button', {
            label: 'Start Building',
            href: 'https://kdba-frontend.vercel.app',
            variant: 'primary',
          }),
        ],
        { layout: { display: 'flex', direction: 'column', alignItems: 'center' } },
      ),
    ],
    { spacing: { padding: { top: 64, bottom: 64 } }, background: { color: '#111827' }, color: { color: '#FFFFFF' } },
  );

  const footer = node(
    'section_footer',
    'section',
    { name: 'Footer' },
    [
      node(
        'container_footer',
        'container',
        { maxWidth: '1200px' },
        [
          node(
            'row_footer',
            'row',
            {},
            [
              node('column_footer_brand', 'column', { span: 6 }, [
                node('heading_footer', 'heading', { text: 'KDBA Studio', tag: 'h3' }),
                node('paragraph_footer', 'paragraph', {
                  text: 'A structured website document engine for brands that care about quality.',
                }),
              ]),
              node('column_footer_links', 'column', { span: 6 }, [
                node('link_footer_privacy', 'link', { label: 'Privacy', href: '/privacy' }),
                node('link_footer_contact', 'link', { label: 'Contact', href: '/#cta' }),
              ]),
            ],
          ),
          node('divider_footer', 'divider', { style: 'solid' }),
          node('text_copyright', 'text', { text: '© 2026 KDBA Studio. All rights reserved.' }),
        ],
      ),
    ],
    { spacing: { padding: { top: 40, bottom: 32 } } },
  );

  return {
    schemaVersion: '3.0',
    site: {
      id: 'site_kdba_demo',
      name: 'KDBA Studio',
      businessType: 'agency',
      language: 'en',
      settings: {
        enableContactForm: true,
        language: 'en',
      },
    },
    theme: {
      primaryColor: '#5B5FEF',
      secondaryColor: '#111827',
      accentColor: '#5B5FEF',
      backgroundColor: '#FFFFFF',
      textColor: '#111827',
      headingFont: 'Inter',
      bodyFont: 'Inter',
      borderRadius: 'md',
      shadows: 'subtle',
      colors: {
        primary: '#5B5FEF',
        secondary: '#111827',
        accent: '#5B5FEF',
        background: '#FFFFFF',
        surface: '#F8FAFC',
        text: '#111827',
        muted: '#6B7280',
        border: '#E5E7EB',
      },
      typography: {
        headingFont: 'Inter',
        bodyFont: 'Inter',
      },
      tokens: {
        borderRadius: 'md',
        shadows: 'subtle',
      },
    },
    business: {
      name: 'KDBA Studio',
      tagline: 'Structured websites for ambitious brands',
      description: 'KDBA helps businesses launch premium websites from a single validated document.',
      category: 'Digital Agency',
      email: 'hello@kdba.studio',
      phone: '+1 (415) 555-0148',
    },
    navigation: {
      header: [
        { id: 'nav_home', label: 'Home', href: '/' },
        { id: 'nav_features', label: 'Features', href: '/#features' },
        { id: 'nav_contact', label: 'Contact', href: '/#cta' },
      ],
      footer: [
        {
          title: 'Studio',
          links: [
            { id: 'fl_privacy', label: 'Privacy', href: '/privacy' },
            { id: 'fl_contact', label: 'Contact', href: '/#cta' },
          ],
        },
      ],
      ctaButton: {
        label: 'Get Started',
        href: '/#cta',
        variant: 'primary',
      },
    },
    pages: [
      {
        id: 'page_home',
        name: 'Home',
        title: 'Home',
        slug: '/',
        type: 'home',
        sortOrder: 0,
        enabled: true,
        seo: {
          title: 'KDBA Studio — Grow Your Business',
          description: 'A representative visual website document for the KDBA builder foundation.',
        },
        root: node('root_home', 'page-root', {}, [navbar, hero, features, cta, footer]),
      },
    ],
    seo: {
      metaTitle: 'KDBA Studio — Grow Your Business',
      metaDescription: 'Launch a premium brand website from a validated WebsiteDocument.',
      keywords: ['website builder', 'kdba', 'visual editor'],
    },
    settings: {
      enableContactForm: true,
      language: 'en',
    },
  };
}
