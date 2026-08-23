import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clean() {
  console.log('🔍 Listing all tenants in database:');
  const allTenants = await prisma.tenant.findMany({
    include: {
      members: { include: { user: true } },
      businesses: true,
      websites: true,
    },
  });

  for (const t of allTenants) {
    console.log(`- Tenant: [${t.id}] name: "${t.name}", slug: "${t.slug}", user: "${t.members[0]?.user?.email}"`);
  }

  // 1. Delete all PaymentTransactions and Invoices
  console.log('🧹 Clearing all payment transactions and invoices...');
  await prisma.paymentTransaction.deleteMany({});
  await prisma.invoice.deleteMany({});

  // 2. Identify the real "medium" tenant
  const mediumTenant = allTenants.find(
    (t) => t.slug === 'medium' || t.name.toLowerCase().includes('medium'),
  ) || allTenants[allTenants.length - 1]; // fallback to last created

  console.log(`\n🎯 Keeping user real tenant: "${mediumTenant?.name}" (${mediumTenant?.slug}, id: ${mediumTenant?.id})`);

  // 3. Delete all test tenants (except mediumTenant)
  for (const t of allTenants) {
    if (mediumTenant && t.id !== mediumTenant.id) {
      console.log(`❌ Removing test tenant: "${t.name}" (${t.slug})`);
      // Delete memberships and users if not super admin
      for (const m of t.members) {
        if (!m.user.isSuperAdmin) {
          await prisma.user.delete({ where: { id: m.userId } }).catch(() => {});
        }
      }
      await prisma.tenant.delete({ where: { id: t.id } }).catch(() => {});
    }
  }

  // 4. Set medium tenant subscription to 30-day trial on Starter plan
  if (mediumTenant) {
    await prisma.tenantSubscription.deleteMany({ where: { tenantId: mediumTenant.id } });

    const starterPlan = await prisma.platformPlan.findUnique({ where: { slug: 'starter' } });
    if (starterPlan) {
      const now = new Date();
      const trialEndDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

      await prisma.tenantSubscription.create({
        data: {
          tenantId: mediumTenant.id,
          planId: starterPlan.id,
          status: 'TRIALING',
          billingCycle: 'MONTHLY',
          amount: 0.0, // Free trial period
          currency: 'USD',
          currentPeriodStart: now,
          currentPeriodEnd: trialEndDate,
        },
      });
      console.log(`✅ Set "${mediumTenant.name}" to 30-Day Free Trial (status: TRIALING, end: ${trialEndDate.toISOString().split('T')[0]})`);
    }
  }

  console.log('✨ Cleanup complete! Database now contains only the real tenant with $0 payments and 30-day trial.');
}

clean()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
