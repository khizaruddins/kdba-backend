import { BadRequestException, ConflictException } from '@nestjs/common';
import { z } from 'zod';
import { isSafeUrl, containsDangerousPayload, stripHtml } from '../documents/security/document-security';
import { sanitizeRichTextBlocks } from '../documents/services/rich-text';
import { CMS_LIMITS } from './cms.constants';
import {
  CMS_FIELD_TYPES,
  CMS_FILTER_OPS,
  CMS_RECORD_STATUSES,
  CollectionField,
  CollectionSettings,
  CmsFieldType,
  CmsFilter,
  CmsFilterOp,
  CmsRecordStatusValue,
} from './cms.types';
import { assertCmsSlug, normalizeCmsSlug } from './cms-slug';

const fieldId = z
  .string()
  .regex(/^[a-z][a-zA-Z0-9_-]{0,47}$/, 'Field id must start with a letter and use letters, numbers, underscores, or dashes');

export const CollectionFieldSchema = z
  .object({
    id: fieldId,
    name: z.string().trim().min(1).max(80),
    type: z.enum(CMS_FIELD_TYPES),
    required: z.boolean().optional(),
    unique: z.boolean().optional(),
    options: z.array(z.string().trim().min(1).max(80)).max(50).optional(),
    reference: z
      .string()
      .regex(/^[a-z][a-z0-9-]{0,63}$/)
      .optional(),
    multiple: z.boolean().optional(),
    system: z.boolean().optional(),
    help: z.string().trim().max(200).optional(),
  })
  .strict();

export const CollectionSettingsSchema: z.ZodType<CollectionSettings, z.ZodTypeDef, any> = z
  .object({
    hasSlug: z.boolean().default(true),
    defaultStatus: z.enum(CMS_RECORD_STATUSES).default('DRAFT'),
    publicListLimit: z.number().int().min(1).max(100).default(50),
  })
  .strict();

export const NodeBindingSchema = z
  .object({
    source: z.enum(['collection', 'record', 'business']),
    collection: z
      .string()
      .regex(/^[a-z][a-z0-9-]{0,63}$/)
      .optional(),
    field: z
      .string()
      .regex(/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/)
      .optional(),
    recordSlug: z
      .string()
      .regex(/^[a-z0-9-]{1,80}$/)
      .optional(),
    fallback: z.string().max(500).optional(),
  })
  .strict()
  .superRefine((binding, ctx) => {
    if (binding.source === 'collection' || binding.source === 'record') {
      if (!binding.collection) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['collection'],
          message: 'collection slug is required for collection and record bindings',
        });
      }
    }
    if (binding.fallback && containsDangerousPayload(binding.fallback)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['fallback'],
        message: 'Unsafe fallback text',
      });
    }
  });

export const PageCollectionRefSchema = z
  .object({
    slug: z.string().regex(/^[a-z][a-z0-9-]{0,63}$/),
    itemParam: z.literal('slug').optional(),
  })
  .strict();

export const BusinessLocationSchema = z
  .object({
    id: z.string().trim().max(100).optional(),
    name: z.string().trim().min(1).max(200),
    address: z.string().trim().max(300).optional(),
    city: z.string().trim().max(100).optional(),
    phone: z.string().trim().max(50).optional(),
    email: z.string().email().max(200).optional().or(z.literal('')),
    hours: z.string().trim().max(200).optional(),
  })
  .strict();

export function parseCollectionFields(input: unknown): CollectionField[] {
  if (!Array.isArray(input)) {
    throw cmsError('INVALID_FIELDS', 'Collection fields must be an array');
  }
  if (input.length === 0) {
    throw cmsError('INVALID_FIELDS', 'A collection must define at least one field');
  }
  if (input.length > CMS_LIMITS.maxFieldsPerCollection) {
    throw cmsError(
      'INVALID_FIELDS',
      `A collection may have at most ${CMS_LIMITS.maxFieldsPerCollection} fields`,
    );
  }
  const parsed = input.map((field, index) => {
    const result = CollectionFieldSchema.safeParse(field);
    if (!result.success) {
      throw cmsError(
        'INVALID_FIELDS',
        `Invalid field at index ${index}: ${result.error.issues[0]?.message || 'invalid'}`,
        { issues: result.error.issues },
      );
    }
    const value = result.data;
    if ((value.type === 'select' || value.type === 'multi-select') && !value.options?.length) {
      throw cmsError('INVALID_FIELDS', `Field "${value.id}" requires options`);
    }
    if (
      (value.type === 'reference' || value.type === 'multi-reference') &&
      !value.reference
    ) {
      throw cmsError('INVALID_FIELDS', `Field "${value.id}" requires a reference collection slug`);
    }
    if (value.type !== 'media' && value.multiple) {
      throw cmsError('INVALID_FIELDS', `Field "${value.id}" cannot set multiple unless type is media`);
    }
    return value;
  });
  const ids = new Set<string>();
  for (const field of parsed) {
    if (ids.has(field.id)) {
      throw cmsError('INVALID_FIELDS', `Duplicate field id "${field.id}"`);
    }
    ids.add(field.id);
  }
  return parsed;
}

export function parseCollectionSettings(input: unknown): CollectionSettings {
  const result = CollectionSettingsSchema.safeParse(input ?? {});
  if (!result.success) {
    throw cmsError('INVALID_SETTINGS', 'Invalid collection settings');
  }
  return result.data;
}

export function parseLocations(input: unknown) {
  if (input == null) return undefined;
  const result = z.array(BusinessLocationSchema).max(50).safeParse(input);
  if (!result.success) {
    throw cmsError('INVALID_LOCATIONS', 'Invalid business locations');
  }
  return result.data;
}

export function parseStatus(value: unknown): CmsRecordStatusValue {
  if (typeof value !== 'string' || !CMS_RECORD_STATUSES.includes(value as CmsRecordStatusValue)) {
    throw cmsError('INVALID_STATUS', 'Status must be DRAFT, PUBLISHED, or ARCHIVED');
  }
  return value as CmsRecordStatusValue;
}

export interface RecordValidationContext {
  currentRecordId?: string;
  existingSlugs: Set<string>;
  uniqueValueExists: (fieldId: string, value: unknown) => Promise<boolean>;
  mediaOwned: (mediaId: string) => Promise<boolean>;
  recordInCollection: (
    collectionSlug: string,
    recordId: string,
  ) => Promise<{ id: string } | null>;
}

export async function validateRecordData(
  fields: CollectionField[],
  rawData: unknown,
  settings: CollectionSettings,
  ctx: RecordValidationContext,
): Promise<{ data: Record<string, unknown>; slug: string | null }> {
  if (!rawData || typeof rawData !== 'object' || Array.isArray(rawData)) {
    throw cmsError('INVALID_RECORD', 'Record data must be an object');
  }
  const incoming = rawData as Record<string, unknown>;
  stripUnsafeKeys(incoming);
  const payloadSize = Buffer.byteLength(JSON.stringify(incoming), 'utf8');
  if (payloadSize > CMS_LIMITS.maxRecordJsonBytes) {
    throw cmsError('INVALID_RECORD', 'Record data is too large');
  }

  const known = new Set(fields.map((field) => field.id));
  for (const key of Object.keys(incoming)) {
    if (!known.has(key)) {
      throw cmsError('INVALID_RECORD', `Unknown field "${key}"`);
    }
  }

  const data: Record<string, unknown> = {};
  for (const field of fields) {
    const value = incoming[field.id];
    if (value === undefined || value === null || value === '') {
      if (field.required && field.id !== 'slug') {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" is required`);
      }
      continue;
    }
    data[field.id] = await coerceFieldValue(field, value, ctx);
    if (field.unique && field.id !== 'slug') {
      const taken = await ctx.uniqueValueExists(field.id, data[field.id]);
      if (taken) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" must be unique`);
      }
    }
  }

  let slug: string | null = null;
  if (settings.hasSlug) {
    const fromData = typeof data.slug === 'string' ? data.slug : undefined;
    const fromTitle =
      typeof data.title === 'string'
        ? data.title
        : typeof data.name === 'string'
          ? data.name
          : typeof data.question === 'string'
            ? data.question
            : '';
    const source = fromData || fromTitle;
    if (!source) {
      throw cmsError('INVALID_SLUG', 'A slug or title is required');
    }
    slug = assertCmsSlug(source);
    if (ctx.existingSlugs.has(slug)) {
      throw cmsError('SLUG_COLLISION', `Slug "${slug}" is already in use`, {
        suggestion: `${slug}-2`,
      });
    }
    data.slug = slug;
  } else if (typeof data.slug === 'string' && data.slug.trim()) {
    slug = assertCmsSlug(data.slug);
    if (ctx.existingSlugs.has(slug)) {
      throw cmsError('SLUG_COLLISION', `Slug "${slug}" is already in use`);
    }
    data.slug = slug;
  }

  return { data, slug };
}

async function coerceFieldValue(
  field: CollectionField,
  value: unknown,
  ctx: RecordValidationContext,
): Promise<unknown> {
  switch (field.type) {
    case 'text':
      return asSafeText(value, field.name, CMS_LIMITS.maxTextChars);
    case 'rich-text':
      return sanitizeRichTextBlocks(value);
    case 'number': {
      const num = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(num) || Math.abs(num) > 1e12) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" must be a finite number`);
      }
      return num;
    }
    case 'boolean':
      if (typeof value !== 'boolean') {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" must be a boolean`);
      }
      return value;
    case 'date':
      return asDate(value, field.name, false);
    case 'datetime':
      return asDate(value, field.name, true);
    case 'url': {
      const url = asSafeText(value, field.name, 2000);
      if (!isSafeUrl(url) || url.toLowerCase().startsWith('javascript:')) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" must be a safe URL`);
      }
      return url;
    }
    case 'email': {
      const email = asSafeText(value, field.name, 200).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" must be a valid email`);
      }
      return email;
    }
    case 'image':
      return asMediaId(value, field.name, ctx);
    case 'media':
      if (field.multiple) {
        if (!Array.isArray(value)) {
          throw cmsError('INVALID_RECORD', `Field "${field.name}" must be an array of media ids`);
        }
        if (value.length > 30) {
          throw cmsError('INVALID_RECORD', `Field "${field.name}" exceeds gallery size`);
        }
        const ids: string[] = [];
        for (const item of value) {
          ids.push(await asMediaId(item, field.name, ctx));
        }
        return ids;
      }
      return asMediaId(value, field.name, ctx);
    case 'select': {
      const option = asSafeText(value, field.name, 80);
      if (!field.options?.includes(option)) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" has an invalid option`);
      }
      return option;
    }
    case 'multi-select': {
      if (!Array.isArray(value)) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" must be an array`);
      }
      if (value.length > 20) {
        throw cmsError('INVALID_RECORD', `Field "${field.name}" has too many values`);
      }
      return value.map((item) => {
        const option = asSafeText(item, field.name, 80);
        if (!field.options?.includes(option)) {
          throw cmsError('INVALID_RECORD', `Field "${field.name}" has an invalid option`);
        }
        return option;
      });
    }
    case 'reference':
      return asReference(value, field, ctx, false);
    case 'multi-reference':
      return asReference(value, field, ctx, true);
    default:
      throw cmsError('INVALID_FIELDS', `Unsupported field type "${field.type as string}"`);
  }
}

async function asMediaId(
  value: unknown,
  name: string,
  ctx: RecordValidationContext,
): Promise<string> {
  if (typeof value !== 'string' || !value.trim()) {
    throw cmsError('INVALID_MEDIA_REF', `Field "${name}" must be a media id`);
  }
  const id = value.trim();
  if (id.includes('://') || id.includes('/') || containsDangerousPayload(id)) {
    throw cmsError('INVALID_MEDIA_REF', `Field "${name}" must be a tenant media id, not a URL`);
  }
  if (!(await ctx.mediaOwned(id))) {
    throw cmsError('INVALID_MEDIA_REF', `Media "${id}" is not owned by this tenant`);
  }
  return id;
}

async function asReference(
  value: unknown,
  field: CollectionField,
  ctx: RecordValidationContext,
  multiple: boolean,
): Promise<string | string[]> {
  const ids = multiple
    ? Array.isArray(value)
      ? value
      : null
    : [value];
  if (!ids) {
    throw cmsError('INVALID_REFERENCE', `Field "${field.name}" must be an array of record ids`);
  }
  if (ids.length > CMS_LIMITS.maxReferences) {
    throw cmsError('INVALID_REFERENCE', `Field "${field.name}" has too many references`);
  }
  const resolved: string[] = [];
  for (const item of ids) {
    if (typeof item !== 'string' || !item.trim()) {
      throw cmsError('INVALID_REFERENCE', `Field "${field.name}" contains an invalid record id`);
    }
    const id = item.trim();
    if (ctx.currentRecordId && id === ctx.currentRecordId) {
      throw cmsError('CIRCULAR_REFERENCE', `Field "${field.name}" cannot reference its own record`);
    }
    const found = await ctx.recordInCollection(field.reference!, id);
    if (!found) {
      throw cmsError(
        'INVALID_REFERENCE',
        `Field "${field.name}" references a missing or out-of-collection record`,
      );
    }
    if (!resolved.includes(id)) resolved.push(id);
  }
  return multiple ? resolved : resolved[0];
}

function asSafeText(value: unknown, name: string, max: number): string {
  if (typeof value === 'number' && Number.isFinite(value)) {
    value = String(value);
  }
  if (typeof value !== 'string') {
    throw cmsError('INVALID_RECORD', `Field "${name}" must be text`);
  }
  const stripped = stripHtml(value).trim();
  if (stripped.length > max) {
    throw cmsError('INVALID_RECORD', `Field "${name}" exceeds ${max} characters`);
  }
  if (containsDangerousPayload(stripped)) {
    throw cmsError('INVALID_RECORD', `Field "${name}" contains unsafe content`);
  }
  return stripped;
}

function asDate(value: unknown, name: string, withTime: boolean): string {
  if (typeof value !== 'string') {
    throw cmsError('INVALID_RECORD', `Field "${name}" must be a date string`);
  }
  const trimmed = value.trim();
  const ok = withTime
    ? !Number.isNaN(Date.parse(trimmed))
    : /^\d{4}-\d{2}-\d{2}$/.test(trimmed) && !Number.isNaN(Date.parse(trimmed));
  if (!ok) {
    throw cmsError('INVALID_RECORD', `Field "${name}" must be a valid ${withTime ? 'datetime' : 'date'}`);
  }
  return trimmed;
}

export function parseFilters(raw?: string): CmsFilter[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw cmsError('INVALID_QUERY', 'filters must be valid JSON');
  }
  if (!Array.isArray(parsed)) {
    throw cmsError('INVALID_QUERY', 'filters must be an array');
  }
  if (parsed.length > CMS_LIMITS.maxFilters) {
    throw cmsError('INVALID_QUERY', `A query may include at most ${CMS_LIMITS.maxFilters} filters`);
  }
  return parsed.map((item, index) => {
    if (!item || typeof item !== 'object') {
      throw cmsError('INVALID_QUERY', `Invalid filter at index ${index}`);
    }
    const rec = item as Record<string, unknown>;
    if (typeof rec.field !== 'string' || !/^[a-zA-Z][a-zA-Z0-9_-]{0,47}$/.test(rec.field)) {
      throw cmsError('INVALID_QUERY', `Invalid filter field at index ${index}`);
    }
    if (typeof rec.op !== 'string' || !CMS_FILTER_OPS.includes(rec.op as CmsFilterOp)) {
      throw cmsError('INVALID_QUERY', `Invalid filter operator at index ${index}`);
    }
    return { field: rec.field, op: rec.op as CmsFilterOp, value: rec.value };
  });
}

export function assertFilterAllowed(
  filter: CmsFilter,
  fields: CollectionField[],
): void {
  if (['status', 'slug', 'createdAt', 'updatedAt', 'sortOrder'].includes(filter.field)) {
    return;
  }
  const field = fields.find((item) => item.id === filter.field);
  if (!field) {
    throw cmsError('INVALID_QUERY', `Cannot filter on unknown field "${filter.field}"`);
  }
  const allowed = allowedOps(field.type);
  if (!allowed.includes(filter.op)) {
    throw cmsError(
      'INVALID_QUERY',
      `Operator "${filter.op}" is not allowed on field "${filter.field}"`,
    );
  }
}

function allowedOps(type: CmsFieldType): CmsFilterOp[] {
  switch (type) {
    case 'text':
    case 'email':
    case 'url':
    case 'select':
      return ['eq', 'neq', 'contains'];
    case 'number':
    case 'date':
    case 'datetime':
      return ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'];
    case 'boolean':
      return ['eq', 'neq'];
    default:
      return ['eq'];
  }
}

export function titleFieldValue(data: Record<string, unknown>): string {
  for (const key of ['title', 'name', 'question', 'quote']) {
    if (typeof data[key] === 'string' && data[key]) return data[key] as string;
  }
  return '';
}

export function parseCollectionFieldsFromJson(value: unknown): CollectionField[] {
  return parseCollectionFields(value);
}

export function parseCollectionSettingsFromJson(value: unknown): CollectionSettings {
  return parseCollectionSettings(value);
}

function stripUnsafeKeys(value: Record<string, unknown>): void {
  for (const key of Object.keys(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      delete value[key];
    }
  }
}

export function cmsError(code: string, message: string, extra?: Record<string, unknown>): never {
  if (code === 'SLUG_COLLISION') {
    throw new ConflictException({ code, message, ...extra });
  }
  throw new BadRequestException({ code, message, ...extra });
}

export { normalizeCmsSlug };
