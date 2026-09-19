/**
 * CivicHelp AI — Production Simulation Verifier
 * Tests production static React serving, Express gateway routing,
 * FastAPI RAG retrieval, PII redaction, S3 fallback, and out-of-scope handling.
 */

const fs = require('fs');
const path = require('path');

const BASE_URL = 'http://localhost:5000';

async function runProductionSimulation() {
  console.log('===============================================================');
  console.log('🏭 Starting CivicHelp AI Production Simulation Test');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  // 1. Verify Compiled React Frontend Static Serving
  console.log('1️⃣ Testing Production React Frontend Serving on Port 5000...');
  try {
    const res = await fetch(`${BASE_URL}/`);
    const text = await res.text();
    const contentType = res.headers.get('content-type') || '';
    
    if (res.status === 200 && contentType.includes('text/html') && text.includes('CivicHelp AI')) {
      console.log('   ✅ PASS: Compiled React SPA served successfully with HTML & metadata.');
      passed++;
    } else {
      console.error(`   ❌ FAIL: Unexpected response (status: ${res.status}, type: ${contentType})`);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAIL: Frontend reachability error:', err.message);
    failed++;
  }

  // 2. Verify Express Health Endpoint
  console.log('\n2️⃣ Testing /api/health Endpoint...');
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    const data = await res.json();
    if (res.status === 200 && data.status === 'healthy' && data.services.aiService.reachable) {
      console.log('   ✅ PASS: Health probe reports Gateway and FastAPI RAG service active.');
      passed++;
    } else {
      console.error('   ❌ FAIL: Health check failed:', data);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAIL: Health endpoint error:', err.message);
    failed++;
  }

  // 3. Verify S3 Vault Fallback Behavior (Without Cloud Credentials)
  console.log('\n3️⃣ Testing /api/aws/vault-status Fallback Handling...');
  try {
    const res = await fetch(`${BASE_URL}/api/aws/vault-status`);
    const data = await res.json();
    if (res.status === 200 && data.configured === false && data.localFilesCount === 7) {
      console.log('   ✅ PASS: S3 fallback active. 7 verified local files detected without error.');
      passed++;
    } else {
      console.error('   ❌ FAIL: Vault status unexpected response:', data);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAIL: Vault status error:', err.message);
    failed++;
  }

  // 4. Verify Live Civic Query with PII Redaction & Grounded Retrieval
  console.log('\n4️⃣ Testing Live Civic Query with PII Redaction:');
  const citizenQuery = "My Aadhaar number is 9876 5432 1098 and PAN is ABCDE1234F. I lost my Aadhaar card, what is the official fee and steps to get a PVC reprint?";
  console.log(`   Input Query: "${citizenQuery}"`);
  try {
    const res = await fetch(`${BASE_URL}/api/civic/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: citizenQuery, language: 'en' })
    });
    const data = await res.json();

    const piiRedacted = data.gateway_meta?.pii_detected_and_redacted === true;
    const correctService = data.service_name.includes('Aadhaar');
    const hasSources = data.official_sources && data.official_sources.length > 0;
    const hasChecklist = data.action_checklist && data.action_checklist.length > 0;

    if (res.status === 200 && piiRedacted && correctService && hasSources && hasChecklist) {
      console.log('   ✅ PASS: PII redacted at gateway.');
      console.log(`   ✅ PASS: Correct service matched: "${data.service_name}" (${data.authority})`);
      console.log(`   ✅ PASS: Official Source Cited: ${data.official_sources[0].official_url}`);
      console.log(`   ✅ PASS: Action checklist generated (${data.action_checklist.length} items).`);
      passed++;
    } else {
      console.error('   ❌ FAIL: Query response validation failed:', data);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAIL: Civic query error:', err.message);
    failed++;
  }

  // 5. Verify Out-of-Scope Query Refusal (Anti-Hallucination)
  console.log('\n5️⃣ Testing Out-of-Scope Query Refusal (Zero Hallucination):');
  const outOfScopeQuery = "How do I adopt a mythical fire dragon in Mumbai?";
  console.log(`   Input Query: "${outOfScopeQuery}"`);
  try {
    const res = await fetch(`${BASE_URL}/api/civic/analyze`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query: outOfScopeQuery, language: 'en' })
    });
    const data = await res.json();

    if (res.status === 200 && data.insufficient_information === true && data.official_sources.length === 0) {
      console.log('   ✅ PASS: Out-of-scope query safely rejected with insufficient_information: true.');
      console.log(`   ✅ PASS: Zero hallucinated government sources returned.`);
      passed++;
    } else {
      console.error('   ❌ FAIL: Out-of-scope query failed to refuse:', data);
      failed++;
    }
  } catch (err) {
    console.error('   ❌ FAIL: Out-of-scope query error:', err.message);
    failed++;
  }

  // 6. Security Audit: Check that no secret keys or .env files exist in context
  console.log('\n6️⃣ Security Audit (Checking for secret leaks)...');
  const rootDir = path.resolve(__dirname, '..');
  const dockerIgnorePath = path.join(rootDir, '.dockerignore');
  
  if (fs.existsSync(dockerIgnorePath)) {
    const dockerIgnoreContent = fs.readFileSync(dockerIgnorePath, 'utf-8');
    if (dockerIgnoreContent.includes('.env') && dockerIgnoreContent.includes('node_modules')) {
      console.log('   ✅ PASS: .dockerignore properly excludes .env files and node_modules.');
      passed++;
    } else {
      console.error('   ❌ FAIL: .dockerignore missing required exclusions.');
      failed++;
    }
  } else {
    console.error('   ❌ FAIL: .dockerignore does not exist.');
    failed++;
  }

  console.log('\n===============================================================');
  if (failed === 0) {
    console.log(`🎉 ALL ${passed} PRODUCTION SIMULATION CHECKS PASSED!`);
    console.log('===============================================================\n');
    process.exit(0);
  } else {
    console.error(`💥 ${failed} CHECKS FAILED out of ${passed + failed}`);
    console.log('===============================================================\n');
    process.exit(1);
  }
}

runProductionSimulation();
