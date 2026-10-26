/**
 * Phase 02X: Final Financial Concurrency and Rollback Hardening Suite
 *
 * Tests:
 * 1. Finding A: Revenue Upsert Concurrency & Duplicate-Key Handling
 *    - 1.1: Standard project completion creates revenue record with correct fields & projectModel
 *    - 1.2: Duplicate-key error (E11000) during initial upsert race is caught and safely reconciled
 *    - 1.3: Reconciliation failure after duplicate-key conflict throws clear error fail-closed
 *    - 1.4: Non-duplicate key error (e.g. DB connection error) during upsert is re-thrown fail-closed
 *    - 1.5: Pre-existing duplicate revenue records are audited non-destructively without deletion
 *
 * 2. Finding B: Concurrent-Safe Platform-Fee Compensation
 *    - 2.1: Successful project and transaction update
 *    - 2.2: Transaction update failure triggers CAS compensating revert back to oldProject.platformFee
 *    - 2.3: Stale compensation guard: Concurrent update changing platformFee is NOT overwritten by stale rollback
 *    - 2.4: Idempotent retries: Retrying updateProject after transaction creation updates existing record without duplicates
 *    - 2.5: Zero-fee update removes transaction cleanly and idempotently
 *
 * 3. Finding C: Legacy Revenue Attribution
 *    - 3.1: Unique project title + unique legacy unlinked transaction binds safely
 *    - 3.2: Duplicate project titles in database prevent legacy attribution (remains unlinked)
 *    - 3.3: Multiple legacy unlinked transactions prevent legacy attribution (remains unlinked)
 *    - 3.4: Unrelated description does not match project title
 *    - 3.5: Renamed project does not bind unlinked transactions matching old title
 *
 * 4. Regression Verification of Prior Security Controls
 *    - 4.1: Viewer cannot update projects or delete projects
 *    - 4.2: Editor cannot hard-delete projects
 *    - 4.3: Editor cannot modify hourlyRate via updateProject
 *    - 4.4: Disallowed fields in updateProject are rejected fail-closed
 *    - 4.5: saveProjectHourlyRate rejects mismatched projectId and projectName fail-closed
 *
 * Run via: npx tsx tests/security/phase02x-security-remediation.test.ts
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
import { updateProject, updateProjectStatus, deleteProject } from '../../app/actions/projectActions';
import { saveProjectHourlyRate } from '../../app/actions/timesheetActions';

// Test project IDs
const validProjectId1 = '507f1f77bcf86cd799439011';
const validProjectId2 = '507f1f77bcf86cd799439022';
const validProjectId3 = '507f1f77bcf86cd799439033'; // Duplicate title project

let mockProjectDb: Record<string, any> = {};
let mockTransactionDb: Array<any> = [];
let shouldFailTransactionSave = false;
let shouldTriggerDuplicateKeyError = false;
let shouldFailReconciliation = false;
let shouldFailUpsertGeneric = false;

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
      title: 'Cloud ERP System', // Intentionally identical title to Project 1
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

  shouldFailTransactionSave = false;
  shouldTriggerDuplicateKeyError = false;
  shouldFailReconciliation = false;
  shouldFailUpsertGeneric = false;
}

resetMockStores();

// Mock Mongoose models
MarketplaceProject.findByIdAndUpdate = (async () => null) as any;
MarketplaceProject.findByIdAndDelete = (async (id: any) => ({ _id: id })) as any;
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

Project.findByIdAndDelete = (async (id: any) => {
  const strId = id?.toString();
  delete mockProjectDb[strId];
  return { _id: id };
}) as any;

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

Project.countDocuments = (async (query: any) => {
  let list = Object.values(mockProjectDb);
  if (query && query.title) {
    list = list.filter(p => query.title instanceof RegExp ? query.title.test(p.title) : p.title === query.title);
  }
  return list.length;
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
  if (found && typeof found.save !== 'function') {
    found.save = async function() { return this; };
  }
  return {
    then: (resolve: any) => resolve(found || null)
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
  if (shouldFailUpsertGeneric) {
    throw new Error('Database connection timed out during upsert');
  }

  if (shouldTriggerDuplicateKeyError && options?.upsert) {
    const err: any = new Error('E11000 duplicate key error collection: injaazh-erp.transactions index: projectId_1_category_1_type_1 dup key');
    err.code = 11000;
    err.name = 'MongoServerError';
    throw err;
  }

  if (shouldFailReconciliation && !options?.upsert) {
    return null; // Reconciliation re-read returns null
  }

  let existing = mockTransactionDb.find(t =>
    (!filter.projectId || (t.projectId && t.projectId.toString() === filter.projectId.toString())) &&
    (!filter.category || t.category === filter.category) &&
    (!filter.type || t.type === filter.type)
  );

  if (existing) {
    if (update.$set) Object.assign(existing, update.$set);
    return existing;
  }

  if (options?.upsert) {
    const newDoc: any = {
      _id: new mongoose.Types.ObjectId(),
      ...(update.$set || {}),
      ...(update.$setOnInsert || {}),
      projectId: filter.projectId,
      category: filter.category,
      type: filter.type,
      save: async function() { return this; }
    };
    mockTransactionDb.push(newDoc);
    return newDoc;
  }
  return null;
}) as any;

Transaction.findByIdAndUpdate = (async (id: any, update: any) => {
  const existing = mockTransactionDb.find(t => t._id.toString() === id.toString());
  if (existing && update.$set) {
    Object.assign(existing, update.$set);
    return existing;
  }
  return null;
}) as any;

Transaction.deleteMany = (async (query: any) => {
  if (query.projectId) {
    mockTransactionDb = mockTransactionDb.filter(t =>
      !(t.projectId && t.projectId.toString() === query.projectId.toString() &&
      (!query.category || t.category === query.category))
    );
  }
  return { acknowledged: true };
}) as any;

Transaction.findByIdAndDelete = (async (id: any) => {
  mockTransactionDb = mockTransactionDb.filter(t => t._id.toString() !== id.toString());
  return { _id: id };
}) as any;

Transaction.prototype.save = async function() {
  if (shouldFailTransactionSave) {
    throw new Error('Database connection failed during Transaction save');
  }
  const idStr = this._id ? this._id.toString() : new mongoose.Types.ObjectId().toString();
  this._id = new mongoose.Types.ObjectId(idStr);
  const idx = mockTransactionDb.findIndex(t => t._id.toString() === idStr);
  if (idx >= 0) {
    mockTransactionDb[idx] = this;
  } else {
    mockTransactionDb.push(this);
  }
  return this;
};

// SystemSettings mock
let mockSettingsDb: Record<string, any> = {};
SystemSettings.findOne = (async (query: any) => {
  const doc = mockSettingsDb[query.key];
  return doc ? { ...doc } : null;
}) as any;

SystemSettings.findOneAndUpdate = (async (query: any, update: any) => {
  mockSettingsDb[query.key] = { key: query.key, value: update.value };
  return mockSettingsDb[query.key];
}) as any;

// Test Runner
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
      console.error(`     Error: ${err.message}`);
      this.failed++;
    }
  }
}

async function runTests() {
  console.log('\n===============================================================');
  console.log('🔒 Phase 02X: Final Financial Concurrency & Rollback Suite');
  console.log('===============================================================\n');

  const runner = new TestRunner();

  const adminCookie = await generateAuthToken({
    id: 'u_a',
    email: 'admin@injaazh.test',
    role: 'admin',
    sessionId: 'session_mock_valid_admin',
    tokenVersion: 0,
  });

  const editorCookie = await generateAuthToken({
    id: 'u_e',
    email: 'editor@injaazh.test',
    role: 'editor',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 0,
  });

  const viewerCookie = await generateAuthToken({
    id: 'u_v',
    email: 'viewer@injaazh.test',
    role: 'viewer',
    sessionId: 'session_mock_valid_123',
    tokenVersion: 0,
  });

  // -------------------------------------------------------------
  // 1. Finding A: Revenue Upsert Concurrency & Duplicate-Key Handling
  // -------------------------------------------------------------
  console.log('--- 1. Finding A: Revenue Upsert Concurrency & Duplicate-Key Handling ---');

  await runner.test('1.1: Standard project completion creates revenue record with correct fields & projectModel', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (!res.success) throw new Error(`Status update failed: ${res.error}`);

    const tx = mockTransactionDb.find(t =>
      t.projectId && t.projectId.toString() === validProjectId1 &&
      t.category === 'Project Revenue' &&
      t.type === 'Income'
    );
    if (!tx) throw new Error('Revenue transaction was not created');
    if (tx.amount !== 50000) throw new Error(`Expected amount 50000, got ${tx.amount}`);
    if (tx.projectModel !== 'Project') throw new Error(`Expected projectModel 'Project', got ${tx.projectModel}`);
    if (tx.platform !== 'Direct') throw new Error(`Expected platform 'Direct', got ${tx.platform}`);
  });

  await runner.test('1.2: Duplicate-key error (E11000) during initial upsert race is caught and safely reconciled', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Simulate pre-existing revenue document in DB (inserted by racing Request 1)
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439099'),
      projectId: new mongoose.Types.ObjectId(validProjectId1),
      projectModel: 'Project',
      type: 'Income',
      amount: 45000,
      category: 'Project Revenue',
      description: 'Initial insert by racing request',
      date: new Date(),
      save: async function() { return this; }
    });

    // Request 2 encounters duplicate key error during upsert
    shouldTriggerDuplicateKeyError = true;

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (!res.success) throw new Error(`Expected reconciliation to succeed; got ${res.error}`);

    // Verify reconciliation: document was updated with new net amount (50000)
    const tx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439099');
    if (!tx || tx.amount !== 50000) {
      throw new Error(`Document was not reconciled with netIncome 50000; amount is ${tx?.amount}`);
    }
  });

  await runner.test('1.3: Reconciliation failure after duplicate-key conflict throws clear error fail-closed', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    shouldTriggerDuplicateKeyError = true;
    shouldFailReconciliation = true;

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (res.success !== false) {
      throw new Error('Expected updateProjectStatus to fail when reconciliation fails');
    }
    if (!res.error?.includes('Revenue reconciliation failed')) {
      throw new Error(`Expected reconciliation error message, got: ${res.error}`);
    }
  });

  await runner.test('1.4: Non-duplicate key error (e.g. DB connection error) during upsert is re-thrown fail-closed', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    shouldFailUpsertGeneric = true;

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (res.success !== false) {
      throw new Error('Expected updateProjectStatus to fail when DB upsert throws generic error');
    }
    if (!res.error?.includes('Database connection timed out')) {
      throw new Error(`Expected DB timeout error, got: ${res.error}`);
    }
  });

  await runner.test('1.5: Pre-existing duplicate revenue records are audited non-destructively without deletion', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Simulate 2 pre-existing historical revenue records for Project 1
    mockTransactionDb.push(
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd79943901a'),
        projectId: new mongoose.Types.ObjectId(validProjectId1),
        type: 'Income',
        amount: 25000,
        category: 'Project Revenue',
        description: 'Historical tranche 1',
        date: new Date()
      },
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd79943901b'),
        projectId: new mongoose.Types.ObjectId(validProjectId1),
        type: 'Income',
        amount: 25000,
        category: 'Project Revenue',
        description: 'Historical tranche 2',
        date: new Date()
      }
    );

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (!res.success) throw new Error(`Update status failed: ${res.error}`);

    // Verify neither historical record was deleted
    const r1 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd79943901a');
    const r2 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd79943901b');
    if (!r1 || !r2) throw new Error('Historical duplicate records were destructively deleted');
  });

  // -------------------------------------------------------------
  // 2. Finding B: Concurrent-Safe Platform-Fee Compensation
  // -------------------------------------------------------------
  console.log('\n--- 2. Finding B: Concurrent-Safe Platform-Fee Compensation ---');

  await runner.test('2.1: Successful project and platform-fee transaction update', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Update Project 1 to platform 'Upwork' (10% fee on 50000 = 5000)
    const res = await updateProject(validProjectId1, {
      platform: 'Upwork',
      budget: 50000
    });

    if (!res.success) throw new Error(`updateProject failed: ${res.error}`);

    const p1 = mockProjectDb[validProjectId1];
    if (p1.platformFee !== 5000) throw new Error(`Expected platformFee 5000, got ${p1.platformFee}`);

    const feeTx = mockTransactionDb.find(t =>
      t.projectId && t.projectId.toString() === validProjectId1 &&
      t.category === 'Platform Fee'
    );
    if (!feeTx || feeTx.amount !== 5000) throw new Error(`Expected fee transaction amount 5000, got ${feeTx?.amount}`);
  });

  await runner.test('2.2: Transaction update failure triggers CAS compensating revert back to oldProject.platformFee', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;
    shouldFailTransactionSave = true;

    // Project 1 currently has platformFee: 0
    const res = await updateProject(validProjectId1, {
      platform: 'Upwork',
      budget: 50000
    });

    if (res.success !== false) throw new Error('Expected updateProject to fail when transaction save fails');
    if (!res.error?.includes('Financial synchronization failed')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }

    // Verify CAS reverted platformFee back to 0
    const p1 = mockProjectDb[validProjectId1];
    if (p1.platformFee !== 0) throw new Error(`Expected platformFee to be reverted to 0, got ${p1.platformFee}`);
  });

  await runner.test('2.3: Stale compensation guard: Concurrent update changing platformFee is NOT overwritten by stale rollback', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Simulate concurrent race:
    // Request 1 sets fee to 5000. While Request 1 is writing transaction, Request 2 changes fee to 8000.
    // When Request 1's transaction save fails, CAS checks { _id: validProjectId1, platformFee: 5000 }.
    // Because current fee in DB is 8000 (set by Request 2), CAS does NOT match and does NOT clobber 8000!

    // Setup: simulate DB being updated to 8000 by concurrent Request 2 right before Request 1's compensation
    const originalFindOneAndUpdate = Project.findOneAndUpdate;
    let casIntercepted = false;

    Project.findOneAndUpdate = ((filter: any, update: any) => {
      if (filter._id && filter.platformFee !== undefined) {
        casIntercepted = true;
        // Simulate concurrent Request 2 having changed the DB to 8000
        mockProjectDb[validProjectId1].platformFee = 8000;
        // Now evaluate filter: filter.platformFee (5000) does not match 8000!
        if (mockProjectDb[validProjectId1].platformFee !== filter.platformFee) {
          return {
            lean: async () => null,
            then: (resolve: any) => resolve(null)
          };
        }
      }
      return (originalFindOneAndUpdate as any)(filter, update);
    }) as any;

    shouldFailTransactionSave = true;

    const res = await updateProject(validProjectId1, {
      platform: 'Upwork',
      budget: 50000 // fee would be 5000
    });

    Project.findOneAndUpdate = originalFindOneAndUpdate; // Restore

    if (!casIntercepted) throw new Error('CAS compensation logic was not reached');
    if (res.success !== false) throw new Error('Expected updateProject to fail fail-closed');
    if (!res.error?.includes('Concurrent modification preserved')) {
      throw new Error(`Expected concurrent modification notice in error, got: ${res.error}`);
    }

    // Crucial check: newer concurrent value 8000 was preserved!
    const p1 = mockProjectDb[validProjectId1];
    if (p1.platformFee !== 8000) {
      throw new Error(`Stale compensation overwrote newer concurrent platformFee! Expected 8000, got ${p1.platformFee}`);
    }
  });

  await runner.test('2.4: Idempotent retries: Retrying updateProject after transaction creation updates existing record without duplicates', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // First attempt succeeds
    const res1 = await updateProject(validProjectId1, { platform: 'Upwork', budget: 50000 });
    if (!res1.success) throw new Error(`First attempt failed: ${res1.error}`);

    // Second attempt (retry with same or updated budget)
    const res2 = await updateProject(validProjectId1, { platform: 'Upwork', budget: 60000 });
    if (!res2.success) throw new Error(`Retry failed: ${res2.error}`);

    const feeTxs = mockTransactionDb.filter(t =>
      t.projectId && t.projectId.toString() === validProjectId1 &&
      t.category === 'Platform Fee'
    );
    if (feeTxs.length !== 1) {
      throw new Error(`Retry created duplicate platform fee transactions! Expected 1, found ${feeTxs.length}`);
    }
    if (feeTxs[0].amount !== 6000) {
      throw new Error(`Expected updated fee 6000, got ${feeTxs[0].amount}`);
    }
  });

  await runner.test('2.5: Zero-fee update removes transaction cleanly and idempotently', async () => {
    resetMockStores();
    currentTestCookie = adminCookie;

    // Project 2 has platformFee: 1500 and an existing transaction. Update to platform: 'Direct' (fee: 0)
    const res = await updateProject(validProjectId2, { platform: 'Direct' });
    if (!res.success) throw new Error(`Zero-fee update failed: ${res.error}`);

    const p2Txs = mockTransactionDb.filter(t =>
      t.projectId && t.projectId.toString() === validProjectId2 &&
      t.category === 'Platform Fee'
    );
    if (p2Txs.length !== 0) {
      throw new Error(`Expected 0 fee transactions after setting fee to 0, found ${p2Txs.length}`);
    }
  });

  // -------------------------------------------------------------
  // 3. Finding C: Legacy Revenue Attribution
  // -------------------------------------------------------------
  console.log('\n--- 3. Finding C: Legacy Revenue Attribution ---');

  await runner.test('3.1: Unique project title + unique legacy unlinked transaction binds safely', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Project 2 has unique title 'Mobile App Redesign' (no other project shares this title)
    // Add 1 unlinked legacy revenue record for Project 2
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439077'),
      projectId: null,
      type: 'Income',
      amount: 13500,
      category: 'Project Revenue',
      description: 'Revenue from completed project: Mobile App Redesign',
      date: new Date(),
      save: async function() { return this; }
    });

    const res = await updateProjectStatus(validProjectId2, 'Completed');
    if (!res.success) throw new Error(`Status update failed: ${res.error}`);

    const linkedTx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439077');
    if (!linkedTx) throw new Error('Legacy transaction was deleted');
    if (linkedTx.projectId?.toString() !== validProjectId2) {
      throw new Error(`Expected legacy transaction to be bound to ${validProjectId2}, got ${linkedTx.projectId}`);
    }
    if (linkedTx.projectModel !== 'Project') {
      throw new Error(`Expected projectModel 'Project', got ${linkedTx.projectModel}`);
    }
  });

  await runner.test('3.2: Duplicate project titles in database prevent legacy attribution (remains unlinked)', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Project 1 and Project 3 both share title 'Cloud ERP System'
    // Add 1 unlinked legacy revenue record for 'Cloud ERP System'
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439088'),
      projectId: null,
      type: 'Income',
      amount: 50000,
      category: 'Project Revenue',
      description: 'Revenue from completed project: Cloud ERP System',
      date: new Date(),
      save: async function() { return this; }
    });

    const res = await updateProjectStatus(validProjectId1, 'Completed');
    if (!res.success) throw new Error(`Status update failed: ${res.error}`);

    // Because Project 1 and Project 3 share the same title, attribution is ambiguous!
    // The legacy record MUST remain unlinked (projectId: null)
    const tx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439088');
    if (tx.projectId !== null && tx.projectId !== undefined) {
      throw new Error(`Ambiguous legacy transaction was wrongly bound to project ${tx.projectId} despite duplicate titles!`);
    }
  });

  await runner.test('3.3: Multiple legacy unlinked transactions prevent legacy attribution (remains unlinked)', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Add 2 unlinked legacy records for Project 2
    mockTransactionDb.push(
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439091'),
        projectId: null,
        type: 'Income',
        amount: 5000,
        category: 'Project Revenue',
        description: 'Revenue from completed project: Mobile App Redesign',
        date: new Date(),
        save: async function() { return this; }
      },
      {
        _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439092'),
        projectId: null,
        type: 'Income',
        amount: 8500,
        category: 'Project Revenue',
        description: 'Revenue from completed project: Mobile App Redesign',
        date: new Date(),
        save: async function() { return this; }
      }
    );

    const res = await updateProjectStatus(validProjectId2, 'Completed');
    if (!res.success) throw new Error(`Status update failed: ${res.error}`);

    const t1 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439091');
    const t2 = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439092');
    if (t1.projectId !== null || t2.projectId !== null) {
      throw new Error('Multiple legacy candidate records were wrongly bound instead of preserved unlinked');
    }
  });

  await runner.test('3.4: Unrelated description does not match project title', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439099'),
      projectId: null,
      type: 'Income',
      amount: 15000,
      category: 'Project Revenue',
      description: 'Revenue from unrelated client project: Quantum Analytics',
      date: new Date(),
      save: async function() { return this; }
    });

    await updateProjectStatus(validProjectId2, 'Completed');

    const unrelatedTx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439099');
    if (unrelatedTx.projectId !== null) {
      throw new Error('Unrelated transaction description was erroneously bound');
    }
  });

  await runner.test('3.5: Renamed project does not bind unlinked transactions matching old title', async () => {
    resetMockStores();
    currentTestCookie = editorCookie;

    // Legacy unlinked record has description with OLD title "Old Mobile App Name"
    mockTransactionDb.push({
      _id: new mongoose.Types.ObjectId('707f1f77bcf86cd799439098'),
      projectId: null,
      type: 'Income',
      amount: 15000,
      category: 'Project Revenue',
      description: 'Revenue from completed project: Old Mobile App Name',
      date: new Date(),
      save: async function() { return this; }
    });

    // Complete Project 2 which is now named "Mobile App Redesign"
    await updateProjectStatus(validProjectId2, 'Completed');

    const legacyTx = mockTransactionDb.find(t => t._id.toString() === '707f1f77bcf86cd799439098');
    if (legacyTx.projectId !== null) {
      throw new Error('Legacy record with old name was erroneously bound to renamed project');
    }
  });

  // -------------------------------------------------------------
  // 4. Regression Verification of Prior Security Controls
  // -------------------------------------------------------------
  console.log('\n--- 4. Regression Verification of Prior Security Controls ---');

  await runner.test('4.1: Viewer cannot update projects or delete projects', async () => {
    currentTestCookie = viewerCookie;

    const updateRes = await updateProject(validProjectId1, { title: 'Hacked Title' });
    if (updateRes.success !== false) throw new Error('Expected viewer updateProject to fail');

    const deleteRes = await deleteProject(validProjectId1);
    if (deleteRes.success !== false) throw new Error('Expected viewer deleteProject to fail');
  });

  await runner.test('4.2: Editor cannot hard-delete projects', async () => {
    currentTestCookie = editorCookie;

    const deleteRes = await deleteProject(validProjectId1);
    if (deleteRes.success !== false) throw new Error('Expected editor deleteProject to fail');
  });

  await runner.test('4.3: Editor cannot modify hourlyRate via updateProject', async () => {
    currentTestCookie = editorCookie;

    const updateRes = await updateProject(validProjectId1, { hourlyRate: 100 });
    if (updateRes.success !== false) throw new Error('Expected editor hourlyRate update to fail');
    if (!updateRes.error?.includes('Unauthorized')) {
      throw new Error(`Expected Unauthorized error, got: ${updateRes.error}`);
    }
  });

  await runner.test('4.4: Disallowed fields in updateProject are rejected fail-closed', async () => {
    currentTestCookie = adminCookie;

    const res = await updateProject(validProjectId1, {
      title: 'Valid Title',
      hackedField: 'malicious payload'
    });
    if (res.success !== false) throw new Error('Expected disallowed field to fail');
    if (!res.error?.includes('Disallowed or unknown field')) {
      throw new Error(`Expected disallowed field error, got: ${res.error}`);
    }
  });

  await runner.test('4.5: saveProjectHourlyRate rejects mismatched projectId and projectName fail-closed', async () => {
    currentTestCookie = adminCookie;

    // validProjectId1 has title 'Cloud ERP System'. Passing mismatched title 'Mobile App Redesign'
    const res = await saveProjectHourlyRate('Mobile App Redesign', 75, validProjectId1);
    if (res.success !== false) throw new Error('Expected mismatched projectId and title to fail');
    if (!res.error?.includes('does not match the provided project name')) {
      throw new Error(`Expected mismatch error message, got: ${res.error}`);
    }
  });

  console.log('\n===============================================================');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests`);
  console.log('===============================================================\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
