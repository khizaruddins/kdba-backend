import { ConflictException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { DocumentValidatorService } from '../../documents/services/document-validator.service';
import { TreeOperationsService } from '../../documents/services/tree-operations.service';
import { WebsiteDocumentV3 } from '../../documents/types/document.types';
import { getBuilderCatalog } from '../../documents/contracts/builder-catalog';
import { CmsService } from '../cms.service';
import { getCollectionPreset } from '../cms-presets';
import { collectBoundCollectionSlugs } from '../cms-bindings';
import { BUILTIN_COLLECTION_SLUGS } from '../cms.types';

function blankDoc(): WebsiteDocumentV3 {
  return {
    schemaVersion: '3.0',
    site: { name: 'Test Studio', businessType: 'agency', language: 'en' },
    theme: {
      colors: {
        primary: '#0f172a',
        secondary: '#ffffff',
        accent: '#6366f1',
        background: '#ffffff',
        surface: '#f8fafc',
        text: '#0f172a',
        muted: '#64748b',
        border: '#e2e8f0',
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      typography: {
        h1: { fontFamily: 'Inter', fontSize: '48px', fontWeight: 700, lineHeight: 1.2 },
        h2: { fontFamily: 'Inter', fontSize: '36px', fontWeight: 700, lineHeight: 1.2 },
        h3: { fontFamily: 'Inter', fontSize: '28px', fontWeight: 600, lineHeight: 1.3 },
        h4: { fontFamily: 'Inter', fontSize: '22px', fontWeight: 600, lineHeight: 1.35 },
        h5: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 600, lineHeight: 1.4 },
        h6: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 600, lineHeight: 1.4 },
        body: { fontFamily: 'Inter', fontSize: '16px', fontWeight: 400, lineHeight: 1.5 },
        caption: { fontFamily: 'Inter', fontSize: '13px', fontWeight: 400, lineHeight: 1.5 },
        label: { fontFamily: 'Inter', fontSize: '14px', fontWeight: 500, lineHeight: 1.4 },
        button: { fontFamily: 'Inter', fontSize: '15px', fontWeight: 600, lineHeight: 1.4 },
        quote: { fontFamily: 'Inter', fontSize: '18px', fontWeight: 400, lineHeight: 1.6 },
      },
      breakpoints: { desktop: 1200, tablet: 768, mobile: 480 },
      borderRadius: 'md',
      shadows: 'subtle',
    },
    business: { name: 'Test Studio Inc' },
    navigation: { header: [], footer: [] },
    pages: [
      {
        id: 'page_home',
        title: 'Home',
        slug: '/',
        type: 'home',
        sortOrder: 0,
        enabled: true,
        root: {
          id: 'root_page_home',
          type: 'page-root',
          name: 'Page Root',
          children: [
            {
              id: 'section_bound',
              type: 'section',
              children: [
                {
                  id: 'heading_bound',
                  type: 'heading',
                  props: { text: 'Blog', level: 2 },
                  binding: { source: 'collection', collection: 'blog-posts', field: 'title' },
                },
              ],
            },
          ],
        },
      },
    ],
    global: { reusableNodes: {} },
    seo: { metaTitle: 'Test', metaDescription: 'Test site' },
    settings: { enableContactForm: true, language: 'en' },
  };
}

function createStore() {
  const now = new Date();
  const collections: any[] = [];
  const records: any[] = [];
  const revisions: any[] = [];
  let seq = 1;
  const id = (prefix: string) => `${prefix}_${seq++}`;

  const match = (row: any, where: any): boolean => {
    if (!where) return true;
    if (where.AND) return (where.AND as any[]).every((part) => match(row, part));
    if (where.OR) return (where.OR as any[]).some((part) => match(row, part));
    if (where.NOT) return !match(row, where.NOT);
    for (const [key, value] of Object.entries(where)) {
      if (value === undefined) continue;
      if (key === 'AND' || key === 'OR' || key === 'NOT') continue;
      const current = row[key];
      if (value === null) {
        if (current != null) return false;
        continue;
      }
      if (typeof value === 'object' && value) {
        const filter = value as Record<string, unknown>;
        if ('in' in filter && Array.isArray(filter.in) && !filter.in.includes(current)) return false;
        if ('not' in filter && current === filter.not) return false;
        if ('not' in filter === false && 'contains' in filter) {
          if (!String(current || '').toLowerCase().includes(String(filter.contains).toLowerCase())) {
            return false;
          }
        }
        if ('not' in filter && typeof filter.not === 'object') continue;
        if ('path' in filter) continue;
        if (!('in' in filter) && !('not' in filter) && !('contains' in filter) && !('mode' in filter) && !('gt' in filter) && !('gte' in filter) && !('lt' in filter) && !('lte' in filter) && !('path' in filter) && current !== value) {
          return false;
        }
        continue;
      }
      if (current !== value) return false;
    }
    return true;
  };

  const prisma: any = {
    website: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.id !== 'site_1') return null;
        return {
          id: 'site_1',
          tenantId: 'tenant_1',
          businessId: 'biz_1',
          name: 'Studio',
          favicon: '/favicon.ico',
          business: {
            id: 'biz_1',
            name: 'Studio Inc',
            description: 'Agency',
            category: 'agency',
            logoUrl: 'https://cdn.test/logo.png',
            email: 'hi@test.com',
            phone: '555',
            whatsapp: null,
            address: '1 Main',
            city: 'Miami',
            state: 'FL',
            country: 'US',
            zipCode: '33101',
            website: 'https://studio.test',
            socialMedia: { instagram: 'https://instagram.com/studio' },
            businessHours: { mon: { open: '09:00', close: '17:00' } },
            locations: [],
          },
        };
      }),
    },
    tenant: {
      findUnique: jest.fn(async ({ where }: any) => {
        if (where.slug !== 'studio') return null;
        return {
          id: 'tenant_1',
          status: 'ACTIVE',
          websites: [{ id: 'site_1', tenantId: 'tenant_1' }],
        };
      }),
    },
    cmsCollection: {
      findMany: jest.fn(async ({ where }: any = {}) => collections.filter((row) => match(row, where))),
      findFirst: jest.fn(async ({ where }: any) => collections.find((row) => match(row, where)) || null),
      findUnique: jest.fn(async ({ where }: any) => collections.find((row) => row.id === where.id) || null),
      count: jest.fn(async ({ where }: any) => collections.filter((row) => match(row, where)).length),
      create: jest.fn(async ({ data }: any) => {
        if (collections.some((row) => row.websiteId === data.websiteId && row.slug === data.slug)) {
          const error: any = new Error('unique');
          error.code = 'P2002';
          throw error;
        }
        const row = {
          id: id('col'),
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          isBuiltin: false,
          presetKey: null,
          description: null,
          settings: null,
          ...data,
        };
        collections.push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const row = collections.find((item) => item.id === where.id);
        Object.assign(row, data, { updatedAt: now });
        return row;
      }),
    },
    cmsRecord: {
      findMany: jest.fn(async ({ where, skip = 0, take = 100 }: any = {}) =>
        records.filter((row) => match(row, where)).slice(skip, skip + take),
      ),
      findFirst: jest.fn(async ({ where }: any) => records.find((row) => match(row, where)) || null),
      findUnique: jest.fn(async ({ where }: any) => records.find((row) => row.id === where.id) || null),
      count: jest.fn(async ({ where }: any) => records.filter((row) => match(row, where)).length),
      create: jest.fn(async ({ data }: any) => {
        if (data.slug && records.some((row) => row.collectionId === data.collectionId && row.slug === data.slug && !row.deletedAt)) {
          const error: any = new Error('unique');
          error.code = 'P2002';
          throw error;
        }
        const row = {
          id: id('rec'),
          createdAt: now,
          updatedAt: now,
          deletedAt: null,
          sortOrder: 0,
          ...data,
        };
        records.push(row);
        return row;
      }),
      update: jest.fn(async ({ where, data }: any) => {
        const row = records.find((item) => item.id === where.id);
        Object.assign(row, data, { updatedAt: now });
        return row;
      }),
      updateMany: jest.fn(async ({ where, data }: any) => {
        const matched = records.filter((row) => match(row, where));
        matched.forEach((row) => Object.assign(row, data));
        return { count: matched.length };
      }),
    },
    cmsRecordRevision: {
      create: jest.fn(async ({ data }: any) => {
        const row = { id: id('rev'), createdAt: now, ...data };
        revisions.push(row);
        return row;
      }),
      findMany: jest.fn(async ({ where, skip = 0, take = 100 }: any = {}) =>
        revisions.filter((row) => match(row, where)).slice(skip, skip + take),
      ),
      findFirst: jest.fn(async ({ where }: any) => revisions.find((row) => match(row, where)) || null),
      deleteMany: jest.fn(async ({ where }: any) => {
        const ids = where.id?.in || [];
        for (let i = revisions.length - 1; i >= 0; i -= 1) {
          if (ids.includes(revisions[i].id)) revisions.splice(i, 1);
        }
        return { count: ids.length };
      }),
    },
    media: {
      findUnique: jest.fn(async ({ where }: any) =>
        where.id === 'media_owned'
          ? { id: 'media_owned', tenantId: 'tenant_1', url: 'https://cdn.test/a.png', altText: 'a', mimeType: 'image/png' }
          : where.id === 'media_other'
            ? { id: 'media_other', tenantId: 'tenant_2', url: 'https://cdn.test/b.png', altText: 'b', mimeType: 'image/png' }
            : null,
      ),
      findMany: jest.fn(async ({ where }: any) => {
        const owned = {
          id: 'media_owned',
          tenantId: 'tenant_1',
          url: 'https://cdn.test/a.png',
          altText: 'a',
          mimeType: 'image/png',
        };
        if (where.tenantId !== 'tenant_1') return [];
        if (where.id?.in) return where.id.in.includes('media_owned') ? [owned] : [];
        return [owned];
      }),
    },
    business: {
      update: jest.fn(async ({ data }: any) => data),
    },
    $transaction: jest.fn(async (ops: any) => {
      if (Array.isArray(ops)) return Promise.all(ops);
      return ops(prisma);
    }),
  };

  return { prisma, collections, records, revisions };
}

describe('M4 CMS service', () => {
  let cms: CmsService;
  let store: ReturnType<typeof createStore>;

  beforeEach(async () => {
    store = createStore();
    const module = await Test.createTestingModule({
      providers: [CmsService, { provide: PrismaService, useValue: store.prisma }],
    }).compile();
    cms = module.get(CmsService);
  });

  it('bootstraps builtin business collections on one generic table', async () => {
    const result = await cms.bootstrap('site_1', 'tenant_1');
    expect(result.collections.map((item) => item.slug)).toEqual(expect.arrayContaining([...BUILTIN_COLLECTION_SLUGS]));
    expect(result.collections).toHaveLength(6);
  });

  it('creates, updates, lists, and soft-deletes collections', async () => {
    const created = await cms.createCollection('site_1', 'tenant_1', {
      name: 'Case Studies',
      fields: getCollectionPreset('projects')!.fields,
    });
    expect(created.slug).toBe('case-studies');
    const updated = await cms.updateCollection('site_1', 'tenant_1', created.id, {
      name: 'Work',
    });
    expect(updated.name).toBe('Work');
    await cms.deleteCollection('site_1', 'tenant_1', created.id);
    await expect(cms.getCollection('site_1', 'tenant_1', created.id)).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('rejects a colliding collection slug instead of overwriting', async () => {
    await cms.createCollection('site_1', 'tenant_1', {
      name: 'Services',
      preset: 'services',
    });
    await expect(
      cms.createCollection('site_1', 'tenant_1', { name: 'Services', preset: 'services' }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('performs record CRUD with field validation, search, sort, and pagination', async () => {
    const collection = await cms.createCollection('site_1', 'tenant_1', {
      name: 'Services',
      preset: 'services',
    });
    const first = await cms.createRecord('site_1', 'tenant_1', collection.id, {
      data: { title: 'Web Development', featured: true, price: 100 },
      status: 'PUBLISHED',
      sortOrder: 1,
    });
    const second = await cms.createRecord('site_1', 'tenant_1', collection.id, {
      data: { title: 'Consulting', featured: false, price: 50 },
      status: 'DRAFT',
      sortOrder: 2,
    });
    expect(first.slug).toBe('web-development');
    const listed = await cms.listRecords('site_1', 'tenant_1', collection.id, {
      q: 'web',
      page: 1,
      pageSize: 10,
      sort: 'sortOrder',
      order: 'asc',
    });
    expect(listed.meta.total).toBeGreaterThanOrEqual(1);
    expect(listed.data[0].slug).toBe('web-development');

    const paged = await cms.listRecords('site_1', 'tenant_1', collection.id, {
      page: 1,
      pageSize: 1,
      sort: 'sortOrder',
      order: 'asc',
    });
    expect(paged.data).toHaveLength(1);
    expect(paged.meta.pageSize).toBe(1);

    const updated = await cms.updateRecord('site_1', 'tenant_1', collection.id, first.id, {
      data: { title: 'Web Development', featured: true, price: 150 },
    });
    expect((updated.data as any).price).toBe(150);

    await cms.deleteRecord('site_1', 'tenant_1', collection.id, second.id);
    await expect(
      cms.getRecord('site_1', 'tenant_1', collection.id, second.id),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('enforces tenant isolation and media ownership', async () => {
    await expect(cms.listCollections('site_1', 'tenant_other')).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    const collection = await cms.createCollection('site_1', 'tenant_1', {
      name: 'Team',
      preset: 'team',
    });
    await expect(
      cms.createRecord('site_1', 'tenant_1', collection.id, {
        data: { name: 'Ada', photo: 'media_other' },
      }),
    ).rejects.toThrow();
    const ok = await cms.createRecord('site_1', 'tenant_1', collection.id, {
      data: { name: 'Ada', photo: 'media_owned' },
    });
    expect((ok.data as any).photo).toBe('media_owned');
  });

  it('keeps draft records out of public published payloads', async () => {
    const collection = await cms.createCollection('site_1', 'tenant_1', {
      name: 'Blog Posts',
      preset: 'blog-posts',
    });
    await cms.createRecord('site_1', 'tenant_1', collection.id, {
      data: { title: 'Draft only', body: [{ type: 'paragraph', children: [{ text: 'secret' }] }] },
      status: 'DRAFT',
    });
    await cms.createRecord('site_1', 'tenant_1', collection.id, {
      data: { title: 'Live post', body: [{ type: 'paragraph', children: [{ text: 'hello' }] }] },
      status: 'PUBLISHED',
    });
    const doc = blankDoc();
    const published = await cms.resolvePublishedForWebsite('site_1', 'tenant_1', doc);
    const blog = published.collections.find((item) => item.slug === 'blog-posts');
    expect(blog?.records.map((item) => item.slug)).toEqual(['live-post']);
    await expect(cms.getPublicRecord('studio', 'blog-posts', 'draft-only')).rejects.toBeInstanceOf(
      NotFoundException,
    );
    const live = await cms.getPublicRecord('studio', 'blog-posts', 'live-post');
    expect(live.record.status).toBe('PUBLISHED');
  });

  it('returns a business profile without copying it into pages', async () => {
    const profile = await cms.getBusinessProfile('site_1', 'tenant_1');
    expect(profile.business.email).toBe('hi@test.com');
    expect(profile.website.favicon).toBe('/favicon.ico');
  });
});

describe('M4 dynamic bindings and collection pages', () => {
  const validator = new DocumentValidatorService();
  const treeOps = new TreeOperationsService();

  it('accepts node bindings and dynamic collection routes', () => {
    const doc = blankDoc();
    treeOps.addPage(doc, {
      id: 'page_blog',
      title: 'Blog',
      slug: '/blog',
      type: 'blog',
      sortOrder: 1,
      enabled: true,
      kind: 'collection-index',
      collection: { slug: 'blog-posts' },
      root: { id: 'root_blog', type: 'page-root', children: [] },
    });
    treeOps.addPage(doc, {
      id: 'page_blog_item',
      title: 'Blog post',
      slug: '/blog/:slug',
      type: 'blog',
      sortOrder: 2,
      enabled: true,
      kind: 'collection-item',
      collection: { slug: 'blog-posts', itemParam: 'slug' },
      root: {
        id: 'root_blog_item',
        type: 'page-root',
        children: [
          {
            id: 'section_blog_item',
            type: 'section',
            children: [
              {
                id: 'title_bound',
                type: 'heading',
                props: { text: '', level: 1 },
                binding: { source: 'record', collection: 'blog-posts', field: 'title' },
              },
            ],
          },
        ],
      },
    });
    const validated = validator.validateV3(doc);
    expect(validated.pages.map((page) => page.kind)).toEqual(
      expect.arrayContaining(['collection-index', 'collection-item']),
    );
    expect([...collectBoundCollectionSlugs(validated)]).toContain('blog-posts');
  });

  it('rejects collection item pages without a :slug route', () => {
    const doc = blankDoc();
    doc.pages.push({
      id: 'page_bad',
      title: 'Bad',
      slug: '/blog',
      type: 'blog',
      sortOrder: 1,
      enabled: true,
      kind: 'collection-item',
      collection: { slug: 'blog-posts' },
      root: { id: 'root_bad', type: 'page-root', children: [] },
    });
    expect(() => validator.validateV3(doc)).toThrow();
  });

  it('exposes CMS metadata on the builder catalog', () => {
    const catalog = getBuilderCatalog();
    expect(catalog.cms.fieldTypes).toEqual(expect.arrayContaining(['rich-text', 'reference', 'image']));
    expect(catalog.cms.builtinCollections).toEqual(expect.arrayContaining(['blog-posts', 'services']));
  });
});
