process.env.NODE_ENV = 'test';
const assert = require('assert');
const { requireWidgetAuth, isDomainAllowed, extractHostname } = require('../src/middlewares/widgetAuth');
const { widgetRateLimiter } = require('../src/middlewares/rateLimiter');
const { getWidgetConfig, handleWidgetChat } = require('../src/controllers/widgetController');
const Conversation = require('../src/models/Conversation');

async function runWidgetGatewayTests() {
  console.log('--- Running Plan 03-03 Tests: Widget Gateway, Whitelist & Rate Limiter ---');

  // Test 1: Domain Whitelist matching logic (AUTH-03)
  console.log('Test 1: Domain Whitelist checking...');
  assert.strictEqual(isDomainAllowed('https://acme.com/page', ['*']), true, 'Wildcard * should allow any domain');
  assert.strictEqual(isDomainAllowed('https://acme.com', ['acme.com']), true, 'Exact domain should match');
  assert.strictEqual(isDomainAllowed('https://docs.acme.com', ['*.acme.com']), true, 'Subdomain wildcard should match docs.acme.com');
  assert.strictEqual(isDomainAllowed('https://evil-site.com', ['acme.com', '*.acme.com']), false, 'Disallowed origin should return false');
  assert.strictEqual(isDomainAllowed(null, ['acme.com']), false, 'Missing origin on restricted domain should return false');
  console.log('✓ Domain whitelist matching logic verified');

  // Test 2: Hostname extraction utility
  console.log('Test 2: Hostname extraction...');
  assert.strictEqual(extractHostname('https://help.company.com:8080/path'), 'help.company.com');
  assert.strictEqual(extractHostname('localhost:3000'), 'localhost');
  console.log('✓ Hostname extraction verified');

  // Test 3: Widget Authentication Middleware (AUTH-03)
  console.log('Test 3: requireWidgetAuth middleware...');
  // 3a: Missing widget key returns 401
  let status401 = null;
  let body401 = null;
  const reqNoKey = {
    headers: {},
    query: {},
    app: { get: () => null }
  };
  const resNoKey = {
    status(code) {
      status401 = code;
      return { json: (b) => { body401 = b; } };
    }
  };
  await requireWidgetAuth(reqNoKey, resNoKey, () => {});
  assert.strictEqual(status401, 401, 'Missing widget key must return HTTP 401');
  assert.ok(body401.error.includes('Widget key required'));

  // 3b: Valid key with authorized origin passes
  let nextCalled = false;
  const mockWorkspace = {
    _id: '654321098765432109876543',
    name: 'Acme Knowledge',
    widget_key: 'wk_live_test_valid_key',
    allowed_domains: ['acme.com', 'localhost'],
    widget_settings: {
      bot_name: 'Acme Bot',
      primary_color: '#2563EB',
      welcome_message: 'Hi from Acme!',
      position: 'bottom-right'
    }
  };

  const reqValid = {
    headers: {
      'x-widget-key': 'wk_live_test_valid_key',
      origin: 'https://acme.com'
    },
    query: {},
    app: { get: () => mockWorkspace }
  };
  await requireWidgetAuth(reqValid, {}, () => { nextCalled = true; });
  assert.strictEqual(nextCalled, true, 'Valid widget key and origin must call next()');
  assert.strictEqual(reqValid.workspace.name, 'Acme Knowledge', 'req.workspace should be attached');

  // 3c: Valid key with unauthorized origin returns 403 Forbidden
  let status403 = null;
  let body403 = null;
  const reqSpoofedOrigin = {
    headers: {
      'x-widget-key': 'wk_live_test_valid_key',
      origin: 'https://attacker-domain.org'
    },
    query: {},
    app: { get: () => mockWorkspace }
  };
  const resSpoofed = {
    status(code) {
      status403 = code;
      return { json: (b) => { body403 = b; } };
    }
  };
  await requireWidgetAuth(reqSpoofedOrigin, resSpoofed, () => {
    assert.fail('next() must not be called for unauthorized origin');
  });
  assert.strictEqual(status403, 403, 'Unauthorized origin must return HTTP 403 Forbidden');
  assert.ok(body403.error.includes('Origin domain not authorized'));
  console.log('✓ requireWidgetAuth passes authorized calls and blocks missing keys (401) & unauthorized origins (403)');

  // Test 4: Sliding-Window Rate Limiter (QUEUE-04)
  console.log('Test 4: Sliding-window rate limiter...');
  const limiter = widgetRateLimiter({ limit: 3, windowSeconds: 2 });
  const mockReqLimit = {
    headers: {},
    socket: { remoteAddress: '203.0.113.195' },
    workspace: { _id: 'workspace_test_limiter' }
  };

  let hit1 = false, hit2 = false, hit3 = false, hit4 = false;
  let rateLimitStatus = null;
  const mockResLimit = {
    setHeader() {},
    status(code) {
      rateLimitStatus = code;
      return { json: () => {} };
    }
  };

  await limiter(mockReqLimit, mockResLimit, () => { hit1 = true; });
  await limiter(mockReqLimit, mockResLimit, () => { hit2 = true; });
  await limiter(mockReqLimit, mockResLimit, () => { hit3 = true; });
  await limiter(mockReqLimit, mockResLimit, () => { hit4 = true; });

  assert.strictEqual(hit1, true, 'Request 1 should pass');
  assert.strictEqual(hit2, true, 'Request 2 should pass');
  assert.strictEqual(hit3, true, 'Request 3 should pass');
  assert.strictEqual(hit4, false, 'Request 4 exceeding limit should be blocked');
  assert.strictEqual(rateLimitStatus, 429, 'Blocked request must return HTTP 429');
  console.log('✓ Rate limiter throttles bursts and returns HTTP 429');

  // Test 5: Widget configuration endpoint
  console.log('Test 5: Widget configuration controller...');
  let configStatus = null;
  let configBody = null;
  const reqConfig = { workspace: mockWorkspace };
  const resConfig = {
    status(code) {
      configStatus = code;
      return { json: (b) => { configBody = b; } };
    }
  };
  getWidgetConfig(reqConfig, resConfig);
  assert.strictEqual(configStatus, 200);
  assert.strictEqual(configBody.widget_settings.bot_name, 'Acme Bot');
  assert.strictEqual(configBody.widget_settings.primary_color, '#2563EB');
  console.log('✓ Widget config returned brand theme and settings');

  // Test 6: Chat gateway SSE streaming and persistence (QUEUE-04)
  console.log('Test 6: Chat gateway SSE stream proxy...');
  const writtenChunks = [];
  const sseHeaders = {};
  let streamEnded = false;

  const reqChat = {
    body: {
      message: 'What is your refund policy?',
      session_id: 'sess_test_12345'
    },
    workspace: mockWorkspace,
    headers: { origin: 'https://acme.com' },
    socket: { remoteAddress: '127.0.0.1' }
  };

  const resChat = {
    setHeader(k, v) { sseHeaders[k] = v; },
    flushHeaders() {},
    write(chunk) { writtenChunks.push(chunk); },
    end() { streamEnded = true; }
  };

  await handleWidgetChat(reqChat, resChat);

  assert.strictEqual(sseHeaders['Content-Type'], 'text/event-stream', 'Must set text/event-stream header');
  assert.strictEqual(streamEnded, true, 'Stream must be ended');
  assert.ok(writtenChunks.length >= 1, 'Should write response chunks');
  assert.ok(writtenChunks.some((c) => c.includes('[DONE]')), 'Must emit [DONE] event');
  console.log('✓ Chat gateway streamed tokens via SSE and emitted [DONE]');

  console.log('\n--- ALL PLAN 03-03 TESTS PASSED SUCCESSFULLY ---');
}

runWidgetGatewayTests().catch((err) => {
  console.error('Widget gateway test failed:', err);
  process.exit(1);
});
