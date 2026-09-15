import { ConflictException, BadRequestException } from '@nestjs/common';
import { RESERVED_CMS_SLUGS } from './cms.constants';

export function normalizeCmsSlug(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function isReservedCmsSlug(slug: string): boolean {
  return RESERVED_CMS_SLUGS.has(slug);
}

export function assertCmsSlug(raw: string, label = 'Slug'): string {
  const slug = normalizeCmsSlug(raw);
  if (!slug) {
    throw new BadRequestException({
      code: 'INVALID_SLUG',
      message: `${label} must contain at least one letter or number`,
    });
  }
  if (isReservedCmsSlug(slug)) {
    throw new BadRequestException({
      code: 'RESERVED_SLUG',
      message: `${label} "${slug}" is reserved`,
    });
  }
  return slug;
}

export function suggestCmsSlug(base: string, taken: Set<string>): string {
  const root = normalizeCmsSlug(base) || 'item';
  if (!taken.has(root) && !isReservedCmsSlug(root)) return root;
  for (let i = 2; i < 1000; i += 1) {
    const candidate = `${root}-${i}`.slice(0, 80);
    if (!taken.has(candidate) && !isReservedCmsSlug(candidate)) return candidate;
  }
  throw new ConflictException({
    code: 'SLUG_COLLISION',
    message: `Could not allocate a unique slug from "${root}"`,
  });
}

export function slugConflict(slug: string, suggestion: string): never {
  throw new ConflictException({
    code: 'SLUG_COLLISION',
    message: `Slug "${slug}" is already in use`,
    suggestion,
  });
}
