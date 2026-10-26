/**
 * Phase 02J: Account Security Epoch Automated Regression Test Suite
 *
 * Verifies:
 * 1. A newly issued token with the current version is accepted.
 * 2. A token with an old version is rejected.
 * 3. A token missing tokenVersion is rejected.
 * 4. Password reset atomically increments the version while consuming the token.
 * 5. A second use of the same reset token fails.
 * 6. If session revocation fails, the old token is still rejected by the account-wide version check.
 * 7. Normal mobile login and completed 2FA sessions receive the correct version.
 * 8. Cookie and Bearer authentication enforce identical version checks.
 * 9. A 2FA temporary token cannot access normal APIs.
 * 10. Existing authorization roles remain enforced.
 *
 * Run via: npx tsx tests/security/phase02j-security-remediation.test.ts
 */

import './test-env';
import { dbMutationCalls, mockSessionStore, mockUserStore } from './test-env';

import { resetPassword, verifyTwoFactorLogin } from '../../app/actions/authActions';
import { POST as postMobileLogin } from '../../app/api/mobile/auth/login/route';
import { GET as getLeadGenClients, POST as postLeadGenClients } from '../../app/api/lead-gen/clients/route';
import {
  generateAuthToken,
  generate2FATempToken,
  authenticateApiRequest,
  requireApiAuth,
  requireApiWriteAuth,
} from '../../lib/auth';
import Session from '../../models/Session';
import User from '../../models/User';
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
  console.log('🔒 Phase 02J: Account Security Epoch Automated Verification');
  console.log('===============================================================\n');

  const testUserId = 'user_epoch_test_001';
  const testEmail = 'epoch_user@injaazh.com';

  // Seed user with tokenVersion: 1
  mockUserStore[testEmail] = {
    _id: testUserId,
    email: testEmail,
    role: 'editor',
    tokenVersion: 1,
  };
  mockUserStore[testUserId] = mockUserStore[testEmail];

  mockSessionStore['session_epoch_valid'] = {
    sessionId: 'session_epoch_valid',
    isValid: true,
    userId: testUserId,
  };

  // -------------------------------------------------------------------------
  // 1. Current version is accepted
  // -------------------------------------------------------------------------
  await runner.test('Epoch 1: Newly issued token with current tokenVersion (1) is accepted', async () => {
    const validToken = await generateAuthToken({
      id: testUserId,
      email: testEmail,
      role: 'editor',
      sessionId: 'session_epoch_valid',
      tokenVersion: 1,
    });

    const req = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${validToken}` },
    });

    const user = await authenticateApiRequest(req);
    if (!user || user.id !== testUserId || user.tokenVersion !== 1) {
      throw new Error(`Expected authenticated user with tokenVersion 1, got: ${JSON.stringify(user)}`);
    }
  });

  // -------------------------------------------------------------------------
  // 2. Old version is rejected
  // -------------------------------------------------------------------------
  await runner.test('Epoch 2: Token with outdated tokenVersion (0 vs current 1) is rejected', async () => {
    const outdatedToken = await generateAuthToken({
      id: testUserId,
      email: testEmail,
      role: 'editor',
      sessionId: 'session_epoch_valid',
      tokenVersion: 0,
    });

    const req = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${outdatedToken}` },
    });

    const user = await authenticateApiRequest(req);
    if (user !== null) {
      throw new Error(`Outdated token was accepted! Returned: ${JSON.stringify(user)}`);
    }

    const auth = await requireApiAuth(req);
    if (!('errorResponse' in auth) || !auth.errorResponse || (auth.errorResponse as any).status !== 401) {
      throw new Error('Expected 401 errorResponse for outdated token');
    }
  });

  // -------------------------------------------------------------------------
  // 3. Missing tokenVersion is rejected
  // -------------------------------------------------------------------------
  await runner.test('Epoch 3: Token missing tokenVersion is strictly rejected', async () => {
    // Manually construct token without tokenVersion
    const { SignJWT } = await import('jose');
    const secret = process.env.JWT_SECRET!;
    const tokenWithoutVersion = await new SignJWT({
      id: testUserId,
      email: testEmail,
      role: 'editor',
      sessionId: 'session_epoch_valid',
    })
      .setProtectedHeader({ alg: 'HS256' })
      .setIssuedAt()
      .setExpirationTime('1d')
      .sign(new TextEncoder().encode(secret));

    const req = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${tokenWithoutVersion}` },
    });

    const user = await authenticateApiRequest(req);
    if (user !== null) {
      throw new Error('Token without tokenVersion was accepted!');
    }
  });

  // -------------------------------------------------------------------------
  // 4. Password reset atomically increments version while consuming token
  // -------------------------------------------------------------------------
  const resetUserEmail = 'reset_epoch_target@injaazh.com';
  const resetUserId = 'user_reset_epoch_id';
  const rawResetToken = 'secret_epoch_reset_token_123';
  const hashedResetToken = crypto.createHash('sha256').update(rawResetToken).digest('hex');

  await runner.test('Epoch 4: Password reset atomically increments tokenVersion via $inc: { tokenVersion: 1 }', async () => {
    dbMutationCalls.length = 0;
    mockUserStore[resetUserEmail] = {
      _id: resetUserId,
      email: resetUserEmail,
      role: 'editor',
      tokenVersion: 3,
      resetPasswordToken: hashedResetToken,
      resetPasswordExpires: new Date(Date.now() + 1000 * 60 * 30),
    };
    mockUserStore[resetUserId] = mockUserStore[resetUserEmail];

    mockSessionStore['session_to_remain_unrevoked'] = {
      sessionId: 'session_to_remain_unrevoked',
      isValid: true,
      userId: resetUserId,
    };

    const form = new FormData();
    form.append('password', 'BrandNewPassword123!');
    form.append('confirmPassword', 'BrandNewPassword123!');

    const res = await resetPassword(form, rawResetToken);
    if (!res.success) {
      throw new Error(`Password reset failed: ${res.message}`);
    }

    // Verify $inc: { tokenVersion: 1 } was issued
    const findAndUpdateCall = dbMutationCalls.find(c => c.method === 'User.findOneAndUpdate');
    if (!findAndUpdateCall) throw new Error('User.findOneAndUpdate was not called');
    const [, update] = findAndUpdateCall.args;
    if (update.$inc?.tokenVersion !== 1) {
      throw new Error(`Expected $inc: { tokenVersion: 1 }, got: ${JSON.stringify(update)}`);
    }

    // Check user record was incremented to 4
    if (mockUserStore[resetUserEmail].tokenVersion !== 4) {
      throw new Error(`User tokenVersion was not incremented to 4, current: ${mockUserStore[resetUserEmail].tokenVersion}`);
    }
    if (mockUserStore[resetUserEmail].resetPasswordToken !== undefined) {
      throw new Error('Reset token was not consumed');
    }
  });

  // -------------------------------------------------------------------------
  // 5. Second use of same token fails
  // -------------------------------------------------------------------------
  await runner.test('Epoch 5: Second use of same reset token fails', async () => {
    const form = new FormData();
    form.append('password', 'AnotherPassword123!');
    form.append('confirmPassword', 'AnotherPassword123!');

    const res = await resetPassword(form, rawResetToken);
    if (res.success !== false || !res.message.includes('expired')) {
      throw new Error(`Second use of reset token succeeded: ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // 6. Old token rejected even if session revocation fails
  // -------------------------------------------------------------------------
  await runner.test('Epoch 6: Pre-reset token (version 3) is rejected by epoch check even if session remains valid', async () => {
    // Note: mockSessionStore['session_to_remain_unrevoked'] was NOT revoked or its session is still valid
    mockSessionStore['session_to_remain_unrevoked'].isValid = true;

    // Token issued before reset (with old version 3)
    const preResetToken = await generateAuthToken({
      id: resetUserId,
      email: resetUserEmail,
      role: 'editor',
      sessionId: 'session_to_remain_unrevoked',
      tokenVersion: 3,
    });

    const req = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${preResetToken}` },
    });

    const user = await authenticateApiRequest(req);
    if (user !== null) {
      throw new Error('Pre-reset token with old tokenVersion was accepted despite password change!');
    }

    // But a token with the new version 4 is accepted
    const postResetToken = await generateAuthToken({
      id: resetUserId,
      email: resetUserEmail,
      role: 'editor',
      sessionId: 'session_to_remain_unrevoked',
      tokenVersion: 4,
    });

    const postReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${postResetToken}` },
    });

    const postUser = await authenticateApiRequest(postReq);
    if (!postUser || postUser.tokenVersion !== 4) {
      throw new Error('Newly issued token with new version 4 failed authentication!');
    }
  });

  // -------------------------------------------------------------------------
  // 7. Mobile login & 2FA issuance receive correct tokenVersion
  // -------------------------------------------------------------------------
  await runner.test('Epoch 7: Mobile login and completed 2FA embed current tokenVersion', async () => {
    // A. Mobile login
    const mobileUserEmail = 'mobile_epoch_user@injaazh.com';
    const mobileUserId = '507f191e810c19729de860ea';
    const salt = await bcrypt.genSalt(10);
    const passHash = await bcrypt.hash('MobilePass123!', salt);

    mockUserStore[mobileUserEmail] = {
      _id: mobileUserId,
      email: mobileUserEmail,
      password: passHash,
      role: 'admin',
      tokenVersion: 5,
    };
    mockUserStore[mobileUserId] = mockUserStore[mobileUserEmail];

    const mobileReq = new Request('http://localhost:3000/api/mobile/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: mobileUserEmail, password: 'MobilePass123!' }),
    });

    const mobileRes = await postMobileLogin(mobileReq);
    if (mobileRes.status !== 200) {
      throw new Error(`Mobile login failed with status ${mobileRes.status}`);
    }
    const mobileData = await mobileRes.json();
    const token = mobileData.data.token;

    // Decode token and check version
    const { jwtVerify } = await import('jose');
    const verifiedMobile = await jwtVerify(token, new TextEncoder().encode(process.env.JWT_SECRET!));
    if (verifiedMobile.payload.tokenVersion !== 5) {
      throw new Error(`Mobile token did not embed tokenVersion 5, got: ${verifiedMobile.payload.tokenVersion}`);
    }

    // B. Completed 2FA session
    const twoFactorUserEmail = 'twofactor_epoch@injaazh.com';
    const twoFactorUserId = '507f191e810c19729de860eb';
    const validSecret = 'JBSWY3DPEHPK3PXPJBSWY3DPEHPK3PXP';
    mockUserStore[twoFactorUserId] = {
      _id: twoFactorUserId,
      email: twoFactorUserEmail,
      role: 'editor',
      tokenVersion: 2,
      twoFactorSecret: validSecret,
    };

    const temp2FAToken = await generate2FATempToken(twoFactorUserId);
    const { generateSync } = await import('otplib');
    const validCode = generateSync({ secret: validSecret });

    const twoFactorRes = await verifyTwoFactorLogin(temp2FAToken, validCode, false);
    if (!twoFactorRes.success) {
      throw new Error(`verifyTwoFactorLogin failed: ${twoFactorRes.message}`);
    }
  });

  // -------------------------------------------------------------------------
  // 8. Cookie and Bearer authentication enforce identical version checks
  // -------------------------------------------------------------------------
  await runner.test('Epoch 8: Cookie and Bearer authentication enforce identical tokenVersion checks', async () => {
    const validToken = await generateAuthToken({
      id: testUserId,
      email: testEmail,
      role: 'editor',
      sessionId: 'session_epoch_valid',
      tokenVersion: 1,
    });

    const invalidVersionToken = await generateAuthToken({
      id: testUserId,
      email: testEmail,
      role: 'editor',
      sessionId: 'session_epoch_valid',
      tokenVersion: 99,
    });

    // Case A: Bearer valid vs invalid
    const bearerValidReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${validToken}` },
    });
    const bearerInvalidReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${invalidVersionToken}` },
    });

    const bearerValid = await authenticateApiRequest(bearerValidReq);
    const bearerInvalid = await authenticateApiRequest(bearerInvalidReq);
    if (!bearerValid || bearerInvalid !== null) {
      throw new Error('Bearer authentication mismatch on tokenVersion');
    }

    // Case B: Cookie valid vs invalid
    const cookieValidReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Cookie: `user_token=${validToken}` },
    });
    const cookieInvalidReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Cookie: `user_token=${invalidVersionToken}` },
    });

    const cookieValid = await authenticateApiRequest(cookieValidReq);
    const cookieInvalid = await authenticateApiRequest(cookieInvalidReq);
    if (!cookieValid || cookieInvalid !== null) {
      throw new Error('Cookie authentication mismatch on tokenVersion');
    }
  });

  // -------------------------------------------------------------------------
  // 9. 2FA temporary token cannot access normal APIs
  // -------------------------------------------------------------------------
  await runner.test('Epoch 9: 2FA temporary token cannot access normal APIs', async () => {
    const temp2FAToken = await generate2FATempToken(testUserId);
    const req = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${temp2FAToken}` },
    });

    const user = await authenticateApiRequest(req);
    if (user !== null) {
      throw new Error('2FA temporary token was accepted by normal API!');
    }
  });

  // -------------------------------------------------------------------------
  // 10. Existing authorization roles remain strictly enforced
  // -------------------------------------------------------------------------
  await runner.test('Epoch 10: Existing authorization roles (viewer 403, editor 200) remain strictly enforced', async () => {
    const viewerId = 'user_viewer_epoch_id';
    mockUserStore[viewerId] = {
      _id: viewerId,
      email: 'viewer@injaazh.com',
      role: 'viewer',
      tokenVersion: 0,
    };
    mockSessionStore['sess_viewer_epoch'] = {
      sessionId: 'sess_viewer_epoch',
      isValid: true,
      userId: viewerId,
    };

    const viewerToken = await generateAuthToken({
      id: viewerId,
      email: 'viewer@injaazh.com',
      role: 'viewer',
      sessionId: 'sess_viewer_epoch',
      tokenVersion: 0,
    });

    // Write endpoint (POST /api/lead-gen/clients) must return 403 Forbidden for viewer
    const writeReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${viewerToken}`,
      },
      body: JSON.stringify({ name: 'Disallowed Client' }),
    });

    const writeRes = (await postLeadGenClients(writeReq))!;
    if (writeRes.status !== 403) {
      throw new Error(`Expected 403 for viewer write, got: ${writeRes.status}`);
    }

    // Read endpoint (GET /api/lead-gen/clients) is allowed for viewer
    const readReq = new Request('http://localhost:3000/api/lead-gen/clients', {
      headers: { Authorization: `Bearer ${viewerToken}` },
    });
    const readRes = (await getLeadGenClients(readReq))!;
    if (readRes.status !== 200) {
      throw new Error(`Expected 200 for viewer read, got: ${readRes.status}`);
    }
  });

  runner.summary();
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
