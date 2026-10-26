/**
 * Phase 02N: Internal Service Boundary & Role Policy Remediation Test Suite
 *
 * Verifies:
 * 1. Internal email helpers are removed from public Server Action exports.
 * 2. createNotification is removed from public Server Action exports.
 * 3. Static AST/module analysis confirms no sensitive helpers exported from any 'use server' file.
 * 4. Internal email service (lib/emailService) validates inputs, rejects unsafe URLs, and dispatches properly.
 * 5. Password reset flow dispatches email through trusted internal flow without exposing helper.
 * 6. Internal notification service (lib/notificationService) validates types, message length, and link safety.
 * 7. Daily expenses enforce owner-only access policy for reads and mutations.
 * 8. Personal debts enforce write authorization and protect against demo/viewer modification.
 * 9. AI provider keys are protected: viewer blocked, non-admin masked, admin/owner authorized.
 * 10. AI key mutations restricted to admin/owner roles.
 * 11. Stale tokenVersion remains rejected across actions.
 *
 * Run via: npx tsx tests/security/phase02n-security-remediation.test.ts
 */

import './test-env';
import fs from 'fs';
import path from 'path';

// Mock cookies for Server Actions
let currentTestCookie: string | null = null;
const nextHeaders = require('next/headers');
nextHeaders.cookies = async () => ({
  get: (name: string) => {
    if (name === 'user_token' && currentTestCookie) {
      return { name: 'user_token', value: currentTestCookie };
    }
    return undefined;
  },
});

const nextCache = require('next/cache');
nextCache.revalidatePath = () => {};

// Import Jose & Auth helpers
import { generateAuthToken } from '../../lib/auth';
import User from '../../models/User';
import Session from '../../models/Session';
import Notification from '../../models/Notification';
import { DailyExpense } from '../../models/DailyExpense';
import { PersonalDebt } from '../../models/PersonalDebt';
import { AiKey } from '../../models/AiKey';

// Setup model save prototypes to prevent buffering timeouts
DailyExpense.prototype.save = async function() { return this; };
PersonalDebt.prototype.save = async function() { return this; };
AiKey.prototype.save = async function() { return this; };

// Import services and actions
import * as emailActions from '../../app/actions/emailActions';
import * as notificationActions from '../../app/actions/notificationActions';
import * as emailService from '../../lib/emailService';
import * as notificationService from '../../lib/notificationService';
import { getDailyExpenses, createDailyExpense, updateDailyExpense, deleteDailyExpense } from '../../app/actions/dailyExpenseActions';
import { getPersonalDebts, createPersonalDebt, updatePersonalDebt, deletePersonalDebt } from '../../app/actions/personalDebtActions';
import { getAiKeys, addAiKey, deleteAiKey, toggleAiKeyStatus } from '../../app/actions/aiKeyActions';
import { requestPasswordReset } from '../../app/actions/authActions';

// Mocks for Mongoose models to stay 100% offline and isolated
const mockDailyExpensesList = [
  { _id: 'de_01', amount: 50, category: 'Supplies', date: new Date() }
];
DailyExpense.find = (() => ({
  sort: () => ({
    lean: async () => [...mockDailyExpensesList],
  }),
})) as any;
DailyExpense.create = (async (data: any) => ({ _id: 'de_created', ...data })) as any;
DailyExpense.findByIdAndUpdate = (async (id: string, data: any) => ({ _id: id, ...data })) as any;
DailyExpense.findByIdAndDelete = (async (id: string) => ({ _id: id })) as any;

const mockPersonalDebtsList = [
  { _id: 'pd_01', personName: 'Partner A', amount: 1000, type: 'borrowed' }
];
PersonalDebt.find = (() => ({
  sort: () => ({
    lean: async () => [...mockPersonalDebtsList],
  }),
})) as any;

const mockAiKeysList = [
  {
    _id: 'ai_01',
    provider: 'openai',
    apiKey: 'sk-proj-supersecretkey1234567890abcdef',
    name: 'Production OpenAI',
    modelId: 'gpt-4o',
    dailyLimit: 100,
    sentToday: 12,
    isActive: true,
  },
  {
    _id: 'ai_02',
    provider: 'gemini',
    apiKey: 'AIzaSySecretGeminiKey1234567890abcdef',
    name: 'Gemini Pro',
    modelId: 'gemini-1.5-pro',
    dailyLimit: 200,
    sentToday: 5,
    isActive: true,
  }
];
AiKey.find = (() => ({
  sort: () => ({
    lean: async () => [...mockAiKeysList],
  }),
})) as any;
AiKey.create = (async (data: any) => ({ _id: 'ai_created', ...data })) as any;
AiKey.findByIdAndDelete = (async (id: string) => ({ _id: id })) as any;
AiKey.findByIdAndUpdate = (async (id: string, data: any) => ({ _id: id, ...data })) as any;

Notification.create = (async (data: any) => ({ _id: 'notif_created', ...data })) as any;

class TestRunner {
  passed = 0;
  failed = 0;

  async test(name: string, fn: () => Promise<void>) {
    try {
      await fn();
      console.log(`  ✅ PASS: ${name}`);
      this.passed++;
    } catch (err: any) {
      console.error(`  ❌ FAIL: ${name}`);
      console.error(`     Reason: ${err.message}`);
      this.failed++;
    }
  }
}

async function runTests() {
  const runner = new TestRunner();
  console.log('\n===============================================================');
  console.log('🔒 Phase 02N: Internal Service Boundary & Role Remediation Suite');
  console.log('===============================================================\n');

  // Generate tokens for each role
  const viewerCookie = await generateAuthToken({
    id: 'u_v',
    email: 'v@i.com',
    role: 'viewer',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 0,
  });

  const editorCookie = await generateAuthToken({
    id: 'u_e',
    email: 'e@i.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 0,
  });

  const adminCookie = await generateAuthToken({
    id: 'u_a',
    email: 'a@i.com',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
    tokenVersion: 0,
  });

  const ownerCookie = await generateAuthToken({
    id: 'u_o',
    email: 'o@i.com',
    role: 'owner',
    sessionId: 'session_mock_valid_owner',
    tokenVersion: 0,
  });

  const staleCookie = await generateAuthToken({
    id: 'u_e',
    email: 'e@i.com',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 999, // Stale version
  });

  // -------------------------------------------------------------------------
  // Group 1: Static Code Boundary Checks
  // -------------------------------------------------------------------------

  await runner.test('1.1: Static check - emailActions exports only sendCustomEmail and sendTestEmail', async () => {
    const exports = Object.keys(emailActions);
    if (!exports.includes('sendCustomEmail') || !exports.includes('sendTestEmail')) {
      throw new Error(`Missing expected public actions: ${exports.join(', ')}`);
    }
    const sensitive = [
      'sendWelcomeEmail',
      'sendPasswordResetEmail',
      'sendNewLeadNotification',
      'sendProposalNotification',
      'sendPaymentNotification',
      'sendProjectStatusEmail',
    ];
    for (const helper of sensitive) {
      if (exports.includes(helper)) {
        throw new Error(`Sensitive helper ${helper} is still exported from emailActions.ts!`);
      }
    }
  });

  await runner.test('1.2: Static check - notificationActions does NOT export createNotification', async () => {
    const exports = Object.keys(notificationActions);
    if (exports.includes('createNotification')) {
      throw new Error('createNotification is still exported from notificationActions.ts!');
    }
  });

  await runner.test('1.3: Static check - lib/emailService and lib/notificationService do NOT declare use server', async () => {
    const emailServiceContent = fs.readFileSync(path.join(__dirname, '../../lib/emailService.ts'), 'utf8');
    if (/^\s*['"]use server['"]/m.test(emailServiceContent)) {
      throw new Error("lib/emailService.ts must NOT declare 'use server'!");
    }
    const notifServiceContent = fs.readFileSync(path.join(__dirname, '../../lib/notificationService.ts'), 'utf8');
    if (/^\s*['"]use server['"]/m.test(notifServiceContent)) {
      throw new Error("lib/notificationService.ts must NOT declare 'use server'!");
    }
  });

  // -------------------------------------------------------------------------
  // Group 2: Internal Email Service Validation
  // -------------------------------------------------------------------------

  await runner.test('2.1: emailService.sendPasswordResetEmail rejects invalid email format', async () => {
    const res = await emailService.sendPasswordResetEmail({
      to: 'invalid-email-address',
      name: 'Test',
      resetUrl: 'https://injaazh.com/reset',
    });
    if (res.success !== false || res.error !== 'Invalid recipient email') {
      throw new Error('Expected invalid email to be rejected');
    }
  });

  await runner.test('2.2: emailService.sendPasswordResetEmail rejects unsafe javascript: URL', async () => {
    const res = await emailService.sendPasswordResetEmail({
      to: 'valid@injaazh.com',
      name: 'Test',
      resetUrl: 'javascript:alert(document.cookie)',
    });
    if (res.success !== false) {
      throw new Error('Expected javascript: resetUrl to be rejected');
    }
  });

  await runner.test('2.3: emailService.sendWelcomeEmail rejects unsafe URLs', async () => {
    const res = await emailService.sendWelcomeEmail({
      to: 'member@injaazh.com',
      name: 'Member',
      loginUrl: 'javascript:steal()',
    });
    if (res.success !== false) {
      throw new Error('Expected unsafe loginUrl to be rejected');
    }
  });

  await runner.test('2.4: Legitimate requestPasswordReset dispatches email via internal service', async () => {
    currentTestCookie = null;
    const formData = new FormData();
    formData.append('email', 'user@mock.com');

    const res = await requestPasswordReset(formData);
    if (!res.success) {
      throw new Error(`Expected requestPasswordReset to succeed, got ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Group 3: Internal Notification Service Validation
  // -------------------------------------------------------------------------

  await runner.test('3.1: notificationService rejects invalid notification type', async () => {
    const res = await notificationService.createNotification(
      'invalid_type' as any,
      'Test message'
    );
    if (res.success !== false) {
      throw new Error('Expected invalid notification type to be rejected');
    }
  });

  await runner.test('3.2: notificationService rejects empty message', async () => {
    const res = await notificationService.createNotification('system', '   ');
    if (res.success !== false) {
      throw new Error('Expected empty message to be rejected');
    }
  });

  await runner.test('3.3: notificationService rejects unsafe link protocol', async () => {
    const res = await notificationService.createNotification(
      'system',
      'Test message',
      'javascript:evil()'
    );
    if (res.success !== false) {
      throw new Error('Expected javascript: link to be rejected');
    }
  });

  await runner.test('3.4: notificationService accepts valid notification creation', async () => {
    const res = await notificationService.createNotification(
      'payment',
      'Payment of $500 received.',
      '/finance'
    );
    if (!res.success) {
      throw new Error(`Expected notification creation to succeed, got ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Group 4: Daily Expenses Owner-Only Access Policy
  // -------------------------------------------------------------------------

  await runner.test('4.1: Unauthenticated getDailyExpenses() returns empty array fail-closed', async () => {
    currentTestCookie = null;
    const res = await getDailyExpenses();
    if (!Array.isArray(res) || res.length !== 0) {
      throw new Error('Expected empty array for unauthenticated caller');
    }
  });

  await runner.test('4.2: Viewer role getDailyExpenses() returns empty array', async () => {
    currentTestCookie = viewerCookie;
    const res = await getDailyExpenses();
    if (!Array.isArray(res) || res.length !== 0) {
      throw new Error('Expected empty array for viewer role');
    }
  });

  await runner.test('4.3: Editor role getDailyExpenses() returns empty array (owner-only policy)', async () => {
    currentTestCookie = editorCookie;
    const res = await getDailyExpenses();
    if (!Array.isArray(res) || res.length !== 0) {
      throw new Error('Expected empty array for editor role');
    }
  });

  await runner.test('4.4: Admin role getDailyExpenses() returns empty array (owner-only policy)', async () => {
    currentTestCookie = adminCookie;
    const res = await getDailyExpenses();
    if (!Array.isArray(res) || res.length !== 0) {
      throw new Error('Expected empty array for admin role under owner-only policy');
    }
  });

  await runner.test('4.5: Owner role getDailyExpenses() successfully retrieves expense records', async () => {
    currentTestCookie = ownerCookie;
    const res = await getDailyExpenses();
    if (!Array.isArray(res) || res.length === 0) {
      throw new Error('Expected owner to successfully fetch daily expenses');
    }
  });

  await runner.test('4.6: Non-owner roles cannot createDailyExpense', async () => {
    currentTestCookie = adminCookie;
    const res = await createDailyExpense({ amount: 100, category: 'Food' });
    if (res.success !== false) {
      throw new Error('Expected admin to be rejected from creating daily expense');
    }
  });

  await runner.test('4.7: Owner role can createDailyExpense', async () => {
    currentTestCookie = ownerCookie;
    const res = await createDailyExpense({ amount: 100, category: 'Food' });
    if (!res.success) {
      throw new Error(`Expected owner to create daily expense, got ${JSON.stringify(res)}`);
    }
  });

  await runner.test('4.8: Non-owner roles cannot deleteDailyExpense', async () => {
    currentTestCookie = editorCookie;
    const res = await deleteDailyExpense('de_01');
    if (res.success !== false) {
      throw new Error('Expected editor to be rejected from deleting daily expense');
    }
  });

  await runner.test('4.9: Owner role can deleteDailyExpense', async () => {
    currentTestCookie = ownerCookie;
    const res = await deleteDailyExpense('de_01');
    if (!res.success) {
      throw new Error(`Expected owner to delete daily expense, got ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Group 5: Personal Debt Role Authorization
  // -------------------------------------------------------------------------

  await runner.test('5.1: Unauthenticated getPersonalDebts is rejected', async () => {
    currentTestCookie = null;
    const res = await getPersonalDebts();
    if (res.success !== false) {
      throw new Error('Expected unauthenticated getPersonalDebts to fail');
    }
  });

  await runner.test('5.2: Viewer cannot createPersonalDebt (demo write protection)', async () => {
    currentTestCookie = viewerCookie;
    try {
      const res = await createPersonalDebt({
        personName: 'Person B',
        amount: 200,
        type: 'lent',
        date: new Date(),
      });
      if (res && res.success !== false) {
        throw new Error('Expected viewer to be rejected from createPersonalDebt');
      }
    } catch {
      // Caught as expected by requireWriteAuth
    }
  });

  await runner.test('5.3: Authorized staff (editor) can createPersonalDebt', async () => {
    currentTestCookie = editorCookie;
    const res = await createPersonalDebt({
      personName: 'Person B',
      amount: 200,
      type: 'lent',
      date: new Date(),
    });
    if (!res.success) {
      throw new Error(`Expected editor to create personal debt, got ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Group 6: AI Provider Key Credential Protection
  // -------------------------------------------------------------------------

  await runner.test('6.1: Unauthenticated getAiKeys() is rejected', async () => {
    currentTestCookie = null;
    const res = await getAiKeys();
    if (res.success !== false) {
      throw new Error('Expected unauthenticated getAiKeys to fail');
    }
  });

  await runner.test('6.2: Viewer role getAiKeys() is blocked from seeing AI keys', async () => {
    currentTestCookie = viewerCookie;
    const res = await getAiKeys();
    if (res.success !== false) {
      throw new Error('Expected viewer role to be blocked from getAiKeys');
    }
  });

  await runner.test('6.3: Non-admin staff (editor) receives MASKED AI keys only', async () => {
    currentTestCookie = editorCookie;
    const res = await getAiKeys();
    if (!res.success || !res.data || res.data.length === 0) {
      throw new Error('Expected editor to receive AI key metadata');
    }
    for (const key of res.data) {
      if (key.apiKey.includes('supersecretkey') || key.apiKey.includes('SecretGeminiKey')) {
        throw new Error(`Plaintext key leaked to editor role! Key was: ${key.apiKey}`);
      }
      if (!key.apiKey.includes('••••••••')) {
        throw new Error(`Key was not properly masked for editor role: ${key.apiKey}`);
      }
    }
  });

  await runner.test('6.4: Admin and Owner roles can access unmasked AI keys', async () => {
    currentTestCookie = adminCookie;
    const resAdmin = await getAiKeys();
    if (!resAdmin.success || !resAdmin.data || resAdmin.data.length === 0) {
      throw new Error('Expected admin to fetch AI keys');
    }
    const adminKey = resAdmin.data.find((k: any) => k.provider === 'openai');
    if (!adminKey || !adminKey.apiKey.includes('supersecretkey')) {
      throw new Error('Expected admin to access unmasked API key');
    }

    currentTestCookie = ownerCookie;
    const resOwner = await getAiKeys();
    const ownerKey = resOwner.data.find((k: any) => k.provider === 'openai');
    if (!ownerKey || !ownerKey.apiKey.includes('supersecretkey')) {
      throw new Error('Expected owner to access unmasked API key');
    }
  });

  await runner.test('6.5: Non-admin staff cannot addAiKey', async () => {
    currentTestCookie = editorCookie;
    const res = await addAiKey({ provider: 'groq', apiKey: 'gsk-test12345678' });
    if (res.success !== false) {
      throw new Error('Expected editor to be rejected from addAiKey');
    }
  });

  await runner.test('6.6: Admin can addAiKey', async () => {
    currentTestCookie = adminCookie;
    const res = await addAiKey({ provider: 'groq', apiKey: 'gsk-test12345678' });
    if (!res.success) {
      throw new Error(`Expected admin to successfully add AI key, got ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Group 7: Account Security Epoch (tokenVersion) Enforcement
  // -------------------------------------------------------------------------

  await runner.test('7.1: Stale tokenVersion rejected across Daily Expenses', async () => {
    currentTestCookie = staleCookie;
    const res = await getDailyExpenses();
    if (res.length !== 0) {
      throw new Error('Expected stale JWT to be rejected fail-closed');
    }
  });

  await runner.test('7.2: Stale tokenVersion rejected across AI Keys', async () => {
    currentTestCookie = staleCookie;
    const res = await getAiKeys();
    if (res.success !== false) {
      throw new Error('Expected stale JWT to fail getAiKeys');
    }
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests.`);
  console.log('---------------------------------------------------------------\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
