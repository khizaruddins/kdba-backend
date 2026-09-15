import { CollectionField, CollectionSettings } from './cms.types';

function field(
  id: string,
  name: string,
  type: CollectionField['type'],
  extra: Partial<CollectionField> = {},
): CollectionField {
  return { id, name, type, ...extra };
}

export interface CollectionPreset {
  key: string;
  name: string;
  slug: string;
  description: string;
  seed: boolean;
  fields: CollectionField[];
  settings: CollectionSettings;
}

const DEFAULT_SETTINGS: CollectionSettings = {
  hasSlug: true,
  defaultStatus: 'DRAFT',
  publicListLimit: 50,
};

export const CMS_PRESETS: CollectionPreset[] = [
  {
    key: 'blog-posts',
    name: 'Blog Posts',
    slug: 'blog-posts',
    description: 'Articles and updates for the website blog',
    seed: true,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('title', 'Title', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('excerpt', 'Excerpt', 'text'),
      field('body', 'Body', 'rich-text', { required: true }),
      field('coverImage', 'Cover image', 'image'),
      field('author', 'Author', 'text'),
      field('publishedAt', 'Publish date', 'datetime'),
      field('tags', 'Tags', 'multi-select', {
        options: ['news', 'guide', 'announcement', 'case-study'],
      }),
      field('featured', 'Featured', 'boolean'),
    ],
  },
  {
    key: 'services',
    name: 'Services',
    slug: 'services',
    description: 'Offerings displayed on service pages and listings',
    seed: true,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('title', 'Title', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('description', 'Description', 'rich-text'),
      field('image', 'Image', 'image'),
      field('price', 'Price', 'number'),
      field('featured', 'Featured', 'boolean'),
      field('order', 'Order', 'number'),
    ],
  },
  {
    key: 'team',
    name: 'Team',
    slug: 'team',
    description: 'People who represent the business',
    seed: true,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('name', 'Name', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('role', 'Role', 'text'),
      field('bio', 'Bio', 'rich-text'),
      field('photo', 'Photo', 'image'),
      field('email', 'Email', 'email'),
      field('order', 'Order', 'number'),
    ],
  },
  {
    key: 'testimonials',
    name: 'Testimonials',
    slug: 'testimonials',
    description: 'Customer quotes and reviews',
    seed: true,
    settings: { hasSlug: false, defaultStatus: 'PUBLISHED', publicListLimit: 50 },
    fields: [
      field('quote', 'Quote', 'text', { required: true, system: true }),
      field('authorName', 'Author name', 'text', { required: true }),
      field('authorTitle', 'Author title', 'text'),
      field('avatar', 'Avatar', 'image'),
      field('rating', 'Rating', 'number'),
      field('featured', 'Featured', 'boolean'),
      field('order', 'Order', 'number'),
    ],
  },
  {
    key: 'faq',
    name: 'FAQ',
    slug: 'faq',
    description: 'Frequently asked questions',
    seed: true,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('question', 'Question', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { unique: true, system: true }),
      field('answer', 'Answer', 'rich-text', { required: true }),
      field('category', 'Category', 'select', {
        options: ['general', 'pricing', 'support', 'product'],
      }),
      field('order', 'Order', 'number'),
    ],
  },
  {
    key: 'projects',
    name: 'Projects',
    slug: 'projects',
    description: 'Portfolio work and case studies',
    seed: true,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('title', 'Title', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('summary', 'Summary', 'text'),
      field('body', 'Body', 'rich-text'),
      field('coverImage', 'Cover image', 'image'),
      field('gallery', 'Gallery', 'media', { multiple: true }),
      field('client', 'Client', 'text'),
      field('year', 'Year', 'text'),
      field('featured', 'Featured', 'boolean'),
      field('relatedServices', 'Related services', 'multi-reference', { reference: 'services' }),
    ],
  },
  {
    key: 'products',
    name: 'Products',
    slug: 'products',
    description: 'Content products managed in CMS (separate from the catalog Product table)',
    seed: false,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('title', 'Title', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('description', 'Description', 'rich-text'),
      field('image', 'Image', 'image'),
      field('price', 'Price', 'number'),
      field('featured', 'Featured', 'boolean'),
    ],
  },
  {
    key: 'events',
    name: 'Events',
    slug: 'events',
    description: 'Upcoming events and appearances',
    seed: false,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('title', 'Title', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('description', 'Description', 'rich-text'),
      field('startAt', 'Starts', 'datetime', { required: true }),
      field('endAt', 'Ends', 'datetime'),
      field('location', 'Location', 'text'),
      field('image', 'Image', 'image'),
    ],
  },
  {
    key: 'locations',
    name: 'Locations',
    slug: 'locations',
    description: 'Physical locations beyond the primary business address',
    seed: false,
    settings: DEFAULT_SETTINGS,
    fields: [
      field('name', 'Name', 'text', { required: true, system: true }),
      field('slug', 'Slug', 'text', { required: true, unique: true, system: true }),
      field('address', 'Address', 'text'),
      field('city', 'City', 'text'),
      field('phone', 'Phone', 'text'),
      field('hours', 'Hours', 'text'),
    ],
  },
];

export function getCollectionPreset(key: string): CollectionPreset | undefined {
  return CMS_PRESETS.find((preset) => preset.key === key || preset.slug === key);
}

export function listSeedPresets(): CollectionPreset[] {
  return CMS_PRESETS.filter((preset) => preset.seed);
}
