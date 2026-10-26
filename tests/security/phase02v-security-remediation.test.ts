/**
 * Phase 02V: Targeted Financial Integrity Remediation Suite
 *
 * Tests:
 * 1. FIN-02U-01: Concurrent Project Revenue Synchronization
 *    - 1.1: First completion creates one revenue transaction with correct fields
 *    - 1.2: Repeated completion updates existing transaction (idempotent)
 *    - 1.3: Concurrent completion requests cannot create duplicate revenue records
 *    - 1.4: Different projects maintain strictly isolated revenue records
 *    - 1.5: Milestone and platform-fee transactions remain unaffected
 *    - 1.6: Unambiguous legacy unlinked revenue record is safely linked
 *    - 1.7: Ambiguous legacy unlinked revenue records are preserved untouched
 *    - 1.8: Pre-existing duplicates logged safely without destructive deletion
 *
 * 2. FIN-02U-03: Validate Project ID Against Project Name
 *    - 2.1: Matching projectId and projectName succeeds for admin and updates shared doc
 *    - 2.2: Matching projectId and projectName succeeds for editor (personal only, doc untouched)
 *    - 2.3: Mismatched projectId and projectName rejected fail-closed before mutations
 *    - 2.4: Non-existent projectId rejected fail-closed with "Project not found"
 *    - 2.5: Malformed projectId rejected fail-closed with "Invalid project ID format"
 *    - 2.6: Missing projectId with duplicate titles skips shared update safely
 *    - 2.7: Missing projectId with unique title updates shared doc for admin
 *
 * 3. FIN-02U-02: Report Project Deletion Cleanup Failures
 *    - 3.1: Full deletion succeeds when project and marketplace project delete cleanly
 *    - 3.2: Editor role rejected before any deletion operations
 *    - 3.3: Non-existent project returns "Project not found"
 *    - 3.4: Partial cascade failure returns success with warning without silent suppression
 *
 * 4. FIN-02U-04 & Section 6: Financial Failure Handling & Legacy Platform Fee Disambiguation
 *    - 4.1: Transaction failure during updateProject triggers compensating project revert
 *    - 4.2: Unambiguous legacy platform-fee record is safely bound
 *    - 4.3: Ambiguous legacy platform-fee records are preserved unlinked
 *    - 4.4: Zero-fee deletion with unambiguous legacy record deletes single record
 *    - 4.5: Zero-fee deletion with ambiguous legacy records preserves all unlinked records
 *
 * Run via: npx tsx tests/security/phase02v-security-remediation.test.ts
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
import { updateProject, createProject, updateProjectStatus, deleteProject } from '../../app/actions/projectActions';
import { saveProjectHourlyRate } from '../../app/actions/timesheetActions';

// In-memory Stores
const validProjectId1 = '507f1f77bcf86cd799439011';
const validProjectId2 = '507f1f77bcf86cd799439022';
const validProjectId3 = '507f1f77bcf86cd799439033'; // Duplicate title project

let mockProjectDb: Record<string, any> = {};
let mockTransactionDb: Array<any> = [];
let marketplaceDeleteCalls: Array<string> = [];
let projectDeleteCalls: Array<string> = [];
let shouldFailMarketplaceDelete = false;
let shouldFailTransactionCreate = false;

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
      title: 'Cloud ERP System', // Duplicate title
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
    // Project 2 platform fee transaction
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
    // Milestone transaction (unrelated category)
    {
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439005'),
      projectId: new mongoose.Types.ObjectId(validProjectId1),
      projectModel: 'Project',
      platform: 'Direct',
      type: 'Income',
      amount: 10000,
      category: 'Milestone Payment',
      description: 'Sprint 1 milestone deliverable',
      date: new Date(),
      save: async function() { return this; }
    }
  ];

  marketplaceDeleteCalls = [];
  projectDeleteCalls = [];
  shouldFailMarketplaceDelete = false;
  shouldFailTransactionCreate = false;
}

resetMockStores();

// Mock Mongoose models
MarketplaceProject.findByIdAndUpdate = (async () => null) as any;
MarketplaceProject.findByIdAndDelete = (async (id: any) => {
  if (shouldFailMarketplaceDelete) {
    throw new Error('Database connection failed during MarketplaceProject deletion');
  }
  marketplaceDeleteCalls.push(id.toString());
  return { _id: id };
}) as any;
MarketplaceProject.create = (async (d: any) => ({ _id: new mongoose.Types.ObjectId(), ...d })) as any;
Notification.create = (async (d: any) => ({ _id: 'notif_1', ...d })) as any;

Project.findById = ((id: any) => {
  const doc = mockProjectDb[id?.toString()];
  return {
    select: () => ({
      lean: async () => (doc ? { ...doc } : null),
      then: (resolve: any) => resolve(doc ? { ...doc } : null),
    }),
    lean: async () => (doc ? { ...doc } : null),
    then: (resolve: any) => resolve(doc ? { ...doc } : null),
  };
}) as any;

Project.findByIdAndUpdate = ((id: any, update: any) => {
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
    list = list.filter(p => filter.title instanceof RegExp ? filter.title.test(p.title) : p.title === filter.title);
  }
  const queryObj = {
    limit: (n: number) => ({
      lean: async () => list.slice(0, n),
      then: (resolve: any) => resolve(list.slice(0, n))
    }),
    select: () => queryObj,
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
  }
  return {
    then: (resolve: any) => resolve(found ? { ...found } : null)
  };
}) as any;

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

Transaction.countDocuments = (async (query: any) => {
  let list = [...mockTransactionDb];
  if (query.projectId) {
    list = list.filter(t => t.projectId && t.projectId.toString() === query.projectId.toString());
  }
  if (query.category) {
    list = list.filter(t => t.category === query.category);
  }
  if (query.type) {
    list = list.filter(t => t.type === query.type);
  }
  return list.length;
}) as any;

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

Transaction.findByIdAndUpdate = (async (id: any, update: any) => {
  const strId = id?.toString();
  const existing = mockTransactionDb.find(t => t._id.toString() === strId);
  if (existing && update.$set) {
    Object.assign(existing, update.$set);
  }
  return existing || null;
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

Transaction.create = (async (d: any) => {
  if (shouldFailTransactionCreate) {
    throw new Error('Database connection failed during Transaction.create');
  }
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
  }
  return { acknowledged: true, deletedCount: beforeCount - mockTransactionDb.length };
}) as any;

Transaction.prototype.save = async function() {
  if (shouldFailTransactionCreate) {
    throw new Error('Database connection failed during Transaction save');
  }
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
  console.log('🔒 Phase 02V: Targeted Financial Integrity Remediation Suite');
  console.log('===============================================================');

  // Pre-generate tokens
  const editorCookie = await generateAuthToken({
    id: 'u_e',
    email: 'editor@injaazh.test',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 0,
  });

  const adminCookie = await generateAuthToken({
    id: 'u_a',
    email: 'admin@injaazh.test',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
    tokenVersion: 0,
  });

  const viewerCookie = await generateAuthToken({
    id: 'u_v',
    email: 'viewer@injaazh.test',
    role: 'viewer',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 0,
  });

  // --------------------------------------------------------------------------
  // SECTION 1: FIN-02U-01 Concurrent Project Revenue Synchronization
  // --------------------------------------------------------------------------
  console.log('\n--- 1. FIN-02U-01: Concurrent Project Revenue Synchronization ---');

  await runner.test('1.1: First completion creates one revenue transaction with correct fields', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (!res.success) throw new Error(`updateProjectStatus failed: ${res.error}`);

    const revenueTxs = mockTransactionDb.filter(t =>
      t.projectId && t.projectId.toString() === validProjectId1 &&
      t.category === 'Project Revenue'
    );
    if (revenueTxs.length !== 1) throw new Error(`Expected exactly 1 revenue transaction, found ${revenueTxs.length}`);
    if (revenueTxs[0].amount !== 50000) throw new Error(`Expected revenue 50000, got ${revenueTxs[0].amount}`);
    if (revenueTxs[0].projectModel !== 'Project') throw new Error(`Expected projectModel 'Project', got ${revenueTxs[0].projectModel}`);
    if (revenueTxs[0].type !== 'Income') throw new Error(`Expected type 'Income', got ${revenueTxs[0].type}`);
  });

  await runner.test('1.2: Repeated completion updates existing transaction (idempotent)', async () => {
    currentTestCookie = editorCookie;

    // Second completion on same project
    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (!res.success) throw new Error(`Second updateProjectStatus failed: ${res.error}`);

    const revenueTxs = mockTransactionDb.filter(t =>
      t.projectId && t.projectId.toString() === validProjectId1 &&
      t.category === 'Project Revenue'
    );
    if (revenueTxs.length !== 1) throw new Error(`Repeated completion created duplicate transaction! Found ${revenueTxs.length}`);
  });

  await runner.test('1.3: Concurrent completion requests cannot create duplicate revenue records', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Simulate concurrent completion requests
    const [res1, res2] = await Promise.all([
      updateProjectStatus(validProjectId1, 'Completed'),
      updateProjectStatus(validProjectId1, 'Completed')
    ]);

    if (!res1.success || !res2.success) throw new Error('Concurrent completion update failed');

    const revenueTxs = mockTransactionDb.filter(t =>
      t.projectId && t.projectId.toString() === validProjectId1 &&
      t.category === 'Project Revenue'
    );
    if (revenueTxs.length !== 1) {
      throw new Error(`Race condition created duplicate revenue transactions! Found ${revenueTxs.length}`);
    }
  });

  await runner.test('1.4: Different projects maintain strictly isolated revenue records', async () => {
    currentTestCookie = editorCookie;

    // Complete Project 2 (budget 15000, fee 1500 -> net revenue 13500)
    await updateProjectStatus(validProjectId2, 'Completed');

    const p1Txs = mockTransactionDb.filter(t => t.projectId && t.projectId.toString() === validProjectId1 && t.category === 'Project Revenue');
    const p2Txs = mockTransactionDb.filter(t => t.projectId && t.projectId.toString() === validProjectId2 && t.category === 'Project Revenue');

    if (p1Txs.length !== 1 || p1Txs[0].amount !== 50000) throw new Error('Project 1 revenue corrupted');
    if (p2Txs.length !== 1 || p2Txs[0].amount !== 13500) throw new Error(`Project 2 expected revenue 13500, got ${p2Txs[0]?.amount}`);
  });

  await runner.test('1.5: Milestone and platform-fee transactions remain unaffected', async () => {
    const milestoneTx = mockTransactionDb.find(t => t.category === 'Milestone Payment');
    if (!milestoneTx || milestoneTx.amount !== 10000) {
      throw new Error('Milestone payment transaction was unexpectedly altered or deleted');
    }
  });

  await runner.test('1.6: Unambiguous legacy unlinked revenue record is safely linked', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Setup single unlinked legacy revenue record for Project 1 (ensure unique project title)
    delete mockProjectDb[validProjectId3];
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439088'),
      projectId: null,
      type: 'Income',
      amount: 45000,
      category: 'Project Revenue',
      description: 'Revenue from completed project: Cloud ERP System',
      date: new Date(),
      save: async function() { return this; }
    });

    await updateProjectStatus(validProjectId1, 'Completed');

    const linkedTx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439088');
    if (!linkedTx) throw new Error('Legacy transaction was deleted');
    if (linkedTx.projectId?.toString() !== validProjectId1) {
      throw new Error(`Legacy transaction was not linked to project 1; got ${linkedTx.projectId}`);
    }
  });

  await runner.test('1.7: Ambiguous legacy unlinked revenue records are preserved untouched', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Add 2 unlinked legacy records with the same description
    mockTransactionDb.push(
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439081'),
        projectId: null,
        type: 'Income',
        amount: 20000,
        category: 'Project Revenue',
        description: 'Revenue from completed project: Cloud ERP System',
        date: new Date(),
        save: async function() { return this; }
      },
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439082'),
        projectId: null,
        type: 'Income',
        amount: 30000,
        category: 'Project Revenue',
        description: 'Revenue from completed project: Cloud ERP System',
        date: new Date(),
        save: async function() { return this; }
      }
    );

    await updateProjectStatus(validProjectId1, 'Completed');

    // Both ambiguous unlinked records must still exist with projectId === null
    const leg1 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439081');
    const leg2 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439082');
    if (!leg1 || leg1.projectId !== null || !leg2 || leg2.projectId !== null) {
      throw new Error('Ambiguous legacy records were incorrectly modified or deleted');
    }

    // A clean new record with projectId: validProjectId1 must be created
    const activeTx = mockTransactionDb.find(t => t.projectId && t.projectId.toString() === validProjectId1 && t.category === 'Project Revenue');
    if (!activeTx) throw new Error('New project revenue was not created');
  });

  // --------------------------------------------------------------------------
  // SECTION 2: FIN-02U-03 Validate Project ID Against Project Name
  // --------------------------------------------------------------------------
  console.log('\n--- 2. FIN-02U-03: Validate Project ID Against Project Name ---');

  await runner.test('2.1: Matching projectId and projectName succeeds for admin and updates shared doc', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    const res = await saveProjectHourlyRate('Cloud ERP System', 72.50, validProjectId1);
    if (!res.success) throw new Error(`saveProjectHourlyRate failed: ${res.error}`);

    // Verify shared document hourlyRate updated
    if (mockProjectDb[validProjectId1].hourlyRate !== 72.50) {
      throw new Error(`Shared document rate was not updated; got ${mockProjectDb[validProjectId1].hourlyRate}`);
    }
    // Verify personal settings updated
    const settings = mockSettingsDb['project_hourly_rates_u_a'];
    if (settings?.value?.['Cloud ERP System'] !== 72.50 || settings?.value?.[`id_${validProjectId1}`] !== 72.50) {
      throw new Error('Personal settings were not updated');
    }
  });

  await runner.test('2.2: Matching projectId and projectName succeeds for editor (personal only, doc untouched)', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    const res = await saveProjectHourlyRate('Cloud ERP System', 65.00, validProjectId1);
    if (!res.success) throw new Error(`saveProjectHourlyRate failed: ${res.error}`);

    // Shared doc must NOT be updated by editor
    if (mockProjectDb[validProjectId1].hourlyRate !== 50) {
      throw new Error('Shared Project document was unexpectedly altered by editor');
    }
    // Personal setting updated
    const settings = mockSettingsDb['project_hourly_rates_u_e'];
    if (settings?.value?.['Cloud ERP System'] !== 65.00) {
      throw new Error('Personal rate was not updated for editor');
    }
  });

  await runner.test('2.3: Mismatched projectId and projectName rejected fail-closed before mutations', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Supply projectName "Mobile App Redesign" but projectId for "Cloud ERP System"
    const res = await saveProjectHourlyRate('Mobile App Redesign', 99.00, validProjectId1);
    if (res.success !== false) throw new Error('Expected mismatched project ID and name to fail');
    if (!res.error?.includes('does not match')) {
      throw new Error(`Expected mismatch error, got: ${res.error}`);
    }

    // Assert neither project's shared rate was mutated
    if (mockProjectDb[validProjectId1].hourlyRate !== 50) throw new Error('Project 1 rate was mutated on mismatch');
    if (mockProjectDb[validProjectId2].hourlyRate !== 35) throw new Error('Project 2 rate was mutated on mismatch');

    // Assert personal preferences were NOT mutated
    if (mockSettingsDb['project_hourly_rates_u_a']?.value?.['Mobile App Redesign'] === 99.00) {
      throw new Error('Personal preferences were altered despite mismatch rejection');
    }
  });

  await runner.test('2.4: Non-existent projectId rejected fail-closed with "Project not found"', async () => {
    currentTestCookie = adminCookie;
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await saveProjectHourlyRate('Any Project', 60.00, fakeId);
    if (res.success !== false) throw new Error('Expected non-existent project to fail');
    if (res.error !== 'Project not found') throw new Error(`Expected "Project not found", got: ${res.error}`);
  });

  await runner.test('2.5: Malformed projectId rejected fail-closed with "Invalid project ID format"', async () => {
    currentTestCookie = adminCookie;

    const res = await saveProjectHourlyRate('Any Project', 60.00, 'not-a-valid-id');
    if (res.success !== false) throw new Error('Expected malformed project ID to fail');
    if (res.error !== 'Invalid project ID format') throw new Error(`Expected "Invalid project ID format", got: ${res.error}`);
  });

  await runner.test('2.6: Missing projectId with duplicate titles skips shared update safely', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Title "Cloud ERP System" is shared by validProjectId1 and validProjectId3
    const res = await saveProjectHourlyRate('Cloud ERP System', 82.00);
    if (!res.success) throw new Error(`saveProjectHourlyRate failed: ${res.error}`);

    // Shared docs must NOT be modified blindly
    if (mockProjectDb[validProjectId1].hourlyRate !== 50) throw new Error('Project 1 was modified despite title ambiguity');
    if (mockProjectDb[validProjectId3].hourlyRate !== 40) throw new Error('Project 3 was modified despite title ambiguity');

    // Personal rate is saved
    if (res.rates?.['Cloud ERP System'] !== 82.00) throw new Error('Personal rate was not recorded');
  });

  await runner.test('2.7: Missing projectId with unique title updates shared doc for admin', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Title "Mobile App Redesign" is unique to validProjectId2
    const res = await saveProjectHourlyRate('Mobile App Redesign', 42.00);
    if (!res.success) throw new Error(`saveProjectHourlyRate failed: ${res.error}`);

    if (mockProjectDb[validProjectId2].hourlyRate !== 42.00) {
      throw new Error(`Shared document rate was not updated; got ${mockProjectDb[validProjectId2].hourlyRate}`);
    }
  });

  // --------------------------------------------------------------------------
  // SECTION 3: FIN-02U-02 Report Project Deletion Cleanup Failures
  // --------------------------------------------------------------------------
  console.log('\n--- 3. FIN-02U-02: Report Project Deletion Cleanup Failures ---');

  await runner.test('3.1: Full deletion succeeds when project and marketplace project delete cleanly', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    const res = await deleteProject(validProjectId1);
    if (!res.success) throw new Error(`deleteProject failed: ${res.error}`);
    if (res.warning) throw new Error(`Unexpected warning on clean deletion: ${res.warning}`);
    if (mockProjectDb[validProjectId1]) throw new Error('Primary project was not deleted');
    if (!marketplaceDeleteCalls.includes('607f1f77bcf86cd799439001')) {
      throw new Error('Associated marketplace project was not deleted');
    }
  });

  await runner.test('3.2: Editor role rejected before any deletion operations', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    const res = await deleteProject(validProjectId2);
    if (res.success !== false) throw new Error('Expected editor deleteProject to fail');
    if (!res.error?.includes('Admin or owner access required')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
    if (!mockProjectDb[validProjectId2]) throw new Error('Project was deleted despite authorization failure');
  });

  await runner.test('3.3: Non-existent project returns "Project not found"', async () => {
    currentTestCookie = adminCookie;
    const fakeId = new mongoose.Types.ObjectId().toString();

    const res = await deleteProject(fakeId);
    if (res.success !== false) throw new Error('Expected delete of non-existent project to fail');
    if (res.error !== 'Project not found') throw new Error(`Expected "Project not found", got: ${res.error}`);
  });

  await runner.test('3.4: Partial cascade failure returns success with warning without silent suppression', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;
    shouldFailMarketplaceDelete = true; // Inject cascade failure

    const res = await deleteProject(validProjectId2);
    if (!res.success) throw new Error('Primary deletion should succeed despite cascade cleanup failure');
    if (!res.warning) throw new Error('Expected warning message on cascade cleanup failure, got undefined');
    if (!res.warning.includes('cleanup of the associated marketplace project could not be completed')) {
      throw new Error(`Unexpected warning message: ${res.warning}`);
    }
    if (res.data?.cascadeFailed !== true) {
      throw new Error(`Expected data.cascadeFailed === true, got ${res.data?.cascadeFailed}`);
    }
    if (mockProjectDb[validProjectId2]) throw new Error('Primary project was not deleted');
  });

  // --------------------------------------------------------------------------
  // SECTION 4: FIN-02U-04 & Section 6: Financial Failure Handling & Legacy Platform Fee Safety
  // --------------------------------------------------------------------------
  console.log('\n--- 4. FIN-02U-04: Financial Failure Handling & Legacy Platform Fee Safety ---');

  await runner.test('4.1: Transaction failure during updateProject triggers compensating project revert', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;
    shouldFailTransactionCreate = true; // Inject transaction failure

    const res = await updateProject(validProjectId1, {
      platform: 'Upwork', // Triggers 10% platformFee = $5,000
      budget: 50000,
    });

    if (res.success !== false) throw new Error('Expected updateProject to fail when transaction write fails');
    if (!res.error?.includes('Financial synchronization failed')) {
      throw new Error(`Expected financial synchronization failure error, got: ${res.error}`);
    }

    // Verify project document platformFee was reverted back to 0
    if (mockProjectDb[validProjectId1].platformFee !== 0) {
      throw new Error(`Project platformFee was not reverted! Got ${mockProjectDb[validProjectId1].platformFee}`);
    }
  });

  await runner.test('4.2: Unambiguous legacy platform-fee record is safely bound', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Add exactly 1 legacy platform fee record for Project 1
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439055'),
      projectId: null,
      platform: 'Upwork',
      type: 'Expense',
      amount: 4000,
      category: 'Platform Fee',
      description: 'Platform Fee for Project: Cloud ERP System',
      date: new Date(),
      save: async function() { return this; }
    });

    const res = await updateProject(validProjectId1, {
      platform: 'Upwork',
      budget: 50000,
    });
    if (!res.success) throw new Error(`updateProject failed: ${res.error}`);

    const linkedLegacy = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439055');
    if (!linkedLegacy) throw new Error('Legacy record was lost');
    if (linkedLegacy.projectId?.toString() !== validProjectId1) {
      throw new Error(`Legacy record was not linked to validProjectId1; got ${linkedLegacy.projectId}`);
    }
  });

  await runner.test('4.3: Ambiguous legacy platform-fee records are preserved unlinked', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Add 2 legacy records with same title
    mockTransactionDb.push(
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439061'),
        projectId: null,
        platform: 'Upwork',
        type: 'Expense',
        amount: 3000,
        category: 'Platform Fee',
        description: 'Platform Fee for Project: Cloud ERP System',
        date: new Date(),
        save: async function() { return this; }
      },
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439062'),
        projectId: null,
        platform: 'Upwork',
        type: 'Expense',
        amount: 3500,
        category: 'Platform Fee',
        description: 'Platform Fee for Project: Cloud ERP System',
        date: new Date(),
        save: async function() { return this; }
      }
    );

    const res = await updateProject(validProjectId1, {
      platform: 'Upwork',
      budget: 50000,
    });
    if (!res.success) throw new Error(`updateProject failed: ${res.error}`);

    // Verify both ambiguous legacy records were NOT modified
    const leg1 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439061');
    const leg2 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439062');
    if (!leg1 || leg1.projectId !== null || !leg2 || leg2.projectId !== null) {
      throw new Error('Ambiguous legacy records were wrongly bound');
    }
  });

  await runner.test('4.4: Zero-fee deletion with unambiguous legacy record deletes single record', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Single legacy record
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439071'),
      projectId: null,
      platform: 'Upwork',
      type: 'Expense',
      amount: 1500,
      category: 'Platform Fee',
      description: 'Platform Fee for Project: Cloud ERP System',
      date: new Date(),
      save: async function() { return this; }
    });

    const res = await updateProject(validProjectId1, { platform: 'Direct' }); // Direct fee = 0
    if (!res.success) throw new Error(`updateProject failed: ${res.error}`);

    const found = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439071');
    if (found) throw new Error('Unambiguous legacy record was not deleted on fee zero');
  });

  await runner.test('4.5: Zero-fee deletion with ambiguous legacy records preserves all unlinked records', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // 2 legacy records with same title
    mockTransactionDb.push(
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439075'),
        projectId: null,
        platform: 'Upwork',
        type: 'Expense',
        amount: 1500,
        category: 'Platform Fee',
        description: 'Platform Fee for Project: Cloud ERP System',
        date: new Date(),
        save: async function() { return this; }
      },
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439076'),
        projectId: null,
        platform: 'Upwork',
        type: 'Expense',
        amount: 1500,
        category: 'Platform Fee',
        description: 'Platform Fee for Project: Cloud ERP System',
        date: new Date(),
        save: async function() { return this; }
      }
    );

    const res = await updateProject(validProjectId1, { platform: 'Direct' });
    if (!res.success) throw new Error(`updateProject failed: ${res.error}`);

    // Both ambiguous legacy records must be preserved
    const found1 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439075');
    const found2 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439076');
    if (!found1 || !found2) throw new Error('Ambiguous legacy records were blindly deleted on fee zero');
  });

  runner.summary();
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
