import assert from 'assert';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { renderMarkdown, escapeHtml } from '../src/utils/markdown.js';
import { createCitationBadges, formatCitationLabel } from '../src/components/citations.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple DOM environment simulator for Node.js
class MockElement {
  constructor(tag = 'div') {
    this.tagName = tag.toUpperCase();
    this.children = [];
    this.attributes = new Map();
    this.textContent = '';
    this.innerHTML = '';
  }
  setAttribute(k, v) { this.attributes.set(k, String(v)); }
  getAttribute(k) { return this.attributes.get(k) || null; }
  appendChild(child) {
    this.children.push(child);
    return child;
  }
}

global.document = {
  createElement: (tag) => new MockElement(tag)
};

async function runBundleTests() {
  console.log('--- Running Plan 04-02 Tests: Markdown, Citations & Bundle Size ---');

  // Test 1: Markdown formatting and XSS sanitization (WIDG-04, T-04-03)
  console.log('Test 1: Markdown formatting & XSS sanitization...');
  
  // 1a: Formatting entities
  const mdInput = '**Bold statement** and *italic word* with `inline code`.\n\n- Feature 1\n- Feature 2\n\n[Acme Home](https://acme.com)';
  const rendered = renderMarkdown(mdInput);
  assert.ok(rendered.includes('<strong>Bold statement</strong>'), 'Must format bold');
  assert.ok(rendered.includes('<em>italic word</em>'), 'Must format italic');
  assert.ok(rendered.includes('<code>inline code</code>'), 'Must format code');
  assert.ok(rendered.includes('<ul>') && rendered.includes('<li>Feature 1</li>'), 'Must format lists');
  assert.ok(rendered.includes('<a href="https://acme.com" target="_blank" rel="noopener noreferrer">Acme Home</a>'), 'Must format external links');

  // 1b: Strict XSS escaping
  const xssInput = '<script>alert("hacked")</script><img src=x onerror=alert(1)>';
  const xssRendered = renderMarkdown(xssInput);
  assert.strictEqual(xssRendered.includes('<script>'), false, 'Raw script tags must not be rendered');
  assert.strictEqual(xssRendered.includes('<img'), false, 'Raw img tags must not be rendered');
  assert.ok(xssRendered.includes('&lt;script&gt;'), 'Script tag must be escaped to &lt;script&gt;');
  assert.ok(xssRendered.includes('&lt;img'), 'Img tag must be escaped to &lt;img');
  console.log('✓ Markdown formatting and XSS sanitization verified');

  // Test 2: Source citation badge generation (WIDG-05)
  console.log('Test 2: Source citation badge pill formatting...');
  assert.strictEqual(formatCitationLabel('https://docs.acme.com/api/v1/auth'), 'api › auth');
  assert.strictEqual(formatCitationLabel('https://company.com/faq'), 'faq');

  const citations = [
    'https://docs.acme.com/api/v1/auth',
    'https://docs.acme.com/api/v1/auth', // duplicate
    'https://company.com/faq'
  ];

  const badges = createCitationBadges(citations);
  assert.ok(badges !== null, 'Badges container must be created');
  assert.strictEqual(badges.children.length, 2, 'Badges container should have title and list');

  const list = badges.children[1];
  assert.strictEqual(list.children.length, 2, 'Duplicate citations must be deduplicated into 2 badges');
  assert.strictEqual(list.children[0].getAttribute('href'), 'https://docs.acme.com/api/v1/auth');
  console.log('✓ Citation badges generated and deduplicated successfully');

  // Test 3: Standalone bundle verification (<40KB) (WIDG-01)
  console.log('Test 3: Standalone bundle file & size verification (WIDG-01)...');
  const bundlePath = path.resolve(__dirname, '../dist/widget.js');
  assert.ok(fs.existsSync(bundlePath), 'dist/widget.js must exist after build');

  const stats = fs.statSync(bundlePath);
  const sizeBytes = stats.size;
  const sizeKb = (sizeBytes / 1024).toFixed(2);
  console.log(`Bundle size: ${sizeKb} KB (${sizeBytes} bytes)`);

  const MAX_SIZE_BYTES = 40 * 1024; // 40KB
  assert.ok(
    sizeBytes < MAX_SIZE_BYTES,
    `Widget bundle must be < 40KB. Actual size: ${sizeKb} KB`
  );

  const bundleContent = fs.readFileSync(bundlePath, 'utf8');
  assert.ok(
    bundleContent.includes('supermemory-chat'),
    'Bundle must register supermemory-chat custom element'
  );
  assert.ok(
    bundleContent.includes(':host'),
    'Bundle must contain scoped shadow DOM styles'
  );
  console.log('✓ dist/widget.js verified: standalone IIFE bundle < 40KB');

  console.log('\n--- ALL PLAN 04-02 TESTS PASSED SUCCESSFULLY ---');
}

runBundleTests().catch((err) => {
  console.error('Bundle test failed:', err);
  process.exit(1);
});
