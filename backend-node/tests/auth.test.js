const assert = require('assert');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { generateToken, requireAuth, requireWorkspaceAccess, JWT_SECRET } = require('../src/middlewares/auth');
const Workspace = require('../src/models/Workspace');
const User = require('../src/models/User');

async function runTests() {
  console.log('--- Running Plan 03-01 Tests: Auth & Multi-Tenancy ---');

  // Test 1: Password hashing and verification
  console.log('Test 1: Password hashing and comparison...');
  const plainPassword = 'CompanyAdminSecure123!';
  const salt = await bcrypt.genSalt(10);
  const hash = await bcrypt.hash(plainPassword, salt);
  const isMatch = await bcrypt.compare(plainPassword, hash);
  const isWrongMatch = await bcrypt.compare('WrongPassword', hash);
  assert.strictEqual(isMatch, true, 'bcrypt should match correct password');
  assert.strictEqual(isWrongMatch, false, 'bcrypt should reject incorrect password');
  console.log('✓ Password hashing and verification passed');

  // Test 2: JWT token generation and validation
  console.log('Test 2: JWT token generation and decoding...');
  const mockUser = { id: '654321098765432109876543', email: 'admin@acme.com' };
  const token = generateToken(mockUser);
  assert.ok(token && typeof token === 'string', 'generateToken should produce a string');
  const decoded = jwt.verify(token, JWT_SECRET);
  assert.strictEqual(decoded.id, mockUser.id, 'Decoded token should match user id');
  assert.strictEqual(decoded.email, mockUser.email, 'Decoded token should match email');
  console.log('✓ JWT token generation and verification passed');

  // Test 3: Workspace widget_key & api_key generation format
  console.log('Test 3: Workspace key formatting...');
  const testWorkspace = new Workspace({
    name: 'Acme Corp Memory',
    owner_id: mockUser.id
  });
  assert.ok(testWorkspace.widget_key.startsWith('wk_live_'), 'widget_key must start with wk_live_');
  assert.ok(testWorkspace.api_key.startsWith('sk_live_'), 'api_key must start with sk_live_');
  assert.strictEqual(testWorkspace.allowed_domains[0], '*', 'default allowed_domains should contain *');
  assert.strictEqual(testWorkspace.widget_settings.bot_name, 'SuperMemory AI', 'default bot name should match');
  console.log('✓ Workspace widget_key and defaults passed');

  // Test 4: Multi-tenant isolation middleware check (AUTH-04)
  console.log('Test 4: Cross-tenant access rejection (AUTH-04)...');
  const ownerA = '654321098765432109876543';
  const ownerB = '999999999999999999999999';

  // Mock Workspace.findById
  const originalFindById = Workspace.findById;
  Workspace.findById = async function (id) {
    return {
      _id: id,
      name: "Tenant A's Workspace",
      owner_id: { toString: () => ownerA }
    };
  };

  try {
    // 4a: Same tenant authorized
    let nextCalled = false;
    const reqAuthorized = {
      params: { workspaceId: '111111111111111111111111' },
      body: {},
      headers: {},
      query: {},
      user: { id: ownerA }
    };
    const resAuthorized = {};
    await requireWorkspaceAccess(reqAuthorized, resAuthorized, () => { nextCalled = true; });
    assert.strictEqual(nextCalled, true, 'Authorized owner should be granted access');

    // 4b: Different tenant rejected with 403 Forbidden
    let statusCode = null;
    let errorResponse = null;
    const reqCrossTenant = {
      params: { workspaceId: '111111111111111111111111' },
      body: {},
      headers: {},
      query: {},
      user: { id: ownerB } // Tenant B attempting to access Tenant A's workspace
    };
    const resForbidden = {
      status(code) {
        statusCode = code;
        return {
          json(data) {
            errorResponse = data;
          }
        };
      }
    };
    await requireWorkspaceAccess(reqCrossTenant, resForbidden, () => {
      assert.fail('next() should not be called for unauthorized cross-tenant request');
    });

    assert.strictEqual(statusCode, 403, 'Cross-tenant request must return HTTP 403 Forbidden');
    assert.ok(errorResponse && errorResponse.error.includes('Unauthorized cross-tenant access'), 'Must return cross-tenant error message');
    console.log('✓ Cross-tenant request rejected with HTTP 403 Forbidden');
  } finally {
    Workspace.findById = originalFindById;
  }

  // Test 5: Server health probe response
  console.log('Test 5: Express server health probe...');
  const app = require('../src/server');
  assert.ok(app && typeof app.listen === 'function', 'Express app should be exported');
  console.log('✓ Express server module loaded');

  console.log('\n--- ALL PLAN 03-01 TESTS PASSED SUCCESSFULLY ---');
}

runTests().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
