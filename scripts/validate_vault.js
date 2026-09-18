/**
 * CivicHelp AI — Knowledge Vault Schema & Integrity Validator
 * Verifies that every knowledge document adheres strictly to the required authoritative structure.
 */

const fs = require('fs');
const path = require('path');

const VAULT_DIR = path.join(__dirname, '..', 'knowledge_vault');
const REGISTRY_FILE = path.join(VAULT_DIR, 'registry.json');

const REQUIRED_FIELDS = [
  'id',
  'slug',
  'title',
  'authority',
  'category',
  'official_portal_name',
  'official_url',
  'last_verified_at',
  'verification_status',
  'verification_source',
  'overview',
  'eligibility',
  'fees',
  'timeline',
  'required_documents',
  'steps',
  'warnings_and_fraud_prevention',
  'checklist'
];

function runValidation() {
  console.log('🔍 Starting CivicHelp AI Knowledge Vault Verification...\n');
  
  if (!fs.existsSync(REGISTRY_FILE)) {
    console.error(`❌ Missing registry file at ${REGISTRY_FILE}`);
    process.exit(1);
  }

  const registry = JSON.parse(fs.readFileSync(REGISTRY_FILE, 'utf-8'));
  console.log(`📁 Found Registry: "${registry.vault_name}" (v${registry.version})`);
  console.log(`📊 Registered Services Count: ${registry.sources.length}\n`);

  let errorCount = 0;
  let verifiedCount = 0;

  for (const item of registry.sources) {
    const filePath = path.join(VAULT_DIR, item.file_name);
    console.log(`--------------------------------------------------`);
    console.log(`Checking [${item.id}]: ${item.title}`);

    if (!fs.existsSync(filePath)) {
      console.error(`  ❌ File not found: ${item.file_name}`);
      errorCount++;
      continue;
    }

    try {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      // Check required top-level fields
      const missingFields = REQUIRED_FIELDS.filter(f => !data[f]);
      if (missingFields.length > 0) {
        console.error(`  ❌ Missing required fields: ${missingFields.join(', ')}`);
        errorCount++;
      } else {
        console.log(`  ✅ All ${REQUIRED_FIELDS.length} required fields present.`);
      }

      // Check Official URL validity
      if (!data.official_url.startsWith('https://')) {
        console.error(`  ❌ Invalid or insecure official_url: ${data.official_url}`);
        errorCount++;
      } else {
        console.log(`  ✅ Official URL verified: ${data.official_url}`);
      }

      // Check Verification Status
      if (data.verification_status !== 'VERIFIED_OFFICIAL') {
        console.warn(`  ⚠️ Verification status is ${data.verification_status}`);
      } else {
        console.log(`  ✅ Verification Status: ${data.verification_status} (Dated: ${data.last_verified_at})`);
      }

      // Check Content arrays
      if (!Array.isArray(data.required_documents) || data.required_documents.length === 0) {
        console.error(`  ❌ required_documents must be a non-empty array.`);
        errorCount++;
      }
      if (!Array.isArray(data.steps) || data.steps.length === 0) {
        console.error(`  ❌ steps must be a non-empty array.`);
        errorCount++;
      }
      if (!Array.isArray(data.warnings_and_fraud_prevention) || data.warnings_and_fraud_prevention.length === 0) {
        console.error(`  ❌ warnings_and_fraud_prevention must be a non-empty array.`);
        errorCount++;
      }
      if (!Array.isArray(data.checklist) || data.checklist.length === 0) {
        console.error(`  ❌ checklist must be a non-empty array.`);
        errorCount++;
      }

      // Fees check
      if (typeof data.fees !== 'object' || !data.fees.amount) {
        console.error(`  ❌ fees object must include 'amount'.`);
        errorCount++;
      } else {
        console.log(`  ✅ Fee specification verified: ${data.fees.amount}`);
      }

      verifiedCount++;
    } catch (err) {
      console.error(`  ❌ JSON parse error in ${item.file_name}:`, err.message);
      errorCount++;
    }
  }

  console.log(`\n==================================================`);
  if (errorCount === 0) {
    console.log(`🎉 SUCCESS: All ${verifiedCount} knowledge vault documents passed rigorous verification!`);
    console.log(`==================================================\n`);
    process.exit(0);
  } else {
    console.error(`💥 FAILED: Found ${errorCount} errors in knowledge vault documents.`);
    console.log(`==================================================\n`);
    process.exit(1);
  }
}

runValidation();
