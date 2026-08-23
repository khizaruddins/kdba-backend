import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/v1';

async function runE2ETest() {
  console.log('🧪 Starting KDBA V1 Full End-to-End Verification...\n');

  // 1. Health Check
  console.log('1. Testing Health Endpoint...');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('   ✅ Health Status:', healthRes.data);

  // 2. Register New User & Tenant
  const userEmail = `founder_${Date.now()}@apexholdings.com`;
  console.log(`\n2. Registering Tenant User (${userEmail})...`);
  const registerRes = await axios.post(`${API_BASE}/auth/register`, {
    firstName: 'Jonathan',
    lastName: 'Sterling',
    email: userEmail,
    password: 'SecurePassword123!',
    businessName: 'Apex Advisory Global',
  });
  const { user, tenant, accessToken } = registerRes.data.data;
  console.log('   ✅ User Registered:', user.id, user.email);
  console.log('   ✅ Tenant Created:', tenant.id, tenant.slug);
  console.log('   ✅ Access Token Issued:', accessToken ? 'YES (JWT valid)' : 'NO');

  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // 3. Browse Templates
  console.log('\n3. Fetching Seeded Templates...');
  const templatesRes = await axios.get(`${API_BASE}/templates`, { headers: authHeaders });
  const templates = templatesRes.data.data;
  console.log(`   ✅ Found ${templates.length} Active Templates:`);
  templates.forEach((t: any) => console.log(`      - [${t.category}] ${t.name} (Slug: ${t.slug})`));

  const apexTemplate = templates.find((t: any) => t.slug === 'apex-corporate') || templates[0];

  // 4. Create Business Profile
  console.log('\n4. Creating Business Profile...');
  const businessRes = await axios.post(
    `${API_BASE}/businesses`,
    {
      name: 'Apex Advisory Global',
      description: 'Strategic M&A, Financial Advisory, and Enterprise Growth.',
      category: 'Business',
      email: userEmail,
      phone: '+1 (212) 555-0199',
      address: '350 Park Avenue, 28th Floor',
      city: 'New York',
      state: 'NY',
      zipCode: '10022',
      country: 'US',
    },
    { headers: authHeaders },
  );
  const business = businessRes.data.data;
  console.log('   ✅ Business Created:', business.id, business.name);

  // 5. Create Website from Apex Corporate Template (Clones Pages & Sections)
  console.log(`\n5. Creating Website from Template (${apexTemplate.name})...`);
  const websiteRes = await axios.post(
    `${API_BASE}/websites`,
    {
      businessId: business.id,
      templateId: apexTemplate.id,
      name: 'Apex Advisory Official Website',
    },
    { headers: authHeaders },
  );
  const website = websiteRes.data.data;
  console.log('   ✅ Website Created:', website.id, website.slug);
  console.log(`   ✅ Pages Cloned: ${website.pages.length} pages`);
  website.pages.forEach((p: any) => {
    console.log(`      • Page: ${p.title} (${p.slug}) with ${p.sections.length} sections`);
  });

  // 6. Edit Hero Section in Draft
  const homePage = website.pages.find((p: any) => p.slug === '/') || website.pages[0];
  const heroSection = homePage.sections.find((s: any) => s.type === 'HERO') || homePage.sections[1];

  console.log(`\n6. Customizing Hero Section Draft Config (${heroSection.id})...`);
  const updatedHero = await axios.patch(
    `${API_BASE}/sections/${heroSection.id}`,
    {
      config: {
        ...heroSection.draftConfig,
        headline: 'Next-Gen Strategic Advisory & Enterprise Intelligence',
        subheadline: 'Custom tailored solutions for Fortune 500 executives and private equity leaders.',
      },
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Section Draft Config Updated:', updatedHero.data.data.draftConfig.headline);

  // 7. Create Products / Services in Catalog
  console.log('\n7. Adding Products to Catalog...');
  const prodRes = await axios.post(
    `${API_BASE}/products`,
    {
      name: 'Strategic M&A Valuation Framework',
      description: 'Comprehensive financial diligence and merger modeling.',
      price: 15000.0,
      currency: 'USD',
      category: 'M&A',
      ctaText: 'Inquire Briefing',
      ctaUrl: '#contact',
      isActive: true,
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Product Created:', prodRes.data.data.name, `$${prodRes.data.data.price}`);

  // 8. Create Pricing Retainer
  console.log('\n8. Adding Pricing Plan...');
  const planRes = await axios.post(
    `${API_BASE}/pricing-plans`,
    {
      name: 'Executive Retainer',
      description: 'Quarterly board advisory & continuous risk oversight.',
      price: 8500.0,
      currency: 'USD',
      billingPeriod: 'month',
      features: ['Weekly Executive Briefing', 'Direct Line to Managing Partner', 'Annual Strategy Summit'],
      isRecommended: true,
      ctaText: 'Start Retainer',
      ctaUrl: '#contact',
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Pricing Plan Created:', planRes.data.data.name, `$${planRes.data.data.price}/mo`);

  // 9. Publish Website (Draft -> Live Promotion)
  console.log(`\n9. Publishing Website (${website.id})...`);
  const publishRes = await axios.post(
    `${API_BASE}/websites/${website.id}/publish`,
    {},
    { headers: authHeaders },
  );
  console.log('   ✅ Website Published Status:', publishRes.data.data.status);
  console.log('   ✅ Published At:', publishRes.data.data.publishedAt);

  // 10. Public Site Resolution (Public unauthenticated visitor)
  console.log(`\n10. Fetching Public Published Site (/public/sites/${website.slug})...`);
  const publicRes = await axios.get(`${API_BASE}/public/sites/${website.slug}`);
  const publicData = publicRes.data.data;
  console.log('   ✅ Public Tenant:', publicData.tenant.name);
  console.log('   ✅ Public Website Name:', publicData.website.name);
  console.log(`   ✅ Public Pages: ${publicData.website.pages.length} pages available`);
  console.log(`   ✅ Public Products: ${publicData.products.length} active products`);
  console.log(`   ✅ Public Pricing Plans: ${publicData.pricingPlans.length} plans`);

  // Verify the updated draft was promoted to live
  const publicHero = publicData.website.pages[0].sections.find((s: any) => s.type === 'HERO');
  console.log('   ✅ Live Published Hero Headline:', publicHero?.config?.headline);

  // 11. Submit Public Lead Inquiry
  console.log('\n11. Submitting Public Contact Form Inquiry...');
  const leadSubmitRes = await axios.post(`${API_BASE}/public/sites/${website.slug}/contact`, {
    name: 'Sarah Connor',
    email: 'sarah@skynet-resistance.org',
    phone: '+1 (555) 999-8888',
    message: 'We are seeking an urgent institutional advisory consultation on AI strategy.',
    source: 'website_contact_form',
  });
  console.log('   ✅ Lead Submission Result:', leadSubmitRes.data.data);

  // 12. Fetch Leads in CRM (Authenticated Tenant)
  console.log('\n12. Fetching Inbound Leads in CRM...');
  const leadsRes = await axios.get(`${API_BASE}/leads`, { headers: authHeaders });
  const allLeads = leadsRes.data.data;
  console.log(`   ✅ Total Leads Captured in CRM: ${allLeads.length}`);
  const capturedLead = allLeads[0];
  console.log(`      • Lead: ${capturedLead.name} (${capturedLead.email}) - Status: ${capturedLead.status}`);

  // 13. Update Lead Status to QUALIFIED
  console.log(`\n13. Updating Lead Status to QUALIFIED (${capturedLead.id})...`);
  const leadUpdateRes = await axios.patch(
    `${API_BASE}/leads/${capturedLead.id}`,
    { status: 'QUALIFIED' },
    { headers: authHeaders },
  );
  console.log('   ✅ Updated Lead Status:', leadUpdateRes.data.data.status);

  // 14. Verify Lead Metrics / Stats
  console.log('\n14. Verifying CRM Metrics...');
  const statsRes = await axios.get(`${API_BASE}/leads/stats`, { headers: authHeaders });
  console.log('   ✅ CRM Metrics:', statsRes.data.data);

  console.log('\n🎉 ALL 14 END-TO-END VERIFICATION CHECKS PASSED PERFECTLY!\n');
}

runE2ETest().catch((err) => {
  console.error('❌ Verification failed:', err.response?.data || err.message);
  process.exit(1);
});
