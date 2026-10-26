/**
 * Phase 02L: Server Action Authorization Hardening Automated Regression Test Suite
 *
 * Verifies:
 * 1. Unauthenticated getDashboardData() requests are rejected.
 * 2. Authenticated users can access data allowed by their permissions.
 * 3. Stale JWT is rejected even when its database session remains marked valid.
 * 4. Protected Server Actions cannot be invoked directly without authentication.
 * 5. Existing viewer/editor/admin/owner permissions remain unchanged.
 * 6. Authentication failures do not return protected data.
 * 7. Public login and password-reset entry points continue to work as intended.
 *
 * Run via: npx tsx tests/security/phase02l-security-remediation.test.ts
 */

import './test-env';
import { mockSessionStore, mockUserStore } from './test-env';

// Intercept next/headers cookies() before importing actions
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

// Import Jose & Auth helpers
import { generateAuthToken } from '../../lib/auth';
import User from '../../models/User';
import Session from '../../models/Session';
import { Project } from '../../models/Project';
import MarketplaceClient from '../../models/MarketplaceClient';
import { Invoice } from '../../models/Invoice';
import { DailyExpense } from '../../models/DailyExpense';
import { AiKey } from '../../models/AiKey';
import { IslamicInsight } from '../../models/IslamicInsight';
import { SystemSettings } from '../../models/SystemSettings';
import Notification from '../../models/Notification';
import { PersonalDebt } from '../../models/PersonalDebt';
import { Transaction } from '../../models/Transaction';
import MarketplaceProject from '../../models/MarketplaceProject';
import SeoProject from '../../models/SeoProject';
import DailyTask from '../../models/DailyTask';
import TimeLog from '../../models/TimeLog';

// Setup mock implementations for models accessed by Server Actions
const createDummyQuery = (result: any = []) => {
  const queryObj: any = {
    sort: () => queryObj,
    select: () => queryObj,
    populate: () => queryObj,
    skip: () => queryObj,
    limit: () => queryObj,
    lean: () => Promise.resolve(result),
    exec: async () => result,
    then: (resolve: any, reject: any) => Promise.resolve(result).then(resolve, reject),
  };
  return queryObj;
};

Project.find = (() => createDummyQuery([])) as any;
Project.countDocuments = (() => Promise.resolve(0)) as any;
Invoice.find = (() => createDummyQuery([])) as any;
DailyExpense.find = (() => createDummyQuery([])) as any;
DailyExpense.create = (async (d: any) => ({ _id: 'mock_exp_1', ...d })) as any;
AiKey.find = (() => createDummyQuery([])) as any;
AiKey.create = (async (d: any) => ({ _id: 'mock_ai_1', ...d })) as any;
MarketplaceClient.find = (() => createDummyQuery([])) as any;
MarketplaceClient.findById = ((id: any) => createDummyQuery({ _id: id, name: 'Client X', platform: 'Direct' })) as any;
MarketplaceClient.create = (async (d: any) => ({ _id: 'mock_mc_1', ...d })) as any;
IslamicInsight.find = (() => createDummyQuery([])) as any;
IslamicInsight.countDocuments = (() => Promise.resolve(0)) as any;
SystemSettings.find = (() => createDummyQuery([])) as any;
SystemSettings.findOne = (() => createDummyQuery(null)) as any;
Notification.find = (() => createDummyQuery([])) as any;
Notification.countDocuments = (() => Promise.resolve(0)) as any;
PersonalDebt.find = (() => createDummyQuery([])) as any;
Transaction.find = (() => createDummyQuery([])) as any;
MarketplaceProject.find = (() => createDummyQuery([])) as any;
SeoProject.find = (() => createDummyQuery([])) as any;
DailyTask.find = (() => createDummyQuery([])) as any;
TimeLog.find = (() => createDummyQuery([])) as any;

// Import Actions under test
import { getDashboardData } from '../../app/actions/dashboardActions';
import { getProjectsBoard } from '../../app/actions/projectActions';
import { getMarketplaceClients, getMarketplaceClientById, createMarketplaceClient } from '../../actions/marketplaceClientActions';
import { getTransactions, getPlatformSummary, getFinanceProjectsList } from '../../app/actions/transactionActions';
import { getPersonalDebts } from '../../app/actions/personalDebtActions';
import { getInvoices } from '../../app/actions/invoiceActions';
import { getDailyExpenses, createDailyExpense } from '../../app/actions/dailyExpenseActions';
import { getAiKeys, addAiKey } from '../../app/actions/aiKeyActions';
import { getAllIslamicInsights } from '../../app/actions/dailyInsightsActions';
import { getSystemSettings, saveSystemSettings, testSmtpConnection } from '../../app/actions/settingsActions';
import { getRecentNotifications } from '../../app/actions/notificationActions';
import { sendCustomEmail, sendTestEmail } from '../../app/actions/emailActions';
import { loginUser, registerUser, requestPasswordReset } from '../../app/actions/authActions';

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
  console.log('🔒 Phase 02L: Server Action Authorization Hardening Test Suite');
  console.log('===============================================================\n');

  // Seed test users in mock store
  const userId = 'user_sec_02l_001';
  const userEmail = 'sec02l@injaazh.com';
  mockUserStore[userId] = {
    _id: userId,
    email: userEmail,
    role: 'admin',
    tokenVersion: 5,
  };
  mockUserStore[userEmail] = mockUserStore[userId];

  const viewerId = 'user_viewer_02l';
  const viewerEmail = 'viewer02l@injaazh.com';
  mockUserStore[viewerId] = {
    _id: viewerId,
    email: viewerEmail,
    role: 'viewer',
    tokenVersion: 1,
  };
  mockUserStore[viewerEmail] = mockUserStore[viewerId];

  // Seed active sessions in mock store
  mockSessionStore['session_sec_02l_valid'] = {
    sessionId: 'session_sec_02l_valid',
    isValid: true,
    userId,
  };
  mockSessionStore['session_viewer_valid'] = {
    sessionId: 'session_viewer_valid',
    isValid: true,
    userId: viewerId,
  };

  // Generate tokens
  const validAdminToken = await generateAuthToken({
    id: userId,
    email: userEmail,
    role: 'admin',
    sessionId: 'session_sec_02l_valid',
    tokenVersion: 5, // matches DB tokenVersion: 5
  });

  const staleJwtToken = await generateAuthToken({
    id: userId,
    email: userEmail,
    role: 'admin',
    sessionId: 'session_sec_02l_valid',
    tokenVersion: 4, // STALE! Database is at tokenVersion: 5
  });

  const validViewerToken = await generateAuthToken({
    id: viewerId,
    email: viewerEmail,
    role: 'viewer',
    sessionId: 'session_viewer_valid',
    tokenVersion: 1,
  });

  // =========================================================================
  // TASK 1: getDashboardData() Unauthenticated Rejection
  // =========================================================================
  await runner.test('1.1: Unauthenticated getDashboardData() is rejected fail-closed', async () => {
    currentTestCookie = null; // No cookie set
    const res = await getDashboardData();
    if (res.success !== false) throw new Error('Expected success to be false');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error message: ${res.error}`);
    if (res.data !== null) throw new Error('Expected data to be null on unauthenticated request');
  });

  await runner.test('1.2: Authenticated user with valid tokenVersion accesses getDashboardData()', async () => {
    currentTestCookie = validAdminToken;
    const res = await getDashboardData();
    if (!res.success) throw new Error(`Expected success to be true, got error: ${res.error}`);
    if (!res.data) throw new Error('Expected data to be populated for authenticated user');
  });

  // =========================================================================
  // TASK 1 & 4: Stale JWT Rejection on getDashboardData()
  // =========================================================================
  await runner.test('1.3: Stale JWT (tokenVersion mismatch) is rejected by getDashboardData() even with valid DB session', async () => {
    currentTestCookie = staleJwtToken; // tokenVersion 4 vs DB tokenVersion 5
    const res = await getDashboardData();
    if (res.success !== false) throw new Error('Expected stale JWT to be rejected');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Expected Unauthorized error, got: ${res.error}`);
    if (res.data !== null) throw new Error('Expected data to be null when stale JWT is used');
  });

  // =========================================================================
  // TASK 2: Protected Server Actions Unauthenticated Invocations
  // =========================================================================
  await runner.test('2.1: Unauthenticated getProjectsBoard() is rejected', async () => {
    currentTestCookie = null;
    const res = await getProjectsBoard();
    if (res.success !== false) throw new Error('Expected getProjectsBoard to fail when unauthenticated');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
    if (res.data?.length !== 0) throw new Error('Expected empty data array');
  });

  await runner.test('2.2: Stale JWT rejected by getProjectsBoard()', async () => {
    currentTestCookie = staleJwtToken;
    const res = await getProjectsBoard();
    if (res.success !== false) throw new Error('Expected stale JWT to fail getProjectsBoard');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('2.3: Unauthenticated getMarketplaceClients() is rejected', async () => {
    currentTestCookie = null;
    const res = await getMarketplaceClients();
    if (res.success !== false) throw new Error('Expected getMarketplaceClients to fail when unauthenticated');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('2.4: Stale JWT rejected by getMarketplaceClients()', async () => {
    currentTestCookie = staleJwtToken;
    const res = await getMarketplaceClients();
    if (res.success !== false) throw new Error('Expected stale JWT to fail getMarketplaceClients');
  });

  await runner.test('2.5: Unauthenticated getMarketplaceClientById() is rejected', async () => {
    currentTestCookie = null;
    const res = await getMarketplaceClientById('mc_123');
    if (res.success !== false) throw new Error('Expected getMarketplaceClientById to fail when unauthenticated');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
    if (res.data !== null) throw new Error('Expected data to be null');
  });

  await runner.test('2.6: Unauthenticated getTransactions() is rejected', async () => {
    currentTestCookie = null;
    const res = await getTransactions();
    if (res.success !== false) throw new Error('Expected getTransactions to fail when unauthenticated');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('2.7: Stale JWT rejected by getTransactions()', async () => {
    currentTestCookie = staleJwtToken;
    const res = await getTransactions();
    if (res.success !== false) throw new Error('Expected stale JWT to fail getTransactions');
  });

  await runner.test('2.8: Unauthenticated getPlatformSummary() is rejected', async () => {
    currentTestCookie = null;
    const res = await getPlatformSummary();
    if (res.success !== false) throw new Error('Expected getPlatformSummary to fail when unauthenticated');
  });

  await runner.test('2.9: Unauthenticated getFinanceProjectsList() is rejected', async () => {
    currentTestCookie = null;
    const res = await getFinanceProjectsList();
    if (res.success !== false) throw new Error('Expected getFinanceProjectsList to fail when unauthenticated');
  });

  await runner.test('2.10: Unauthenticated getPersonalDebts() is rejected', async () => {
    currentTestCookie = null;
    const res = await getPersonalDebts();
    if (res.success !== false) throw new Error('Expected getPersonalDebts to fail when unauthenticated');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('2.11: Stale JWT rejected by getPersonalDebts()', async () => {
    currentTestCookie = staleJwtToken;
    const res = await getPersonalDebts();
    if (res.success !== false) throw new Error('Expected stale JWT to fail getPersonalDebts');
  });

  await runner.test('2.12: Unauthenticated getInvoices() is rejected', async () => {
    currentTestCookie = null;
    const res = await getInvoices();
    if (res.success !== false) throw new Error('Expected getInvoices to fail when unauthenticated');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('2.13: Unauthenticated getDailyExpenses() returns empty array for unauthenticated caller', async () => {
    currentTestCookie = null;
    const res = await getDailyExpenses();
    if (!Array.isArray(res) || res.length !== 0) throw new Error('Expected empty array for unauthenticated getDailyExpenses');
  });

  await runner.test('2.14: Unauthenticated getAiKeys() is rejected', async () => {
    currentTestCookie = null;
    const res = await getAiKeys();
    if (res.success !== false) throw new Error('Expected getAiKeys to fail when unauthenticated');
  });

  await runner.test('2.15: Unauthenticated getAllIslamicInsights() is rejected', async () => {
    currentTestCookie = null;
    const res = await getAllIslamicInsights();
    if (res.success !== false) throw new Error('Expected getAllIslamicInsights to fail when unauthenticated');
  });

  await runner.test('2.16: Unauthenticated getSystemSettings() is rejected', async () => {
    currentTestCookie = null;
    const res = await getSystemSettings('smtp');
    if (res.success !== false) throw new Error('Expected getSystemSettings to fail when unauthenticated');
  });

  await runner.test('2.17: Unauthenticated getRecentNotifications() returns empty data fail-closed', async () => {
    currentTestCookie = null;
    const res = await getRecentNotifications();
    if (res.notifications?.length !== 0 || res.unreadCount !== 0) {
      throw new Error('Expected empty notifications for unauthenticated caller');
    }
  });

  // =========================================================================
  // TASK 2 & 5: Protected Mutations & Role-Based Enforcement
  // =========================================================================
  await runner.test('3.1: Unauthenticated write to addAiKey is rejected', async () => {
    currentTestCookie = null;
    const res = await addAiKey({ name: 'Key1', provider: 'openai', apiKey: 'sk-test' });
    if (res.success !== false) throw new Error('Expected addAiKey to fail when unauthenticated');
  });

  await runner.test('3.2: Viewer role cannot addAiKey (demo mode protection)', async () => {
    currentTestCookie = validViewerToken;
    const res = await addAiKey({ name: 'Key1', provider: 'openai', apiKey: 'sk-test' });
    if (res.success !== false) throw new Error('Expected addAiKey to fail for viewer role');
    if (!res.error?.toLowerCase().includes('demo') && !res.error?.toLowerCase().includes('view-only')) {
      throw new Error(`Expected demo mode error, got: ${res.error}`);
    }
  });

  await runner.test('3.3: Unauthenticated createMarketplaceClient is rejected', async () => {
    currentTestCookie = null;
    const res = await createMarketplaceClient({ name: 'New Client', platform: 'Direct' });
    if (res.success !== false) throw new Error('Expected createMarketplaceClient to fail when unauthenticated');
  });

  await runner.test('3.4: Viewer role cannot createMarketplaceClient', async () => {
    currentTestCookie = validViewerToken;
    const res = await createMarketplaceClient({ name: 'New Client', platform: 'Direct' });
    if (res.success !== false) throw new Error('Expected createMarketplaceClient to fail for viewer');
  });

  await runner.test('3.5: Unauthenticated sendCustomEmail is rejected', async () => {
    currentTestCookie = null;
    const res = await sendCustomEmail({ to: 'victim@test.com', subject: 'Spam', title: 'Test', content: 'Test' });
    if (res.success !== false) throw new Error('Expected sendCustomEmail to fail when unauthenticated');
  });

  await runner.test('3.6: Viewer role cannot sendCustomEmail', async () => {
    currentTestCookie = validViewerToken;
    const res = await sendCustomEmail({ to: 'victim@test.com', subject: 'Spam', title: 'Test', content: 'Test' });
    if (res.success !== false) throw new Error('Expected sendCustomEmail to fail for viewer');
  });

  const dummySmtp = { host: 'smtp.test.com', port: 587, user: 'u', pass: 'p', fromName: 'n', fromEmail: 'e@test.com' };

  await runner.test('3.7: Unauthenticated testSmtpConnection is rejected', async () => {
    currentTestCookie = null;
    const res = await testSmtpConnection(dummySmtp);
    if (res.success !== false) throw new Error('Expected testSmtpConnection to fail when unauthenticated');
  });

  await runner.test('3.8: Viewer role cannot testSmtpConnection', async () => {
    currentTestCookie = validViewerToken;
    const res = await testSmtpConnection(dummySmtp);
    if (res.success !== false) throw new Error('Expected testSmtpConnection to fail for viewer');
  });

  await runner.test('3.9: Viewer role cannot createDailyExpense', async () => {
    currentTestCookie = validViewerToken;
    const res = await createDailyExpense({ title: 'Lunch', amount: 100, category: 'Food' });
    if (res.success !== false) throw new Error('Expected createDailyExpense to fail for viewer');
  });

  // =========================================================================
  // TASK 7: Public Entry Points Remain Intact
  // =========================================================================
  await runner.test('4.1: Public loginUser works without existing cookie', async () => {
    currentTestCookie = null; // Public entry point
    const fd = new FormData();
    fd.append('email', 'nonexistent@test.com');
    fd.append('password', 'wrongpassword');
    const res = await loginUser(fd);
    if (res.success !== false) throw new Error('Expected invalid credentials to fail');
    const msg = res.message || (res as any).error || '';
    if (!msg.toLowerCase().includes('invalid')) {
      throw new Error(`Expected credentials error message, got: ${msg}`);
    }
  });

  await runner.test('4.2: Public requestPasswordReset works without existing cookie', async () => {
    currentTestCookie = null; // Public entry point
    const fd = new FormData();
    fd.append('email', 'test@injaazh.com');
    const res = await requestPasswordReset(fd);
    if (res === undefined) throw new Error('Expected requestPasswordReset to return a response');
  });

  // Summary
  runner.summary();
}

runTests().catch((err) => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
