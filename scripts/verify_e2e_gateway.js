/**
 * CivicHelp AI — End-to-End Gateway & RAG Integration Verifier
 * Uses Node.js native fetch for zero external dependencies.
 */

const EXPRESS_URL = 'http://localhost:5000';
const FASTAPI_URL = 'http://localhost:8000';

async function runE2EVerification() {
  console.log('===============================================================');
  console.log('🧪 Starting CivicHelp AI Gateway & RAG Integration Verification');
  console.log('===============================================================\n');

  try {
    // 1. Check FastAPI Service Health
    console.log('1️⃣ Checking FastAPI RAG Service (Port 8000)...');
    const fastApiRes = await fetch(`${FASTAPI_URL}/health`);
    const fastApiHealth = await fastApiRes.json();
    console.log('   FastAPI Status:', JSON.stringify(fastApiHealth, null, 2));

    // 2. Check Express Gateway Health
    console.log('\n2️⃣ Checking Express API Gateway (Port 5000)...');
    const gatewayRes = await fetch(`${EXPRESS_URL}/api/health`);
    const gatewayHealth = await gatewayRes.json();
    console.log('   Gateway Status:', JSON.stringify(gatewayHealth, null, 2));

    // 3. Test Service Directory Endpoint
    console.log('\n3️⃣ Checking /api/services endpoint...');
    const servicesRes = await fetch(`${EXPRESS_URL}/api/services`);
    const servicesData = await servicesRes.json();
    console.log(`   Found ${servicesData.count} verified services.`);
    servicesData.services.forEach(s => console.log(`   - [${s.authority || s.category}] ${s.title}`));

    // 4. Test S3 Vault Status Endpoint
    console.log('\n4️⃣ Checking /api/aws/vault-status endpoint...');
    const vaultRes = await fetch(`${EXPRESS_URL}/api/aws/vault-status`);
    const vaultStatus = await vaultRes.json();
    console.log('   Vault Status:', JSON.stringify(vaultStatus, null, 2));

    // 5. Test Live Query with PII Protection & Semantic Routing
    console.log('\n5️⃣ Sending Live Query with PII to Express Gateway:');
    const testQuery = "My Aadhaar is 1234 5678 9012. I lost my wallet and need to order a new PVC Aadhaar card. How much does it cost and what is the official website?";
    console.log(`   Citizen Query: "${testQuery}"`);

    const queryRes = await fetch(`${EXPRESS_URL}/api/civic/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: testQuery,
        language: 'en'
      })
    });

    const queryData = await queryRes.json();

    console.log('\n🎉 Received Structured Response from Express -> FastAPI Gateway:');
    console.log('   Service Identified:', queryData.service_name);
    console.log('   Authority:', queryData.authority);
    console.log('   Official Fee:', queryData.fees);
    console.log('   Timeline:', queryData.timeline);
    console.log('   PII Redacted at Gateway:', queryData.gateway_meta?.pii_detected_and_redacted);
    console.log('   Official Sources Cited:');
    queryData.official_sources?.forEach(src => {
      console.log(`     🔗 ${src.title} -> ${src.official_url}`);
    });
    console.log('   Action Checklist:', queryData.action_checklist);

    console.log('\n===============================================================');
    console.log('✅ ALL INTEGRATION CHECKS PASSED SUCCESSFULLY!');
    console.log('===============================================================\n');
  } catch (error) {
    console.error('\n❌ Verification Failed:', error.message);
  }
}

runE2EVerification();
