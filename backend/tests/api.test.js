const test = require('node:test');
const assert = require('node:assert');
const request = require('supertest');
const app = require('../src/app');
const aiServiceClient = require('../src/services/aiServiceClient');
const s3Service = require('../src/services/s3Service');
const { isAwsConfigured } = require('../src/config/s3Client');

test('CivicHelp Express Gateway API Test Suite', async (t) => {

  await t.test('1. GET / — Root endpoint serves compiled React SPA or service info', async () => {
    const res = await request(app).get('/');
    assert.strictEqual(res.status, 200);
    if (res.headers['content-type']?.includes('text/html')) {
      assert.ok(res.text.includes('<!doctype html>') || res.text.includes('CivicHelp AI'));
    } else {
      assert.ok(res.body.message.includes('CivicHelp AI'));
    }
  });

  await t.test('2. GET /api/health — Health endpoint reports Gateway, FastAPI, and S3 status', async () => {
    const res = await request(app).get('/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'healthy');
    assert.ok(res.body.gateway);
    assert.ok(res.body.services.aiService);
    assert.ok(res.body.services.awsS3);
    assert.strictEqual(typeof res.body.services.awsS3.configured, 'boolean');
  });

  await t.test('3. GET /api/services — Lists verified citizen services from registry or AI service', async () => {
    const res = await request(app).get('/api/services');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.services);
    assert.ok(Array.isArray(res.body.services));
    assert.strictEqual(res.body.count, 6);
    
    const titles = res.body.services.map(s => s.title);
    assert.ok(titles.some(t => t.includes('Aadhaar')));
    assert.ok(titles.some(t => t.includes('Passport')));
    assert.ok(titles.some(t => t.includes('Driving Licence')));
    assert.ok(titles.some(t => t.includes('PAN')));
  });

  await t.test('4. POST /api/civic/analyze — Validates request and rejects empty query', async () => {
    const res = await request(app)
      .post('/api/civic/analyze')
      .send({ query: '   ' });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
    assert.ok(res.body.message.includes('empty'));
  });

  await t.test('5. POST /api/civic/analyze — Validates request and rejects oversized query (>1000 chars)', async () => {
    const oversizedQuery = 'A'.repeat(1050);
    const res = await request(app)
      .post('/api/civic/analyze')
      .send({ query: oversizedQuery });

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.error, 'Validation Error');
    assert.ok(res.body.message.includes('maximum allowed limit'));
  });

  await t.test('6. POST /api/civic/analyze — PII Sanitizer detects and strips sensitive Aadhaar/PAN numbers', async () => {
    // Mock the aiServiceClient.analyzeQuery for isolated unit testing
    const originalAnalyze = aiServiceClient.analyzeQuery;
    let interceptedQuery = '';

    aiServiceClient.analyzeQuery = async (query, lang) => {
      interceptedQuery = query;
      return {
        problem_understood: 'Assistance with Aadhaar update',
        service_name: 'Aadhaar Card — Demographic & Mobile Update',
        authority: 'UIDAI',
        summary: 'Step-by-step guidance provided',
        required_documents: ['Proof of Address'],
        steps: ['Visit portal', 'Submit details'],
        fees: '₹75.00',
        timeline: '5-15 days',
        warnings: ['Do not share OTP'],
        official_sources: [],
        action_checklist: ['Check documents'],
        confidence_score: 0.95,
        insufficient_information: false
      };
    };

    try {
      const res = await request(app)
        .post('/api/civic/analyze')
        .send({
          query: 'My Aadhaar number is 9876 5432 1098 and PAN is ABCDE1234F. How do I change address?',
          language: 'en'
        });

      assert.strictEqual(res.status, 200);
      assert.ok(interceptedQuery.includes('[REDACTED_AADHAAR_NUMBER]'));
      assert.ok(interceptedQuery.includes('[REDACTED_PAN_NUMBER]'));
      assert.ok(!interceptedQuery.includes('9876 5432 1098'));
      assert.ok(!interceptedQuery.includes('ABCDE1234F'));
      assert.strictEqual(res.body.gateway_meta.pii_detected_and_redacted, true);
    } finally {
      aiServiceClient.analyzeQuery = originalAnalyze;
    }
  });

  await t.test('7. GET /api/aws/vault-status — Correctly handles unconfigured AWS credentials safely', async () => {
    const res = await request(app).get('/api/aws/vault-status');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.bucket);
    assert.ok(res.body.region);
    assert.strictEqual(typeof res.body.configured, 'boolean');
    assert.strictEqual(res.body.localFilesCount, 7); // 6 schemes + 1 registry
    assert.ok(Array.isArray(res.body.localFiles));
  });

  await t.test('8. POST /api/aws/sync — Gracefully handles missing AWS credentials with informative error', async () => {
    if (!isAwsConfigured()) {
      const res = await request(app).post('/api/aws/sync');
      assert.strictEqual(res.status, 400);
      assert.ok(res.body.message.includes('not configured'));
    }
  });

  await t.test('9. 404 Handler — Non-existent API routes return structured 404 JSON', async () => {
    const res = await request(app).get('/api/non-existent-endpoint');
    assert.strictEqual(res.status, 404);
    assert.strictEqual(res.body.error, 'Not Found');
  });

});
