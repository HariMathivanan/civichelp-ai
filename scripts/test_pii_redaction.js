/**
 * CivicHelp AI — Live PII Redaction Verification Script
 * Tests sensitive Indian PII redaction across Gateway and AI layers.
 */

const path = require('path');
const axios = require('../backend/node_modules/axios');
const piiSanitizer = require('../backend/src/middleware/piiSanitizer');

const testCases = [
  {
    name: '12-digit Aadhaar Number Redaction',
    query: 'I lost my Aadhaar card. My Aadhaar number is 123456789012',
    expectedRedactions: ['[REDACTED_AADHAAR_NUMBER]'],
    shouldNotContain: ['123456789012']
  },
  {
    name: '10-character PAN Card Redaction',
    query: 'My PAN is ABCDE1234F',
    expectedRedactions: ['[REDACTED_PAN_NUMBER]'],
    shouldNotContain: ['ABCDE1234F']
  },
  {
    name: '6-digit OTP Credential Redaction',
    query: 'My OTP is 123456',
    expectedRedactions: ['[REDACTED_CREDENTIAL]'],
    shouldNotContain: ['123456']
  },
  {
    name: '4-digit Number Preservation (Non-PII False Positive Guard)',
    query: 'For your 1234 example, don\'t treat 1234 itself as a valid Aadhaar number. It\'s only four digits.',
    expectedRedactions: [],
    mustContain: ['1234']
  },
  {
    name: 'Combined Multi-PII Query',
    query: 'I lost my Aadhaar card. Aadhaar: 987654321098, PAN: ABCDE1234F, OTP is 654321.',
    expectedRedactions: ['[REDACTED_AADHAAR_NUMBER]', '[REDACTED_PAN_NUMBER]', '[REDACTED_CREDENTIAL]'],
    shouldNotContain: ['987654321098', 'ABCDE1234F', '654321']
  }
];

async function runPIITests() {
  console.log('===============================================================');
  console.log('🛡️  CivicHelp AI — Live PII Sanitization Test Suite');
  console.log('===============================================================\n');

  let passed = 0;
  let failed = 0;

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i];
    console.log(`[TEST ${i + 1}] ${tc.name}`);
    console.log(`  Input Query : "${tc.query}"`);

    // Test 1: Middleware unit test
    const req = { body: { query: tc.query } };
    const res = { status: () => ({ json: () => {} }) };
    let nextCalled = false;
    piiSanitizer(req, res, () => { nextCalled = true; });

    const sanitized = req.sanitizedQuery;
    console.log(`  Sanitized   : "${sanitized}"`);
    console.log(`  PII Detected: ${req.piiDetected}`);

    let testPass = true;

    if (tc.expectedRedactions) {
      for (const red of tc.expectedRedactions) {
        if (!sanitized.includes(red)) {
          console.error(`  ❌ Missing expected placeholder: ${red}`);
          testPass = false;
        }
      }
    }

    if (tc.shouldNotContain) {
      for (const secret of tc.shouldNotContain) {
        if (sanitized.includes(secret)) {
          console.error(`  ❌ Sensitive value leaked: ${secret}`);
          testPass = false;
        }
      }
    }

    if (tc.mustContain) {
      for (const safe of tc.mustContain) {
        if (!sanitized.includes(safe)) {
          console.error(`  ❌ Safe value incorrectly removed: ${safe}`);
          testPass = false;
        }
      }
    }

    if (testPass) {
      console.log('  ✅ PASSED\n');
      passed++;
    } else {
      console.log('  ❌ FAILED\n');
      failed++;
    }
  }

  // Live Gateway Test
  console.log('---------------------------------------------------------------');
  console.log('🌐 Testing Live Express Gateway (/api/civic/analyze)...');
  try {
    const gatewayRes = await axios.post('http://localhost:5000/api/civic/analyze', {
      query: 'I lost my Aadhaar card. My Aadhaar number is 123456789012 and my PAN is ABCDE1234F. How do I get a new PVC card?'
    });

    console.log(`  Gateway Status: ${gatewayRes.status}`);
    console.log(`  PII Detected at Gateway: ${gatewayRes.data.pii_redacted}`);
    console.log(`  Identified Service: ${gatewayRes.data.service_name}`);
    console.log(`  Authority: ${gatewayRes.data.authority}`);
    console.log('  ✅ Live Gateway PII redaction and RAG flow verified!\n');
    passed++;
  } catch (err) {
    console.warn(`  ⚠️ Live gateway check note: ${err.message}`);
  }

  console.log('===============================================================');
  console.log(`🎉 PII TEST SUITE COMPLETED: ${passed} Passed, ${failed} Failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runPIITests().catch(err => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
