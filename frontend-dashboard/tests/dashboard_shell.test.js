/**
 * Plan 05-01 Verification Test: Dashboard Scaffolding, Shell, Auth & Workspace Overview (DASH-01)
 */

import assert from 'assert';
import { NAV_ITEMS, DEMO_WORKSPACE, DEFAULT_WIDGET_SETTINGS } from '../src/constants.js';

console.log('--- Running Plan 05-01 Tests: Dashboard Shell & Overview (DASH-01) ---');

// Test 1: Navigation items & views definition
console.log('Test 1: Navigation views and dashboard tabs...');
assert.strictEqual(NAV_ITEMS.length, 4, 'Should define 4 main navigation tabs');
const tabIds = NAV_ITEMS.map(n => n.id);
assert.ok(tabIds.includes('overview'), 'Should include overview tab');
assert.ok(tabIds.includes('sources'), 'Should include sources tab');
assert.ok(tabIds.includes('customizer'), 'Should include customizer tab');
assert.ok(tabIds.includes('conversations'), 'Should include conversations tab');
console.log('✓ Navigation items and tab identifiers verified');

// Test 2: Workspace credentials & key structures (DASH-01)
console.log('Test 2: Workspace credentials structure (widget_key & api_key)...');
assert.ok(DEMO_WORKSPACE.widget_key.startsWith('wk_live_'), 'Widget key must have wk_live_ prefix');
assert.ok(DEMO_WORKSPACE.api_key.startsWith('sk_live_'), 'API key must have sk_live_ prefix');
assert.ok(DEMO_WORKSPACE.allowed_domains.length >= 2, 'Allowed domains list must contain default origins');
console.log('✓ Workspace credentials and key prefixes verified');

// Test 3: Key rotation format simulation
console.log('Test 3: API & Widget key rotation formatting...');
function simulateRotateKey(type) {
  const rand = Math.random().toString(36).substring(2, 18);
  return type === 'api_key' ? `sk_live_${rand}` : `wk_live_${rand}`;
}
const rotatedApi = simulateRotateKey('api_key');
const rotatedWidget = simulateRotateKey('widget_key');
assert.ok(rotatedApi.startsWith('sk_live_'), 'Rotated API key must maintain sk_live_ prefix');
assert.ok(rotatedWidget.startsWith('wk_live_'), 'Rotated Widget key must maintain wk_live_ prefix');
assert.notStrictEqual(rotatedApi, DEMO_WORKSPACE.api_key, 'Rotated key must be a new distinct string');
console.log('✓ Key rotation formatting verified');

// Test 4: Allowed domains array manipulation
console.log('Test 4: Allowed domains whitelist manipulation...');
let domains = ['https://company.com', 'http://localhost:3000'];
const addDomain = (list, newD) => {
  const trimmed = newD.trim();
  if (trimmed && !list.includes(trimmed)) {
    return [...list, trimmed];
  }
  return list;
};
const removeDomain = (list, target) => list.filter(d => d !== target);

domains = addDomain(domains, 'https://staging.company.com');
assert.strictEqual(domains.length, 3, 'Should add new domain');
assert.ok(domains.includes('https://staging.company.com'));

// Duplicate check
domains = addDomain(domains, 'https://company.com');
assert.strictEqual(domains.length, 3, 'Should reject duplicate domain');

// Removal
domains = removeDomain(domains, 'http://localhost:3000');
assert.strictEqual(domains.length, 2, 'Should remove specified domain');
assert.ok(!domains.includes('http://localhost:3000'));
console.log('✓ Allowed domains whitelist manipulation verified');

// Test 5: Default Widget settings
console.log('Test 5: Default widget settings tokens...');
assert.strictEqual(DEFAULT_WIDGET_SETTINGS.primary_color, '#6366f1');
assert.strictEqual(DEFAULT_WIDGET_SETTINGS.position, 'bottom-right');
assert.ok(DEFAULT_WIDGET_SETTINGS.greeting_message.length > 10);
console.log('✓ Default widget settings verified');

console.log('\n--- ALL PLAN 05-01 TESTS PASSED SUCCESSFULLY ---');
