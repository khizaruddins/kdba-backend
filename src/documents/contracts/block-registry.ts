import { BadRequestException } from '@nestjs/common';
import { isAllowedChild, isLeafNode } from './component-registry';
import { NodeType, WebsiteNode } from '../types/document.types';
import { CONTACT_FORM_VARIANTS } from './form-fields';
import { visualNodeToWebsiteNode } from '../services/preset-to-v3';
import { buildSectionPreset, isSectionPresetId } from '../presets/section-presets';
import { BLOCK_TREES } from '../presets/block-trees';

export const BLOCK_CATEGORIES = [
  'layout',
  'hero',
  'navigation',
  'content',
  'features',
  'services',
  'business',
  'testimonials',
  'pricing',
  'gallery',
  'faq',
  'forms',
  'contact',
  'cta',
  'footer',
  'media',
  'social',
] as const;

export type BlockCategory = (typeof BLOCK_CATEGORIES)[number];

export interface BlockDefinition {
  id: string;
  name: string;
  category: BlockCategory;
  description: string;
  icon: string;
  tags: string[];
  preview?: string;
  allowedParents: NodeType[];
  variant?: string;
  version: number;
  createDocumentTree: () => WebsiteNode;
}

export const SECTION_PARENTS: NodeType[] = [
  'page-root',
  'section',
  'container',
  'column',
  'stack',
  'grid',
  'card',
];

const SECTION_BLOCKS: Array<Omit<BlockDefinition, 'createDocumentTree' | 'allowedParents' | 'version'> & { tree: string }> = [
  { id: 'layout-section', name: 'Blank section', category: 'layout', description: 'Empty section ready for content', icon: 'layout', tags: ['layout'], tree: 'layout-section' },
  { id: 'layout-stack', name: 'Stack section', category: 'layout', description: 'Vertical stack starter', icon: 'rows', tags: ['layout'], tree: 'layout-stack' },
  { id: 'layout-two-column', name: 'Two columns', category: 'layout', description: 'Row with two editable columns', icon: 'columns', tags: ['layout'], tree: 'layout-two-column' },
  { id: 'layout-three-column', name: 'Three columns', category: 'layout', description: 'Three-column grid starter', icon: 'grid', tags: ['layout'], tree: 'layout-three-column' },
  { id: 'hero-centered', name: 'Centered hero', category: 'hero', description: 'Centered headline, copy, and CTA', icon: 'sparkles', tags: ['hero'], variant: 'centered', tree: 'hero-centered' },
  { id: 'hero-split', name: 'Split hero', category: 'hero', description: 'Copy and image in two columns', icon: 'split', tags: ['hero'], variant: 'split', tree: 'hero-split' },
  { id: 'hero-image-left', name: 'Image-left hero', category: 'hero', description: 'Image on the left, copy on the right', icon: 'image', tags: ['hero'], variant: 'image-left', tree: 'hero-image-left' },
  { id: 'hero-image-right', name: 'Image-right hero', category: 'hero', description: 'Copy on the left, image on the right', icon: 'image', tags: ['hero'], variant: 'image-right', tree: 'hero-image-right' },
  { id: 'hero-minimal', name: 'Minimal hero', category: 'hero', description: 'Quiet headline and a single action', icon: 'minus', tags: ['hero'], variant: 'minimal', tree: 'hero-minimal' },
  { id: 'about-split', name: 'About', category: 'content', description: 'Story and supporting image', icon: 'user', tags: ['about', 'content'], tree: 'about-split' },
  { id: 'features-three-column', name: 'Three-column features', category: 'features', description: 'Three feature cards', icon: 'layout-grid', tags: ['features'], variant: 'three-column', tree: 'features-three-column' },
  { id: 'features-four-column', name: 'Four-column features', category: 'features', description: 'Four feature cards', icon: 'layout-grid', tags: ['features'], variant: 'four-column', tree: 'features-four-column' },
  { id: 'features-icon-grid', name: 'Icon grid', category: 'features', description: 'Icon-led feature grid', icon: 'shapes', tags: ['features'], variant: 'icon-grid', tree: 'features-icon-grid' },
  { id: 'features-bento', name: 'Bento features', category: 'features', description: 'Uneven bento feature board', icon: 'layout-dashboard', tags: ['features'], variant: 'bento', tree: 'features-bento' },
  { id: 'features-alternating', name: 'Alternating features', category: 'features', description: 'Image and copy that swap sides', icon: 'arrow-left-right', tags: ['features'], variant: 'alternating', tree: 'features-alternating' },
  { id: 'services-cards', name: 'Service cards', category: 'services', description: 'Service offerings as cards', icon: 'briefcase', tags: ['services'], variant: 'cards', tree: 'services-cards' },
  { id: 'services-list', name: 'Service list', category: 'services', description: 'Stacked service list', icon: 'list', tags: ['services'], variant: 'list', tree: 'services-list' },
  { id: 'services-split', name: 'Split services', category: 'services', description: 'Intro copy with a service stack', icon: 'split', tags: ['services'], variant: 'split', tree: 'services-split' },
  { id: 'testimonials-quote', name: 'Quote', category: 'testimonials', description: 'Single featured quote', icon: 'quote', tags: ['testimonials'], variant: 'quote', tree: 'testimonials-quote' },
  { id: 'testimonials-cards', name: 'Testimonial cards', category: 'testimonials', description: 'Two testimonial cards', icon: 'messages-square', tags: ['testimonials'], variant: 'cards', tree: 'testimonials-cards' },
  { id: 'testimonials-grid', name: 'Testimonial grid', category: 'testimonials', description: 'Three-up testimonial grid', icon: 'grid', tags: ['testimonials'], variant: 'grid', tree: 'testimonials-grid' },
  { id: 'pricing-three-column', name: 'Three-column pricing', category: 'pricing', description: 'Three pricing plans', icon: 'badge-dollar-sign', tags: ['pricing'], variant: 'three-column', tree: 'pricing-three-column' },
  { id: 'pricing-highlighted-plan', name: 'Highlighted plan', category: 'pricing', description: 'Plans with one featured tier', icon: 'star', tags: ['pricing'], variant: 'highlighted-plan', tree: 'pricing-highlighted-plan' },
  { id: 'pricing-comparison', name: 'Pricing comparison', category: 'pricing', description: 'Side-by-side plan comparison', icon: 'table', tags: ['pricing'], variant: 'comparison', tree: 'pricing-comparison' },
  { id: 'gallery-grid', name: 'Gallery grid', category: 'gallery', description: 'Even image grid', icon: 'images', tags: ['gallery'], variant: 'grid', tree: 'gallery-grid' },
  { id: 'gallery-masonry', name: 'Masonry gallery', category: 'gallery', description: 'Dense image gallery', icon: 'layout', tags: ['gallery', 'media'], variant: 'masonry', tree: 'gallery-masonry' },
  { id: 'gallery-featured', name: 'Featured gallery', category: 'gallery', description: 'Hero image with supporting thumbs', icon: 'image', tags: ['gallery'], variant: 'featured', tree: 'gallery-featured' },
  { id: 'media-featured', name: 'Featured media', category: 'media', description: 'Single featured image block', icon: 'image', tags: ['media'], tree: 'media-featured' },
  { id: 'faq-accordion', name: 'FAQ accordion', category: 'faq', description: 'Collapsible questions', icon: 'help-circle', tags: ['faq'], variant: 'accordion', tree: 'faq-accordion' },
  { id: 'faq-two-column', name: 'Two-column FAQ', category: 'faq', description: 'Questions in two columns', icon: 'columns', tags: ['faq'], variant: 'two-column', tree: 'faq-two-column' },
  { id: 'cta-centered', name: 'Centered CTA', category: 'cta', description: 'Centered conversion band', icon: 'megaphone', tags: ['cta'], variant: 'centered', tree: 'cta-centered' },
  { id: 'cta-split', name: 'Split CTA', category: 'cta', description: 'Copy and action in two columns', icon: 'split', tags: ['cta'], variant: 'split', tree: 'cta-split' },
  { id: 'cta-minimal', name: 'Minimal CTA', category: 'cta', description: 'Short call to action', icon: 'minus', tags: ['cta'], variant: 'minimal', tree: 'cta-minimal' },
  { id: 'footer-simple', name: 'Simple footer', category: 'footer', description: 'Compact footer bar', icon: 'panel-bottom', tags: ['footer'], variant: 'simple', tree: 'footer-simple' },
  { id: 'footer-multi-column', name: 'Multi-column footer', category: 'footer', description: 'Brand, links, and social columns', icon: 'columns', tags: ['footer'], variant: 'multi-column', tree: 'footer-multi-column' },
  { id: 'footer-centered', name: 'Centered footer', category: 'footer', description: 'Centered brand footer', icon: 'panel-bottom', tags: ['footer'], variant: 'centered', tree: 'footer-centered' },
  { id: 'nav-simple', name: 'Simple navigation', category: 'navigation', description: 'Brand and utility links', icon: 'menu', tags: ['navigation'], tree: 'nav-simple' },
  { id: 'social-links', name: 'Social links', category: 'social', description: 'Row of social destinations', icon: 'share-2', tags: ['social'], tree: 'social-links' },
  ...CONTACT_FORM_VARIANTS.map((variant) => {
    const id = variant === 'contact-info' ? 'contact-info' : `contact-${variant}`;
    return {
      id,
      name: `Contact (${variant})`,
      category: 'contact' as const,
      description: `Contact layout: ${variant}. Shares the same lead form.`,
      icon: 'mail',
      tags: ['contact', 'forms', variant],
      variant,
      tree: id,
    };
  }),
];

export const LEGACY_PRESET_ALIASES: Record<string, string> = {
  hero: 'hero-split',
  about: 'about-split',
  features: 'features-three-column',
  services: 'services-cards',
  testimonials: 'testimonials-cards',
  pricing: 'pricing-three-column',
  gallery: 'gallery-grid',
  faq: 'faq-accordion',
  cta: 'cta-centered',
  contact: 'contact-simple',
  footer: 'footer-multi-column',
};

function unlockSubtree(node: WebsiteNode): WebsiteNode {
  delete node.locked;
  if (node.children) {
    for (const child of node.children) unlockSubtree(child);
  }
  return node;
}

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = Object.fromEntries(
  SECTION_BLOCKS.map((block) => {
    const treeId = block.tree;
    const definition: BlockDefinition = {
      id: block.id,
      name: block.name,
      category: block.category,
      description: block.description,
      icon: block.icon,
      tags: block.tags,
      allowedParents: SECTION_PARENTS,
      variant: block.variant,
      version: 1,
      createDocumentTree: () => {
        const factory = BLOCK_TREES[treeId];
        if (!factory) {
          throw new Error(`Missing block tree for "${treeId}"`);
        }
        return unlockSubtree(factory());
      },
    };
    return [block.id, definition];
  }),
);

export function resolveBlockId(id: string): string {
  return LEGACY_PRESET_ALIASES[id] || id;
}

export function isKnownBlockId(id: string): boolean {
  const resolved = resolveBlockId(id);
  return Boolean(BLOCK_REGISTRY[resolved]) || isSectionPresetId(id);
}

export function getBlockDefinition(id: string): BlockDefinition | undefined {
  return BLOCK_REGISTRY[resolveBlockId(id)];
}

export function listBlocks(category?: string) {
  return Object.values(BLOCK_REGISTRY)
    .filter((block) => !category || block.category === category)
    .map((block) => ({
      id: block.id,
      name: block.name,
      category: block.category,
      description: block.description,
      icon: block.icon,
      tags: block.tags,
      preview: block.preview,
      allowedParents: block.allowedParents,
      variant: block.variant,
      version: block.version,
    }));
}

export function listBlockCategories() {
  return BLOCK_CATEGORIES.map((id) => ({
    id,
    count: Object.values(BLOCK_REGISTRY).filter((block) => block.category === id).length,
  }));
}

function walk(node: WebsiteNode, visit: (node: WebsiteNode, parent: WebsiteNode | null) => void, parent: WebsiteNode | null = null) {
  visit(node, parent);
  for (const child of node.children || []) walk(child, visit, node);
}

export function assertBlockTree(block: BlockDefinition, tree: WebsiteNode): void {
  if (tree.locked) {
    throw new Error(`Block "${block.id}" must not create a locked root`);
  }
  if (!block.allowedParents.length) {
    throw new Error(`Block "${block.id}" must declare allowed parents`);
  }

  const ids = new Set<string>();
  walk(tree, (node, parent) => {
    if (!node.id || ids.has(node.id)) {
      throw new Error(`Block "${block.id}" produced a missing or duplicate node id`);
    }
    ids.add(node.id);
    if (node.locked) {
      throw new Error(`Block "${block.id}" must not lock node "${node.id}"`);
    }
    if (parent && !isAllowedChild(parent.type, node.type)) {
      throw new Error(`Block "${block.id}" nests "${node.type}" inside "${parent.type}"`);
    }
    if (isLeafNode(node.type) && node.children?.length) {
      throw new Error(`Block "${block.id}" gave leaf "${node.type}" children`);
    }
  });
}

export function assertBlockRegistry(): void {
  for (const block of Object.values(BLOCK_REGISTRY)) {
    assertBlockTree(block, block.createDocumentTree());
  }
}

export function buildBlockTree(blockId: string): WebsiteNode {
  const resolved = resolveBlockId(blockId);
  const definition = BLOCK_REGISTRY[resolved];
  if (definition) {
    const tree = definition.createDocumentTree();
    assertBlockTree(definition, tree);
    return tree;
  }

  if (isSectionPresetId(blockId)) {
    return unlockSubtree(visualNodeToWebsiteNode(buildSectionPreset(blockId)));
  }

  throw new BadRequestException(`Unknown block "${blockId}"`);
}

export function getBlockCatalog(options: { includeTrees?: boolean } = {}) {
  return listBlocks().map((block) =>
    options.includeTrees
      ? { ...block, tree: buildBlockTree(block.id) }
      : block,
  );
}
