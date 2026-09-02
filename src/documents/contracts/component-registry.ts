import {
  NodeType,
  ALL_NODE_TYPES,
  WebsiteNode,
  StyleDefinition,
} from '../types/document.types';
import * as crypto from 'crypto';

export interface ComponentCapabilities {
  canHaveChildren: boolean;
  canDropInto: boolean;
  canDuplicate: boolean;
  canDelete: boolean;
  canMove: boolean;
  supportsStyles: boolean;
  supportsResponsive: boolean;
  supportsInteractions: boolean;
  supportsAnimations: boolean;
}

export interface ComponentDefinition {
  type: NodeType;
  category: 'structural' | 'content' | 'media' | 'business' | 'navigation';
  name: string;
  description: string;
  allowedChildren: NodeType[];
  defaultProps: Record<string, unknown>;
  defaultStyles: StyleDefinition;
  capabilities: ComponentCapabilities;
  isLeaf: boolean;
}

// ─── COMPONENT REGISTRY DEFINITIONS ───────────────────────────────────────────

export const COMPONENT_REGISTRY: Record<NodeType, ComponentDefinition> = {
  // ─── STRUCTURAL NODES ───────────────────────────────────────────────────────
  'page-root': {
    type: 'page-root',
    category: 'structural',
    name: 'Page Root',
    description: 'Top-level root container for a page, housing sections and persistent layouts.',
    allowedChildren: ['section', 'navbar', 'footer'],
    defaultProps: {},
    defaultStyles: {
      layout: { display: 'flex', position: 'relative', width: '100%', minHeight: '100vh' },
      flex: { direction: 'column' },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: false,
      canDelete: false,
      canMove: false,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: false,
      supportsAnimations: false,
    },
    isLeaf: false,
  },

  section: {
    type: 'section',
    category: 'structural',
    name: 'Section',
    description: 'Full-width visual section block with optional background media and containment.',
    allowedChildren: [
      'container',
      'row',
      'grid',
      'stack',
      'heading',
      'paragraph',
      'rich-text',
      'button',
      'link',
      'image',
      'video',
      'form',
      'contact-form',
      'map',
      'opening-hours',
      'pricing',
      'product',
      'testimonial',
      'team',
      'service',
      'background-media',
      'divider',
      'spacer',
      'navbar',
      'footer',
    ],
    defaultProps: {
      fullWidth: true,
      anchorId: '',
    },
    defaultStyles: {
      layout: { position: 'relative', width: '100%' },
      spacing: { padding: { top: '64px', bottom: '64px', left: '24px', right: '24px' } },
      background: { color: 'transparent' },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  container: {
    type: 'container',
    category: 'structural',
    name: 'Container',
    description: 'Max-width bounded wrapper for organizing and aligning responsive content.',
    allowedChildren: [
      'container',
      'row',
      'column',
      'grid',
      'stack',
      'heading',
      'paragraph',
      'rich-text',
      'text',
      'button',
      'link',
      'icon',
      'logo',
      'badge',
      'divider',
      'spacer',
      'list',
      'quote',
      'image',
      'video',
      'gallery',
      'carousel',
      'form',
      'contact-form',
      'map',
      'opening-hours',
      'pricing',
      'product',
      'testimonial',
      'team',
      'service',
    ],
    defaultProps: {
      maxWidth: '1200px',
      centered: true,
    },
    defaultStyles: {
      layout: { position: 'relative', width: '100%' },
      size: { maxWidth: '1200px' },
      spacing: { margin: { left: 'auto', right: 'auto' }, padding: { left: '16px', right: '16px' } },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  row: {
    type: 'row',
    category: 'structural',
    name: 'Row',
    description: 'Horizontal flex row layout for arranging columns and child elements.',
    allowedChildren: [
      'column',
      'stack',
      'container',
      'heading',
      'paragraph',
      'rich-text',
      'text',
      'button',
      'link',
      'image',
      'video',
      'icon',
      'badge',
    ],
    defaultProps: {
      gutter: '24px',
    },
    defaultStyles: {
      layout: { display: 'flex', position: 'relative', width: '100%' },
      flex: { direction: 'row', wrap: 'wrap', gap: '24px', alignItems: 'center' },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  column: {
    type: 'column',
    category: 'structural',
    name: 'Column',
    description: 'Vertical layout column within a row or grid, supporting width and span controls.',
    allowedChildren: [
      'container',
      'grid',
      'stack',
      'heading',
      'paragraph',
      'rich-text',
      'text',
      'button',
      'link',
      'image',
      'video',
      'icon',
      'logo',
      'badge',
      'divider',
      'spacer',
      'list',
      'quote',
      'gallery',
      'carousel',
      'form',
      'contact-form',
      'map',
      'opening-hours',
      'pricing',
      'product',
      'testimonial',
      'team',
      'service',
    ],
    defaultProps: {
      span: 6, // 1 to 12
    },
    defaultStyles: {
      layout: { display: 'flex', position: 'relative', width: '100%' },
      flex: { direction: 'column', grow: 1, shrink: 1 },
      spacing: { padding: { top: '8px', bottom: '8px', left: '8px', right: '8px' } },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  grid: {
    type: 'grid',
    category: 'structural',
    name: 'CSS Grid',
    description: 'Multi-column 12-column or custom grid container for responsive layouts.',
    allowedChildren: [
      'container',
      'column',
      'stack',
      'heading',
      'paragraph',
      'rich-text',
      'text',
      'button',
      'link',
      'image',
      'video',
      'icon',
      'logo',
      'badge',
      'divider',
      'spacer',
      'list',
      'quote',
      'gallery',
      'carousel',
      'form',
      'contact-form',
      'map',
      'opening-hours',
      'pricing',
      'product',
      'testimonial',
      'team',
      'service',
    ],
    defaultProps: {
      columns: 3,
      gap: '24px',
    },
    defaultStyles: {
      layout: { display: 'grid', position: 'relative', width: '100%' },
      grid: {
        columns: 3,
        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
        columnGap: '24px',
        rowGap: '24px',
      },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  stack: {
    type: 'stack',
    category: 'structural',
    name: 'Stack',
    description: 'Vertical or horizontal auto-layout stack with configurable spacing and alignment.',
    allowedChildren: [
      'container',
      'column',
      'stack',
      'heading',
      'paragraph',
      'rich-text',
      'text',
      'button',
      'link',
      'image',
      'video',
      'icon',
      'logo',
      'badge',
      'divider',
      'spacer',
      'list',
      'quote',
      'form',
      'contact-form',
    ],
    defaultProps: {
      direction: 'column',
      gap: '16px',
    },
    defaultStyles: {
      layout: { display: 'flex', position: 'relative', width: '100%' },
      flex: { direction: 'column', gap: '16px', alignItems: 'flex-start' },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  // ─── CONTENT NODES ──────────────────────────────────────────────────────────
  heading: {
    type: 'heading',
    category: 'content',
    name: 'Heading',
    description: 'Header text element supporting H1 through H6 with customizable typography tokens.',
    allowedChildren: [],
    defaultProps: {
      text: 'Build Something Exceptional',
      level: 2, // 1 to 6
    },
    defaultStyles: {
      typography: {
        fontSize: '32px',
        fontWeight: 700,
        lineHeight: 1.25,
        letterSpacing: '-0.02em',
        textAlign: 'left',
      },
      spacing: { margin: { bottom: '12px' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  paragraph: {
    type: 'paragraph',
    category: 'content',
    name: 'Paragraph',
    description: 'Standard body text block with typography and color controls.',
    allowedChildren: [],
    defaultProps: {
      text: 'Craft stunning, responsive websites with full visual precision and high performance.',
    },
    defaultStyles: {
      typography: {
        fontSize: '16px',
        fontWeight: 400,
        lineHeight: 1.6,
        textAlign: 'left',
      },
      spacing: { margin: { bottom: '16px' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  'rich-text': {
    type: 'rich-text',
    category: 'content',
    name: 'Rich Text',
    description: 'Sanitized HTML / rich-text block for formatted copy and inline links.',
    allowedChildren: [],
    defaultProps: {
      html: '<p>Empowering businesses with <strong>next-generation</strong> digital solutions.</p>',
    },
    defaultStyles: {
      typography: { fontSize: '16px', lineHeight: 1.6 },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  text: {
    type: 'text',
    category: 'content',
    name: 'Inline Text',
    description: 'Inline span text element.',
    allowedChildren: [],
    defaultProps: {
      text: 'Inline text',
    },
    defaultStyles: {},
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  button: {
    type: 'button',
    category: 'content',
    name: 'Button',
    description: 'Interactive button with configurable variant, link, icon, and hover styling.',
    allowedChildren: [],
    defaultProps: {
      label: 'Get Started',
      href: '#contact',
      target: '_self',
      variant: 'primary', // 'primary' | 'secondary' | 'outline' | 'ghost'
      size: 'md',
    },
    defaultStyles: {
      layout: { display: 'inline-flex', position: 'relative' },
      flex: { alignItems: 'center', justifyContent: 'center' },
      spacing: { padding: { top: '12px', bottom: '12px', left: '24px', right: '24px' } },
      border: { radius: { all: '8px' } },
      typography: { fontSize: '15px', fontWeight: 600 },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  link: {
    type: 'link',
    category: 'content',
    name: 'Link',
    description: 'Hyperlink element to internal pages, anchors, URLs, email, or phone.',
    allowedChildren: [],
    defaultProps: {
      label: 'Learn more →',
      href: '/',
      target: '_self',
    },
    defaultStyles: {
      typography: { textDecoration: 'none', fontWeight: 500 },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  icon: {
    type: 'icon',
    category: 'content',
    name: 'Icon',
    description: 'Vector icon with color and size controls.',
    allowedChildren: [],
    defaultProps: {
      iconName: 'sparkles',
      size: 24,
    },
    defaultStyles: {
      size: { width: '24px', height: '24px' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  logo: {
    type: 'logo',
    category: 'content',
    name: 'Logo',
    description: 'Brand logo image or typography mark.',
    allowedChildren: [],
    defaultProps: {
      src: '',
      alt: 'Brand Logo',
      text: 'KDBA',
      width: 140,
    },
    defaultStyles: {
      size: { maxWidth: '180px', height: 'auto' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  badge: {
    type: 'badge',
    category: 'content',
    name: 'Badge',
    description: 'Pill or tag highlight badge for statuses, tags, or features.',
    allowedChildren: [],
    defaultProps: {
      text: 'New Feature',
      variant: 'subtle',
    },
    defaultStyles: {
      layout: { display: 'inline-flex' },
      spacing: { padding: { top: '4px', bottom: '4px', left: '12px', right: '12px' }, margin: { bottom: '12px' } },
      border: { radius: { all: '9999px' } },
      typography: { fontSize: '13px', fontWeight: 600 },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  divider: {
    type: 'divider',
    category: 'content',
    name: 'Divider',
    description: 'Horizontal rule line separating content blocks.',
    allowedChildren: [],
    defaultProps: {
      thickness: 1,
    },
    defaultStyles: {
      layout: { width: '100%' },
      border: { bottom: { width: '1px', style: 'solid', color: '#e2e8f0' } },
      spacing: { margin: { top: '24px', bottom: '24px' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: false,
      supportsAnimations: false,
    },
    isLeaf: true,
  },

  spacer: {
    type: 'spacer',
    category: 'content',
    name: 'Spacer',
    description: 'Configurable blank space for vertical rhythm.',
    allowedChildren: [],
    defaultProps: {
      height: '32px',
    },
    defaultStyles: {
      size: { height: '32px', width: '100%' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: false,
      supportsAnimations: false,
    },
    isLeaf: true,
  },

  list: {
    type: 'list',
    category: 'content',
    name: 'List',
    description: 'Bullet, numbered, or checkmarked item list.',
    allowedChildren: [],
    defaultProps: {
      items: ['Comprehensive digital audit', 'Tailored architectural roadmap', 'Enterprise SLAs & security'],
      styleType: 'check', // 'bullet' | 'check' | 'numbered'
    },
    defaultStyles: {
      spacing: { margin: { bottom: '16px' } },
      typography: { fontSize: '15px', lineHeight: 1.6 },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  quote: {
    type: 'quote',
    category: 'content',
    name: 'Quote / Blockquote',
    description: 'Stylized quote block with citation and author details.',
    allowedChildren: [],
    defaultProps: {
      quote: 'KDBA accelerated our website launch by 4x while giving us total visual freedom.',
      author: 'Sarah Jenkins',
      title: 'Founder & CEO, Horizon Studio',
    },
    defaultStyles: {
      border: { left: { width: '4px', style: 'solid', color: '#6366f1' } },
      spacing: { padding: { left: '20px' }, margin: { top: '16px', bottom: '16px' } },
      typography: { fontSize: '18px', fontStyle: 'italic' } as any,
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  // ─── MEDIA NODES ────────────────────────────────────────────────────────────
  image: {
    type: 'image',
    category: 'media',
    name: 'Image',
    description: 'Responsive image with mediaId reference, aspect ratio, lazy loading, and object-fit.',
    allowedChildren: [],
    defaultProps: {
      src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200&auto=format&fit=crop&q=80',
      alt: 'Office workspace',
      mediaId: '',
      objectFit: 'cover',
      aspectRatio: '16/9',
      lazy: true,
    },
    defaultStyles: {
      layout: { position: 'relative', width: '100%' },
      border: { radius: { all: '12px' } },
      effects: { boxShadow: { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0,0,0,0.08)' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  video: {
    type: 'video',
    category: 'media',
    name: 'Video',
    description: 'HTML5 or embedded video with autoplay, muted, controls, and poster options.',
    allowedChildren: [],
    defaultProps: {
      src: '',
      poster: '',
      autoplay: false,
      muted: true,
      loop: false,
      controls: true,
      aspectRatio: '16/9',
    },
    defaultStyles: {
      layout: { width: '100%' },
      border: { radius: { all: '12px' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  gallery: {
    type: 'gallery',
    category: 'media',
    name: 'Image Gallery',
    description: 'Grid-based responsive showcase of images with lightbox support.',
    allowedChildren: [],
    defaultProps: {
      columns: 3,
      gap: '16px',
      images: [
        { src: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=800', alt: 'Showcase 1' },
        { src: 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800', alt: 'Showcase 2' },
        { src: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=800', alt: 'Showcase 3' },
      ],
    },
    defaultStyles: {
      layout: { width: '100%' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  carousel: {
    type: 'carousel',
    category: 'media',
    name: 'Carousel / Slider',
    description: 'Interactive slide carousel for testimonials, portfolios, or banners.',
    allowedChildren: [],
    defaultProps: {
      autoplay: true,
      interval: 5000,
      showArrows: true,
      showDots: true,
      slides: [
        { title: 'Slide 1', image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=1200' },
        { title: 'Slide 2', image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200' },
      ],
    },
    defaultStyles: {
      layout: { width: '100%', position: 'relative' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  'background-media': {
    type: 'background-media',
    category: 'media',
    name: 'Background Media',
    description: 'Full-bleed section background media layer with color overlay support.',
    allowedChildren: [],
    defaultProps: {
      mediaType: 'image', // 'image' | 'video'
      src: '',
      overlayColor: 'rgba(15, 23, 42, 0.65)',
      blur: 0,
    },
    defaultStyles: {
      layout: { position: 'absolute', top: '0', right: '0', bottom: '0', left: '0', zIndex: -1 },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: false,
      supportsAnimations: false,
    },
    isLeaf: true,
  },

  // ─── BUSINESS NODES ─────────────────────────────────────────────────────────
  form: {
    type: 'form',
    category: 'business',
    name: 'Form Container',
    description: 'Configurable interactive form wrapper connected to backend lead handling.',
    allowedChildren: ['heading', 'paragraph', 'text', 'button', 'divider', 'spacer'],
    defaultProps: {
      action: 'leads',
      fields: [
        { id: 'name', type: 'text', label: 'Full Name', required: true, placeholder: 'John Doe' },
        { id: 'email', type: 'email', label: 'Email Address', required: true, placeholder: 'john@example.com' },
        { id: 'message', type: 'textarea', label: 'Message', required: true, placeholder: 'How can we help you?' },
      ],
      submitLabel: 'Send Inquiry',
    },
    defaultStyles: {
      layout: { display: 'flex', width: '100%' },
      flex: { direction: 'column', gap: '16px' },
      spacing: { padding: { top: '24px', bottom: '24px', left: '24px', right: '24px' } },
      border: { radius: { all: '12px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
      effects: { boxShadow: { x: 0, y: 4, blur: 16, spread: 0, color: 'rgba(0,0,0,0.06)' } },
    },
    capabilities: {
      canHaveChildren: true,
      canDropInto: true,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: false,
  },

  'contact-form': {
    type: 'contact-form',
    category: 'business',
    name: 'Contact Form',
    description: 'Pre-configured contact lead generation form with spam protection.',
    allowedChildren: [],
    defaultProps: {
      headline: 'Get in Touch',
      subheadline: 'Leave your details and our team will get back to you shortly.',
      fields: ['name', 'email', 'phone', 'message'],
      submitButtonText: 'Submit Inquiry',
      successMessage: 'Thank you! We have received your message.',
    },
    defaultStyles: {
      layout: { width: '100%' },
      spacing: { padding: { top: '24px', bottom: '24px', left: '24px', right: '24px' } },
      border: { radius: { all: '12px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  map: {
    type: 'map',
    category: 'business',
    name: 'Interactive Map',
    description: 'Embeddable location map display for physical address.',
    allowedChildren: [],
    defaultProps: {
      address: '100 Market St, San Francisco, CA',
      zoom: 14,
      aspectRatio: '16/9',
    },
    defaultStyles: {
      layout: { width: '100%' },
      border: { radius: { all: '12px' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: false,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  'opening-hours': {
    type: 'opening-hours',
    category: 'business',
    name: 'Opening Hours',
    description: 'Structured display of weekly operating schedule.',
    allowedChildren: [],
    defaultProps: {
      title: 'Business Hours',
      hours: {
        mon_fri: { label: 'Monday – Friday', time: '8:00 AM – 6:00 PM' },
        sat: { label: 'Saturday', time: '9:00 AM – 2:00 PM' },
        sun: { label: 'Sunday', time: 'Closed' },
      },
    },
    defaultStyles: {
      spacing: { padding: { top: '16px', bottom: '16px' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  pricing: {
    type: 'pricing',
    category: 'business',
    name: 'Pricing Card / Table',
    description: 'Pricing tier card with feature bullets, price tag, and checkout / contact CTA.',
    allowedChildren: [],
    defaultProps: {
      planName: 'Professional',
      price: '$99',
      billingPeriod: 'per month',
      description: 'Ideal for scaling businesses looking for dedicated support.',
      features: ['Unlimited custom pages', 'Priority 24/7 support', 'Custom domain & SSL', 'Advanced analytics'],
      ctaLabel: 'Choose Plan',
      ctaHref: '#contact',
      isPopular: true,
    },
    defaultStyles: {
      layout: { width: '100%' },
      spacing: { padding: { top: '32px', bottom: '32px', left: '28px', right: '28px' } },
      border: { radius: { all: '16px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
      effects: { boxShadow: { x: 0, y: 8, blur: 24, spread: 0, color: 'rgba(0,0,0,0.06)' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  product: {
    type: 'product',
    category: 'business',
    name: 'Product Card',
    description: 'Showcase card for an e-commerce product or service offering.',
    allowedChildren: [],
    defaultProps: {
      title: 'Digital Architecture Review',
      price: '$450',
      description: 'Comprehensive system review and optimization roadmap.',
      imageUrl: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800',
      ctaText: 'Order Now',
      ctaUrl: '#order',
    },
    defaultStyles: {
      layout: { width: '100%' },
      border: { radius: { all: '12px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  testimonial: {
    type: 'testimonial',
    category: 'business',
    name: 'Testimonial Card',
    description: 'Customer review showcase card with avatar, rating, and quote.',
    allowedChildren: [],
    defaultProps: {
      quote: 'KDBA provided the most seamless website management experience our company has ever had.',
      author: 'Marcus Vance',
      role: 'Chief Technology Officer',
      rating: 5,
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
    },
    defaultStyles: {
      layout: { width: '100%' },
      spacing: { padding: { top: '24px', bottom: '24px', left: '24px', right: '24px' } },
      border: { radius: { all: '12px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  team: {
    type: 'team',
    category: 'business',
    name: 'Team Member Card',
    description: 'Profile card highlighting member photo, credentials, role, and social links.',
    allowedChildren: [],
    defaultProps: {
      name: 'Dr. Elena Rostova',
      title: 'Principal Clinical Director',
      bio: 'Over 15 years leading award-winning cosmetic and clinical care.',
      imageUrl: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=800',
    },
    defaultStyles: {
      layout: { width: '100%' },
      border: { radius: { all: '12px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  service: {
    type: 'service',
    category: 'business',
    name: 'Service Item Card',
    description: 'Structured service offering block with icon, headline, and details.',
    allowedChildren: [],
    defaultProps: {
      title: 'Enterprise Architecture',
      description: 'Design robust, resilient, and highly scalable cloud systems.',
      icon: 'layers',
    },
    defaultStyles: {
      layout: { width: '100%' },
      spacing: { padding: { top: '24px', bottom: '24px', left: '24px', right: '24px' } },
      border: { radius: { all: '12px' }, width: '1px', style: 'solid', color: '#e2e8f0' },
      background: { color: '#ffffff' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: true,
    },
    isLeaf: true,
  },

  // ─── NAVIGATION NODES ───────────────────────────────────────────────────────
  navbar: {
    type: 'navbar',
    category: 'navigation',
    name: 'Navigation Bar',
    description: 'Site header navbar with logo, menu links, CTA button, and mobile menu toggle.',
    allowedChildren: [],
    defaultProps: {
      brandName: 'Brand',
      sticky: true,
      links: [
        { label: 'Home', href: '/' },
        { label: 'Services', href: '/#services' },
        { label: 'Pricing', href: '/#pricing' },
        { label: 'Contact', href: '/#contact' },
      ],
      ctaText: 'Get in Touch',
      ctaHref: '#contact',
    },
    defaultStyles: {
      layout: { position: 'sticky', top: '0', zIndex: 100, width: '100%' },
      spacing: { padding: { top: '16px', bottom: '16px', left: '24px', right: '24px' } },
      background: { color: '#ffffff' },
      border: { bottom: { width: '1px', style: 'solid', color: '#f1f5f9' } },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: false,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: false,
    },
    isLeaf: true,
  },

  navigation: {
    type: 'navigation',
    category: 'navigation',
    name: 'Navigation Menu',
    description: 'Standalone horizontal or vertical link list.',
    allowedChildren: [],
    defaultProps: {
      items: [
        { label: 'Overview', href: '/' },
        { label: 'Features', href: '/#features' },
      ],
      orientation: 'horizontal',
    },
    defaultStyles: {
      layout: { display: 'flex' },
      flex: { direction: 'row', gap: '20px' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: true,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: false,
    },
    isLeaf: true,
  },

  footer: {
    type: 'footer',
    category: 'navigation',
    name: 'Footer',
    description: 'Multi-column site footer with copyright, links, social media, and newsletter.',
    allowedChildren: [],
    defaultProps: {
      copyright: '© 2026 KDBA Inc. All rights reserved.',
      columns: [
        {
          title: 'Product',
          links: [{ label: 'Overview', href: '/' }, { label: 'Features', href: '/#features' }],
        },
        {
          title: 'Company',
          links: [{ label: 'About Us', href: '/#about' }, { label: 'Contact', href: '/#contact' }],
        },
      ],
    },
    defaultStyles: {
      layout: { position: 'relative', width: '100%' },
      spacing: { padding: { top: '48px', bottom: '48px', left: '24px', right: '24px' } },
      background: { color: '#0f172a' },
      typography: { color: '#f8fafc' },
    },
    capabilities: {
      canHaveChildren: false,
      canDropInto: false,
      canDuplicate: false,
      canDelete: true,
      canMove: true,
      supportsStyles: true,
      supportsResponsive: true,
      supportsInteractions: true,
      supportsAnimations: false,
    },
    isLeaf: true,
  },
};

// ─── HELPER FUNCTIONS ─────────────────────────────────────────────────────────

export function isValidNodeType(type: string): type is NodeType {
  return ALL_NODE_TYPES.includes(type as NodeType);
}

export function isAllowedChild(parentType: NodeType, childType: NodeType): boolean {
  const def = COMPONENT_REGISTRY[parentType];
  if (!def) return false;
  return def.allowedChildren.includes(childType);
}

export function isLeafNode(type: NodeType): boolean {
  const def = COMPONENT_REGISTRY[type];
  return !def || def.isLeaf;
}

export function getDefaultNode(type: NodeType, id?: string): WebsiteNode {
  const def = COMPONENT_REGISTRY[type];
  if (!def) {
    throw new Error(`Unknown node type: ${type}`);
  }

  const generatedId = id || `${type.replace(/-/g, '_')}_${crypto.randomBytes(4).toString('hex')}`;

  const node: WebsiteNode = {
    id: generatedId,
    type,
    name: def.name,
    props: JSON.parse(JSON.stringify(def.defaultProps)),
    styles: JSON.parse(JSON.stringify(def.defaultStyles)),
  };

  if (def.capabilities.canHaveChildren) {
    node.children = [];
  }

  return node;
}

export function getComponentManifest() {
  return Object.values(COMPONENT_REGISTRY).map((def) => ({
    type: def.type,
    category: def.category,
    name: def.name,
    description: def.description,
    allowedChildren: def.allowedChildren,
    defaultProps: def.defaultProps,
    defaultStyles: def.defaultStyles,
    capabilities: def.capabilities,
    isLeaf: def.isLeaf,
  }));
}
