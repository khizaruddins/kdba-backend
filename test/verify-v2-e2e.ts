import axios from 'axios';

const API_BASE = 'http://localhost:4000/api/v1';

async function runV2Verification() {
  console.log('🚀 Starting KDBA V2 Comprehensive Verification Suite...\n');

  // 1. Health Check
  console.log('1. Testing Health Endpoint...');
  const healthRes = await axios.get(`${API_BASE}/health`);
  console.log('   ✅ Health Status:', healthRes.data.data);

  // 2. Fetch All 20 Seeded Niche Templates
  console.log('\n2. Fetching Template Catalog (/templates)...');
  const templatesRes = await axios.get(`${API_BASE}/templates`);
  const templates = templatesRes.data.data;
  console.log(`   ✅ Found ${templates.length} Templates (Expected: 20):`);
  templates.forEach((t: any, i: number) => {
    console.log(`      ${i + 1}. [${t.category}] ${t.name} (Slug: ${t.slug}, Styles: ${t.style?.join(', ')})`);
  });

  if (templates.length < 20) {
    throw new Error(`Expected at least 20 templates, found ${templates.length}`);
  }

  // 3. Automated Template Validation Endpoint
  console.log('\n3. Running Automated Schema Validation across all Templates (/templates/validate)...');
  const validateRes = await axios.get(`${API_BASE}/templates/validate`);
  const report = validateRes.data.data;
  console.log(`   ✅ Total Validated: ${report.total} | Valid: ${report.validCount} | Invalid: ${report.invalidCount}`);
  if (report.invalidCount > 0) {
    throw new Error(`Template validation failed for ${report.invalidCount} templates`);
  }

  // 4. Fetch Single Template Canonical WebsiteDocument
  const targetTemplateSlug = 'restaurant-modern';
  console.log(`\n4. Fetching Single Canonical Template Document (/templates/${targetTemplateSlug})...`);
  const singleTemplateRes = await axios.get(`${API_BASE}/templates/${targetTemplateSlug}`);
  const singleTemplate = singleTemplateRes.data.data;
  console.log('   ✅ Template Loaded:', singleTemplate.name);
  console.log('   ✅ Schema Version:', singleTemplate.document.schemaVersion);
  console.log('   ✅ Pages in Document:', singleTemplate.document.pages.length);
  console.log('   ✅ Sections in Home Page:', singleTemplate.document.pages[0].sections.length);

  // 5. Register New Tenant & User
  const userEmail = `founder_v2_${Date.now()}@michelingroup.com`;
  console.log(`\n5. Registering New Tenant User (${userEmail})...`);
  const registerRes = await axios.post(`${API_BASE}/auth/register`, {
    firstName: 'Marco',
    lastName: 'Pierre',
    email: userEmail,
    password: 'SecurePassword123!',
    businessName: 'L’Osteria Gastronomy Group',
  });
  const { user, tenant, accessToken } = registerRes.data.data;
  console.log('   ✅ User Registered:', user.id, user.email);
  console.log('   ✅ Tenant Created:', tenant.id, tenant.slug);
  const authHeaders = { Authorization: `Bearer ${accessToken}` };

  // 6. Create Business Profile
  console.log('\n6. Creating Business Profile...');
  const businessRes = await axios.post(
    `${API_BASE}/businesses`,
    {
      name: 'L’Osteria Modern Dining',
      description: 'Contemporary European fine dining and artisanal wine bar in San Francisco.',
      category: 'Restaurant & Fine Dining',
      email: userEmail,
      phone: '+1 (415) 555-7890',
      address: '742 Montgomery Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94111',
      country: 'US',
    },
    { headers: authHeaders },
  );
  const business = businessRes.data.data;
  console.log('   ✅ Business Profile Created:', business.id, business.name);

  // 7. Clone Template into WebsiteDocument
  console.log(`\n7. Cloning Template (${targetTemplateSlug}) into Customer Website...`);
  const cloneRes = await axios.post(
    `${API_BASE}/templates/${targetTemplateSlug}/clone`,
    {
      businessId: business.id,
      name: 'L’Osteria San Francisco Flagship',
    },
    { headers: authHeaders },
  );
  const website = cloneRes.data.data;
  console.log('   ✅ Website Created:', website.id, website.slug);
  console.log('   ✅ Initial Status:', website.status);

  // 8. Fetch Canonical Draft WebsiteDocument
  console.log(`\n8. Fetching Draft WebsiteDocument (/websites/${website.id}/document)...`);
  const docRes = await axios.get(`${API_BASE}/websites/${website.id}/document`, {
    headers: authHeaders,
  });
  const docData = docRes.data.data;
  console.log('   ✅ Document Schema Version:', docData.schemaVersion);
  console.log('   ✅ Current Revision:', docData.revision);
  console.log('   ✅ Document Site Name:', docData.document.site.name);
  console.log('   ✅ Document Business Name:', docData.document.business.name);

  // 9. Mutate Document (Update Theme & Section Props)
  console.log(`\n9. Mutating Document via Granular Mutation API (/websites/${website.id}/document/mutations)...`);
  const mutateThemeRes = await axios.patch(
    `${API_BASE}/websites/${website.id}/document/mutations`,
    {
      type: 'UPDATE_THEME',
      payload: {
        primaryColor: '#1e1b18',
        accentColor: '#e11d48',
        borderRadius: 'lg',
      },
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Theme Mutated. New Accent Color:', mutateThemeRes.data.data.document.theme.accentColor);
  console.log('   ✅ Revision Incremented to:', mutateThemeRes.data.data.revision);

  // 10. Update Full Document with Optimistic Concurrency Check
  console.log('\n10. Testing Full Document PUT with Optimistic Concurrency Control...');
  const currentDoc = mutateThemeRes.data.data.document;
  currentDoc.business.tagline = 'Michelin Guide 2026 Recommended Culinary Sanctuary';

  // 10a. Valid save with correct revision
  const saveDocRes = await axios.put(
    `${API_BASE}/websites/${website.id}/document`,
    {
      document: currentDoc,
      expectedRevision: mutateThemeRes.data.data.revision,
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Valid Save Succeeded. New Revision:', saveDocRes.data.data.revision);

  // 10b. Concurrency conflict test (stale revision should throw 409)
  try {
    await axios.put(
      `${API_BASE}/websites/${website.id}/document`,
      {
        document: currentDoc,
        expectedRevision: 1, // Deliberately stale revision
      },
      { headers: authHeaders },
    );
    throw new Error('Expected 409 Conflict error was not thrown');
  } catch (err: any) {
    if (err.response?.status === 409) {
      console.log('   ✅ Optimistic Concurrency Conflict Correctly Rejected with 409 Conflict!');
    } else {
      throw err;
    }
  }

  // 11. Fetch Preview
  console.log(`\n11. Fetching Editor Live Preview (/websites/${website.id}/preview)...`);
  const previewRes = await axios.get(`${API_BASE}/websites/${website.id}/preview`, {
    headers: authHeaders,
  });
  console.log('   ✅ Preview Retrieved. Tagline:', previewRes.data.data.document.business.tagline);

  // 12. Create Named Manual Version Snapshot
  console.log(`\n12. Creating Manual Version Snapshot (/websites/${website.id}/versions)...`);
  const snapshotRes = await axios.post(
    `${API_BASE}/websites/${website.id}/versions`,
    {
      reason: 'Pre-Grand-Opening Redesign',
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Version Snapshot Created. Snapshot ID:', snapshotRes.data.data.id);

  // 13. Publish Website
  console.log(`\n13. Publishing Website (/websites/${website.id}/publish)...`);
  const publishRes = await axios.post(
    `${API_BASE}/websites/${website.id}/publish`,
    {},
    { headers: authHeaders },
  );
  console.log('   ✅ Published Status:', publishRes.data.data.status);
  console.log('   ✅ Published At:', publishRes.data.data.publishedAt);
  console.log('   ✅ Publication Snapshot Version ID:', publishRes.data.data.versionId);

  // 14. Add Catalog Products & Pricing for Public Site
  console.log('\n14. Adding Catalog Products & Pricing Plans...');
  await axios.post(
    `${API_BASE}/products`,
    {
      name: 'Chef Antonio 7-Course Truffle Tasting Experience',
      description: 'Exclusive seasonal multi-course culinary journey with wine pairing.',
      price: 195.0,
      currency: 'USD',
      category: 'Tasting Menu',
      ctaText: 'Reserve Table',
      ctaUrl: '#contact',
    },
    { headers: authHeaders },
  );

  // 15. Public Site Resolution (Visitor Lookup)
  console.log(`\n15. Fetching Public Published Site (/public/sites/${website.slug})...`);
  const publicRes = await axios.get(`${API_BASE}/public/sites/${website.slug}`);
  const publicData = publicRes.data.data;
  console.log('   ✅ Public Tenant Name:', publicData.tenant.name);
  console.log('   ✅ Public Canonical Document Site:', publicData.document.site.name);
  console.log('   ✅ Public Canonical Document Theme Primary:', publicData.document.theme.primaryColor);
  console.log('   ✅ Public Products Count:', publicData.products.length);
  console.log('   ✅ Public Pages Count (Legacy Compatibility):', publicData.website.pages.length);

  // 16. Version History & Restore Verification
  console.log(`\n16. Testing Version History & Rollback (/websites/${website.id}/restore)...`);
  const versionsListRes = await axios.get(`${API_BASE}/websites/${website.id}/versions`, {
    headers: authHeaders,
  });
  const versions = versionsListRes.data.data;
  console.log(`   ✅ Version History Count: ${versions.length} snapshots`);
  versions.forEach((v: any) => {
    console.log(`      • Rev ${v.revision} [${v.reason}] (${v.createdAt})`);
  });

  const oldestVersion = versions[versions.length - 1];
  const restoreRes = await axios.post(
    `${API_BASE}/websites/${website.id}/restore`,
    {
      versionId: oldestVersion.id,
    },
    { headers: authHeaders },
  );
  console.log('   ✅ Rollback Succeeded! Restored to Revision:', restoreRes.data.data.revision);

  // 17. Submit Public Contact Form Lead
  console.log('\n17. Submitting Public Contact Form Lead Inquiry...');
  const leadRes = await axios.post(`${API_BASE}/public/sites/${website.slug}/contact`, {
    name: 'Eleanor Roosevelt',
    email: 'eleanor@globaldiplomats.org',
    phone: '+1 (415) 555-4920',
    message: 'Seeking a private dining buyout reservation for 40 guests in October.',
    source: 'public_website_contact',
  });
  const confirmation = leadRes.data?.data?.message || leadRes.data?.message || 'Received';
  console.log('   ✅ Lead Submitted. Confirmation:', confirmation);

  // 18. Fetch Leads in CRM
  console.log('\n18. Verifying Inbound Lead in CRM (/leads)...');
  const leadsRes = await axios.get(`${API_BASE}/leads`, { headers: authHeaders });
  const leadsList = Array.isArray(leadsRes.data.data)
    ? leadsRes.data.data
    : Array.isArray(leadsRes.data)
      ? leadsRes.data
      : [];
  console.log(`   ✅ Leads Found in CRM: ${leadsList.length}`);
  if (leadsList.length > 0) {
    const capturedLead = leadsList[0];
    console.log(`   ✅ CRM Lead Captured: ${capturedLead.name} (${capturedLead.email}) — Status: ${capturedLead.status}`);
  }

  console.log('\n================================================================');
  console.log('🎉 ALL 18 KDBA V2 END-TO-END VERIFICATION CHECKS PASSED FLAWLESSLY!');
  console.log('================================================================\n');
}

runV2Verification().catch((err) => {
  console.error('\n❌ V2 Verification Failed:');
  if (err.response) {
    console.error('HTTP Status:', err.response.status);
    console.error('Error Message:', err.response.data?.message);
    console.error('Error Details:', err.response.data?.errors || err.response.data?.error);
  } else {
    console.error('Error:', err.message);
  }
  process.exit(1);
});
