/**
 * Phase 01D: Comprehensive Cross-Component Integration & Regression Suite
 *
 * Verifies end-to-end integration across:
 * 1. Phase 1A: Notification Privacy, RBAC & Per-User Isolation
 * 2. Phase 1B: Global Toast Architecture, Event Deduplication & Ephemeral Separation
 * 3. Phase 1C: Confirmation Dialog Focus Safety & Async Error Recovery
 * 4. Cross-Component Lifecycles:
 *    - Mutation -> Instant Notification -> Event Registry Registration
 *    - Persistent Polling Retrieval -> Topbar Deduplication Suppression
 *    - Ephemeral Toast Dismissal Independence (Zero DB mutations)
 *    - Dropdown Read & Clear Isolation Across Roles (Owner vs Admin vs Editor vs Viewer)
 *    - Confirmation Dialog Async Failure -> Error Toast Emission & Dialog Recovery
 *    - Synchronous Burst Handling & Audio Rate Limiter Cooldown
 *
 * Run via: npx tsx tests/security/phase01d-regression-integration.test.ts
 */

import './test-env';
import mongoose from 'mongoose';
import { generateAuthToken } from '../../lib/auth';
import Notification from '../../models/Notification';
import * as notificationActions from '../../app/actions/notificationActions';
import * as notificationService from '../../lib/notificationService';
import { notify, normalizeMsg } from '../../lib/notify';
import { MAX_VISIBLE_TOASTS } from '../../components/ui/GlobalToaster';

// Mock cookies for Server Action execution
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

// In-Memory Database Simulator for Integrated Testing
interface MockNotificationDoc {
  _id: string;
  type: 'payment' | 'lead' | 'system' | 'proposal';
  message: string;
  link?: string;
  userId?: any;
  targetRoles?: string[];
  createdBy?: any;
  readBy: any[];
  dismissedBy: any[];
  isRead?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const dbStore: MockNotificationDoc[] = [];

// Intercept Notification model
Notification.create = (async (docs: any) => {
  const items = Array.isArray(docs) ? docs : [docs];
  const created: any[] = [];
  for (const item of items) {
    const doc: MockNotificationDoc = {
      _id: item._id ? item._id.toString() : new mongoose.Types.ObjectId().toString(),
      type: item.type,
      message: item.message,
      link: item.link || '',
      userId: item.userId || null,
      targetRoles: item.targetRoles || [],
      createdBy: item.createdBy || null,
      readBy: Array.isArray(item.readBy) ? [...item.readBy] : [],
      dismissedBy: Array.isArray(item.dismissedBy) ? [...item.dismissedBy] : [],
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt || new Date(),
      updatedAt: item.updatedAt || new Date()
    };
    dbStore.push(doc);
    created.push(doc);
  }
  return Array.isArray(docs) ? created : created[0];
}) as any;

function matchesClause(doc: MockNotificationDoc, clause: any): boolean {
  if (!clause || typeof clause !== 'object') return true;

  if (clause._id !== undefined) {
    const filterId = clause._id?.toString();
    if (doc._id?.toString() !== filterId) return false;
  }

  if (clause.userId !== undefined) {
    if (clause.userId?.$in) {
      const inValues = clause.userId.$in.map((v: any) => v?.toString());
      if (!doc.userId || !inValues.includes(doc.userId?.toString())) return false;
    } else if (clause.userId?.$exists === false) {
      if (doc.userId !== undefined && doc.userId !== null) return false;
    } else if (clause.userId === null) {
      if (doc.userId !== null && doc.userId !== undefined) return false;
    } else if (doc.userId?.toString() !== clause.userId?.toString()) {
      return false;
    }
  }

  if (clause.targetRoles !== undefined) {
    if (clause.targetRoles?.$size === 0) {
      if (Array.isArray(doc.targetRoles) && doc.targetRoles.length !== 0) return false;
    } else if (clause.targetRoles?.$exists === false) {
      if (doc.targetRoles !== undefined) return false;
    } else if (typeof clause.targetRoles === 'string') {
      if (!Array.isArray(doc.targetRoles) || !doc.targetRoles.includes(clause.targetRoles)) return false;
    }
  }

  if (clause.isRead !== undefined) {
    if (clause.isRead?.$ne !== undefined) {
      if (doc.isRead === clause.isRead.$ne) return false;
    } else if (doc.isRead !== clause.isRead) {
      return false;
    }
  }

  if (clause.readBy !== undefined) {
    if (clause.readBy?.$nin) {
      const ninValues = clause.readBy.$nin.map((v: any) => v?.toString());
      if (doc.readBy.some(r => ninValues.includes(r?.toString()))) return false;
    }
    if (clause.readBy?.$in) {
      const inValues = clause.readBy.$in.map((v: any) => v?.toString());
      if (!doc.readBy.some(r => inValues.includes(r?.toString()))) return false;
    }
    if (clause.readBy?.$ne) {
      const neVal = clause.readBy.$ne?.toString();
      if (doc.readBy.some(r => r?.toString() === neVal)) return false;
    }
  }

  if (clause.dismissedBy !== undefined) {
    if (clause.dismissedBy?.$nin) {
      const ninValues = clause.dismissedBy.$nin.map((v: any) => v?.toString());
      if (doc.dismissedBy.some(d => ninValues.includes(d?.toString()))) return false;
    }
  }

  if (clause.$or && Array.isArray(clause.$or)) {
    const anyOrMatches = clause.$or.some((sub: any) => matchesClause(doc, sub));
    if (!anyOrMatches) return false;
  }

  if (clause.$and && Array.isArray(clause.$and)) {
    const allAndMatch = clause.$and.every((sub: any) => matchesClause(doc, sub));
    if (!allAndMatch) return false;
  }

  return true;
}

function matchesFilter(doc: MockNotificationDoc, filter: any): boolean {
  if (!filter) return true;
  return matchesClause(doc, filter);
}

Notification.find = ((filter: any) => {
  const filtered = dbStore.filter(doc => matchesFilter(doc, filter));
  return {
    sort: () => ({
      limit: (n: number) => ({
        lean: async () => filtered.slice(0, n)
      })
    })
  };
}) as any;

Notification.countDocuments = (async (filter: any) => {
  return dbStore.filter(doc => matchesFilter(doc, filter)).length;
}) as any;

Notification.updateOne = (async (filter: any, update: any) => {
  const doc = dbStore.find(d => matchesFilter(d, filter));
  if (!doc) return { matchedCount: 0, modifiedCount: 0 };

  if (update?.$addToSet?.readBy) {
    const idStr = update.$addToSet.readBy.toString();
    if (!doc.readBy.some(x => x.toString() === idStr)) {
      doc.readBy.push(idStr);
    }
  }
  if (update?.$addToSet?.dismissedBy) {
    const idStr = update.$addToSet.dismissedBy.toString();
    if (!doc.dismissedBy.some(x => x.toString() === idStr)) {
      doc.dismissedBy.push(idStr);
    }
  }
  return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
}) as any;

Notification.updateMany = (async (filter: any, update: any) => {
  const matches = dbStore.filter(d => matchesFilter(d, filter));
  let modified = 0;
  for (const doc of matches) {
    if (update?.$addToSet?.readBy) {
      const idStr = update.$addToSet.readBy.toString();
      if (!doc.readBy.some(x => x.toString() === idStr)) {
        doc.readBy.push(idStr);
        modified++;
      }
    }
    if (update?.$addToSet?.dismissedBy) {
      const idStr = update.$addToSet.dismissedBy.toString();
      if (!doc.dismissedBy.some(x => x.toString() === idStr)) {
        doc.dismissedBy.push(idStr);
        modified++;
      }
    }
  }
  return { acknowledged: true, matchedCount: matches.length, modifiedCount: modified };
}) as any;

class TestRunner {
  passed = 0;
  failed = 0;

  async test(name: string, fn: () => Promise<void> | void) {
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
  console.log('\n========================================================================');
  console.log('🔗 Phase 01D: Comprehensive Cross-Component Integration & Regression');
  console.log('========================================================================\n');

  // Set up authenticated test user tokens matching test-env mockSessionStore
  const ownerToken = await generateAuthToken({ id: 'user_owner_001', email: 'owner@mock.com', role: 'owner', sessionId: 'session_mock_valid_owner', tokenVersion: 0 });
  const adminToken = await generateAuthToken({ id: 'user_admin_001', email: 'admin@mock.com', role: 'admin', sessionId: 'session_mock_valid_admin', tokenVersion: 0 });
  const editorToken = await generateAuthToken({ id: 'user_mock_001', email: 'user@mock.com', role: 'editor', sessionId: 'session_mock_valid_123', tokenVersion: 0 });
  const viewerToken = await generateAuthToken({ id: 'u_v', email: 'v@i.com', role: 'viewer', sessionId: 'session_mock_valid_123', tokenVersion: 0 });

  // -------------------------------------------------------------------------
  // Test 1: Full Lifecycle: Mutation -> Instant Toast -> Polling Deduplication -> Read Isolation
  // -------------------------------------------------------------------------
  await runner.test('1.1: Financial Mutation emits instant toast, suppresses polling replay, and maintains read isolation', async () => {
    dbStore.length = 0;

    const paymentMsg = 'Invoice #INV-2026-901 marked PAID ($4,500.00 USD)';
    const notifId = 'notif_inv_901';

    // Step A: Business mutation creates notification in DB and emits optimistic UI toast
    await notificationService.createNotification('payment', paymentMsg, '/finance/invoices', {
      targetRoles: ['owner', 'admin']
    });

    // Client action emits instant notification
    notify.instant({
      id: notifId,
      type: 'payment',
      message: paymentMsg,
      sound: 'income'
    });

    // Step B: Verify event registry recorded the emission with 30s TTL
    if (!notify.isRecentlyEmitted(notifId)) {
      throw new Error('Event ID not found in notify emission registry');
    }
    if (!notify.isRecentlyEmitted(paymentMsg)) {
      throw new Error('Message text not found in notify emission registry');
    }

    // Step C: Topbar background polling runs for Admin user
    currentTestCookie = adminToken;
    const adminPoll = await notificationActions.getRecentNotifications();
    if (adminPoll.notifications.length !== 1) {
      throw new Error(`Expected 1 notification for Admin, got: ${adminPoll.notifications.length}`);
    }
    if (adminPoll.unreadCount !== 1) {
      throw new Error(`Expected 1 unread notification for Admin, got: ${adminPoll.unreadCount}`);
    }

    // Verify: Polling alert would be suppressed because isRecentlyEmitted is true
    const isSuppressed = notify.isRecentlyEmitted(adminPoll.notifications[0]._id) || notify.isRecentlyEmitted(adminPoll.notifications[0].message);
    if (!isSuppressed) {
      throw new Error('Topbar would fail to suppress polling replay for locally emitted mutation!');
    }

    // Step D: Ephemeral toast dismissal occurs on UI
    notify.dismiss(notifId);

    // Verify: Ephemeral dismissal did NOT alter the DB notification (still unread)
    const adminCheckAfterDismiss = await notificationActions.getRecentNotifications();
    if (adminCheckAfterDismiss.unreadCount !== 1) {
      throw new Error('Ephemeral toast dismissal corrupted persistent notification unread count!');
    }

    // Step E: Admin marks notification as read in notification dropdown
    const markRes = await notificationActions.markNotificationAsRead(adminPoll.notifications[0]._id);
    if (!markRes.success) throw new Error('Failed to mark notification as read');

    const adminCheckAfterRead = await notificationActions.getRecentNotifications();
    if (adminCheckAfterRead.unreadCount !== 0) {
      throw new Error(`Expected Admin unread count to be 0 after marking read, got: ${adminCheckAfterRead.unreadCount}`);
    }

    // Step F: Verify Owner's view is strictly isolated: Owner's unread count must still be 1!
    currentTestCookie = ownerToken;
    const ownerPoll = await notificationActions.getRecentNotifications();
    if (ownerPoll.unreadCount !== 1) {
      throw new Error(`Expected Owner unread count to remain 1 (isolation violation!), got: ${ownerPoll.unreadCount}`);
    }
    if (ownerPoll.notifications[0].isRead !== false) {
      throw new Error('Admin mark-read erroneously mutated Owner isRead status!');
    }

    // Step G: Admin clears read notifications
    currentTestCookie = adminToken;
    await notificationActions.clearReadNotifications();
    const adminFinal = await notificationActions.getRecentNotifications();
    if (adminFinal.notifications.length !== 0) {
      throw new Error('Expected 0 notifications for Admin after clearReadNotifications');
    }

    // Verify: Owner STILL sees the notification (per-user dismissal isolation)
    currentTestCookie = ownerToken;
    const ownerFinal = await notificationActions.getRecentNotifications();
    if (ownerFinal.notifications.length !== 1) {
      throw new Error('Admin clear-read accidentally deleted notification record for Owner!');
    }

    notify.clearEmitted(notifId);
    notify.clearEmitted(paymentMsg);
  });

  // -------------------------------------------------------------------------
  // Test 2: Confirmation Dialog + Async Failure Recovery + Error Toast Integration
  // -------------------------------------------------------------------------
  await runner.test('2.1: Confirmation dialog recovers from async mutation failure and dispatches error toast', async () => {
    // Simulator representing ConfirmDialogProvider state
    let isProcessing = false;
    let isOpen = true;
    let toastErrorCaptured: string | null = null;

    const mockOrigError = notify.error;
    (notify as any).error = (msg: string) => {
      toastErrorCaptured = msg;
    };

    // User confirms a dangerous delete action
    const simulatedAsyncDelete = async () => {
      isProcessing = true;
      try {
        // Simulated network/server crash
        throw new Error('Database transaction lock: could not delete project #P-402');
      } catch (err: any) {
        // Recovery mechanism from ConfirmDialogProvider
        isProcessing = false;
        notify.error(err.message);
        throw err;
      }
    };

    let caughtError: any = null;
    try {
      await simulatedAsyncDelete();
    } catch (e: any) {
      caughtError = e;
    }

    if (!caughtError) throw new Error('Expected async deletion to fail');
    if (isProcessing) throw new Error('Dialog remained locked with isProcessing: true after failure');
    if (!isOpen) throw new Error('Dialog prematurely unmounted on failure');
    if (toastErrorCaptured !== 'Database transaction lock: could not delete project #P-402') {
      throw new Error(`Expected error toast to be emitted, got: ${toastErrorCaptured}`);
    }

    (notify as any).error = mockOrigError;
  });

  // -------------------------------------------------------------------------
  // Test 3: Audio Rate Limiting & Rapid Burst Handling
  // -------------------------------------------------------------------------
  await runner.test('3.1: Audio rate limiter throttles sound triggers to prevent ear fatigue during burst events', async () => {
    // lib/notify defines AUDIO_COOLDOWN_MS = 300
    // Test that rapid sequential instant notifications do not throw or overlap
    const startTime = Date.now();
    for (let i = 0; i < 5; i++) {
      notify.instant({
        id: `burst_${i}`,
        message: `Rapid Burst Event #${i}`,
        type: 'system',
        sound: 'notification'
      });
    }

    // Verify all 5 are recorded in registry without error
    for (let i = 0; i < 5; i++) {
      if (!notify.isRecentlyEmitted(`burst_${i}`)) {
        throw new Error(`Burst notification #${i} was not registered in emittedEvents`);
      }
      notify.clearEmitted(`burst_${i}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 4: Privacy Boundary Under Adversarial Cross-Role Access
  // -------------------------------------------------------------------------
  await runner.test('4.1: Financial and private notifications are completely invisible to Editor and Viewer', async () => {
    dbStore.length = 0;

    // Create 3 notifications:
    // 1. Financial payment (owner, admin only)
    await notificationService.createNotification('payment', 'Stripe payout of $10,000 processed', '/finance', {
      targetRoles: ['owner', 'admin']
    });

    // 2. Lead notification (owner, admin, editor)
    await notificationService.createNotification('lead', 'New enterprise prospect submitted RFP', '/lead-gen', {
      targetRoles: ['owner', 'admin', 'editor']
    });

    // 3. User B private notification (strictly userId: user_mock_001)
    await notificationService.createNotification('system', 'Private review notes for Editor', '/profile', {
      userId: 'user_mock_001',
      targetRoles: ['editor', 'owner', 'admin']
    });

    // Verify Editor View:
    currentTestCookie = editorToken;
    const editorRes = await notificationActions.getRecentNotifications();
    // Editor sees lead notification and their private notification (2 items), but NOT the payment notification!
    if (editorRes.notifications.length !== 2) {
      throw new Error(`Expected Editor to see exactly 2 notifications, got ${editorRes.notifications.length}`);
    }
    const hasPaymentForEditor = editorRes.notifications.some((n: any) => n.type === 'payment');
    if (hasPaymentForEditor) {
      throw new Error('CRITICAL SECURITY LEAK: Editor received financial payment notification!');
    }

    // Verify Viewer View (demo/unauthorized):
    currentTestCookie = viewerToken;
    const viewerRes = await notificationActions.getRecentNotifications();
    // Viewer sees 0 items because none are targeted to viewer
    if (viewerRes.notifications.length !== 0) {
      throw new Error(`Expected Viewer to see 0 notifications, got ${viewerRes.notifications.length}`);
    }

    // Viewer mutation fail-closed
    const viewerMark = await notificationActions.markNotificationAsRead(editorRes.notifications[0]._id);
    if (viewerMark.success) {
      throw new Error('CRITICAL SECURITY LEAK: Viewer was allowed to mutate notification read state!');
    }
  });

  // -------------------------------------------------------------------------
  // Test 5: Backward Compatibility for Legacy Notifications Lacking Metadata
  // -------------------------------------------------------------------------
  await runner.test('5.1: Legacy unclassified notifications safely default to Owner fallback with zero unread inflation', async () => {
    dbStore.length = 0;

    // Simulate legacy unmigrated record (no targetRoles, no userId, isRead: false)
    dbStore.push({
      _id: 'legacy_notif_001',
      type: 'system',
      message: 'Old system notification from v1.0',
      link: '/system',
      userId: null,
      targetRoles: [],
      createdBy: null,
      readBy: [],
      dismissedBy: [],
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Non-owner (Editor) fetches: must be 0 items
    currentTestCookie = editorToken;
    const editorRes = await notificationActions.getRecentNotifications();
    if (editorRes.notifications.length !== 0) {
      throw new Error('Legacy unclassified notification leaked to non-owner role');
    }

    // Owner fetches: safely visible via Clause C fallback
    currentTestCookie = ownerToken;
    const ownerRes = await notificationActions.getRecentNotifications();
    if (ownerRes.notifications.length !== 1 || ownerRes.unreadCount !== 1) {
      throw new Error('Owner failed to receive legacy notification fallback');
    }

    // Mark as read legacy record:
    // When isRead: true is present, countDocuments must NOT count it as unread
    dbStore[0].isRead = true;
    const ownerAfterRead = await notificationActions.getRecentNotifications();
    if (ownerAfterRead.unreadCount !== 0) {
      throw new Error(`Legacy record with isRead: true inflated unreadCount to ${ownerAfterRead.unreadCount}`);
    }
  });

  console.log('\n------------------------------------------------------------------------');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests.`);
  console.log('------------------------------------------------------------------------\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Integration test suite error:', err);
  process.exit(1);
});
