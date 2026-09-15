import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { WebsiteDocumentV3 } from '../documents/types/document.types';
import { isSafeUrl } from '../documents/security/document-security';
import { CMS_LIMITS } from './cms.constants';
import { CMS_PRESETS, getCollectionPreset, listSeedPresets } from './cms-presets';
import { collectBoundCollectionSlugs } from './cms-bindings';
import { buildRecordOrderBy, buildRecordWhere } from './cms-query';
import { assertCmsSlug, slugConflict, suggestCmsSlug } from './cms-slug';
import {
  CMS_FIELD_TYPES,
  CollectionField,
  CollectionSettings,
  CmsRecordQuery,
  CmsRecordStatusValue,
} from './cms.types';
import {
  cmsError,
  parseCollectionFields,
  parseCollectionSettings,
  parseFilters,
  parseLocations,
  parseStatus,
  validateRecordData,
} from './cms-validation';
import {
  CreateCmsCollectionDto,
  CreateCmsRecordDto,
  QueryCmsRecordsDto,
  UpdateBusinessProfileDto,
  UpdateCmsCollectionDto,
  UpdateCmsRecordDto,
} from './dto/cms.dto';

@Injectable()
export class CmsService {
  constructor(private readonly prisma: PrismaService) {}

  getCatalog() {
    return {
      fieldTypes: [...CMS_FIELD_TYPES],
      recordStatuses: ['DRAFT', 'PUBLISHED', 'ARCHIVED'],
      filterOps: ['eq', 'neq', 'contains', 'gt', 'gte', 'lt', 'lte'],
      bindingSources: ['collection', 'record', 'business'],
      pageKinds: ['static', 'collection-index', 'collection-item'],
      presets: CMS_PRESETS.map((preset) => ({
        key: preset.key,
        name: preset.name,
        slug: preset.slug,
        description: preset.description,
        seed: preset.seed,
        fields: preset.fields,
        settings: preset.settings,
      })),
    };
  }

  async bootstrap(websiteId: string, tenantId: string) {
    await this.assertWebsite(websiteId, tenantId);
    const collections = await this.ensurePresets(websiteId, tenantId);
    return { collections: collections.map((item) => this.serializeCollection(item)) };
  }

  async listCollections(websiteId: string, tenantId: string) {
    await this.assertWebsite(websiteId, tenantId);
    await this.ensurePresets(websiteId, tenantId);
    const collections = await this.prisma.cmsCollection.findMany({
      where: { websiteId, tenantId, deletedAt: null },
      orderBy: { createdAt: 'asc' },
    });
    return collections.map((item) => this.serializeCollection(item));
  }

  async createCollection(websiteId: string, tenantId: string, dto: CreateCmsCollectionDto) {
    await this.assertWebsite(websiteId, tenantId);
    await this.assertCollectionCount(websiteId);

    const preset = dto.preset ? getCollectionPreset(dto.preset) : undefined;
    if (dto.preset && !preset) {
      throw cmsError('INVALID_PRESET', `Unknown collection preset "${dto.preset}"`);
    }

    const name = dto.name.trim();
    const slug = assertCmsSlug(dto.slug || preset?.slug || name, 'Collection slug');
    await this.assertCollectionSlugFree(websiteId, slug);

    const fields = parseCollectionFields(dto.fields ?? preset?.fields);
    const settings = parseCollectionSettings(dto.settings ?? preset?.settings ?? {});

    try {
      const created = await this.prisma.cmsCollection.create({
        data: {
          tenantId,
          websiteId,
          name,
          slug,
          description: dto.description?.trim() || preset?.description || null,
          fields: fields as unknown as Prisma.InputJsonValue,
          settings: settings as unknown as Prisma.InputJsonValue,
          presetKey: preset?.key ?? null,
          isBuiltin: Boolean(preset?.seed && preset.slug === slug),
        },
      });
      return this.serializeCollection(created);
    } catch (error) {
      this.rethrowUnique(error, slug);
    }
  }

  async getCollection(websiteId: string, tenantId: string, collectionId: string) {
    const collection = await this.assertCollection(websiteId, tenantId, collectionId);
    return this.serializeCollection(collection);
  }

  async updateCollection(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    dto: UpdateCmsCollectionDto,
  ) {
    const collection = await this.assertCollection(websiteId, tenantId, collectionId);
    const data: Prisma.CmsCollectionUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.description !== undefined) data.description = dto.description.trim() || null;
    if (dto.slug !== undefined) {
      const slug = assertCmsSlug(dto.slug, 'Collection slug');
      if (slug !== collection.slug) {
        await this.assertCollectionSlugFree(websiteId, slug);
        data.slug = slug;
      }
    }
    if (dto.fields !== undefined) {
      const next = parseCollectionFields(dto.fields);
      this.assertSystemFieldsPreserved(this.readFields(collection.fields), next);
      data.fields = next as unknown as Prisma.InputJsonValue;
    }
    if (dto.settings !== undefined) {
      data.settings = parseCollectionSettings(dto.settings) as unknown as Prisma.InputJsonValue;
    }

    try {
      const updated = await this.prisma.cmsCollection.update({
        where: { id: collection.id },
        data,
      });
      return this.serializeCollection(updated);
    } catch (error) {
      this.rethrowUnique(error, typeof data.slug === 'string' ? data.slug : collection.slug);
    }
  }

  async deleteCollection(websiteId: string, tenantId: string, collectionId: string) {
    const collection = await this.assertCollection(websiteId, tenantId, collectionId);
    const retiredSlug = `${collection.slug}__deleted__${collection.id}`.slice(0, 120);
    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.cmsRecord.updateMany({
        where: { collectionId: collection.id, deletedAt: null },
        data: { deletedAt: now },
      }),
      this.prisma.cmsCollection.update({
        where: { id: collection.id },
        data: { deletedAt: now, slug: retiredSlug },
      }),
    ]);
    return { id: collection.id, deleted: true };
  }

  async restoreCollection(websiteId: string, tenantId: string, collectionId: string) {
    const collection = await this.prisma.cmsCollection.findFirst({
      where: { id: collectionId, websiteId, tenantId },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    if (collection.tenantId !== tenantId) throw new ForbiddenException('Access denied');
    if (!collection.deletedAt) return this.serializeCollection(collection);

    const restoredSlug = collection.slug.includes('__deleted__')
      ? collection.slug.slice(0, collection.slug.indexOf('__deleted__'))
      : collection.slug;
    await this.assertCollectionSlugFree(websiteId, restoredSlug, collection.id);

    const updated = await this.prisma.cmsCollection.update({
      where: { id: collection.id },
      data: { deletedAt: null, slug: restoredSlug },
    });
    await this.prisma.cmsRecord.updateMany({
      where: { collectionId: collection.id, deletedAt: { not: null } },
      data: { deletedAt: null },
    });
    return this.serializeCollection(updated);
  }

  async listRecords(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    dto: QueryCmsRecordsDto,
    publishedOnly = false,
  ) {
    const collection = await this.assertCollection(websiteId, tenantId, collectionId);
    const fields = this.readFields(collection.fields);
    const query = this.toQuery(dto);
    const where = buildRecordWhere(
      collection.id,
      tenantId,
      websiteId,
      fields,
      query,
      publishedOnly,
    );
    const orderBy = buildRecordOrderBy(query.sort, query.order, fields);
    const skip = (query.page - 1) * query.pageSize;

    const [total, records] = await this.prisma.$transaction([
      this.prisma.cmsRecord.count({ where }),
      this.prisma.cmsRecord.findMany({
        where,
        orderBy,
        skip,
        take: query.pageSize,
      }),
    ]);

    return {
      data: records.map((record) => this.serializeRecord(record)),
      meta: {
        total,
        page: query.page,
        pageSize: query.pageSize,
        totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
      },
    };
  }

  async createRecord(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    dto: CreateCmsRecordDto,
  ) {
    const collection = await this.assertCollection(websiteId, tenantId, collectionId);
    await this.assertRecordCount(collection.id);
    const fields = this.readFields(collection.fields);
    const settings = this.readSettings(collection.settings);
    const payload = dto.slug ? { ...dto.data, slug: dto.slug } : dto.data;
    const validated = await this.validateIncomingRecord(
      websiteId,
      tenantId,
      collection,
      fields,
      settings,
      payload,
    );

    try {
      const created = await this.prisma.cmsRecord.create({
        data: {
          tenantId,
          websiteId,
          collectionId: collection.id,
          slug: validated.slug,
          status: dto.status ?? settings.defaultStatus,
          data: validated.data as Prisma.InputJsonValue,
          sortOrder: dto.sortOrder ?? 0,
        },
      });
      await this.writeRevision(created);
      return this.serializeRecord(created);
    } catch (error) {
      this.rethrowUnique(error, validated.slug || '');
    }
  }

  async getRecord(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
  ) {
    const record = await this.assertRecord(websiteId, tenantId, collectionId, recordId);
    return this.serializeRecord(record);
  }

  async updateRecord(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
    dto: UpdateCmsRecordDto,
  ) {
    const record = await this.assertRecord(websiteId, tenantId, collectionId, recordId);
    const collection = await this.assertCollection(websiteId, tenantId, collectionId);
    const fields = this.readFields(collection.fields);
    const settings = this.readSettings(collection.settings);
    const nextData =
      dto.data !== undefined
        ? dto.slug
          ? { ...dto.data, slug: dto.slug }
          : dto.data
        : dto.slug
          ? { ...(record.data as Record<string, unknown>), slug: dto.slug }
          : (record.data as Record<string, unknown>);

    const validated = await this.validateIncomingRecord(
      websiteId,
      tenantId,
      collection,
      fields,
      settings,
      nextData,
      record.id,
    );

    try {
      const updated = await this.prisma.cmsRecord.update({
        where: { id: record.id },
        data: {
          data: validated.data as Prisma.InputJsonValue,
          slug: validated.slug,
          ...(dto.status !== undefined && { status: parseStatus(dto.status) }),
          ...(dto.sortOrder !== undefined && { sortOrder: dto.sortOrder }),
        },
      });
      await this.writeRevision(updated);
      return this.serializeRecord(updated);
    } catch (error) {
      this.rethrowUnique(error, validated.slug || '');
    }
  }

  async deleteRecord(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
  ) {
    const record = await this.assertRecord(websiteId, tenantId, collectionId, recordId);
    const retiredSlug = record.slug
      ? `${record.slug}__deleted__${record.id}`.slice(0, 120)
      : record.slug;
    await this.prisma.cmsRecord.update({
      where: { id: record.id },
      data: { deletedAt: new Date(), slug: retiredSlug },
    });
    return { id: record.id, deleted: true };
  }

  async restoreRecord(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
  ) {
    const record = await this.prisma.cmsRecord.findFirst({
      where: { id: recordId, collectionId, websiteId, tenantId },
    });
    if (!record) throw new NotFoundException('Record not found');
    if (!record.deletedAt) return this.serializeRecord(record);
    const restoredSlug =
      record.slug && record.slug.includes('__deleted__')
        ? record.slug.slice(0, record.slug.indexOf('__deleted__'))
        : record.slug;
    if (restoredSlug) {
      const clash = await this.prisma.cmsRecord.findFirst({
        where: {
          collectionId,
          slug: restoredSlug,
          deletedAt: null,
          NOT: { id: record.id },
        },
      });
      if (clash) slugConflict(restoredSlug, `${restoredSlug}-2`);
    }
    const updated = await this.prisma.cmsRecord.update({
      where: { id: record.id },
      data: { deletedAt: null, slug: restoredSlug },
    });
    return this.serializeRecord(updated);
  }

  async listRevisions(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
  ) {
    await this.assertRecord(websiteId, tenantId, collectionId, recordId);
    return this.prisma.cmsRecordRevision.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' },
      take: CMS_LIMITS.maxRevisionsKept,
    });
  }

  async restoreRevision(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
    revisionId: string,
  ) {
    await this.assertRecord(websiteId, tenantId, collectionId, recordId);
    const revision = await this.prisma.cmsRecordRevision.findFirst({
      where: { id: revisionId, recordId },
    });
    if (!revision) throw new NotFoundException('Revision not found');
    const updated = await this.prisma.cmsRecord.update({
      where: { id: recordId },
      data: {
        data: revision.data as Prisma.InputJsonValue,
        slug: revision.slug,
        status: revision.status,
      },
    });
    await this.writeRevision(updated);
    return this.serializeRecord(updated);
  }

  async getBusinessProfile(websiteId: string, tenantId: string) {
    const website = await this.assertWebsite(websiteId, tenantId);
    return this.serializeBusinessProfile(website);
  }

  async updateBusinessProfile(
    websiteId: string,
    tenantId: string,
    dto: UpdateBusinessProfileDto,
  ) {
    const website = await this.assertWebsite(websiteId, tenantId);
    if (dto.logoUrl && !isSafeUrl(dto.logoUrl)) {
      throw cmsError('INVALID_URL', 'logoUrl must be a safe URL');
    }
    if (dto.favicon && !isSafeUrl(dto.favicon)) {
      throw cmsError('INVALID_URL', 'favicon must be a safe URL');
    }
    if (dto.website && !isSafeUrl(dto.website)) {
      throw cmsError('INVALID_URL', 'website must be a safe URL');
    }
    const locations = dto.locations !== undefined ? parseLocations(dto.locations) : undefined;

    await this.prisma.$transaction([
      this.prisma.business.update({
        where: { id: website.businessId },
        data: {
          ...(dto.name !== undefined && { name: dto.name }),
          ...(dto.description !== undefined && { description: dto.description }),
          ...(dto.logoUrl !== undefined && { logoUrl: dto.logoUrl }),
          ...(dto.email !== undefined && { email: dto.email }),
          ...(dto.phone !== undefined && { phone: dto.phone }),
          ...(dto.address !== undefined && { address: dto.address }),
          ...(dto.city !== undefined && { city: dto.city }),
          ...(dto.state !== undefined && { state: dto.state }),
          ...(dto.country !== undefined && { country: dto.country }),
          ...(dto.zipCode !== undefined && { zipCode: dto.zipCode }),
          ...(dto.website !== undefined && { website: dto.website }),
          ...(dto.socialMedia !== undefined && { socialMedia: dto.socialMedia }),
          ...(dto.businessHours !== undefined && {
            businessHours: dto.businessHours as Prisma.InputJsonValue,
          }),
          ...(locations !== undefined && { locations: locations as Prisma.InputJsonValue }),
        },
      }),
      ...(dto.favicon !== undefined
        ? [
            this.prisma.website.update({
              where: { id: website.id },
              data: { favicon: dto.favicon },
            }),
          ]
        : []),
    ]);

    return this.getBusinessProfile(websiteId, tenantId);
  }

  async resolvePublishedForWebsite(
    websiteId: string,
    tenantId: string,
    doc: WebsiteDocumentV3,
  ) {
    const slugs = [...collectBoundCollectionSlugs(doc)];
    if (!slugs.length) {
      return { collections: [] };
    }
    const collections = await this.prisma.cmsCollection.findMany({
      where: { websiteId, tenantId, deletedAt: null, slug: { in: slugs } },
    });
    const publicCollections = [];
    for (const collection of collections) {
      const settings = this.readSettings(collection.settings);
      const take = Math.min(settings.publicListLimit, CMS_LIMITS.publicDefaultLimit);
      const records = await this.prisma.cmsRecord.findMany({
        where: {
          collectionId: collection.id,
          tenantId,
          websiteId,
          deletedAt: null,
          status: 'PUBLISHED',
        },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'desc' }],
        take,
      });
      publicCollections.push(
        await this.serializePublicCollection(collection, records, tenantId),
      );
    }
    return { collections: publicCollections };
  }

  async listPublicRecords(
    slugOrId: string,
    collectionSlug: string,
    dto: QueryCmsRecordsDto,
  ) {
    const website = await this.resolvePublicWebsite(slugOrId);
    const collection = await this.prisma.cmsCollection.findFirst({
      where: {
        websiteId: website.id,
        tenantId: website.tenantId,
        slug: collectionSlug,
        deletedAt: null,
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    const pageSize = Math.min(dto.pageSize || CMS_LIMITS.defaultPageSize, CMS_LIMITS.publicMaxPageSize);
    return this.listRecords(website.id, website.tenantId, collection.id, {
      ...dto,
      pageSize,
      status: 'PUBLISHED',
    }, true);
  }

  async getPublicRecord(slugOrId: string, collectionSlug: string, recordSlug: string) {
    const website = await this.resolvePublicWebsite(slugOrId);
    const collection = await this.prisma.cmsCollection.findFirst({
      where: {
        websiteId: website.id,
        tenantId: website.tenantId,
        slug: collectionSlug,
        deletedAt: null,
      },
    });
    if (!collection) throw new NotFoundException('Collection not found');
    const record = await this.prisma.cmsRecord.findFirst({
      where: {
        collectionId: collection.id,
        tenantId: website.tenantId,
        slug: recordSlug,
        deletedAt: null,
        status: 'PUBLISHED',
      },
    });
    if (!record) throw new NotFoundException('Record not found');
    const media = await this.expandMedia(
      website.tenantId,
      this.collectMediaIds(this.readFields(collection.fields), record.data),
    );
    return {
      collection: {
        id: collection.id,
        slug: collection.slug,
        name: collection.name,
      },
      record: this.serializeRecord(record),
      media,
    };
  }

  private async resolvePublicWebsite(slugOrId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { slug: slugOrId },
      include: { websites: { take: 1, orderBy: { createdAt: 'asc' } } },
    });
    if (tenant?.websites?.[0]) {
      if (tenant.status === 'BLOCKED' || tenant.status === 'SUSPENDED') {
        throw new NotFoundException('Website not found');
      }
      return tenant.websites[0];
    }
    const website = await this.prisma.website.findFirst({
      where: { OR: [{ slug: slugOrId }, { id: slugOrId }] },
      include: { tenant: true },
    });
    if (!website || website.tenant.status === 'BLOCKED' || website.tenant.status === 'SUSPENDED') {
      throw new NotFoundException('Website not found');
    }
    return website;
  }

  private async ensurePresets(websiteId: string, tenantId: string) {
    const existing = await this.prisma.cmsCollection.findMany({
      where: { websiteId, tenantId, deletedAt: null },
    });
    const slugs = new Set(existing.map((item) => item.slug));
    for (const preset of listSeedPresets()) {
      if (slugs.has(preset.slug)) continue;
      try {
        const created = await this.prisma.cmsCollection.create({
          data: {
            tenantId,
            websiteId,
            name: preset.name,
            slug: preset.slug,
            description: preset.description,
            fields: preset.fields as unknown as Prisma.InputJsonValue,
            settings: preset.settings as unknown as Prisma.InputJsonValue,
            presetKey: preset.key,
            isBuiltin: true,
          },
        });
        existing.push(created);
        slugs.add(preset.slug);
      } catch (error) {
        if (this.isUniqueError(error)) continue;
        throw error;
      }
    }
    return existing;
  }

  private async validateIncomingRecord(
    websiteId: string,
    tenantId: string,
    collection: { id: string; slug: string },
    fields: CollectionField[],
    settings: CollectionSettings,
    payload: Record<string, unknown>,
    currentRecordId?: string,
  ) {
    const siblings = await this.prisma.cmsRecord.findMany({
      where: {
        collectionId: collection.id,
        deletedAt: null,
        slug: { not: null },
        ...(currentRecordId ? { NOT: { id: currentRecordId } } : {}),
      },
      select: { slug: true },
    });
    const existingSlugs = new Set(
      siblings.map((item) => item.slug).filter((value): value is string => Boolean(value)),
    );

    return validateRecordData(fields, payload, settings, {
      currentRecordId,
      existingSlugs,
      uniqueValueExists: async (fieldId, value) => {
        const found = await this.prisma.cmsRecord.findFirst({
          where: {
            collectionId: collection.id,
            deletedAt: null,
            ...(currentRecordId ? { NOT: { id: currentRecordId } } : {}),
            data: { path: [fieldId], equals: value as Prisma.InputJsonValue },
          },
          select: { id: true },
        });
        return Boolean(found);
      },
      mediaOwned: async (mediaId) => {
        const media = await this.prisma.media.findUnique({ where: { id: mediaId } });
        return Boolean(media && media.tenantId === tenantId);
      },
      recordInCollection: async (collectionSlug, recordId) => {
        const target = await this.prisma.cmsCollection.findFirst({
          where: { websiteId, tenantId, slug: collectionSlug, deletedAt: null },
        });
        if (!target) return null;
        const referenced = await this.prisma.cmsRecord.findFirst({
          where: {
            id: recordId,
            collectionId: target.id,
            websiteId,
            tenantId,
            deletedAt: null,
          },
          select: { id: true },
        });
        return referenced;
      },
    });
  }

  private async writeRevision(record: {
    id: string;
    data: Prisma.JsonValue;
    slug: string | null;
    status: CmsRecordStatusValue;
  }) {
    await this.prisma.cmsRecordRevision.create({
      data: {
        recordId: record.id,
        data: record.data as Prisma.InputJsonValue,
        slug: record.slug,
        status: record.status,
      },
    });
    const extras = await this.prisma.cmsRecordRevision.findMany({
      where: { recordId: record.id },
      orderBy: { createdAt: 'desc' },
      skip: CMS_LIMITS.maxRevisionsKept,
      select: { id: true },
    });
    if (extras.length) {
      await this.prisma.cmsRecordRevision.deleteMany({
        where: { id: { in: extras.map((item) => item.id) } },
      });
    }
  }

  private async assertWebsite(websiteId: string, tenantId: string) {
    const website = await this.prisma.website.findUnique({
      where: { id: websiteId },
      include: { business: true },
    });
    if (!website) throw new NotFoundException('Website not found');
    if (website.tenantId !== tenantId) throw new ForbiddenException('Access denied');
    return website;
  }

  private async assertCollection(websiteId: string, tenantId: string, collectionId: string) {
    const collection = await this.prisma.cmsCollection.findUnique({
      where: { id: collectionId },
    });
    if (!collection || collection.deletedAt) throw new NotFoundException('Collection not found');
    if (collection.tenantId !== tenantId || collection.websiteId !== websiteId) {
      throw new ForbiddenException('Access denied');
    }
    return collection;
  }

  private async assertRecord(
    websiteId: string,
    tenantId: string,
    collectionId: string,
    recordId: string,
  ) {
    const record = await this.prisma.cmsRecord.findUnique({ where: { id: recordId } });
    if (!record || record.deletedAt) throw new NotFoundException('Record not found');
    if (
      record.tenantId !== tenantId ||
      record.websiteId !== websiteId ||
      record.collectionId !== collectionId
    ) {
      throw new ForbiddenException('Access denied');
    }
    return record;
  }

  private async assertCollectionCount(websiteId: string) {
    const count = await this.prisma.cmsCollection.count({
      where: { websiteId, deletedAt: null },
    });
    if (count >= CMS_LIMITS.maxCollectionsPerWebsite) {
      throw cmsError('COLLECTION_LIMIT', 'This website has reached the collection limit');
    }
  }

  private async assertRecordCount(collectionId: string) {
    const count = await this.prisma.cmsRecord.count({
      where: { collectionId, deletedAt: null },
    });
    if (count >= CMS_LIMITS.maxRecordsPerCollection) {
      throw cmsError('RECORD_LIMIT', 'This collection has reached the record limit');
    }
  }

  private async assertCollectionSlugFree(websiteId: string, slug: string, exceptId?: string) {
    const existing = await this.prisma.cmsCollection.findFirst({
      where: {
        websiteId,
        slug,
        ...(exceptId ? { NOT: { id: exceptId } } : {}),
      },
    });
    if (existing) {
      const taken = new Set(
        (
          await this.prisma.cmsCollection.findMany({
            where: { websiteId },
            select: { slug: true },
          })
        ).map((item) => item.slug),
      );
      slugConflict(slug, suggestCmsSlug(slug, taken));
    }
  }

  private assertSystemFieldsPreserved(previous: CollectionField[], next: CollectionField[]) {
    const nextIds = new Set(next.map((field) => field.id));
    for (const field of previous) {
      if (field.system && !nextIds.has(field.id)) {
        throw cmsError('INVALID_FIELDS', `System field "${field.id}" cannot be removed`);
      }
    }
  }

  private toQuery(dto: QueryCmsRecordsDto): CmsRecordQuery {
    return {
      q: dto.q,
      status: dto.status,
      page: dto.page || 1,
      pageSize: Math.min(dto.pageSize || CMS_LIMITS.defaultPageSize, CMS_LIMITS.maxPageSize),
      sort: dto.sort || 'sortOrder',
      order: dto.order || 'asc',
      filters: parseFilters(dto.filters),
    };
  }

  private readFields(value: Prisma.JsonValue): CollectionField[] {
    return parseCollectionFields(value);
  }

  private readSettings(value: Prisma.JsonValue | null): CollectionSettings {
    return parseCollectionSettings(value ?? {});
  }

  private serializeCollection(collection: {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    fields: Prisma.JsonValue;
    settings: Prisma.JsonValue | null;
    presetKey: string | null;
    isBuiltin: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt: Date | null;
  }) {
    return {
      id: collection.id,
      name: collection.name,
      slug: collection.slug,
      description: collection.description,
      fields: this.readFields(collection.fields),
      settings: this.readSettings(collection.settings),
      presetKey: collection.presetKey,
      isBuiltin: collection.isBuiltin,
      createdAt: collection.createdAt,
      updatedAt: collection.updatedAt,
    };
  }

  private serializeRecord(record: {
    id: string;
    collectionId: string;
    slug: string | null;
    status: string;
    data: Prisma.JsonValue;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }) {
    return {
      id: record.id,
      collectionId: record.collectionId,
      slug: record.slug,
      status: record.status,
      data: record.data,
      sortOrder: record.sortOrder,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  private async serializePublicCollection(
    collection: {
      id: string;
      slug: string;
      name: string;
      fields: Prisma.JsonValue;
    },
    records: Array<{
      id: string;
      collectionId: string;
      slug: string | null;
      status: string;
      data: Prisma.JsonValue;
      sortOrder: number;
      createdAt: Date;
      updatedAt: Date;
    }>,
    tenantId: string,
  ) {
    const fields = this.readFields(collection.fields);
    const mediaIds = new Set<string>();
    for (const record of records) {
      for (const id of this.collectMediaIds(fields, record.data)) mediaIds.add(id);
    }
    return {
      id: collection.id,
      slug: collection.slug,
      name: collection.name,
      fields: fields.map((field) => ({ id: field.id, name: field.name, type: field.type })),
      records: records.map((record) => this.serializeRecord(record)),
      media: await this.expandMedia(tenantId, [...mediaIds]),
    };
  }

  private collectMediaIds(fields: CollectionField[], data: Prisma.JsonValue): string[] {
    if (!data || typeof data !== 'object' || Array.isArray(data)) return [];
    const record = data as Record<string, unknown>;
    const ids: string[] = [];
    for (const field of fields) {
      if (field.type !== 'image' && field.type !== 'media') continue;
      const value = record[field.id];
      if (typeof value === 'string') ids.push(value);
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item === 'string') ids.push(item);
        }
      }
    }
    return ids;
  }

  private async expandMedia(tenantId: string, ids: string[]) {
    if (!ids.length) return {};
    const rows = await this.prisma.media.findMany({
      where: { tenantId, id: { in: ids } },
      select: { id: true, url: true, altText: true, mimeType: true },
    });
    return Object.fromEntries(
      rows.map((row) => [row.id, { url: row.url, altText: row.altText, mimeType: row.mimeType }]),
    );
  }

  private serializeBusinessProfile(website: {
    id: string;
    name: string;
    favicon: string | null;
    business: {
      id: string;
      name: string;
      description: string | null;
      category: string | null;
      logoUrl: string | null;
      email: string | null;
      phone: string | null;
      whatsapp: string | null;
      address: string | null;
      city: string | null;
      state: string | null;
      country: string | null;
      zipCode: string | null;
      website: string | null;
      socialMedia: Prisma.JsonValue | null;
      businessHours: Prisma.JsonValue | null;
      locations: Prisma.JsonValue | null;
    };
  }) {
    const business = website.business;
    return {
      website: {
        id: website.id,
        name: website.name,
        favicon: website.favicon,
      },
      business: {
        id: business.id,
        name: business.name,
        description: business.description,
        category: business.category,
        logoUrl: business.logoUrl,
        email: business.email,
        phone: business.phone,
        whatsapp: business.whatsapp,
        address: business.address,
        city: business.city,
        state: business.state,
        country: business.country,
        zipCode: business.zipCode,
        website: business.website,
        socialMedia: business.socialMedia,
        businessHours: business.businessHours,
        locations: business.locations ?? [],
      },
    };
  }

  private isUniqueError(error: unknown): boolean {
    return Boolean(
      error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code?: string }).code === 'P2002',
    );
  }

  private rethrowUnique(error: unknown, slug: string): never {
    if (this.isUniqueError(error)) {
      slugConflict(slug, `${slug}-2`);
    }
    throw error;
  }
}
