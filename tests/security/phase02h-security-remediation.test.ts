/**
 * Phase 02H: Final Security Fixes Automated Regression Test Suite
 *
 * Verifies:
 * 1. First use of a valid reset token succeeds with atomic findOneAndUpdate.
 * 2. Second use of the same reset token fails.
 * 3. Concurrent requests with the same reset token cannot both succeed (single-use race condition prevented).
 * 4. Password hashing uses bcrypt (12 rounds) and is compatible with user.comparePassword().
 * 5. Session revocation failure is handled explicitly without silent success.
 * 6. CSV/TXT upload content with dangerous script markup placed beyond byte 2,048 is rejected.
 * 7. Valid large CSV/TXT files (>2,048 bytes) are accepted.
 * 8. Malformed UTF-8 text uploads are rejected safely.
 * 9. next.config.ts includes hardened headers for /uploads/:path* (nosniff, sandbox, attachment).
 *
 * Run via: npx tsx tests/security/phase02h-security-remediation.test.ts
 */

import './test-env';
import { dbMutationCalls, mockSessionStore, mockUserStore } from './test-env';

import { resetPassword } from '../../app/actions/authActions';
import { POST as postUpload } from '../../app/api/upload/route';
import { generateAuthToken } from '../../lib/auth';
import Session from '../../models/Session';
import nextConfig from '../../next.config';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';

class TestRunner {
  private passed = 0;
  private failed = 0;

  async test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      this.passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Error: ${err.message || err}`);
      this.failed++;
    }
  }

  summary() {
    console.log('\n---------------------------------------------------------------');
    console.log(`Results: ${this.passed} passed, ${this.failed} failed out of ${this.passed + this.failed} tests.`);
    console.log('---------------------------------------------------------------\n');
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

const runner = new TestRunner();

async function runTests() {
  console.log('\n===============================================================');
  console.log('🔒 Phase 02H: Final Security Fixes Automated Verification');
  console.log('===============================================================\n');

  // =========================================================================
  // 1. PASSWORD RESET ATOMICITY & SINGLE-USE
  // =========================================================================

  const rawToken = 'secret_phase02h_valid_token_789';
  const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex');
  const userEmail = 'user_phase02h_atomicity@injaazh.com';

  await runner.test('Atomicity 1: First use of a valid reset token succeeds and consumes token', async () => {
    dbMutationCalls.length = 0;
    mockUserStore[userEmail] = {
      _id: 'user_phase02h_id',
      email: userEmail,
      resetPasswordToken: hashedToken,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
      tokenVersion: 0,
      comparePassword: async function(candidate: string) {
        return bcrypt.compare(candidate, this.password);
      },
    };

    mockSessionStore['sess_phase02h_active'] = {
      sessionId: 'sess_phase02h_active',
      isValid: true,
      userId: 'user_phase02h_id',
    };

    const form = new FormData();
    form.append('password', 'InitialSecurePass123!');
    form.append('confirmPassword', 'InitialSecurePass123!');

    const result = await resetPassword(form, rawToken);
    if (!result.success || !result.message.includes('successfully')) {
      throw new Error(`Expected success, got: ${JSON.stringify(result)}`);
    }

    // Verify User.findOneAndUpdate was called atomically with the token and expiry filter
    const findAndUpdateCall = dbMutationCalls.find(c => c.method === 'User.findOneAndUpdate');
    if (!findAndUpdateCall) {
      throw new Error('User.findOneAndUpdate was not called! Non-atomic operation detected.');
    }
    const [query, update] = findAndUpdateCall.args;
    if (query.resetPasswordToken !== hashedToken) {
      throw new Error(`Query did not match resetPasswordToken: ${JSON.stringify(query)}`);
    }
    if (!query.resetPasswordExpires || !query.resetPasswordExpires.$gt) {
      throw new Error(`Query did not verify resetPasswordExpires.$gt: ${JSON.stringify(query)}`);
    }
    if (!update.$unset?.resetPasswordToken || !update.$unset?.resetPasswordExpires) {
      throw new Error(`Update did not unset resetPasswordToken and resetPasswordExpires: ${JSON.stringify(update)}`);
    }
    if (update.$inc?.tokenVersion !== 1) {
      throw new Error(`Update did not increment tokenVersion by 1: ${JSON.stringify(update)}`);
    }

    // Verify token was cleared and version incremented on user record
    const updatedRecord = mockUserStore[userEmail];
    if (updatedRecord.resetPasswordToken !== undefined || updatedRecord.resetPasswordExpires !== undefined) {
      throw new Error('Token fields were not consumed in user record!');
    }
    if (updatedRecord.tokenVersion !== 1) {
      throw new Error(`Expected tokenVersion to be incremented to 1, got: ${updatedRecord.tokenVersion}`);
    }
  });

  await runner.test('Atomicity 2: Second sequential use of the same reset token fails', async () => {
    const form = new FormData();
    form.append('password', 'SecondAttemptPass123!');
    form.append('confirmPassword', 'SecondAttemptPass123!');

    const result = await resetPassword(form, rawToken);
    if (result.success !== false || !result.message.includes('expired')) {
      throw new Error(`Token reuse was permitted! Expected failure, got: ${JSON.stringify(result)}`);
    }
  });

  await runner.test('Atomicity 3: Concurrent requests using the same token cannot both succeed', async () => {
    // Setup fresh token
    const concurrentToken = 'secret_concurrent_race_test_999';
    const concurrentHashed = crypto.createHash('sha256').update(concurrentToken).digest('hex');
    const raceUserEmail = 'race_user@injaazh.com';

    mockUserStore[raceUserEmail] = {
      _id: 'user_race_id',
      email: raceUserEmail,
      resetPasswordToken: concurrentHashed,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
      tokenVersion: 0,
    };

    const formA = new FormData();
    formA.append('password', 'PassWinner123!');
    formA.append('confirmPassword', 'PassWinner123!');

    const formB = new FormData();
    formB.append('password', 'PassLoser123!');
    formB.append('confirmPassword', 'PassLoser123!');

    // Execute both concurrently
    const [resA, resB] = await Promise.all([
      resetPassword(formA, concurrentToken),
      resetPassword(formB, concurrentToken),
    ]);

    const successes = [resA, resB].filter(r => r.success);
    const failures = [resA, resB].filter(r => !r.success);

    if (successes.length !== 1 || failures.length !== 1) {
      throw new Error(
        `Race condition failed! Exactly 1 request must succeed and 1 must fail. Successes: ${successes.length}, Failures: ${failures.length}. Results: ${JSON.stringify({ resA, resB })}`
      );
    }
  });

  await runner.test('Atomicity 4: Password hashing matches bcrypt 12-round standard and user.comparePassword', async () => {
    const verifyToken = 'secret_bcrypt_compat_check_555';
    const verifyHashed = crypto.createHash('sha256').update(verifyToken).digest('hex');
    const compatEmail = 'bcrypt_compat@injaazh.com';

    mockUserStore[compatEmail] = {
      _id: 'user_compat_id',
      email: compatEmail,
      resetPasswordToken: verifyHashed,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
      tokenVersion: 0,
      comparePassword: async function(candidate: string) {
        return bcrypt.compare(candidate, this.password);
      },
    };

    const newPlaintext = 'SuperSecret123!';
    const form = new FormData();
    form.append('password', newPlaintext);
    form.append('confirmPassword', newPlaintext);

    const res = await resetPassword(form, verifyToken);
    if (!res.success) throw new Error('Password reset failed');

    const updatedUser = mockUserStore[compatEmail];
    // Check that password is a bcrypt hash ($2a$12$ or $2b$12$)
    if (!updatedUser.password.startsWith('$2a$12$') && !updatedUser.password.startsWith('$2b$12$')) {
      throw new Error(`Password is not a bcrypt hash with 12 salt rounds: ${updatedUser.password}`);
    }

    // Verify comparison via method
    const matches = await updatedUser.comparePassword(newPlaintext);
    if (!matches) {
      throw new Error('user.comparePassword() failed to verify the newly hashed password!');
    }

    const wrongMatches = await updatedUser.comparePassword('WrongPassword123!');
    if (wrongMatches) {
      throw new Error('user.comparePassword() verified incorrect password!');
    }
  });

  await runner.test('Atomicity 5: Session revocation failure is handled explicitly without silent success', async () => {
    const failToken = 'secret_session_fail_token_333';
    const failHashed = crypto.createHash('sha256').update(failToken).digest('hex');
    const failEmail = 'session_fail_user@injaazh.com';

    mockUserStore[failEmail] = {
      _id: 'user_session_fail_id',
      email: failEmail,
      resetPasswordToken: failHashed,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
      tokenVersion: 0,
    };

    // Temporarily cause Session.updateMany to throw
    const originalUpdateMany = Session.updateMany;
    Session.updateMany = (async () => {
      throw new Error('Database connection dropped during session invalidation');
    }) as any;

    try {
      const form = new FormData();
      form.append('password', 'NewPassNoRevoke123!');
      form.append('confirmPassword', 'NewPassNoRevoke123!');

      const res = await resetPassword(form, failToken);

      // Must not report full success
      if (res.success === true) {
        throw new Error('Function silently returned success: true when session invalidation failed!');
      }

      // Must explicitly indicate partial success / session warning
      if (!(res as any).partialSuccess || !res.message.includes('active sessions')) {
        throw new Error(`Expected partialSuccess notification, got: ${JSON.stringify(res)}`);
      }
    } finally {
      Session.updateMany = originalUpdateMany;
    }
  });

  // =========================================================================
  // 2. CSV/TXT FULL-BUFFER ACTIVE CONTENT SCANNING
  // =========================================================================

  const adminToken = await generateAuthToken({
    id: 'u_admin',
    email: 'admin@injaazh.com',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
  });

  await runner.test('Upload Scan 1: Rejects dangerous <script> markup placed AFTER byte 2,048 in a large CSV', async () => {
    // Construct a 4KB CSV where byte 0-2500 is legitimate CSV rows, and byte 2501 contains <script>
    const cleanPrefix = 'id,name,role,notes\n' + '1,Alice,editor,normal row\n'.repeat(100); // ~2600 bytes
    const maliciousPayload = cleanPrefix + '999,Evil,hacker,<script>alert(1)</script>\n';
    const fileBytes = Buffer.from(maliciousPayload, 'utf-8');

    if (fileBytes.length <= 2048) {
      throw new Error(`Test setup error: payload must exceed 2048 bytes (current: ${fileBytes.length})`);
    }

    const formData = new FormData();
    const blob = new Blob([fileBytes], { type: 'text/csv' });
    formData.append('file', blob, 'large_evasion_test.csv');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData,
    });

    const res = (await postUpload(req))!;
    if (res.status !== 400) {
      throw new Error(`Expected 400 rejection for evasion payload past byte 2048, got ${res.status}`);
    }
    const json = await res.json();
    if (!json.error || !json.error.includes('signature verification failed')) {
      throw new Error(`Expected signature verification failure, got: ${JSON.stringify(json)}`);
    }
  });

  await runner.test('Upload Scan 2: Accepts legitimate large CSV (>2,048 bytes) with clean tabular data', async () => {
    const largeValidCsv = 'order_id,customer_name,amount,status,created_at\n' +
      '1001,Acme Corp,4500.00,COMPLETED,2026-10-25\n'.repeat(120); // ~5500 bytes
    const fileBytes = Buffer.from(largeValidCsv, 'utf-8');

    if (fileBytes.length <= 2048) {
      throw new Error(`Test setup error: payload must exceed 2048 bytes (current: ${fileBytes.length})`);
    }

    const formData = new FormData();
    const blob = new Blob([fileBytes], { type: 'text/csv' });
    formData.append('file', blob, 'orders_export_large.csv');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData,
    });

    const res = (await postUpload(req))!;
    if (res.status !== 200) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Expected 200 for clean large CSV, got ${res.status}: ${JSON.stringify(err)}`);
    }
    const json = await res.json();
    if (!json.success || !json.url.startsWith('/uploads/') || !json.url.endsWith('.csv')) {
      throw new Error(`Unexpected response payload: ${JSON.stringify(json)}`);
    }
  });

  await runner.test('Upload Scan 3: Rejects malformed / invalid UTF-8 byte sequences in text uploads', async () => {
    // Create an invalid UTF-8 sequence (0xFF 0xFE invalid start bytes in UTF-8)
    const invalidUtf8Buffer = Buffer.from([0x68, 0x65, 0x6c, 0x6c, 0x6f, 0xff, 0xfe, 0x80, 0x81]);

    const formData = new FormData();
    const blob = new Blob([invalidUtf8Buffer], { type: 'text/plain' });
    formData.append('file', blob, 'invalid_encoding.txt');

    const req = new Request('http://localhost:3000/api/upload', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${adminToken}` },
      body: formData,
    });

    const res = (await postUpload(req))!;
    if (res.status !== 400) {
      throw new Error(`Expected 400 for malformed UTF-8, got ${res.status}`);
    }
  });

  // =========================================================================
  // 3. HARDENED NEXT.CONFIG HEADERS VERIFICATION
  // =========================================================================

  await runner.test('Upload Headers: next.config.ts configures nosniff, sandbox, and attachment for /uploads/:path*', async () => {
    if (typeof nextConfig.headers !== 'function') {
      throw new Error('nextConfig.headers is not defined as a function');
    }

    const headersConfig = await nextConfig.headers();
    const uploadRule = headersConfig.find((r: any) => r.source === '/uploads/:path*');
    if (!uploadRule) {
      throw new Error('No header rule found matching source: "/uploads/:path*" in next.config.ts');
    }

    const headersMap = Object.fromEntries(uploadRule.headers.map((h: any) => [h.key, h.value]));

    if (headersMap['X-Content-Type-Options'] !== 'nosniff') {
      throw new Error(`Expected X-Content-Type-Options: "nosniff", got: "${headersMap['X-Content-Type-Options']}"`);
    }

    if (headersMap['Content-Security-Policy'] !== "sandbox; default-src 'none'") {
      throw new Error(`Expected Content-Security-Policy: "sandbox; default-src 'none'", got: "${headersMap['Content-Security-Policy']}"`);
    }

    if (headersMap['Content-Disposition'] !== 'attachment') {
      throw new Error(`Expected Content-Disposition: "attachment", got: "${headersMap['Content-Disposition']}"`);
    }
  });

  runner.summary();
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
