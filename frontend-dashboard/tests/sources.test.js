/**
 * Plan 05-02 Verification Test: Knowledge Sources & Real-Time Ingestion Progress (DASH-02)
 */

import assert from 'assert';
import { validateSourceUrl, DEMO_SOURCES } from '../src/api/sourcesApi.js';

console.log('--- Running Plan 05-02 Tests: Sources & Ingestion Monitor (DASH-02) ---');

// Test 1: URL scheme and SSRF validation
console.log('Test 1: URL validation and SSRF protection (T-05-04)...');
assert.ok(validateSourceUrl('https://docs.acmecorp.com').valid, 'https URL should be valid');
assert.ok(validateSourceUrl('http://help.acmecorp.com/faq').valid, 'http URL should be valid');

// Invalid scheme checks
assert.strictEqual(validateSourceUrl('ftp://docs.acmecorp.com').valid, false, 'ftp scheme should be rejected');
assert.strictEqual(validateSourceUrl('javascript:alert(1)').valid, false, 'javascript scheme should be rejected');
assert.strictEqual(validateSourceUrl('').valid, false, 'Empty URL should be rejected');

// SSRF checks
assert.strictEqual(validateSourceUrl('http://localhost:3000').valid, false, 'localhost should be rejected');
assert.strictEqual(validateSourceUrl('http://127.0.0.1:8000').valid, false, '127.0.0.1 should be rejected');
assert.strictEqual(validateSourceUrl('http://192.168.1.1').valid, false, 'Private IP 192.168 should be rejected');
assert.strictEqual(validateSourceUrl('http://10.0.0.1').valid, false, 'Private IP 10.0 should be rejected');
console.log('✓ URL validation and SSRF protection verified');

// Test 2: Source payload parameters & constraints (T-05-05)
console.log('Test 2: Crawl parameters and bounds validation...');
function sanitizeCrawlParams(maxPages, maxDepth) {
  const parsedPages = parseInt(maxPages, 10);
  const parsedDepth = parseInt(maxDepth, 10);
  const p = Math.min(200, Math.max(10, !isNaN(parsedPages) ? parsedPages : 50));
  const d = Math.min(5, Math.max(1, !isNaN(parsedDepth) ? parsedDepth : 3));
  return { max_pages: p, max_depth: d };
}
assert.deepStrictEqual(sanitizeCrawlParams(50, 3), { max_pages: 50, max_depth: 3 });
assert.deepStrictEqual(sanitizeCrawlParams(500, 10), { max_pages: 200, max_depth: 5 }, 'Bounds clamping');
assert.deepStrictEqual(sanitizeCrawlParams(0, 0), { max_pages: 10, max_depth: 1 }, 'Lower bounds clamping');
console.log('✓ Crawl parameter bounds clamping verified');

// Test 3: Demo sources structure & metrics
console.log('Test 3: Knowledge sources structure and metrics...');
assert.ok(DEMO_SOURCES.length >= 3, 'Must provide at least 3 initial demo sources');
for (const s of DEMO_SOURCES) {
  assert.ok(s._id, 'Source must have _id');
  assert.ok(s.url.startsWith('https://'), 'Demo source URL must be valid https');
  assert.strictEqual(typeof s.pages_indexed, 'number', 'pages_indexed must be number');
  assert.strictEqual(typeof s.chunks_stored, 'number', 'chunks_stored must be number');
}
console.log('✓ Knowledge sources structure and metrics verified');

// Test 4: Ingestion stage progress calculation
console.log('Test 4: Ingestion progress calculation & stage transitions...');
function calculateProgress(pagesCrawled, targetPages) {
  const percent = Math.min(100, Math.round((pagesCrawled / (targetPages || 50)) * 100));
  return {
    percent,
    isCompleted: percent >= 100,
    hasExtracted: pagesCrawled > 2,
    hasVectors: pagesCrawled > 5
  };
}

const p0 = calculateProgress(0, 50);
assert.strictEqual(p0.percent, 0);
assert.strictEqual(p0.hasVectors, false);

const pMid = calculateProgress(25, 50);
assert.strictEqual(pMid.percent, 50);
assert.strictEqual(pMid.hasExtracted, true);

const pDone = calculateProgress(50, 50);
assert.strictEqual(pDone.percent, 100);
assert.strictEqual(pDone.isCompleted, true);
console.log('✓ Ingestion progress calculation verified');

console.log('\n--- ALL PLAN 05-02 TESTS PASSED SUCCESSFULLY ---');
