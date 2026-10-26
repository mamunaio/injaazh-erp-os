/**
 * Phase 02B: Critical Security Remediation Isolated Test Suite
 *
 * Verifies:
 * - SEC-01: Lead-Gen API Security (Authentication, Authorization, Role checks, Seed disable in Prod, Mass-wipe protection)
 * - SEC-02: Mobile Dashboard Security (Authentication, Pseudo-token rejection, CORS sanitization, Backdoor removal)
 * - SEC-03: Full-State and Excel Export Security (Zero sensitive data disclosure without valid auth)
 * - Edge Middleware: Standard 401 JSON for unauthenticated API requests, public endpoint bypass, browser redirect
 *
 * Run via: npx tsx tests/security/phase02b-security-remediation.test.ts
 */

import './test-env';

import { NextRequest } from 'next/server';
import { middleware } from '../../middleware';
import { generateAuthToken } from '../../lib/auth';
import { GET as getFullState } from '../../app/api/lead-gen/full-state/route';
import { GET as getExportExcel } from '../../app/api/lead-gen/export-excel/route';
import { POST as postSeed } from '../../app/api/lead-gen/seed/route';
import { GET as getClients, POST as postClients } from '../../app/api/lead-gen/clients/route';
import { GET as getMobileDashboard, OPTIONS as optionsMobileDashboard } from '../../app/api/mobile/dashboard/route';
import { POST as postMobileLogin, OPTIONS as optionsMobileLogin } from '../../app/api/mobile/auth/login/route';

class TestRunner {
  private passed = 0;
  private failed = 0;
  private tests: Array<{ name: string; fn: () => Promise<void> }> = [];

  test(name: string, fn: () => Promise<void>) {
    this.tests.push({ name, fn });
  }

  async run() {
    console.log('\n===============================================================');
    console.log('🔒 Phase 02B: Critical Security Remediation Automated Verification');
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

// ==========================================
// SEC-01: Lead-Gen API Security Tests
// ==========================================

runner.test('SEC-01: GET /api/lead-gen/clients rejects unauthenticated requests with 401 JSON', async () => {
  const req = new Request('http://localhost:3000/api/lead-gen/clients');
  const res = (await getClients(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== false || !body.error.includes('Unauthorized')) {
    throw new Error(`Expected Unauthorized error, got ${JSON.stringify(body)}`);
  }
});

runner.test('SEC-01: POST /api/lead-gen/clients rejects unauthenticated write with 401 JSON', async () => {
  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Malicious Injected Client' }),
  });
  const res = (await postClients(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== false) {
    throw new Error(`Expected success: false, got ${JSON.stringify(body)}`);
  }
});

runner.test('SEC-01: POST /api/lead-gen/clients rejects viewer role with 403 Forbidden', async () => {
  const viewerToken = await generateAuthToken({
    id: 'user_viewer_123',
    email: 'viewer@injaazh.com',
    role: 'viewer',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/lead-gen/clients', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${viewerToken}`,
    },
    body: JSON.stringify({ name: 'Viewer Client Attempt' }),
  });

  const res = (await postClients(req))!;
  if (res.status !== 403) {
    throw new Error(`Expected 403 Forbidden for viewer, got ${res.status}`);
  }
  const body = await res.json();
  if (!body.error.includes('Demo / View-Only Mode')) {
    throw new Error(`Expected Demo / View-Only message, got ${JSON.stringify(body)}`);
  }
});

runner.test('SEC-01: POST /api/lead-gen/seed is completely blocked with 403 in production', async () => {
  const origEnv = process.env.NODE_ENV;
  try {
    (process.env as any).NODE_ENV = 'production';
    const req = new Request('http://localhost:3000/api/lead-gen/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmWipe: true, confirmationPhrase: 'CONFIRM_SEED_RESET' }),
    });

    const res = (await postSeed(req))!;
    if (res.status !== 403) {
      throw new Error(`Expected 403 in production, got ${res.status}`);
    }
    const body = await res.json();
    if (!body.error.includes('disabled in production')) {
      throw new Error(`Expected production disabled message, got ${JSON.stringify(body)}`);
    }
  } finally {
    (process.env as any).NODE_ENV = origEnv;
  }
});

runner.test('SEC-01: POST /api/lead-gen/seed rejects unauthenticated requests with 401', async () => {
  const req = new Request('http://localhost:3000/api/lead-gen/seed', {
    method: 'POST',
  });
  const res = (await postSeed(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
});

runner.test('SEC-01: POST /api/lead-gen/seed rejects non-admin users (e.g. editor role) with 403', async () => {
  const editorToken = await generateAuthToken({
    id: 'user_editor_123',
    email: 'editor@injaazh.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
  });

  const req = new Request('http://localhost:3000/api/lead-gen/seed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${editorToken}`,
    },
    body: JSON.stringify({ confirmWipe: true, confirmationPhrase: 'CONFIRM_SEED_RESET' }),
  });

  const res = (await postSeed(req))!;
  if (res.status !== 403) {
    throw new Error(`Expected 403 for editor role, got ${res.status}`);
  }
  const body = await res.json();
  if (!body.error.includes('Administrative privileges required')) {
    throw new Error(`Expected administrative privileges error, got ${JSON.stringify(body)}`);
  }
});

runner.test('SEC-01: POST /api/lead-gen/seed rejects ordinary requests without confirmation with 400', async () => {
  const adminToken = await generateAuthToken({
    id: 'user_admin_123',
    email: 'admin@injaazh.com',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
  });

  // Ordinary request without confirmWipe payload
  const req = new Request('http://localhost:3000/api/lead-gen/seed', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${adminToken}`,
    },
    body: JSON.stringify({}),
  });

  const res = (await postSeed(req))!;
  if (res.status !== 400) {
    throw new Error(`Expected 400 Bad Request for unconfirmed seed, got ${res.status}`);
  }
  const body = await res.json();
  if (!body.error.includes('Destructive operation rejected: Missing explicit confirmation')) {
    throw new Error(`Expected explicit confirmation required message, got ${JSON.stringify(body)}`);
  }
});

// ==========================================
// SEC-02: Mobile Dashboard Security Tests
// ==========================================

runner.test('SEC-02: GET /api/mobile/dashboard rejects unauthenticated request with 401', async () => {
  const req = new Request('http://localhost:3000/api/mobile/dashboard');
  const res = (await getMobileDashboard(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== false || body.data) {
    throw new Error(`Sensitive data disclosed to unauthenticated caller: ${JSON.stringify(body)}`);
  }
});

runner.test('SEC-02: GET /api/mobile/dashboard rejects legacy pseudo-tokens', async () => {
  const req = new Request('http://localhost:3000/api/mobile/dashboard', {
    headers: {
      'Authorization': 'Bearer injaazh_jwt_token_dummy_admin_1740000000000',
    },
  });
  const res = (await getMobileDashboard(req))!;
  if (res.status !== 401) {
    throw new Error(`Pseudo-token was accepted! Expected 401, got ${res.status}`);
  }
});

runner.test('SEC-02: CORS headers on mobile routes do not contain wildcard *', async () => {
  const req = new Request('http://localhost:3000/api/mobile/dashboard', {
    method: 'OPTIONS',
    headers: {
      'Origin': 'https://evil-attacker.example.com',
    },
  });
  const res = (await optionsMobileDashboard(req))!;
  const allowOrigin = res.headers.get('Access-Control-Allow-Origin');
  if (allowOrigin === '*') {
    throw new Error('CORS wildcard * is still returned!');
  }
  if (allowOrigin === 'https://evil-attacker.example.com') {
    throw new Error('Untrusted origin was accepted!');
  }
});

runner.test('SEC-02: Mobile login rejects hardcoded admin123 backdoor credentials', async () => {
  const req = new Request('http://localhost:3000/api/mobile/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@injaazh.com', password: 'admin123' }),
  });
  const res = (await postMobileLogin(req))!;
  // Database connection will either fail or user won't exist with admin123, returning 401 or 500, but NEVER 200 with dummy token!
  if (res.status === 200) {
    const body = await res.json();
    if (body.data?.token?.includes('dummy_admin')) {
      throw new Error(`Hardcoded admin123 backdoor is still active! Token: ${body.data.token}`);
    }
  }
});

// ==========================================
// SEC-03: Full-State & Excel Export Security Tests
// ==========================================

runner.test('SEC-03: GET /api/lead-gen/full-state rejects unauthenticated request with 401 and zero data', async () => {
  const req = new Request('http://localhost:3000/api/lead-gen/full-state');
  const res = (await getFullState(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  const body = await res.json();
  if (body.prospects || body.clients || body.invoices || body.expenses) {
    throw new Error(`Sensitive CRM records disclosed to unauthenticated caller: ${JSON.stringify(body)}`);
  }
});

runner.test('SEC-03: GET /api/lead-gen/export-excel rejects unauthenticated request with 401', async () => {
  const req = new Request('http://localhost:3000/api/lead-gen/export-excel');
  const res = (await getExportExcel(req))!;
  if (res.status !== 401) {
    throw new Error(`Expected 401, got ${res.status}`);
  }
  const contentType = res.headers.get('Content-Type') || '';
  if (contentType.includes('spreadsheetml')) {
    throw new Error('Excel spreadsheet was downloaded without authentication!');
  }
});

// ==========================================
// Edge Middleware Defense-in-Depth Tests
// ==========================================

runner.test('Middleware: Unauthenticated request to /api/lead-gen/full-state returns 401 JSON', async () => {
  const req = new NextRequest('http://localhost:3000/api/lead-gen/full-state');
  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Expected middleware 401, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== false || !body.error.includes('Unauthorized')) {
    throw new Error(`Expected JSON error response, got ${JSON.stringify(body)}`);
  }
});

runner.test('Middleware: Unauthenticated request to /api/mobile/dashboard returns 401 JSON', async () => {
  const req = new NextRequest('http://localhost:3000/api/mobile/dashboard');
  const res = await middleware(req);
  if (res.status !== 401) {
    throw new Error(`Expected middleware 401, got ${res.status}`);
  }
  const body = await res.json();
  if (body.success !== false) {
    throw new Error(`Expected success: false, got ${JSON.stringify(body)}`);
  }
});

runner.test('Middleware: Public route /api/mobile/auth/login passes through without token', async () => {
  const req = new NextRequest('http://localhost:3000/api/mobile/auth/login');
  const res = await middleware(req);
  if (res.status === 401 || res.status === 307) {
    throw new Error(`Public login was unexpectedly blocked: ${res.status}`);
  }
});

runner.test('Middleware: Unauthenticated web browser navigation to /dashboard redirects to /login', async () => {
  const req = new NextRequest('http://localhost:3000/dashboard');
  const res = await middleware(req);
  if (res.status !== 307) {
    throw new Error(`Expected 307 redirect for browser, got ${res.status}`);
  }
  const location = res.headers.get('location') || '';
  if (!location.includes('/login')) {
    throw new Error(`Expected redirect to /login, got ${location}`);
  }
});

runner.test('Middleware: Valid Authorization Bearer token passes middleware check', async () => {
  const validToken = await generateAuthToken({
    id: 'user_test_999',
    email: 'test@injaazh.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
  });

  const req = new NextRequest('http://localhost:3000/api/lead-gen/full-state', {
    headers: {
      'Authorization': `Bearer ${validToken}`,
    },
  });

  const res = await middleware(req);
  // Middleware should return NextResponse.next() (status 200)
  if (res.status === 401 || res.status === 307) {
    throw new Error(`Valid bearer token was rejected by middleware: status ${res.status}`);
  }
});

// Run all test cases
runner.run();
