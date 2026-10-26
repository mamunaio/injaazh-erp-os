/**
 * Phase 02D: Authorization & CORS Hardening Security Test Suite
 *
 * Verifies:
 * 1. Blocking 2FA Temporary Tokens from standard API access (authenticateApiRequest, middleware, handlers)
 * 2. Explicit Database Session Validation (missing sessionId, nonexistent session, revoked session rejection)
 * 3. Handler-Level Authorization for Admin Debt Endpoints (fix-debt-amounts & migrate-debts: 401 anonymous, 403 viewer/editor, 200 admin/owner)
 * 4. Zero DB mutations prior to authorization
 * 5. CORS Preflight & Origin Hardening (OPTIONS preflight passthrough for mobile, strict origin validation, no wildcard credentials)
 *
 * Run via: npx tsx tests/security/phase02d-security-remediation.test.ts
 */

import './test-env';
import { dbMutationCalls, mockSessionStore } from './test-env';

import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';
import {
  authenticateApiRequest,
  generateAuthToken,
  generate2FATempToken,
  verify2FATempToken
} from '../../lib/auth';
import { getMobileCorsHeaders, isAllowedOrigin } from '../../lib/cors';
import { GET as getMobileDashboard, OPTIONS as optionsMobileDashboard } from '../../app/api/mobile/dashboard/route';
import { POST as postFixDebtAmounts } from '../../app/api/admin/fix-debt-amounts/route';
import { POST as postMigrateDebts } from '../../app/api/admin/migrate-debts/route';
import { POST as postClients } from '../../app/api/lead-gen/clients/route';
import { GET as getFullState } from '../../app/api/lead-gen/full-state/route';

class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n===============================================================');
    console.log('🔒 Phase 02D: Authorization & CORS Hardening Automated Verification');
    console.log('===============================================================\n');

    for (const test of this.tests) {
      try {
        await test.fn();
        console.log(`  ✅ PASS: ${test.name}`);
        this.passed++;
      } catch (error: any) {
        console.error(`  ❌ FAIL: ${test.name}`);
        console.error(`     Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log('\n---------------------------------------------------------------');
    console.log(`Results: ${this.passed} passed, ${this.failed} failed out of ${this.tests.length} tests.`);
    console.log('---------------------------------------------------------------\n');

    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

// =========================================================================
// 1. BLOCK 2FA TEMPORARY TOKENS FROM STANDARD API ACCESS
// =========================================================================

runner.test('2FA Isolation: authenticateApiRequest() strictly rejects 2FA temporary token with null', async () => {
  const tempToken = await generate2FATempToken('user_2fa_pending_001');
  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    headers: { 'Authorization': `Bearer ${tempToken}` },
  });

  const authUser = await authenticateApiRequest(req);
  if (authUser !== null) {
    throw new Error(`Expected null, but authenticateApiRequest accepted 2FA temp token: ${JSON.stringify(authUser)}`);
  }
});

runner.test('2FA Isolation: POST /api/lead-gen/clients rejects 2FA temporary token with 401', async () => {
  const tempToken = await generate2FATempToken('user_2fa_pending_002');
  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tempToken}`,
    },
    body: JSON.stringify({ name: '2FA Bypassed Client' }),
  });

  const res = (await postClients(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for 2FA token, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== false) {
    throw new Error(`Expected success: false, got ${JSON.stringify(body)}`);
  }
});

runner.test('2FA Isolation: GET /api/mobile/dashboard rejects 2FA temporary token with 401', async () => {
  const tempToken = await generate2FATempToken('user_2fa_pending_003');
  const req = new Request('http://localhost:3000/api/mobile/dashboard', {
    headers: { 'Authorization': `Bearer ${tempToken}` },
  });

  const res = (await getMobileDashboard(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for 2FA token on mobile dashboard, got ${res.status}`);
  }
});

runner.test('2FA Isolation: GET /api/lead-gen/full-state rejects 2FA temporary token with 401', async () => {
  const tempToken = await generate2FATempToken('user_2fa_pending_004');
  const req = new Request('http://localhost:3000/api/lead-gen/full-state', {
    headers: { 'Authorization': `Bearer ${tempToken}` },
  });

  const res = (await getFullState(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401 Unauthorized for 2FA token on full-state, got ${res.status}`);
  }
});

runner.test('2FA Isolation: Middleware strictly rejects 2FA temporary token with 401', async () => {
  const tempToken = await generate2FATempToken('user_2fa_pending_005');
  const req = new NextRequest('http://localhost:3000/api/lead-gen/full-state', {
    headers: { 'Authorization': `Bearer ${tempToken}` },
  });

  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Middleware allowed 2FA temp token to pass! Status: ${res.status}`);
  }
});

runner.test('2FA Isolation: verify2FATempToken() preserves valid 2FA verification flow', async () => {
  const tempToken = await generate2FATempToken('user_valid_2fa_target');
  const extractedId = await verify2FATempToken(tempToken);
  if (extractedId !== 'user_valid_2fa_target') {
    throw new Error(`Expected user_valid_2fa_target, got ${extractedId}`);
  }
});

runner.test('2FA Isolation: Completed login session token with sessionId is accepted by authenticateApiRequest()', async () => {
  const completedToken = await generateAuthToken({
    id: 'user_full_login_001',
    email: 'user@injaazh.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    headers: { 'Authorization': `Bearer ${completedToken}` },
  });

  const authUser = await authenticateApiRequest(req);
  if (!authUser || authUser.id !== 'user_full_login_001' || authUser.sessionId !== 'session_mock_valid_123') {
    throw new Error(`Valid session token was unexpectedly rejected: ${JSON.stringify(authUser)}`);
  }
});

// =========================================================================
// 2. EXPLICIT DATABASE SESSION VALIDATION
// =========================================================================

runner.test('Session Validation: Token without sessionId is rejected by authenticateApiRequest()', async () => {
  const tokenNoSession = await generateAuthToken({
    id: 'user_no_session',
    email: 'nosession@injaazh.com',
    role: 'editor',
    // explicitly omitting sessionId
  });

  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    headers: { 'Authorization': `Bearer ${tokenNoSession}` },
  });

  const authUser = await authenticateApiRequest(req);
  if (authUser !== null) {
    throw new Error(`Token without sessionId was accepted by authenticateApiRequest: ${JSON.stringify(authUser)}`);
  }
});

runner.test('Session Validation: Token without sessionId is rejected by Middleware with 401', async () => {
  const tokenNoSession = await generateAuthToken({
    id: 'user_no_session',
    email: 'nosession@injaazh.com',
    role: 'editor',
    // explicitly omitting sessionId
  });

  const req = new NextRequest('http://localhost:3000/api/lead-gen/full-state', {
    headers: { 'Authorization': `Bearer ${tokenNoSession}` },
  });

  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Middleware allowed token without sessionId to pass! Status: ${res.status}`);
  }
});

runner.test('Session Validation: Token with nonexistent database session is rejected with null', async () => {
  const tokenNonexistentSession = await generateAuthToken({
    id: 'user_phantom_session',
    email: 'phantom@injaazh.com',
    role: 'editor',
    sessionId: 'session_phantom_does_not_exist_in_db',
  });

  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    headers: { 'Authorization': `Bearer ${tokenNonexistentSession}` },
  });

  const authUser = await authenticateApiRequest(req);
  if (authUser !== null) {
    throw new Error(`Token with nonexistent session was accepted! ${JSON.stringify(authUser)}`);
  }
});

runner.test('Session Validation: Token with revoked database session (isValid: false) is rejected with null', async () => {
  const tokenRevokedSession = await generateAuthToken({
    id: 'user_revoked_session',
    email: 'revoked@injaazh.com',
    role: 'editor',
    sessionId: 'session_mock_revoked_456',
  });

  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    headers: { 'Authorization': `Bearer ${tokenRevokedSession}` },
  });

  const authUser = await authenticateApiRequest(req);
  if (authUser !== null) {
    throw new Error(`Revoked session token was accepted! ${JSON.stringify(authUser)}`);
  }
});

// =========================================================================
// 3. HANDLER-LEVEL AUTHORIZATION: ADMIN DEBT ENDPOINTS
// =========================================================================

runner.test('Admin Debt Authorization: POST /api/admin/fix-debt-amounts rejects anonymous with 401', async () => {
  dbMutationCalls.length = 0;
  const req = new Request('http://localhost:3000/api/admin/fix-debt-amounts', {
    method: 'POST',
  });

  const res = (await postFixDebtAmounts(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401 for anonymous, got ${res.status}`);
  }
  if (dbMutationCalls.length > 0) {
    throw new Error(`Database operation was executed before authentication! Calls: ${JSON.stringify(dbMutationCalls)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/fix-debt-amounts rejects viewer role with 403', async () => {
  dbMutationCalls.length = 0;
  const viewerToken = await generateAuthToken({
    id: 'user_viewer_001',
    email: 'viewer@injaazh.com',
    role: 'viewer',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/admin/fix-debt-amounts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${viewerToken}` },
  });

  const res = (await postFixDebtAmounts(req))!;
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for viewer, got ${res.status}`);
  }
  if (dbMutationCalls.length > 0) {
    throw new Error(`Database operation was executed for viewer! Calls: ${JSON.stringify(dbMutationCalls)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/fix-debt-amounts rejects editor role with 403', async () => {
  dbMutationCalls.length = 0;
  const editorToken = await generateAuthToken({
    id: 'user_editor_001',
    email: 'editor@injaazh.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/admin/fix-debt-amounts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${editorToken}` },
  });

  const res = (await postFixDebtAmounts(req))!;
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for editor, got ${res.status}`);
  }
  const body = await res.json();
  if (!body.error.includes('Administrative privileges required')) {
    throw new Error(`Expected admin privileges error, got ${JSON.stringify(body)}`);
  }
  if (dbMutationCalls.length > 0) {
    throw new Error(`Database operation was executed for editor! Calls: ${JSON.stringify(dbMutationCalls)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/fix-debt-amounts allows admin role with 200', async () => {
  dbMutationCalls.length = 0;
  const adminToken = await generateAuthToken({
    id: 'user_admin_001',
    email: 'admin@injaazh.com',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
  });

  const req = new Request('http://localhost:3000/api/admin/fix-debt-amounts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });

  const res = (await postFixDebtAmounts(req))!;
  if (res.status !== 200) {
    throw new Error(`Expected 200 OK for admin, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== true) {
    throw new Error(`Expected success: true, got ${JSON.stringify(body)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/fix-debt-amounts allows owner role with 200', async () => {
  dbMutationCalls.length = 0;
  const ownerToken = await generateAuthToken({
    id: 'user_owner_001',
    email: 'owner@injaazh.com',
    role: 'owner',
    sessionId: 'session_mock_valid_owner',
  });

  const req = new Request('http://localhost:3000/api/admin/fix-debt-amounts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` },
  });

  const res = (await postFixDebtAmounts(req))!;
  if (res.status !== 200) {
    throw new Error(`Expected 200 OK for owner, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== true) {
    throw new Error(`Expected success: true, got ${JSON.stringify(body)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/migrate-debts rejects anonymous with 401', async () => {
  dbMutationCalls.length = 0;
  const req = new Request('http://localhost:3000/api/admin/migrate-debts', {
    method: 'POST',
  });

  const res = (await postMigrateDebts(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401 for anonymous, got ${res.status}`);
  }
  if (dbMutationCalls.length > 0) {
    throw new Error(`Database operation was executed before authentication! Calls: ${JSON.stringify(dbMutationCalls)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/migrate-debts rejects viewer role with 403', async () => {
  dbMutationCalls.length = 0;
  const viewerToken = await generateAuthToken({
    id: 'user_viewer_001',
    email: 'viewer@injaazh.com',
    role: 'viewer',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/admin/migrate-debts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${viewerToken}` },
  });

  const res = (await postMigrateDebts(req))!;
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for viewer, got ${res.status}`);
  }
  if (dbMutationCalls.length > 0) {
    throw new Error(`Database operation was executed for viewer! Calls: ${JSON.stringify(dbMutationCalls)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/migrate-debts rejects editor role with 403', async () => {
  dbMutationCalls.length = 0;
  const editorToken = await generateAuthToken({
    id: 'user_editor_001',
    email: 'editor@injaazh.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/admin/migrate-debts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${editorToken}` },
  });

  const res = (await postMigrateDebts(req))!;
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for editor, got ${res.status}`);
  }
  const body = await res.json();
  if (!body.error.includes('Administrative privileges required')) {
    throw new Error(`Expected admin privileges error, got ${JSON.stringify(body)}`);
  }
  if (dbMutationCalls.length > 0) {
    throw new Error(`Database operation was executed for editor! Calls: ${JSON.stringify(dbMutationCalls)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/migrate-debts allows admin role with 200', async () => {
  dbMutationCalls.length = 0;
  const adminToken = await generateAuthToken({
    id: 'user_admin_001',
    email: 'admin@injaazh.com',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
  });

  const req = new Request('http://localhost:3000/api/admin/migrate-debts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${adminToken}` },
  });

  const res = (await postMigrateDebts(req))!;
  if (res.status !== 200) {
    throw new Error(`Expected 200 OK for admin, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== true) {
    throw new Error(`Expected success: true, got ${JSON.stringify(body)}`);
  }
});

runner.test('Admin Debt Authorization: POST /api/admin/migrate-debts allows owner role with 200', async () => {
  dbMutationCalls.length = 0;
  const ownerToken = await generateAuthToken({
    id: 'user_owner_001',
    email: 'owner@injaazh.com',
    role: 'owner',
    sessionId: 'session_mock_valid_owner',
  });

  const req = new Request('http://localhost:3000/api/admin/migrate-debts', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${ownerToken}` },
  });

  const res = (await postMigrateDebts(req))!;
  if (res.status !== 200) {
    throw new Error(`Expected 200 OK for owner, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== true) {
    throw new Error(`Expected success: true, got ${JSON.stringify(body)}`);
  }
});

// =========================================================================
// 4. CORS PREFLIGHT & ORIGIN HARDENING
// =========================================================================

runner.test('CORS Preflight: Middleware allows unauthenticated OPTIONS to /api/mobile/dashboard to reach CORS handler', async () => {
  const req = new NextRequest('http://localhost:3000/api/mobile/dashboard', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8081',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const res = await middleware(req);
  // Middleware should pass request to route handler (NextResponse.next() status 200)
  if (res.status === 401 || res.status === 307) {
    throw new Error(`Middleware blocked mobile OPTIONS preflight: status ${res.status}`);
  }
});

runner.test('CORS Preflight: Handler returns 204 with CORS headers for allowed origin', async () => {
  const req = new Request('http://localhost:3000/api/mobile/dashboard', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'http://localhost:8081',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const res = (await optionsMobileDashboard(req))!;
  if (res.status !== 204) {
    throw new Error(`Expected 204 for OPTIONS preflight, got ${res.status}`);
  }
  if (res.headers.get('Access-Control-Allow-Origin') !== 'http://localhost:8081') {
    throw new Error(`Expected Access-Control-Allow-Origin: http://localhost:8081, got ${res.headers.get('Access-Control-Allow-Origin')}`);
  }
  if (res.headers.get('Access-Control-Allow-Credentials') !== 'true') {
    throw new Error('Expected Access-Control-Allow-Credentials: true');
  }
});

runner.test('CORS Preflight: Disallowed origin does NOT receive Access-Control-Allow-Origin', async () => {
  const req = new Request('http://localhost:3000/api/mobile/dashboard', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://evil-untrusted-site.com',
      'Access-Control-Request-Method': 'GET',
    },
  });

  const res = (await optionsMobileDashboard(req))!;
  const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
  if (allowOrigin !== null && allowOrigin !== undefined && allowOrigin !== '') {
    throw new Error(`Disallowed origin was granted CORS access! Got header: ${allowOrigin}`);
  }
});

runner.test('CORS Preflight: Never combines wildcard * with credentials', async () => {
  const corsHeaders = getMobileCorsHeaders(new Request('http://localhost:3000', {
    headers: { 'Origin': 'http://localhost:8081' }
  }));

  if (corsHeaders['Access-Control-Allow-Origin'] === '*' && corsHeaders['Access-Control-Allow-Credentials'] === 'true') {
    throw new Error('CRITICAL SECURITY FLAW: Wildcard * combined with credentials: true!');
  }
});

runner.test('CORS Preflight: Middleware does NOT bypass unauthenticated OPTIONS on non-mobile routes', async () => {
  const req = new NextRequest('http://localhost:3000/api/admin/fix-debt-amounts', {
    method: 'OPTIONS',
  });

  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Non-mobile OPTIONS request bypassed middleware! Status: ${res.status}`);
  }
});

runner.test('CORS Preflight: Middleware does NOT bypass unauthenticated OPTIONS on lead-gen routes', async () => {
  const req = new NextRequest('http://localhost:3000/api/lead-gen/clients', {
    method: 'OPTIONS',
  });

  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Lead-gen OPTIONS request bypassed middleware! Status: ${res.status}`);
  }
});

runner.test('CORS Preflight: Unauthenticated GET /api/mobile/dashboard rejected with 401 despite valid OPTIONS', async () => {
  const req = new Request('http://localhost:3000/api/mobile/dashboard', {
    method: 'GET',
    headers: { 'Origin': 'http://localhost:8081' }
  });

  const res = (await getMobileDashboard(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401 for unauthenticated GET, got ${res.status}`);
  }
  // Check that CORS headers are attached on 401 so the mobile browser can read the response
  if (res.headers.get('Access-Control-Allow-Origin') !== 'http://localhost:8081') {
    throw new Error(`Expected CORS headers on 401 response for allowed origin, got: ${res.headers.get('Access-Control-Allow-Origin')}`);
  }
});

runner.test('CORS Preflight: Middleware 401 for mobile route includes CORS headers for allowed origin', async () => {
  const req = new NextRequest('http://localhost:3000/api/mobile/dashboard', {
    method: 'GET',
    headers: { 'Origin': 'http://localhost:8081' }
  });

  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Expected 401 from middleware, got ${res.status}`);
  }
  if (res.headers.get('Access-Control-Allow-Origin') !== 'http://localhost:8081') {
    throw new Error(`Expected middleware 401 to have CORS headers for allowed origin, got: ${res.headers.get('Access-Control-Allow-Origin')}`);
  }
});

// Run all test cases
runner.run();
