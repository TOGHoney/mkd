/**
 * Plan 05-03 Verification Test: Widget Customizer, Embed Modal & Conversation Analytics (DASH-03, DASH-04, DASH-05)
 */

import assert from 'assert';
import {
  isValidHexColor,
  getLatencyBadge,
  generateEmbedSnippet,
  DEMO_CONVERSATIONS
} from '../src/api/widgetApi.js';
import { BRAND_COLOR_PRESETS } from '../src/constants.js';

console.log('--- Running Plan 05-03 Tests: Customizer & Conversations (DASH-03, DASH-04, DASH-05) ---');

// Test 1: Color hex format validation & presets (DASH-03)
console.log('Test 1: Hex color code validation and brand presets...');
assert.strictEqual(isValidHexColor('#6366f1'), true);
assert.strictEqual(isValidHexColor('#10B981'), true);
assert.strictEqual(isValidHexColor('#ffffff'), true);
assert.strictEqual(isValidHexColor('rgb(99, 102, 241)'), false, 'rgb format should be false');
assert.strictEqual(isValidHexColor('#123'), false, '3-digit hex should be false');
assert.strictEqual(isValidHexColor('blue'), false, 'named color should be false');

assert.strictEqual(BRAND_COLOR_PRESETS.length, 6, 'Should define 6 brand color presets');
for (const p of BRAND_COLOR_PRESETS) {
  assert.ok(p.name, 'Preset must have name');
  assert.ok(isValidHexColor(p.hex), `Preset hex ${p.hex} must be valid`);
}
console.log('✓ Color hex validation and brand presets verified');

// Test 2: Embed snippet script generation (DASH-04)
console.log('Test 2: Embed snippet tag generation...');
const testKey = 'wk_live_abc123xyz789';
const testHost = 'https://ai.example.com';
const snippet = generateEmbedSnippet(testKey, testHost);

assert.ok(snippet.includes('<script'), 'Must contain <script tag');
assert.ok(snippet.includes(`${testHost}/dist/widget.js`), 'Must reference dist/widget.js on host');
assert.ok(snippet.includes(`data-widget-key="${testKey}"`), 'Must inject active widget_key');
assert.ok(snippet.includes('async'), 'Must include async attribute');
console.log('✓ Embed snippet tag generation verified');

// Test 3: Response latency metrics classification (DASH-05)
console.log('Test 3: Response latency badge classification...');
const fast = getLatencyBadge(340);
assert.strictEqual(fast.status, 'fast');
assert.ok(fast.class.includes('emerald'));
assert.strictEqual(fast.label, '340ms');

const moderate = getLatencyBadge(850);
assert.strictEqual(moderate.status, 'moderate');
assert.ok(moderate.class.includes('amber'));
assert.strictEqual(moderate.label, '850ms');

const slow = getLatencyBadge(2200);
assert.strictEqual(slow.status, 'slow');
assert.ok(slow.class.includes('rose'));
assert.strictEqual(slow.label, '2200ms');
console.log('✓ Response latency badge classification verified');

// Test 4: Conversation logs structure & citations (DASH-05)
console.log('Test 4: Conversation logs telemetry & citations...');
assert.ok(DEMO_CONVERSATIONS.length >= 3, 'Must contain initial demo conversations');

for (const conv of DEMO_CONVERSATIONS) {
  assert.ok(conv.session_id.startsWith('sess_'), 'Session ID must start with sess_');
  assert.ok(conv.origin.startsWith('https://'), 'Origin must be valid URL');
  assert.strictEqual(typeof conv.latency_ms, 'number', 'Latency must be numeric ms');
  assert.ok(Array.isArray(conv.messages), 'Messages must be array');

  const assistantMsg = conv.messages.find(m => m.role === 'assistant');
  assert.ok(assistantMsg, 'Conversation must contain assistant response');
  assert.ok(Array.isArray(assistantMsg.citations), 'Assistant message must have citations array');
  assert.ok(assistantMsg.citations.length > 0, 'Assistant response must cite grounded documentation');
}
console.log('✓ Conversation logs telemetry & citations verified');

console.log('\n--- ALL PLAN 05-03 TESTS PASSED SUCCESSFULLY ---');
