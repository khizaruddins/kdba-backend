import { VisualNode } from '../types/v3.types';
import { cloneNodeWithNewIds, createNode } from '../services/document-tree';

function n(
  type: VisualNode['type'],
  props: Record<string, unknown> = {},
  children: VisualNode[] = [],
  styles: VisualNode['styles'] = {},
): VisualNode {
  return createNode(type, props, children, { styles });
}

export const SECTION_PRESET_IDS = [
  'hero',
  'about',
  'features',
  'services',
  'testimonials',
  'pricing',
  'gallery',
  'faq',
  'cta',
  'contact',
  'footer',
] as const;

export type SectionPresetId = (typeof SECTION_PRESET_IDS)[number];

export interface SectionPresetDefinition {
  id: SectionPresetId;
  name: string;
  description: string;
  tree: () => VisualNode;
}

const PRESETS: Record<SectionPresetId, Omit<SectionPresetDefinition, 'id' | 'tree'> & { tree: () => VisualNode }> = {
  hero: {
    name: 'Hero',
    description: 'Headline, supporting copy, call to action, and image',
    tree: () =>
      n('section', { name: 'Hero', presetId: 'hero' }, [
        n('container', { maxWidth: '1200px' }, [
          n('row', {}, [
            n('column', { span: 6 }, [
              n('heading', { text: 'Grow Your Business', tag: 'h1' }),
              n('paragraph', {
                text: 'A premium brand website with structured sections your team can actually edit.',
              }),
              n('button', { label: 'Get Started', href: '#contact', variant: 'primary' }),
            ]),
            n('column', { span: 6 }, [
              n('image', {
                alt: 'Hero visual',
                fit: 'cover',
                position: 'center',
                src: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=1200&auto=format&fit=crop&q=80',
              }),
            ]),
          ]),
        ]),
      ]),
  },
  about: {
    name: 'About',
    description: 'Story heading, narrative, and supporting image',
    tree: () =>
      n('section', { name: 'About', presetId: 'about' }, [
        n('container', {}, [
          n('row', {}, [
            n('column', { span: 6 }, [
              n('image', {
                alt: 'About the studio',
                fit: 'cover',
                src: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?w=1200&auto=format&fit=crop&q=80',
              }),
            ]),
            n('column', { span: 6 }, [
              n('heading', { text: 'About the studio', tag: 'h2' }),
              n('paragraph', {
                text: 'We help ambitious brands launch websites that look considered and stay easy to maintain.',
              }),
            ]),
          ]),
        ]),
      ]),
  },
  features: {
    name: 'Features',
    description: 'Three-up grid of value propositions',
    tree: () =>
      n('section', { name: 'Features', presetId: 'features' }, [
        n('container', {}, [
          n('heading', { text: 'Why teams choose KDBA', tag: 'h2' }),
          n('grid', { columns: 3 }, [
            n('stack', {}, [
              n('heading', { text: 'Visual editing', tag: 'h3' }),
              n('paragraph', { text: 'Every change is a validated document operation.' }),
            ]),
            n('stack', {}, [
              n('heading', { text: 'Responsive by default', tag: 'h3' }),
              n('paragraph', { text: 'Tablet and mobile inherit desktop unless you override.' }),
            ]),
            n('stack', {}, [
              n('heading', { text: 'Theme tokens', tag: 'h3' }),
              n('paragraph', { text: 'Keep color and type consistent across the site.' }),
            ]),
          ]),
        ]),
      ]),
  },
  services: {
    name: 'Services',
    description: 'Service cards with short descriptions',
    tree: () =>
      n('section', { name: 'Services', presetId: 'services' }, [
        n('container', {}, [
          n('heading', { text: 'Services', tag: 'h2' }),
          n('grid', { columns: 3 }, [
            n('stack', {}, [
              n('heading', { text: 'Brand websites', tag: 'h3' }),
              n('paragraph', { text: 'Launch a polished marketing site from a structured document.' }),
            ]),
            n('stack', {}, [
              n('heading', { text: 'Content systems', tag: 'h3' }),
              n('paragraph', { text: 'Reusable sections that stay on-brand as you grow.' }),
            ]),
            n('stack', {}, [
              n('heading', { text: 'Launch support', tag: 'h3' }),
              n('paragraph', { text: 'Publish drafts to production without leaking editor state.' }),
            ]),
          ]),
        ]),
      ]),
  },
  testimonials: {
    name: 'Testimonials',
    description: 'Social proof quotes',
    tree: () =>
      n('section', { name: 'Testimonials', presetId: 'testimonials' }, [
        n('container', {}, [
          n('heading', { text: 'What clients say', tag: 'h2' }),
          n('grid', { columns: 2 }, [
            n('stack', {}, [
              n('paragraph', { text: '“The editor finally matches how we think about pages.”' }),
              n('text', { text: 'Amina Shaw, Founder' }),
            ]),
            n('stack', {}, [
              n('paragraph', { text: '“We can change copy without breaking the layout.”' }),
              n('text', { text: 'Julian Hayes, Creative Director' }),
            ]),
          ]),
        ]),
      ]),
  },
  pricing: {
    name: 'Pricing',
    description: 'Two-column plan comparison',
    tree: () =>
      n('section', { name: 'Pricing', presetId: 'pricing' }, [
        n('container', {}, [
          n('heading', { text: 'Pricing', tag: 'h2' }),
          n('grid', { columns: 2 }, [
            n('stack', {}, [
              n('heading', { text: 'Studio', tag: 'h3' }),
              n('paragraph', { text: 'For growing brands that need a refined marketing site.' }),
              n('button', { label: 'Choose Studio', href: '#contact', variant: 'secondary' }),
            ]),
            n('stack', {}, [
              n('heading', { text: 'Partner', tag: 'h3' }),
              n('paragraph', { text: 'For teams that need more pages, more control, and launch support.' }),
              n('button', { label: 'Choose Partner', href: '#contact', variant: 'primary' }),
            ]),
          ]),
        ]),
      ]),
  },
  gallery: {
    name: 'Gallery',
    description: 'Image grid',
    tree: () =>
      n('section', { name: 'Gallery', presetId: 'gallery' }, [
        n('container', {}, [
          n('heading', { text: 'Selected work', tag: 'h2' }),
          n('grid', { columns: 3 }, [
            n('image', { alt: 'Gallery image 1', fit: 'cover', src: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&auto=format&fit=crop&q=80' }),
            n('image', { alt: 'Gallery image 2', fit: 'cover', src: 'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?w=800&auto=format&fit=crop&q=80' }),
            n('image', { alt: 'Gallery image 3', fit: 'cover', src: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&auto=format&fit=crop&q=80' }),
          ]),
        ]),
      ]),
  },
  faq: {
    name: 'FAQ',
    description: 'Question and answer stack',
    tree: () =>
      n('section', { name: 'FAQ', presetId: 'faq' }, [
        n('container', {}, [
          n('heading', { text: 'Frequently asked questions', tag: 'h2' }),
          n('stack', {}, [
            n('heading', { text: 'Can I edit on mobile?', tag: 'h3' }),
            n('paragraph', { text: 'Yes. Mobile styles inherit desktop unless you override them.' }),
            n('heading', { text: 'Will my current site break?', tag: 'h3' }),
            n('paragraph', { text: 'Existing templates remain valid V2 documents and upgrade safely.' }),
          ]),
        ]),
      ]),
  },
  cta: {
    name: 'CTA',
    description: 'Centered conversion band',
    tree: () =>
      n(
        'section',
        { name: 'CTA', presetId: 'cta' },
        [
          n('container', {}, [
            n('heading', { text: 'Ready to publish something you are proud of?', tag: 'h2' }),
            n('paragraph', { text: 'Start from a validated WebsiteDocument and ship with confidence.' }),
            n('button', { label: 'Start building', href: '#contact', variant: 'primary' }),
          ]),
        ],
        { background: { color: 'primary' }, color: { color: '#FFFFFF' } },
      ),
  },
  contact: {
    name: 'Contact',
    description: 'Contact prompt and action',
    tree: () =>
      n('section', { name: 'Contact', presetId: 'contact' }, [
        n('container', {}, [
          n('heading', { text: 'Let’s talk', tag: 'h2' }),
          n('paragraph', { text: 'Tell us about the brand, the launch date, and what the site needs to do.' }),
          n('button', { label: 'Send a message', href: 'mailto:hello@kdba.studio', variant: 'primary' }),
        ]),
      ]),
  },
  footer: {
    name: 'Footer',
    description: 'Brand note and utility links',
    tree: () =>
      n('section', { name: 'Footer', presetId: 'footer' }, [
        n('container', {}, [
          n('row', {}, [
            n('column', { span: 6 }, [
              n('heading', { text: 'KDBA', tag: 'h3' }),
              n('paragraph', { text: 'Structured websites for ambitious brands.' }),
            ]),
            n('column', { span: 6 }, [
              n('link', { label: 'Privacy', href: '/privacy' }),
              n('link', { label: 'Contact', href: '#contact' }),
            ]),
          ]),
          n('divider', { style: 'solid' }),
          n('text', { text: '© 2026 KDBA. All rights reserved.' }),
        ]),
      ]),
  },
};

export function isSectionPresetId(value: string): value is SectionPresetId {
  return (SECTION_PRESET_IDS as readonly string[]).includes(value);
}

export function listSectionPresets() {
  return SECTION_PRESET_IDS.map((id) => ({
    id,
    name: PRESETS[id].name,
    description: PRESETS[id].description,
  }));
}

export function buildSectionPreset(presetId: string): VisualNode {
  if (!isSectionPresetId(presetId)) {
    throw new Error(`Unknown section preset "${presetId}"`);
  }
  return cloneNodeWithNewIds(PRESETS[presetId].tree());
}

export function getSectionPresetCatalog() {
  return SECTION_PRESET_IDS.map((id) => ({
    id,
    name: PRESETS[id].name,
    description: PRESETS[id].description,
    root: buildSectionPreset(id),
  }));
}
