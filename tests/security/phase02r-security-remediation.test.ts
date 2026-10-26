/**
 * Phase 02R: Project Mutation Boundary Remediation Test Suite
 *
 * Verifies:
 * 1. Project ID Validation & Existence:
 *    - Invalid project ID format fails safely before mutation.
 *    - Non-existent project ID returns error fail-closed.
 *    - Unauthenticated and viewer callers rejected fail-closed.
 *
 * 2. Field Allowlist & Injection Prevention:
 *    - Unknown fields are rejected (never passed to $set).
 *    - Internal forbidden fields (_id, platformFee, etc.) are rejected.
 *    - Malformed payloads (arrays, primitives) are rejected.
 *
 * 3. Role-Based Protection of Financial Fields (hourlyRate):
 *    - Editor role CANNOT update hourlyRate through updateProject().
 *    - Editor role CANNOT set hourlyRate through createProject().
 *    - Admin and Owner roles CAN update hourlyRate with valid values.
 *    - Invalid hourly rates (negative, NaN, >10,000) rejected even for admin.
 *
 * 4. Legitimate Updates by Authorized Staff:
 *    - Editor CAN update allowed fields (title, status, progress, budget, etc.).
 *    - Platform fee is strictly calculated server-side.
 *
 * 5. updateProjectStatus & deleteProject Hardening:
 *    - Invalid status rejected.
 *    - Non-existent project IDs fail safely.
 *
 * 6. Non-Regression & Alternate Path Boundary:
 *    - saveProjectHourlyRate remains personal-only for editors and shared for admins.
 *    - Email action restrictions remain intact.
 *    - Daily expenses owner-only enforcement remains intact.
 *
 * Run via: npx tsx tests/security/phase02r-security-remediation.test.ts
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
import { sendCustomEmail } from '../../app/actions/emailActions';
import { getDailyExpenses } from '../../app/actions/dailyExpenseActions';

// Mock Transaction and Notification to prevent connection buffering timeouts
Transaction.findOne = (() => ({
  then: (resolve: any) => resolve(null),
})) as any;
Transaction.find = (() => {
  const queryObj = {
    limit: () => ({
      lean: async () => [],
      then: (resolve: any) => resolve([]),
    }),
    lean: async () => [],
    then: (resolve: any) => resolve([]),
  };
  return queryObj;
}) as any;
Transaction.create = (async (d: any) => ({ _id: 'tx_mock_1', ...d })) as any;
Transaction.deleteMany = (async () => ({ acknowledged: true, deletedCount: 0 })) as any;
Transaction.prototype.save = async function() { return this; };
MarketplaceProject.findByIdAndUpdate = (async () => null) as any;
MarketplaceProject.findByIdAndDelete = (async () => null) as any;
MarketplaceProject.create = (async (d: any) => ({ _id: 'mp_mock_1', ...d })) as any;
Notification.create = (async (d: any) => ({ _id: 'notif_1', ...d })) as any;

// In-memory Project Store
const validProjectId1 = '507f1f77bcf86cd799439011';
const validProjectId2 = '507f1f77bcf86cd799439022';

export const mockProjectDb: Record<string, any> = {
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
  },
  [validProjectId2]: {
    _id: new mongoose.Types.ObjectId(validProjectId2),
    title: 'Mobile App Redesign',
    status: 'Planning',
    priority: 'Medium',
    progress: 10,
    budget: 15000,
    platform: 'Upwork',
    platformFee: 1500,
    hourlyRate: 35,
  },
};

export const dbFindByIdAndUpdateCalls: Array<{ id: string; update: any; options?: any }> = [];
export const dbFindByIdAndDeleteCalls: Array<{ id: string }> = [];

Project.findById = ((id: any) => {
  const idStr = id?.toString();
  const proj = mockProjectDb[idStr];
  return {
    lean: async () => (proj ? { ...proj } : null),
    then: (resolve: any, reject: any) => Promise.resolve(proj ? { ...proj } : null).then(resolve, reject),
  };
}) as any;

Project.findByIdAndUpdate = ((id: any, update: any, options: any) => {
  const idStr = id?.toString();
  dbFindByIdAndUpdateCalls.push({ id: idStr, update, options });
  const current = mockProjectDb[idStr];
  let updated: any = null;
  if (current) {
    const appliedUpdate = update?.$set || update;
    updated = { ...current, ...appliedUpdate };
    mockProjectDb[idStr] = updated;
  }
  return {
    lean: async () => (updated ? { ...updated } : null),
    then: (resolve: any, reject: any) => Promise.resolve(updated ? { ...updated } : null).then(resolve, reject),
  };
}) as any;

Project.findByIdAndDelete = (async (id: any) => {
  const idStr = id?.toString();
  dbFindByIdAndDeleteCalls.push({ id: idStr });
  if (!mockProjectDb[idStr]) return null;
  const deleted = mockProjectDb[idStr];
  delete mockProjectDb[idStr];
  return deleted;
}) as any;

Project.find = ((query: any) => {
  const matches = Object.values(mockProjectDb).filter((p: any) => {
    if (query?.title) {
      return p.title === query.title;
    }
    if (query?.$or) {
      return query.$or.some((cond: any) => (cond.title && p.title === cond.title) || (cond.name && p.title === cond.name));
    }
    return true;
  });
  const chain: any = {
    select: () => chain,
    limit: () => chain,
    lean: async () => matches,
    then: (resolve: any, reject: any) => Promise.resolve(matches).then(resolve, reject),
  };
  return chain;
}) as any;

Project.prototype.save = async function() {
  const idStr = this._id?.toString() || new mongoose.Types.ObjectId().toString();
  this._id = new mongoose.Types.ObjectId(idStr);
  mockProjectDb[idStr] = { _id: this._id, ...(this.toObject ? this.toObject() : this) };
  return this;
};

// SystemSettings Mock for timesheet checking
export const mockSettingsStore: Record<string, any> = {};
SystemSettings.findOne = ((query: any) => {
  const key = query?.key;
  const val = key ? mockSettingsStore[key] : null;
  const doc = val ? { key, value: val } : null;
  return {
    lean: async () => doc,
    then: (resolve: any) => resolve(doc),
  };
}) as any;

SystemSettings.findOneAndUpdate = (async (filter: any, update: any) => {
  if (filter?.key && update?.value !== undefined) {
    mockSettingsStore[filter.key] = update.value;
  }
  return { key: filter?.key, value: update?.value };
}) as any;

Project.findOneAndUpdate = ((filter: any, update: any) => {
  const title = filter?.title;
  const foundKey = Object.keys(mockProjectDb).find(k => mockProjectDb[k].title === title);
  if (foundKey && update?.$set) {
    mockProjectDb[foundKey] = { ...mockProjectDb[foundKey], ...update.$set };
  }
  return {
    then: (resolve: any) => resolve(foundKey ? mockProjectDb[foundKey] : null),
  };
}) as any;

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
  console.log('🔒 Phase 02R: Project Mutation Boundary Remediation Test Suite');
  console.log('===============================================================\n');

  // Generate tokens
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

  // --------------------------------------------------------------------------
  // SECTION 1: Project ID & Existence Validation
  // --------------------------------------------------------------------------
  console.log('--- 1. Project ID Validation & Existence ---');

  await runner.test('1.1: Unauthenticated updateProject is rejected before DB update', async () => {
    currentTestCookie = null;
    const initialCalls = dbFindByIdAndUpdateCalls.length;
    const res = await updateProject(validProjectId1, { title: 'Hacked Title' });
    if (res.success !== false) throw new Error('Expected unauthenticated updateProject to fail');
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for unauthenticated user');
  });

  await runner.test('1.2: Viewer role updateProject is rejected (demo mode protection)', async () => {
    currentTestCookie = viewerCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;
    const res = await updateProject(validProjectId1, { title: 'Hacked Title' });
    if (res.success !== false) throw new Error('Expected viewer updateProject to fail');
    if (!res.error?.includes('Demo / View-Only Mode')) throw new Error(`Unexpected error message: ${res.error}`);
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for viewer');
  });

  await runner.test('1.3: Malformed project ID format is rejected safely', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;
    const badIds = ['not-a-mongo-id', '12345', '', '   ', undefined as any, null as any];

    for (const badId of badIds) {
      const res = await updateProject(badId, { title: 'Updated' });
      if (res.success !== false) throw new Error(`Expected bad ID "${badId}" to fail`);
      if (!res.error?.includes('Invalid project ID format')) {
        throw new Error(`Unexpected error for ID "${badId}": ${res.error}`);
      }
    }
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for malformed ID');
  });

  await runner.test('1.4: Non-existent project ID returns error fail-closed', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;
    const nonExistentId = new mongoose.Types.ObjectId().toString();

    const res = await updateProject(nonExistentId, { title: 'Ghost Project' });
    if (res.success !== false) throw new Error('Expected non-existent project update to fail');
    if (res.error !== 'Project not found') throw new Error(`Expected "Project not found", got: ${res.error}`);
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for non-existent project');
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Field Allowlist & Unknown Field Rejection
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Field Allowlist & Injection Prevention ---');

  await runner.test('2.1: Unknown fields in updateProject are rejected', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;
    const maliciousPayload = {
      title: 'Valid Title',
      evilInjectedField: 'arbitrary_data',
      __proto__: { polluted: true },
    };

    const res = await updateProject(validProjectId1, maliciousPayload);
    if (res.success !== false) throw new Error('Expected unknown field to be rejected');
    if (!res.error?.includes('Disallowed or unknown field: "evilInjectedField"')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked despite unknown field');
  });

  await runner.test('2.2: Internal/Protected fields cannot be injected directly (_id, platformFee)', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const resId = await updateProject(validProjectId1, { _id: '507f1f77bcf86cd799439999' } as any);
    if (resId.success !== false) throw new Error('Expected _id injection to fail');

    const resFee = await updateProject(validProjectId1, { platformFee: 0 } as any);
    if (resFee.success !== false) throw new Error('Expected client platformFee injection to fail');

    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for forbidden fields');
  });

  await runner.test('2.3: Non-object or array update payload is rejected', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const resArray = await updateProject(validProjectId1, ['malicious', 'array'] as any);
    if (resArray.success !== false) throw new Error('Expected array payload to fail');

    const resString = await updateProject(validProjectId1, 'string-payload' as any);
    if (resString.success !== false) throw new Error('Expected string payload to fail');

    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for malformed payload');
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Role-Based Protection of Financial Fields (hourlyRate)
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Protected Field (hourlyRate) Authorization ---');

  await runner.test('3.1: Editor role CANNOT modify hourlyRate via updateProject()', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const res = await updateProject(validProjectId1, {
      title: 'Valid Project Title',
      hourlyRate: 150, // Unauthorized financial modification attempt
    });

    if (res.success !== false) throw new Error('Expected editor hourlyRate modification to fail');
    if (!res.error?.includes('Unauthorized: Modifying hourlyRate requires admin or owner role')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation occurred for unauthorized editor rate change');
    if (mockProjectDb[validProjectId1].hourlyRate !== 50) throw new Error('Project hourlyRate was altered in DB by editor');
  });

  await runner.test('3.2: Editor role CANNOT set hourlyRate via createProject()', async () => {
    currentTestCookie = editorCookie;

    const res = await createProject({
      title: 'Editor Created Project',
      hourlyRate: 200, // Unauthorized financial rate assignment
    });

    if (res.success !== false) throw new Error('Expected editor createProject with hourlyRate to fail');
    if (!res.error?.includes('Unauthorized: Setting hourlyRate requires admin or owner role')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
  });

  await runner.test('3.3: Admin role CAN update hourlyRate with valid input', async () => {
    currentTestCookie = adminCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const res = await updateProject(validProjectId1, {
      hourlyRate: 85.50,
    });

    if (!res.success) throw new Error(`Expected admin updateProject to succeed, got: ${res.error}`);
    if (dbFindByIdAndUpdateCalls.length !== initialCalls + 1) throw new Error('DB mutation was not called for admin update');
    if (mockProjectDb[validProjectId1].hourlyRate !== 85.50) throw new Error('Hourly rate was not updated in DB by admin');
  });

  await runner.test('3.4: Owner role CAN update hourlyRate with valid input', async () => {
    currentTestCookie = ownerCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const res = await updateProject(validProjectId1, {
      hourlyRate: 95.00,
    });

    if (!res.success) throw new Error(`Expected owner updateProject to succeed, got: ${res.error}`);
    if (dbFindByIdAndUpdateCalls.length !== initialCalls + 1) throw new Error('DB mutation was not called for owner update');
    if (mockProjectDb[validProjectId1].hourlyRate !== 95.00) throw new Error('Hourly rate was not updated in DB by owner');
  });

  await runner.test('3.5: Invalid hourlyRate bounds rejected even for admin', async () => {
    currentTestCookie = adminCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const badRates = [-10, NaN, Infinity, 10001, '50' as any];
    for (const badRate of badRates) {
      const res = await updateProject(validProjectId1, { hourlyRate: badRate });
      if (res.success !== false) throw new Error(`Expected invalid rate ${badRate} to fail`);
      if (!res.error?.includes('between 0 and 10,000')) {
        throw new Error(`Unexpected error message for ${badRate}: ${res.error}`);
      }
    }
    if (dbFindByIdAndUpdateCalls.length !== initialCalls) throw new Error('DB mutation was invoked for invalid rate');
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Legitimate Updates by Authorized Staff
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Legitimate Updates by Authorized Staff (Editor) ---');

  await runner.test('4.1: Editor CAN update legitimate project fields', async () => {
    currentTestCookie = editorCookie;
    const initialCalls = dbFindByIdAndUpdateCalls.length;

    const res = await updateProject(validProjectId1, {
      title: 'Cloud ERP System Modernized',
      description: 'Expanded scope and sprint 2 deliverables',
      status: 'In Progress',
      priority: 'Urgent',
      progress: 60,
      budget: 65000,
      techStack: ['Next.js', 'MongoDB', 'TailwindCSS'],
      assignees: ['Developer A', 'Developer B'],
    });

    if (!res.success) throw new Error(`Expected legitimate update to succeed, got: ${res.error}`);
    if (dbFindByIdAndUpdateCalls.length !== initialCalls + 1) throw new Error('Expected DB mutation for valid update');

    const lastCall = dbFindByIdAndUpdateCalls[dbFindByIdAndUpdateCalls.length - 1];
    if (lastCall.update.$set.title !== 'Cloud ERP System Modernized') throw new Error('Title not updated in $set');
    if (lastCall.update.$set.progress !== 60) throw new Error('Progress not updated in $set');
    if (lastCall.update.$set.priority !== 'Urgent') throw new Error('Priority not updated in $set');
    if (lastCall.update.$set.hourlyRate !== undefined) throw new Error('hourlyRate was unexpectedly included in $set');
  });

  await runner.test('4.2: Platform fee is auto-calculated server-side on budget/platform change', async () => {
    currentTestCookie = editorCookie;

    const res = await updateProject(validProjectId1, {
      platform: 'Upwork',
      budget: 10000,
    });

    if (!res.success) throw new Error(`Expected platform update to succeed, got: ${res.error}`);
    const lastCall = dbFindByIdAndUpdateCalls[dbFindByIdAndUpdateCalls.length - 1];
    // Upwork fee is 10% of budget = $1,000
    if (lastCall.update.$set.platformFee !== 1000) {
      throw new Error(`Expected server-calculated platformFee 1000, got: ${lastCall.update.$set.platformFee}`);
    }
  });

  await runner.test('4.3: Invalid progress bounds (>100 or <0) rejected', async () => {
    currentTestCookie = editorCookie;
    const resOver = await updateProject(validProjectId1, { progress: 101 });
    if (resOver.success !== false) throw new Error('Expected progress > 100 to fail');

    const resUnder = await updateProject(validProjectId1, { progress: -1 });
    if (resUnder.success !== false) throw new Error('Expected progress < 0 to fail');
  });

  await runner.test('4.4: Invalid status value rejected', async () => {
    currentTestCookie = editorCookie;
    const res = await updateProject(validProjectId1, { status: 'InvalidStatus' as any });
    if (res.success !== false) throw new Error('Expected invalid status to fail');
    if (!res.error?.includes('Invalid project status value')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
  });

  // --------------------------------------------------------------------------
  // SECTION 5: updateProjectStatus & deleteProject Hardening
  // --------------------------------------------------------------------------
  console.log('\n--- 5. updateProjectStatus & deleteProject Hardening ---');

  await runner.test('5.1: updateProjectStatus rejects invalid status value', async () => {
    currentTestCookie = editorCookie;
    const res = await updateProjectStatus(validProjectId1, 'HackedStatus');
    if (res.success !== false) throw new Error('Expected updateProjectStatus with invalid status to fail');
  });

  await runner.test('5.2: updateProjectStatus fails safely for non-existent project', async () => {
    currentTestCookie = editorCookie;
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const res = await updateProjectStatus(nonExistentId, 'Completed');
    if (res.success !== false) throw new Error('Expected non-existent project status update to fail');
    if (res.error !== 'Project not found') throw new Error(`Expected "Project not found", got: ${res.error}`);
  });

  await runner.test('5.3: deleteProject fails safely for non-existent project', async () => {
    // Editor is rejected before DB lookup (Phase 02T restriction)
    currentTestCookie = editorCookie;
    const nonExistentId = new mongoose.Types.ObjectId().toString();
    const editorRes = await deleteProject(nonExistentId);
    if (editorRes.success !== false) throw new Error('Expected editor delete to fail');
    if (!editorRes.error?.includes('Admin or owner access required')) {
      throw new Error(`Expected admin/owner required error for editor, got: ${editorRes.error}`);
    }

    // Admin calling with non-existent ID fails safely with "Project not found"
    currentTestCookie = adminCookie;
    const res = await deleteProject(nonExistentId);
    if (res.success !== false) throw new Error('Expected non-existent project delete to fail');
    if (res.error !== 'Project not found') throw new Error(`Expected "Project not found", got: ${res.error}`);
  });

  // --------------------------------------------------------------------------
  // SECTION 6: Non-Regression & Alternate Path Boundary Checks
  // --------------------------------------------------------------------------
  console.log('\n--- 6. Non-Regression & Alternate Path Boundary Checks ---');

  await runner.test('6.1: saveProjectHourlyRate remains personal-only for editor', async () => {
    currentTestCookie = editorCookie;
    const res = await saveProjectHourlyRate('Mobile App Redesign', 70);
    if (!res.success) throw new Error(`Expected rate save to succeed, got: ${res.error}`);

    // Verify personal rate was recorded in SystemSettings
    if (mockSettingsStore['project_hourly_rates_u_e']?.['Mobile App Redesign'] !== 70) {
      throw new Error('Personal rate mapping was not updated for user u_e');
    }

    // Verify shared Project document hourlyRate in DB was NOT changed by editor
    if (mockProjectDb[validProjectId2].hourlyRate === 70) {
      throw new Error('Shared Project document was unexpectedly altered by editor via saveProjectHourlyRate');
    }
  });

  await runner.test('6.2: saveProjectHourlyRate updates shared Project document for admin', async () => {
    currentTestCookie = adminCookie;
    const res = await saveProjectHourlyRate('Mobile App Redesign', 75);
    if (!res.success) throw new Error(`Expected admin rate save to succeed, got: ${res.error}`);

    // Shared document updated
    if (mockProjectDb[validProjectId2].hourlyRate !== 75) {
      throw new Error('Shared Project document hourlyRate was not updated for admin');
    }
  });

  await runner.test('6.3: Email actions remain strictly restricted to admin/owner', async () => {
    currentTestCookie = editorCookie;
    const res = await sendCustomEmail({
      to: 'test@example.com',
      subject: 'Test',
      title: 'Title',
      content: 'Content',
    });
    if (res.success !== false) throw new Error('Expected editor to be rejected from sendCustomEmail');
  });

  await runner.test('6.4: Daily expenses remain strictly owner-only', async () => {
    currentTestCookie = editorCookie;
    const resEditor = await getDailyExpenses();
    if (!Array.isArray(resEditor) || resEditor.length !== 0) {
      throw new Error('Expected editor to receive empty daily expenses array');
    }

    currentTestCookie = adminCookie;
    const resAdmin = await getDailyExpenses();
    if (!Array.isArray(resAdmin) || resAdmin.length !== 0) {
      throw new Error('Expected admin to receive empty daily expenses array (owner-only)');
    }
  });

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n===============================================================');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests`);
  console.log('===============================================================\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
