-- M4 CMS: additive only. Does not drop or rewrite M1–M3 tables.

DO $$ BEGIN
  CREATE TYPE "CmsRecordStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

ALTER TABLE "Business" ADD COLUMN IF NOT EXISTS "locations" JSONB;

CREATE TABLE IF NOT EXISTS "CmsCollection" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "websiteId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "description" TEXT,
  "fields" JSONB NOT NULL,
  "settings" JSONB,
  "presetKey" TEXT,
  "isBuiltin" BOOLEAN NOT NULL DEFAULT false,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CmsCollection_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CmsRecord" (
  "id" TEXT NOT NULL,
  "tenantId" TEXT NOT NULL,
  "websiteId" TEXT NOT NULL,
  "collectionId" TEXT NOT NULL,
  "slug" TEXT,
  "status" "CmsRecordStatus" NOT NULL DEFAULT 'DRAFT',
  "data" JSONB NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "deletedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CmsRecord_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "CmsRecordRevision" (
  "id" TEXT NOT NULL,
  "recordId" TEXT NOT NULL,
  "data" JSONB NOT NULL,
  "slug" TEXT,
  "status" "CmsRecordStatus" NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CmsRecordRevision_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CmsCollection_websiteId_slug_key" ON "CmsCollection"("websiteId", "slug");
CREATE INDEX IF NOT EXISTS "CmsCollection_tenantId_idx" ON "CmsCollection"("tenantId");
CREATE INDEX IF NOT EXISTS "CmsCollection_websiteId_idx" ON "CmsCollection"("websiteId");
CREATE INDEX IF NOT EXISTS "CmsCollection_tenantId_websiteId_idx" ON "CmsCollection"("tenantId", "websiteId");
CREATE INDEX IF NOT EXISTS "CmsCollection_websiteId_deletedAt_idx" ON "CmsCollection"("websiteId", "deletedAt");
CREATE INDEX IF NOT EXISTS "CmsCollection_presetKey_idx" ON "CmsCollection"("presetKey");

CREATE UNIQUE INDEX IF NOT EXISTS "CmsRecord_collectionId_slug_key" ON "CmsRecord"("collectionId", "slug");
CREATE INDEX IF NOT EXISTS "CmsRecord_tenantId_idx" ON "CmsRecord"("tenantId");
CREATE INDEX IF NOT EXISTS "CmsRecord_websiteId_idx" ON "CmsRecord"("websiteId");
CREATE INDEX IF NOT EXISTS "CmsRecord_collectionId_idx" ON "CmsRecord"("collectionId");
CREATE INDEX IF NOT EXISTS "CmsRecord_collectionId_status_idx" ON "CmsRecord"("collectionId", "status");
CREATE INDEX IF NOT EXISTS "CmsRecord_websiteId_status_idx" ON "CmsRecord"("websiteId", "status");
CREATE INDEX IF NOT EXISTS "CmsRecord_tenantId_websiteId_status_idx" ON "CmsRecord"("tenantId", "websiteId", "status");
CREATE INDEX IF NOT EXISTS "CmsRecord_slug_idx" ON "CmsRecord"("slug");
CREATE INDEX IF NOT EXISTS "CmsRecord_createdAt_idx" ON "CmsRecord"("createdAt");
CREATE INDEX IF NOT EXISTS "CmsRecord_updatedAt_idx" ON "CmsRecord"("updatedAt");
CREATE INDEX IF NOT EXISTS "CmsRecord_collectionId_deletedAt_status_idx" ON "CmsRecord"("collectionId", "deletedAt", "status");
CREATE INDEX IF NOT EXISTS "CmsRecord_websiteId_deletedAt_idx" ON "CmsRecord"("websiteId", "deletedAt");

CREATE INDEX IF NOT EXISTS "CmsRecordRevision_recordId_idx" ON "CmsRecordRevision"("recordId");
CREATE INDEX IF NOT EXISTS "CmsRecordRevision_recordId_createdAt_idx" ON "CmsRecordRevision"("recordId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "CmsCollection"
    ADD CONSTRAINT "CmsCollection_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CmsCollection"
    ADD CONSTRAINT "CmsCollection_websiteId_fkey"
    FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CmsRecord"
    ADD CONSTRAINT "CmsRecord_tenantId_fkey"
    FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CmsRecord"
    ADD CONSTRAINT "CmsRecord_websiteId_fkey"
    FOREIGN KEY ("websiteId") REFERENCES "Website"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CmsRecord"
    ADD CONSTRAINT "CmsRecord_collectionId_fkey"
    FOREIGN KEY ("collectionId") REFERENCES "CmsCollection"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  ALTER TABLE "CmsRecordRevision"
    ADD CONSTRAINT "CmsRecordRevision_recordId_fkey"
    FOREIGN KEY ("recordId") REFERENCES "CmsRecord"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;
