import { PrismaClient } from '@prisma/client';
import { ALL_NICHE_TEMPLATES } from '../src/templates/data/definitions';
import { DocumentValidatorService } from '../src/documents/services/document-validator.service';
import { DocumentMigrationService } from '../src/documents/services/document-migration.service';

const prisma = new PrismaClient();
const validator = new DocumentValidatorService();
const migrationService = new DocumentMigrationService(validator);

async function main() {
  console.log('🌱 Starting KDBA V2 Database Seeding...\n');

  // 1. Seed All 20 Canonical V2 Niche Templates
  console.log(`📦 1. Seeding ${ALL_NICHE_TEMPLATES.length} Canonical Niche Templates...`);
  for (const t of ALL_NICHE_TEMPLATES) {
    const validated = validator.validate(t.document);

    await prisma.template.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        description: t.description,
        category: t.category as any,
        previewImage: t.previewImage,
        style: t.style,
        theme: validated.theme as any,
        document: validated as any,
        schemaVersion: '2.0',
        version: t.version,
      },
      create: {
        id: t.id,
        name: t.name,
        slug: t.slug,
        description: t.description,
        category: t.category as any,
        previewImage: t.previewImage,
        style: t.style,
        theme: validated.theme as any,
        document: validated as any,
        schemaVersion: '2.0',
        version: t.version,
      },
    });
    console.log(`   ✅ Seeded template: [${t.category}] ${t.name} (${t.slug})`);
  }

  // 2. Seed Platform Plans
  console.log('\n💳 2. Seeding Platform Plans...');
  const plans = [
    {
      name: 'Starter',
      slug: 'starter',
      description: 'Perfect for small businesses and independent professionals.',
      monthlyPrice: 29.0,
      yearlyPrice: 290.0,
      currency: 'USD',
      features: ['1 Website', 'Custom Domain Support', '500MB Media Storage', 'Contact Form & Leads CRM', 'Standard SSL Certificate'],
      maxWebsites: 1,
      maxProducts: 10,
      maxMediaStorageMb: 500,
      isPopular: false,
      sortOrder: 0,
    },
    {
      name: 'Professional',
      slug: 'professional',
      description: 'Ideal for growing companies, creative studios, and multi-location clinics.',
      monthlyPrice: 79.0,
      yearlyPrice: 790.0,
      currency: 'USD',
      features: ['5 Websites', 'All 20 Premium Templates', '5GB Media Storage', 'Version Snapshots & History', 'Priority Support', 'Full Leads CRM & Analytics'],
      maxWebsites: 5,
      maxProducts: 50,
      maxMediaStorageMb: 5120,
      isPopular: true,
      sortOrder: 1,
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'For high-growth agencies, multi-brand holding groups, and large enterprises.',
      monthlyPrice: 199.0,
      yearlyPrice: 1990.0,
      currency: 'USD',
      features: ['Unlimited Websites', 'Custom Bespoke Templates', '50GB Media Storage', 'Dedicated Account Manager', 'Custom API Webhooks', '99.99% Uptime SLA'],
      maxWebsites: 100,
      maxProducts: 1000,
      maxMediaStorageMb: 51200,
      isPopular: false,
      sortOrder: 2,
    },
  ];

  for (const plan of plans) {
    await prisma.platformPlan.upsert({
      where: { slug: plan.slug },
      update: plan,
      create: plan,
    });
    console.log(`   ✅ Seeded platform plan: ${plan.name} ($${plan.monthlyPrice}/mo)`);
  }

  // 3. Migrate Existing Legacy Websites to V2 WebsiteDocuments
  console.log('\n🔄 3. Checking for Legacy Websites Requiring V2 Migration...');
  const allWebsites = await prisma.website.findMany({
    include: {
      pages: {
        include: {
          sections: {
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { sortOrder: 'asc' },
      },
      business: true,
      template: true,
    },
  });

  const legacyWebsites = allWebsites.filter((w) => !w.draftDocument);

  if (legacyWebsites.length > 0) {
    console.log(`   Found ${legacyWebsites.length} legacy websites without V2 documents. Migrating...`);
    for (const site of legacyWebsites) {
      const migratedDoc = migrationService.migrateLegacyRelationalWebsite(
        site,
        site.pages,
        site.business,
        site.template,
      );

      await prisma.website.update({
        where: { id: site.id },
        data: {
          draftDocument: migratedDoc as any,
          publishedDocument: site.status === 'PUBLISHED' ? (migratedDoc as any) : null,
          schemaVersion: '2.0',
          documentRevision: 1,
        },
      });

      await prisma.websiteVersion.create({
        data: {
          websiteId: site.id,
          document: migratedDoc as any,
          schemaVersion: '2.0',
          revision: 1,
          reason: 'legacy-migration',
        },
      });

      console.log(`   ✅ Migrated legacy website: ${site.name} (${site.id})`);
    }
  } else {
    console.log('   ✅ All websites already upgraded to V2 canonical documents.');
  }

  console.log('\n🎉 KDBA V2 Database Seeding & Migration Completed Successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
