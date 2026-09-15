import { Prisma } from '@prisma/client';
import { CollectionField, CmsFilter, CmsRecordQuery } from './cms.types';
import { assertFilterAllowed } from './cms-validation';

const COLUMN_SORTS = new Set(['sortOrder', 'createdAt', 'updatedAt', 'slug', 'status']);

export function buildRecordWhere(
  collectionId: string,
  tenantId: string,
  websiteId: string,
  fields: CollectionField[],
  query: CmsRecordQuery,
  publishedOnly = false,
): Prisma.CmsRecordWhereInput {
  const where: Prisma.CmsRecordWhereInput = {
    collectionId,
    tenantId,
    websiteId,
    deletedAt: query.includeDeleted ? undefined : null,
  };

  if (publishedOnly) {
    where.status = 'PUBLISHED';
  } else if (query.status) {
    where.status = query.status;
  }

  const and: Prisma.CmsRecordWhereInput[] = [];

  if (query.q?.trim()) {
    const q = query.q.trim().slice(0, 200);
    const or: Prisma.CmsRecordWhereInput[] = [{ slug: { contains: q, mode: 'insensitive' } }];
    for (const field of fields) {
      if (field.type === 'text' || field.type === 'email' || field.type === 'url') {
        or.push({
          data: {
            path: [field.id],
            string_contains: q,
          },
        });
      }
    }
    and.push({ OR: or });
  }

  for (const filter of query.filters) {
    assertFilterAllowed(filter, fields);
    and.push(filterToWhere(filter));
  }

  if (and.length) {
    where.AND = and;
  }

  return where;
}

function filterToWhere(filter: CmsFilter): Prisma.CmsRecordWhereInput {
  if (filter.field === 'status' && typeof filter.value === 'string') {
    if (filter.op === 'eq') return { status: filter.value as never };
    if (filter.op === 'neq') return { NOT: { status: filter.value as never } };
  }
  if (filter.field === 'slug' && typeof filter.value === 'string') {
    if (filter.op === 'eq') return { slug: filter.value };
    if (filter.op === 'contains') return { slug: { contains: filter.value, mode: 'insensitive' } };
    if (filter.op === 'neq') return { NOT: { slug: filter.value } };
  }
  if (filter.field === 'sortOrder' && typeof filter.value === 'number') {
    return numericColumn('sortOrder', filter.op, filter.value);
  }
  if ((filter.field === 'createdAt' || filter.field === 'updatedAt') && typeof filter.value === 'string') {
    const date = new Date(filter.value);
    if (Number.isNaN(date.getTime())) {
      return {};
    }
    return dateColumn(filter.field, filter.op, date);
  }

  const path = [filter.field];
  switch (filter.op) {
    case 'eq':
      return { data: { path, equals: filter.value as Prisma.InputJsonValue } };
    case 'neq':
      return { NOT: { data: { path, equals: filter.value as Prisma.InputJsonValue } } };
    case 'contains':
      return {
        data: {
          path,
          string_contains: String(filter.value ?? ''),
        },
      };
    case 'gt':
      return { data: { path, gt: filter.value as Prisma.InputJsonValue } };
    case 'gte':
      return { data: { path, gte: filter.value as Prisma.InputJsonValue } };
    case 'lt':
      return { data: { path, lt: filter.value as Prisma.InputJsonValue } };
    case 'lte':
      return { data: { path, lte: filter.value as Prisma.InputJsonValue } };
    default:
      return {};
  }
}

function numericColumn(
  field: 'sortOrder',
  op: CmsFilter['op'],
  value: number,
): Prisma.CmsRecordWhereInput {
  if (op === 'eq') return { [field]: value };
  if (op === 'neq') return { NOT: { [field]: value } };
  if (op === 'gt') return { [field]: { gt: value } };
  if (op === 'gte') return { [field]: { gte: value } };
  if (op === 'lt') return { [field]: { lt: value } };
  if (op === 'lte') return { [field]: { lte: value } };
  return {};
}

function dateColumn(
  field: 'createdAt' | 'updatedAt',
  op: CmsFilter['op'],
  value: Date,
): Prisma.CmsRecordWhereInput {
  if (op === 'eq') return { [field]: value };
  if (op === 'gt') return { [field]: { gt: value } };
  if (op === 'gte') return { [field]: { gte: value } };
  if (op === 'lt') return { [field]: { lt: value } };
  if (op === 'lte') return { [field]: { lte: value } };
  return {};
}

export function buildRecordOrderBy(
  sort: string,
  order: 'asc' | 'desc',
  _fields?: CollectionField[],
): Prisma.CmsRecordOrderByWithRelationInput[] {
  if (COLUMN_SORTS.has(sort)) {
    return [{ [sort]: order } as Prisma.CmsRecordOrderByWithRelationInput];
  }
  return [{ sortOrder: 'asc' }, { createdAt: 'desc' }];
}
