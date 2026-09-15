export const CMS_FIELD_TYPES = [
  'text',
  'rich-text',
  'number',
  'boolean',
  'date',
  'datetime',
  'url',
  'email',
  'image',
  'media',
  'select',
  'multi-select',
  'reference',
  'multi-reference',
] as const;

export type CmsFieldType = (typeof CMS_FIELD_TYPES)[number];

export const CMS_RECORD_STATUSES = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type CmsRecordStatusValue = (typeof CMS_RECORD_STATUSES)[number];

export const CMS_FILTER_OPS = ['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte'] as const;
export type CmsFilterOp = (typeof CMS_FILTER_OPS)[number];

export interface CollectionField {
  id: string;
  name: string;
  type: CmsFieldType;
  required?: boolean;
  unique?: boolean;
  options?: string[];
  reference?: string;
  multiple?: boolean;
  system?: boolean;
  help?: string;
}

export interface CollectionSettings {
  hasSlug: boolean;
  defaultStatus: CmsRecordStatusValue;
  publicListLimit: number;
}

export interface CmsFilter {
  field: string;
  op: CmsFilterOp;
  value: unknown;
}

export interface CmsRecordQuery {
  q?: string;
  status?: CmsRecordStatusValue;
  page: number;
  pageSize: number;
  sort: string;
  order: 'asc' | 'desc';
  filters: CmsFilter[];
  includeDeleted?: boolean;
}

export const NODE_BINDING_SOURCES = ['collection', 'record', 'business'] as const;
export type NodeBindingSource = (typeof NODE_BINDING_SOURCES)[number];

export interface NodeBinding {
  source: NodeBindingSource;
  collection?: string;
  field?: string;
  recordSlug?: string;
  fallback?: string;
}

export type PageKind = 'static' | 'collection-index' | 'collection-item';

export interface PageCollectionRef {
  slug: string;
  itemParam?: 'slug';
}

export const BUILTIN_COLLECTION_SLUGS = [
  'blog-posts',
  'services',
  'team',
  'testimonials',
  'faq',
  'projects',
] as const;

export const OPTIONAL_COLLECTION_SLUGS = ['products', 'events', 'locations'] as const;
