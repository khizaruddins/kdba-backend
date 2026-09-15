import { BadRequestException, ConflictException } from '@nestjs/common';
import { getCollectionPreset } from '../cms-presets';
import { assertCmsSlug, isReservedCmsSlug, normalizeCmsSlug, suggestCmsSlug } from '../cms-slug';
import {
  NodeBindingSchema,
  parseCollectionFields,
  parseFilters,
  parseLocations,
  validateRecordData,
} from '../cms-validation';
import { CollectionField } from '../cms.types';

function ctx(overrides: Partial<Parameters<typeof validateRecordData>[3]> = {}) {
  return {
    existingSlugs: new Set<string>(),
    uniqueValueExists: async () => false,
    mediaOwned: async (id: string) => id === 'media_owned',
    recordInCollection: async (_slug: string, recordId: string) =>
      recordId.startsWith('rec_') ? { id: recordId } : null,
    ...overrides,
  };
}

describe('CMS slug system', () => {
  it('normalizes invalid characters and casing', () => {
    expect(normalizeCmsSlug('Web Development!')).toBe('web-development');
    expect(normalizeCmsSlug('  Projet Alpha  ')).toBe('projet-alpha');
  });

  it('rejects reserved and empty slugs', () => {
    expect(isReservedCmsSlug('admin')).toBe(true);
    expect(() => assertCmsSlug('admin')).toThrow(BadRequestException);
    expect(() => assertCmsSlug('***')).toThrow(BadRequestException);
  });

  it('suggests a unique slug instead of overwriting', () => {
    expect(suggestCmsSlug('services', new Set(['services']))).toBe('services-2');
  });
});

describe('CMS field definitions', () => {
  it('accepts builtin service fields and rejects unknown types', () => {
    const preset = getCollectionPreset('services')!;
    expect(parseCollectionFields(preset.fields).map((field) => field.id)).toContain('title');
    expect(() =>
      parseCollectionFields([{ id: 'title', name: 'Title', type: 'html' }]),
    ).toThrow(BadRequestException);
  });

  it('requires options for select and a target for references', () => {
    expect(() =>
      parseCollectionFields([{ id: 'kind', name: 'Kind', type: 'select' }]),
    ).toThrow(BadRequestException);
    expect(() =>
      parseCollectionFields([{ id: 'author', name: 'Author', type: 'reference' }]),
    ).toThrow(BadRequestException);
  });
});

describe('CMS record validation', () => {
  const fields = getCollectionPreset('services')!.fields as CollectionField[];
  const settings = getCollectionPreset('services')!.settings;

  it('creates a valid service record', async () => {
    const result = await validateRecordData(
      fields,
      { title: 'Web Development', description: [{ type: 'paragraph', children: [{ text: 'Build' }] }], price: 1200, featured: true },
      settings,
      ctx(),
    );
    expect(result.slug).toBe('web-development');
    expect(result.data.title).toBe('Web Development');
    expect(result.data.featured).toBe(true);
  });

  it('rejects unknown fields and malformed booleans', async () => {
    await expect(
      validateRecordData(fields, { title: 'A', extra: 'nope' }, settings, ctx()),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validateRecordData(fields, { title: 'A', featured: 'yes' }, settings, ctx()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects unsafe text and javascript URLs', async () => {
    await expect(
      validateRecordData(fields, { title: 'javascript:alert(1)' }, settings, ctx()),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('does not silently overwrite an existing slug', async () => {
    await expect(
      validateRecordData(
        fields,
        { title: 'Web Development' },
        settings,
        ctx({ existingSlugs: new Set(['web-development']) }),
      ),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('validates owned media ids and rejects URLs', async () => {
    const imageFields: CollectionField[] = [
      { id: 'title', name: 'Title', type: 'text', required: true, system: true },
      { id: 'slug', name: 'Slug', type: 'text', required: true, system: true },
      { id: 'image', name: 'Image', type: 'image' },
    ];
    await expect(
      validateRecordData(imageFields, { title: 'A', image: 'https://evil.test/x.png' }, settings, ctx()),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validateRecordData(imageFields, { title: 'A', image: 'media_other' }, settings, ctx()),
    ).rejects.toBeInstanceOf(BadRequestException);
    const ok = await validateRecordData(
      imageFields,
      { title: 'A', image: 'media_owned' },
      settings,
      ctx(),
    );
    expect(ok.data.image).toBe('media_owned');
  });

  it('validates references and blocks self-references', async () => {
    const refFields: CollectionField[] = [
      { id: 'title', name: 'Title', type: 'text', required: true },
      { id: 'slug', name: 'Slug', type: 'text', required: true },
      { id: 'related', name: 'Related', type: 'multi-reference', reference: 'services' },
    ];
    await expect(
      validateRecordData(
        refFields,
        { title: 'A', related: ['rec_self'] },
        settings,
        ctx({ currentRecordId: 'rec_self' }),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
    await expect(
      validateRecordData(refFields, { title: 'A', related: ['missing'] }, settings, ctx()),
    ).rejects.toBeInstanceOf(BadRequestException);
    const ok = await validateRecordData(
      refFields,
      { title: 'A', related: ['rec_other'] },
      settings,
      ctx(),
    );
    expect(ok.data.related).toEqual(['rec_other']);
  });

  it('stores structured rich text instead of raw HTML', async () => {
    const blog = getCollectionPreset('blog-posts')!;
    const result = await validateRecordData(
      blog.fields,
      {
        title: 'My first post',
        body: [{ type: 'paragraph', children: [{ text: 'Hello', marks: ['bold'] }] }],
      },
      blog.settings,
      ctx(),
    );
    expect(Array.isArray(result.data.body)).toBe(true);
    expect((result.data.body as any)[0].type).toBe('paragraph');
  });
});

describe('CMS query and locations', () => {
  it('parses a bounded filter list and rejects unknown operators', () => {
    const filters = parseFilters(
      JSON.stringify([{ field: 'featured', op: 'eq', value: true }]),
    );
    expect(filters).toEqual([{ field: 'featured', op: 'eq', value: true }]);
    expect(() => parseFilters(JSON.stringify([{ field: 'title', op: 'rawSql', value: '1' }]))).toThrow(
      BadRequestException,
    );
  });

  it('validates business locations', () => {
    expect(parseLocations([{ name: 'HQ', city: 'Miami' }])).toEqual([
      expect.objectContaining({ name: 'HQ', city: 'Miami' }),
    ]);
    expect(() => parseLocations([{ city: 'No name' }])).toThrow(BadRequestException);
  });

  it('validates node binding shape', () => {
    expect(
      NodeBindingSchema.parse({ source: 'collection', collection: 'blog-posts', field: 'title' }),
    ).toMatchObject({ source: 'collection', collection: 'blog-posts' });
    expect(
      NodeBindingSchema.safeParse({ source: 'collection', field: 'title' }).success,
    ).toBe(false);
  });
});
