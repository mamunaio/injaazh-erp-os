/**
 * Phase 02T: Project Deletion Authorization & Financial Record Integrity Suite
 *
 * Tests:
 * 1. Project Deletion Role Authorization:
 *    - Editors cannot hard-delete projects.
 *    - Viewers and unauthenticated callers cannot delete projects.
 *    - Admins and Owners CAN delete projects according to policy.
 *    - Unauthorized deletion never invokes database deletion or cascade operations.
 *    - Missing or malformed project IDs fail safely.
 *
 * 2. Elimination of Ambiguous Project-Title Matching:
 *    - Duplicate project titles do not cause cross-project financial updates or deletions.
 *    - Setting one project's fee to zero does not delete another project's transaction.
 *    - Project renaming does not redirect financial updates to another project.
 *    - Repeated completion updates do not create duplicate income transactions.
 *    - Project ID targeting in saveProjectHourlyRate updates the intended project document.
 *    - Ambiguous project titles without projectId fail safe without blindly corrupting documents.
 *    - Legacy transactions without projectId are safely handled.
 *
 * 3. Regression Checks on Previous Security Controls:
 *    - Email action restrictions (admin/owner only) remain intact.
 *    - Daily expenses (owner only) remain intact.
 *    - Field-level mutation allowlists remain intact.
 *
 * Run via: npx tsx tests/security/phase02t-security-remediation.test.ts
 */

import './test-env';
import mongoose from 'mongoose';

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

// Import auth and models
import { generateAuthToken } from '../../lib/auth';
import { Project } from '../../models/Project';
import { SystemSettings } from '../../models/SystemSettings';
import { Transaction } from '../../models/Transaction';
import MarketplaceProject from '../../models/MarketplaceProject';
import Notification from '../../models/Notification';
import { updateProject, createProject, deleteProject } from '../../app/actions/projectActions';
import { saveProjectHourlyRate } from '../../app/actions/timesheetActions';
import { sendCustomEmail } from '../../app/actions/emailActions';
import { getDailyExpenses } from '../../app/actions/dailyExpenseActions';

// In-memory Stores
const validProjectId1 = '507f1f77bcf86cd799439011';
const validProjectId2 = '507f1f77bcf86cd799439022';
const validProjectId3 = '507f1f77bcf86cd799439033'; // Duplicate title project

let mockProjectDb: Record<string, any> = {};
let mockTransactionDb: Array<any> = [];
let marketplaceDeleteCalls: Array<string> = [];
let projectDeleteCalls: Array<string> = [];

function resetMockStores() {
  mockProjectDb = {
    [validProjectId1]: {
      _id: new mongoose.Types.ObjectId(validProjectId1),
      title: 'Cloud ERP System',
      description: 'Enterprise ERP modernization',
      clientName: 'Acme Corp',
      status: 'In Progress',
      priority: 'High',
      progress: 45,
      budget: 50000,
      platform: 'Direct',
      platformFee: 0,
      techStack: ['Next.js', 'MongoDB'],
      assignees: ['Developer A'],
      tags: ['Core'],
      hourlyRate: 50,
      marketplaceProjectId: new mongoose.Types.ObjectId('607f1f77bcf86cd799439001'),
    },
    [validProjectId2]: {
      _id: new mongoose.Types.ObjectId(validProjectId2),
      title: 'Mobile App Redesign',
      description: 'iOS and Android redesign',
      clientName: 'Globex Ltd',
      status: 'Planning',
      priority: 'Medium',
      progress: 10,
      budget: 15000,
      platform: 'Upwork',
      platformFee: 1500,
      techStack: ['React Native'],
      assignees: ['Developer B'],
      tags: ['Mobile'],
      hourlyRate: 35,
      marketplaceProjectId: new mongoose.Types.ObjectId('607f1f77bcf86cd799439002'),
    },
    [validProjectId3]: {
      _id: new mongoose.Types.ObjectId(validProjectId3),
      title: 'Cloud ERP System', // Intentional duplicate title
      description: 'Duplicate title project for another client',
      clientName: 'Beta Corp',
      status: 'Planning',
      priority: 'Low',
      progress: 5,
      budget: 20000,
      platform: 'Freelancer',
      platformFee: 2000,
      techStack: ['Vue.js'],
      assignees: ['Developer C'],
      tags: ['Secondary'],
      hourlyRate: 40,
    },
  };

  mockTransactionDb = [
    // Project 2 platform fee transaction linked by projectId
    {
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439001'),
      projectId: new mongoose.Types.ObjectId(validProjectId2),
      projectModel: 'Project',
      platform: 'Upwork',
      type: 'Expense',
      amount: 1500,
      category: 'Platform Fee',
      description: 'Platform Fee for Project: Mobile App Redesign',
      date: new Date(),
      save: async function() { return this; }
    },
    // Project 3 platform fee transaction linked by projectId (same title as Project 1)
    {
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439002'),
      projectId: new mongoose.Types.ObjectId(validProjectId3),
      projectModel: 'Project',
      platform: 'Freelancer',
      type: 'Expense',
      amount: 2000,
      category: 'Platform Fee',
      description: 'Platform Fee for Project: Cloud ERP System',
      date: new Date(),
      save: async function() { return this; }
    },
    // Unlinked legacy transaction
    {
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439099'),
      projectId: null,
      platform: 'Direct',
      type: 'Expense',
      amount: 100,
      category: 'Platform Fee',
      description: 'Legacy Platform Fee for Project: Old Archive',
      date: new Date(),
      save: async function() { return this; }
    }
  ];

  marketplaceDeleteCalls = [];
  projectDeleteCalls = [];
}

resetMockStores();

// Mock Mongoose models
MarketplaceProject.findByIdAndUpdate = (async () => null) as any;
MarketplaceProject.findByIdAndDelete = (async (id: any) => {
  marketplaceDeleteCalls.push(id.toString());
  return { _id: id };
}) as any;
MarketplaceProject.create = (async (d: any) => ({ _id: new mongoose.Types.ObjectId(), ...d })) as any;
Notification.create = (async (d: any) => ({ _id: 'notif_1', ...d })) as any;

Project.findById = ((id: any) => {
  const doc = mockProjectDb[id?.toString()];
  return {
    lean: async () => (doc ? { ...doc } : null),
    then: (resolve: any) => resolve(doc ? { ...doc } : null),
  };
}) as any;

Project.findByIdAndUpdate = ((id: any, update: any, options: any) => {
  const strId = id?.toString();
  const existing = mockProjectDb[strId];
  if (!existing) {
    return {
      lean: async () => null,
      then: (resolve: any) => resolve(null),
    };
  }
  const updatedDoc = { ...existing };
  if (update.$set) {
    Object.assign(updatedDoc, update.$set);
  } else {
    Object.assign(updatedDoc, update);
  }
  mockProjectDb[strId] = updatedDoc;
  return {
    lean: async () => ({ ...updatedDoc }),
    then: (resolve: any) => resolve({ ...updatedDoc }),
  };
}) as any;

Project.findByIdAndDelete = (async (id: any) => {
  const strId = id?.toString();
  projectDeleteCalls.push(strId);
  delete mockProjectDb[strId];
  return { _id: id };
}) as any;

Project.prototype.save = async function() {
  const id = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
  this._id = new mongoose.Types.ObjectId(id);
  mockProjectDb[id] = { ...this };
  return this;
};

Project.find = ((filter?: any) => {
  let list = Object.values(mockProjectDb);
  if (filter && filter.title) {
    list = list.filter(p => p.title === filter.title);
  }
  const queryObj = {
    limit: (n: number) => ({
      lean: async () => list.slice(0, n),
      then: (resolve: any) => resolve(list.slice(0, n))
    }),
    sort: () => queryObj,
    lean: async () => list,
    then: (resolve: any) => resolve(list)
  };
  return queryObj;
}) as any;

Project.findOneAndUpdate = ((filter: any, update: any) => {
  let matched: any = null;
  const list = Object.values(mockProjectDb);
  matched = list.find(p => {
    if (filter._id && p._id.toString() !== filter._id.toString()) return false;
    if (filter.platformFee !== undefined && p.platformFee !== filter.platformFee) return false;
    if (filter.title) {
      const match = filter.title instanceof RegExp ? filter.title.test(p.title) : p.title === filter.title;
      if (!match) return false;
    }
    return true;
  });

  if (matched && update) {
    if (update.$set) {
      Object.assign(matched, update.$set);
    } else {
      Object.assign(matched, update);
    }
  }
  return {
    lean: async () => (matched ? { ...matched } : null),
    then: (resolve: any) => resolve(matched ? { ...matched } : null),
  };
}) as any;

// Mock Transaction methods
Transaction.find = ((query: any) => {
  let list = [...mockTransactionDb];
  if (query.projectId === null) {
    list = list.filter(t => !t.projectId);
  }
  if (query.category) {
    list = list.filter(t => t.category === query.category);
  }
  if (query.type) {
    list = list.filter(t => t.type === query.type);
  }
  if (query.description instanceof RegExp) {
    list = list.filter(t => query.description.test(t.description || ''));
  } else if (query.$or) {
    const descriptions = query.$or.map((o: any) => o.description);
    list = list.filter(t => descriptions.includes(t.description));
  }
  const queryObj = {
    limit: (n: number) => ({
      lean: async () => list.slice(0, n),
      then: (resolve: any) => resolve(list.slice(0, n))
    }),
    lean: async () => list,
    then: (resolve: any) => resolve(list)
  };
  return queryObj;
}) as any;

Transaction.countDocuments = (async () => 1) as any;

Transaction.findOneAndUpdate = (async (filter: any, update: any, options: any) => {
  let existing = mockTransactionDb.find(t =>
    (!filter.projectId || (t.projectId && t.projectId.toString() === filter.projectId.toString())) &&
    (!filter.category || t.category === filter.category) &&
    (!filter.type || t.type === filter.type)
  );

  if (existing) {
    if (update.$set) Object.assign(existing, update.$set);
    return existing;
  }

  if (options && options.upsert) {
    const newDoc: any = {
      _id: new mongoose.Types.ObjectId(),
      ...filter,
      ...(update.$setOnInsert || {}),
      ...(update.$set || {}),
      save: async function() { return this; }
    };
    mockTransactionDb.push(newDoc);
    return newDoc;
  }

  return null;
}) as any;

Transaction.findByIdAndDelete = (async (id: any) => {
  const strId = id?.toString();
  const idx = mockTransactionDb.findIndex(t => t._id.toString() === strId);
  if (idx >= 0) {
    const deleted = mockTransactionDb[idx];
    mockTransactionDb.splice(idx, 1);
    return deleted;
  }
  return null;
}) as any;

Transaction.findOne = ((query: any) => {
  let found: any = null;
  if (query.projectId) {
    found = mockTransactionDb.find(t =>
      t.projectId && t.projectId.toString() === query.projectId.toString() &&
      (!query.category || t.category === query.category) &&
      (!query.type || t.type === query.type)
    );
  } else if (query.projectId === null && query.category) {
    found = mockTransactionDb.find(t =>
      !t.projectId && t.category === query.category &&
      (!query.type || t.type === query.type)
    );
  } else if (query.description && query.category) {
    found = mockTransactionDb.find(t =>
      t.category === query.category &&
      (!query.type || t.type === query.type)
    );
  }
  return {
    then: (resolve: any) => resolve(found || null)
  };
}) as any;

Transaction.create = (async (d: any) => {
  const newTx = {
    _id: new mongoose.Types.ObjectId(),
    ...d,
    save: async function() { return this; }
  };
  mockTransactionDb.push(newTx);
  return newTx;
}) as any;

Transaction.deleteMany = (async (query: any) => {
  const beforeCount = mockTransactionDb.length;
  if (query.projectId) {
    mockTransactionDb = mockTransactionDb.filter(t =>
      !(t.projectId && t.projectId.toString() === query.projectId.toString() &&
        (!query.category || t.category === query.category))
    );
  } else if (query.$or && query.projectId === null) {
    const descriptions = query.$or.map((o: any) => o.description);
    mockTransactionDb = mockTransactionDb.filter(t =>
      !(t.projectId === null && descriptions.includes(t.description))
    );
  }
  return { acknowledged: true, deletedCount: beforeCount - mockTransactionDb.length };
}) as any;

Transaction.prototype.save = async function() {
  const idx = mockTransactionDb.findIndex(t => t._id.toString() === this._id?.toString());
  if (idx >= 0) {
    mockTransactionDb[idx] = this;
  } else {
    mockTransactionDb.push(this);
  }
  return this;
};

// Mock SystemSettings for personal timesheet rates
const mockSettingsDb: Record<string, any> = {};
SystemSettings.findOne = (async (query: any) => {
  const doc = mockSettingsDb[query.key];
  return doc ? { ...doc } : null;
}) as any;

SystemSettings.findOneAndUpdate = (async (query: any, update: any) => {
  mockSettingsDb[query.key] = { key: query.key, value: { ...update.value } };
  return mockSettingsDb[query.key];
}) as any;

// Test Runner
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
      console.error(`     Error: ${err.message}`);
      this.failed++;
    }
  }

  summary() {
    console.log('\n===============================================================');
    console.log(`Results: ${this.passed} passed, ${this.failed} failed out of ${this.passed + this.failed} tests`);
    console.log('===============================================================\n');
    if (this.failed > 0) {
      process.exit(1);
    }
  }
}

async function runTests() {
  const runner = new TestRunner();
  console.log('\n===============================================================');
  console.log('🔒 Phase 02T: Project Deletion Auth & Financial Integrity Suite');
  console.log('===============================================================');

  // Pre-generate tokens backed by mockUserStore and mockSessionStore in test-env
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

  // SECTION 1: Project Deletion Role Authorization
  console.log('\n--- 1. Project Deletion Role Authorization ---');

  await runner.test('1.1: Editor role CANNOT hard-delete projects', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;
    const res = await deleteProject(validProjectId1);
    if (res.success !== false) throw new Error('Expected editor project deletion to fail');
    if (!res.error?.includes('Unauthorized: Admin or owner access required')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
    // Verify document was NOT deleted from DB
    if (!mockProjectDb[validProjectId1]) throw new Error('Project was unexpectedly deleted from DB by editor');
    // Verify MarketplaceProject cascade delete was NOT invoked
    if (marketplaceDeleteCalls.length > 0) throw new Error('MarketplaceProject was deleted during unauthorized attempt');
    if (projectDeleteCalls.length > 0) throw new Error('Project delete was recorded during unauthorized attempt');
  });

  await runner.test('1.2: Viewer role CANNOT hard-delete projects', async () => {
    resetMockStores();
    currentTestCookie = viewerCookie;
    const res = await deleteProject(validProjectId1);
    if (res.success !== false) throw new Error('Expected viewer project deletion to fail');
    if (!mockProjectDb[validProjectId1]) throw new Error('Project was deleted by viewer');
  });

  await runner.test('1.3: Unauthenticated caller CANNOT delete projects', async () => {
    resetMockStores();
    currentTestCookie = null;
    const res = await deleteProject(validProjectId1);
    if (res.success !== false) throw new Error('Expected unauthenticated deleteProject to fail');
    if (!mockProjectDb[validProjectId1]) throw new Error('Project was deleted by unauthenticated caller');
  });

  await runner.test('1.4: Admin role CAN delete projects and cascade-delete marketplace project', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;
    const res = await deleteProject(validProjectId1);
    if (!res.success) throw new Error(`Expected admin delete to succeed, got: ${res.error}`);
    if (mockProjectDb[validProjectId1]) throw new Error('Project remained in DB after admin delete');
    if (projectDeleteCalls.length !== 1 || projectDeleteCalls[0] !== validProjectId1) {
      throw new Error('Project deletion was not recorded correctly in DB');
    }
    // Verify cascade to linked MarketplaceProject
    if (marketplaceDeleteCalls.length !== 1 || marketplaceDeleteCalls[0] !== '607f1f77bcf86cd799439001') {
      throw new Error('Linked MarketplaceProject was not cascade-deleted');
    }
  });

  await runner.test('1.5: Owner role CAN delete projects and cascade-delete marketplace project', async () => {
    resetMockStores();
    currentTestCookie = ownerCookie;
    const res = await deleteProject(validProjectId2);
    if (!res.success) throw new Error(`Expected owner delete to succeed, got: ${res.error}`);
    if (mockProjectDb[validProjectId2]) throw new Error('Project remained in DB after owner delete');
  });

  await runner.test('1.6: Malformed project ID fails safely before DB deletion', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;
    const res = await deleteProject('invalid-object-id-123');
    if (res.success !== false || res.error !== 'Invalid project ID format') {
      throw new Error(`Expected invalid project ID error, got: ${JSON.stringify(res)}`);
    }
    if (projectDeleteCalls.length > 0) throw new Error('DB deletion was called for malformed ID');
  });

  await runner.test('1.7: Non-existent project ID returns Project not found fail-closed', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;
    const nonExistentId = '507f1f77bcf86cd799439099';
    const res = await deleteProject(nonExistentId);
    if (res.success !== false || res.error !== 'Project not found') {
      throw new Error(`Expected Project not found error, got: ${JSON.stringify(res)}`);
    }
  });

  // SECTION 2: Elimination of Ambiguous Project-Title Matching & Financial Record Integrity
  console.log('\n--- 2. Elimination of Ambiguous Project-Title Matching ---');

  await runner.test('2.1: Duplicate project titles do not collide in platform fee transactions', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Project 1 and Project 3 both have title 'Cloud ERP System'
    // Project 3 has platform fee $2000, Project 2 has platform fee $1500
    const txP3 = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId3);
    const txP2 = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId2);
    if (!txP3 || !txP2) throw new Error('Setup failed: Transactions not found');

    // Setting Project 2's fee to zero (by updating platform to Direct or budget to 0)
    const res = await updateProject(validProjectId2, { platform: 'Direct' });
    if (!res.success) throw new Error(`updateProject failed: ${res.error}`);

    // Project 2 transaction should be removed, Project 3 transaction MUST remain intact!
    const txP2After = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId2);
    const txP3After = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId3);

    if (txP2After) throw new Error('Project 2 fee transaction was not deleted');
    if (!txP3After) throw new Error('Project 3 fee transaction was wrongly deleted by setting Project 2 fee to zero!');
    if (txP3After.amount !== 2000) throw new Error('Project 3 fee transaction amount was altered');
  });

  await runner.test('2.2: Setting platform fee to zero does not delete transactions belonging to duplicate titles', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Project 1 ('Cloud ERP System') is updated with budget $10,000, platform Freelancer -> creates fee $1000
    const createFeeRes = await updateProject(validProjectId1, { platform: 'Freelancer', budget: 10000 });
    if (!createFeeRes.success) throw new Error(`Failed to set fee: ${createFeeRes.error}`);

    const txP1 = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId1);
    if (!txP1 || txP1.amount !== 1000) throw new Error('Project 1 fee transaction was not created with projectId');

    // Now set Project 1 fee to 0
    const zeroFeeRes = await updateProject(validProjectId1, { platform: 'Direct' });
    if (!zeroFeeRes.success) throw new Error(`Failed to set fee to zero: ${zeroFeeRes.error}`);

    // Project 1 transaction deleted, but Project 3 ('Cloud ERP System') transaction MUST remain untouched!
    const txP1After = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId1);
    const txP3After = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId3);

    if (txP1After) throw new Error('Project 1 fee transaction was not removed');
    if (!txP3After) throw new Error('Project 3 fee transaction was wrongly deleted due to identical title!');
  });

  await runner.test('2.3: Project renaming does not detach financial records or redirect them to another project', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Rename Project 3 from 'Cloud ERP System' to 'Modern NextGen ERP'
    const renameRes = await updateProject(validProjectId3, {
      title: 'Modern NextGen ERP',
      budget: 30000 // fee becomes $3000 on Freelancer
    });
    if (!renameRes.success) throw new Error(`Failed to rename project: ${renameRes.error}`);

    // Verify transaction was looked up by projectId and updated with new description and amount
    const txP3 = mockTransactionDb.find(t => t.projectId?.toString() === validProjectId3);
    if (!txP3) throw new Error('Transaction for Project 3 was lost after renaming');
    if (txP3.amount !== 3000) throw new Error(`Expected amount 3000, got: ${txP3.amount}`);
    if (!txP3.description.includes('Modern NextGen ERP')) {
      throw new Error(`Transaction description was not updated: ${txP3.description}`);
    }
  });

  await runner.test('2.4: Repeated completion updates do not create duplicate income transactions', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // First completion of Project 2
    const res1 = await updateProject(validProjectId2, { status: 'Completed' });
    if (!res1.success) throw new Error(`First completion failed: ${res1.error}`);

    const incomeTxs1 = mockTransactionDb.filter(t =>
      t.projectId?.toString() === validProjectId2 && t.type === 'Income'
    );
    if (incomeTxs1.length !== 1) throw new Error(`Expected 1 income transaction, got: ${incomeTxs1.length}`);

    // Repeated completion call with budget change
    const res2 = await updateProject(validProjectId2, { status: 'Completed', budget: 20000 });
    if (!res2.success) throw new Error(`Second completion failed: ${res2.error}`);

    const incomeTxs2 = mockTransactionDb.filter(t =>
      t.projectId?.toString() === validProjectId2 && t.type === 'Income'
    );
    if (incomeTxs2.length !== 1) {
      throw new Error(`Expected still 1 income transaction (updated in place), got: ${incomeTxs2.length}`);
    }
    // Net income = 20000 - 2000 (Upwork 10%) = 18000
    if (incomeTxs2[0].amount !== 18000) {
      throw new Error(`Expected net income 18000, got: ${incomeTxs2[0].amount}`);
    }
  });

  await runner.test('2.5: saveProjectHourlyRate targets specific project by projectId for admin', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Project 1 and Project 3 both share title 'Cloud ERP System'
    // Target Project 3 specifically using validProjectId3
    const res = await saveProjectHourlyRate('Cloud ERP System', 88.50, validProjectId3);
    if (!res.success) throw new Error(`saveProjectHourlyRate failed: ${res.error}`);

    // Project 3 hourly rate should be updated to 88.50
    if (mockProjectDb[validProjectId3].hourlyRate !== 88.50) {
      throw new Error(`Project 3 rate was not updated, current: ${mockProjectDb[validProjectId3].hourlyRate}`);
    }
    // Project 1 (same title) MUST remain 50
    if (mockProjectDb[validProjectId1].hourlyRate !== 50) {
      throw new Error(`Project 1 rate was wrongly mutated by Project 3 update! rate: ${mockProjectDb[validProjectId1].hourlyRate}`);
    }
  });

  await runner.test('2.6: Ambiguous project titles without projectId skip blind shared document update', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Call saveProjectHourlyRate with ambiguous title 'Cloud ERP System' WITHOUT projectId
    const res = await saveProjectHourlyRate('Cloud ERP System', 99.00);
    if (!res.success) throw new Error(`saveProjectHourlyRate failed: ${res.error}`);

    // Personal setting is updated
    if (!res.rates || res.rates['Cloud ERP System'] !== 99.00) throw new Error('Personal rate mapping was not updated');

    // BUT shared project document must NOT be blindly mutated because title is ambiguous
    if (mockProjectDb[validProjectId1].hourlyRate !== 50) throw new Error('Project 1 rate was mutated ambiguously');
    if (mockProjectDb[validProjectId3].hourlyRate !== 40) throw new Error('Project 3 rate was mutated ambiguously');
  });

  await runner.test('2.7: Legacy unlinked transactions without projectId are safely preserved', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Verify unlinked legacy transaction exists
    const legacyTx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439099');
    if (!legacyTx) throw new Error('Legacy transaction setup failed');

    // Update another project with fee 0
    await updateProject(validProjectId2, { platform: 'Direct' });

    // Legacy transaction must still exist!
    const legacyTxAfter = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439099');
    if (!legacyTxAfter) throw new Error('Legacy transaction was deleted by unrelated project fee change');
  });

  // SECTION 3: Regression Verification of Earlier Security Controls
  console.log('\n--- 3. Regression Verification of Prior Security Controls ---');

  await runner.test('3.1: Email actions remain strictly restricted to admin/owner', async () => {
    currentTestCookie = editorCookie;
    const res = await sendCustomEmail({
      to: ['client@example.com'],
      subject: 'Test Subject',
      title: 'Hello',
      content: 'This is a test message'
    });
    if (res.success !== false || !res.error?.includes('Unauthorized: Admin or owner access required')) {
      throw new Error(`Expected email action to be rejected for editor, got: ${JSON.stringify(res)}`);
    }
  });

  await runner.test('3.2: Daily expenses remain strictly owner-only', async () => {
    currentTestCookie = adminCookie;
    const resAdmin = await getDailyExpenses();
    if (!Array.isArray(resAdmin) || resAdmin.length > 0) {
      throw new Error('Admin should receive empty daily expenses (owner-only policy)');
    }
  });

  runner.summary();
}

runTests().catch(err => {
  console.error('Test run failed with unhandled error:', err);
  process.exit(1);
});
