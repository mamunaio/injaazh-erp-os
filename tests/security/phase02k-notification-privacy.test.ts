/**
 * Phase 02K: Notification Privacy & RBAC Automated Verification Suite
 *
 * Verifies:
 * 1. Unauthenticated requests to getRecentNotifications() return empty set with zero leaks.
 * 2. Unauthorized roles (editor, marketplace_team, viewer) cannot view financial 'payment' notifications.
 * 3. Authorized roles (owner, admin) can view financial 'payment' notifications.
 * 4. ADVERSARIAL: User B's private notification with targetRoles: ['editor', 'owner', 'admin'] is strictly
 *    inaccessible to User A (editor), Admin, and Owner via role matching.
 * 5. ADVERSARIAL: Unauthorized users cannot mark another user's private notification read or dismiss it.
 * 6. Broadcast notifications without userId remain accessible to all authorized targetRoles.
 * 7. markAllNotificationsAsRead() marks read only for the current user and does not alter other users' read state.
 * 8. clearReadNotifications() dismisses only the current user's view via dismissedBy without deleting records.
 * 9. Legacy unclassified notifications default safely to 'owner' only.
 * 10. Legacy read consistency: Legacy records with isRead: true and empty readBy do not inflate unread counts
 *     and agree identically with dropdown serialization.
 * 11. Migrated read consistency: Migrated records with isRead: true and empty readBy do not revert to unread.
 * 12. createNotification() assigns secure default targetRoles based on category.
 * 13. Viewer accounts are blocked from mutating notification read/dismiss states (fail-closed via requireWriteAuth).
 * 14. Malformed, empty, or non-existent notification IDs fail safely on mutations without throwing 500 errors.
 *
 * Run via: npx tsx tests/security/phase02k-notification-privacy.test.ts
 */

import './test-env';
import mongoose from 'mongoose';
import { generateAuthToken } from '../../lib/auth';
import Notification from '../../models/Notification';
import * as notificationActions from '../../app/actions/notificationActions';
import * as notificationService from '../../lib/notificationService';

// Mock next/headers cookies for Server Action authentication
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

// Mock In-Memory Notification Database
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

let mockNotifications: MockNotificationDoc[] = [];

/**
 * Recursive MongoDB query clause evaluator matching actual MongoDB filter semantics.
 */
function matchesClause(doc: MockNotificationDoc, clause: any): boolean {
  if (!clause || typeof clause !== 'object') return true;

  // Check _id
  if (clause._id !== undefined) {
    const filterId = clause._id?.toString();
    if (doc._id?.toString() !== filterId) return false;
  }

  // Check userId
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

  // Check targetRoles
  if (clause.targetRoles !== undefined) {
    if (clause.targetRoles?.$size === 0) {
      if (Array.isArray(doc.targetRoles) && doc.targetRoles.length !== 0) return false;
    } else if (clause.targetRoles?.$exists === false) {
      if (doc.targetRoles !== undefined) return false;
    } else if (typeof clause.targetRoles === 'string') {
      if (!Array.isArray(doc.targetRoles) || !doc.targetRoles.includes(clause.targetRoles)) return false;
    }
  }

  // Check isRead
  if (clause.isRead !== undefined) {
    if (clause.isRead?.$ne !== undefined) {
      if (doc.isRead === clause.isRead.$ne) return false;
    } else if (doc.isRead !== clause.isRead) {
      return false;
    }
  }

  // Check readBy
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

  // Check dismissedBy
  if (clause.dismissedBy !== undefined) {
    if (clause.dismissedBy?.$nin) {
      const ninValues = clause.dismissedBy.$nin.map((v: any) => v?.toString());
      if (doc.dismissedBy.some(d => ninValues.includes(d?.toString()))) return false;
    }
  }

  // Check nested $or (any subclause must match)
  if (clause.$or && Array.isArray(clause.$or)) {
    const anyOrMatches = clause.$or.some((sub: any) => matchesClause(doc, sub));
    if (!anyOrMatches) return false;
  }

  // Check nested $and (all subclauses must match)
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

// Mock Notification model queries
Notification.find = ((filter: any) => {
  return {
    sort: () => ({
      limit: (lim: number) => ({
        lean: async () => {
          return mockNotifications.filter(d => matchesFilter(d, filter)).slice(0, lim);
        }
      })
    })
  };
}) as any;

Notification.countDocuments = (async (filter: any) => {
  return mockNotifications.filter(d => matchesFilter(d, filter)).length;
}) as any;

Notification.updateOne = (async (filter: any, update: any) => {
  const target = mockNotifications.find(d => matchesFilter(d, filter));
  if (!target) {
    return { acknowledged: true, matchedCount: 0, modifiedCount: 0 };
  }

  if (update.$addToSet?.readBy) {
    const val = update.$addToSet.readBy.toString();
    if (!target.readBy.some(r => r?.toString() === val)) {
      target.readBy.push(val);
    }
  }

  if (update.$addToSet?.dismissedBy) {
    const val = update.$addToSet.dismissedBy.toString();
    if (!target.dismissedBy.some(d => d?.toString() === val)) {
      target.dismissedBy.push(val);
    }
  }

  return { acknowledged: true, matchedCount: 1, modifiedCount: 1 };
}) as any;

Notification.updateMany = (async (filter: any, update: any) => {
  const targets = mockNotifications.filter(d => matchesFilter(d, filter));

  targets.forEach(target => {
    if (update.$addToSet?.readBy) {
      const val = update.$addToSet.readBy.toString();
      if (!target.readBy.some(r => r?.toString() === val)) {
        target.readBy.push(val);
      }
    }

    if (update.$addToSet?.dismissedBy) {
      const val = update.$addToSet.dismissedBy.toString();
      if (!target.dismissedBy.some(d => d?.toString() === val)) {
        target.dismissedBy.push(val);
      }
    }
  });

  return { acknowledged: true, matchedCount: targets.length, modifiedCount: targets.length };
}) as any;

Notification.create = (async (data: any) => {
  const newDoc: MockNotificationDoc = {
    _id: 'notif_' + (mockNotifications.length + 1),
    type: data.type,
    message: data.message,
    link: data.link || '',
    userId: data.userId || null,
    targetRoles: data.targetRoles || [],
    createdBy: data.createdBy || null,
    readBy: data.readBy || [],
    dismissedBy: data.dismissedBy || [],
    isRead: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  mockNotifications.push(newDoc);
  return newDoc;
}) as any;

// Test runner helper
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
  console.log('🔒 Phase 02K: Notification Privacy & RBAC Security Suite');
  console.log('===============================================================\n');

  // Test setup: Generate tokens for different test roles
  const ownerToken = await generateAuthToken({ id: 'user_owner_001', email: 'owner@mock.com', role: 'owner', sessionId: 'session_mock_valid_owner', tokenVersion: 0 });
  const adminToken = await generateAuthToken({ id: 'user_admin_001', email: 'admin@mock.com', role: 'admin', sessionId: 'session_mock_valid_admin', tokenVersion: 0 });
  const editorAToken = await generateAuthToken({ id: 'user_editor_A', email: 'editorA@mock.com', role: 'editor', sessionId: 'session_mock_valid_123', tokenVersion: 0 });
  const editorBToken = await generateAuthToken({ id: 'user_editor_B', email: 'editorB@mock.com', role: 'editor', sessionId: 'session_mock_valid_123', tokenVersion: 0 });
  const viewerToken = await generateAuthToken({ id: 'u_v', email: 'v@i.com', role: 'viewer', sessionId: 'session_mock_valid_123', tokenVersion: 0 });

  // -------------------------------------------------------------------------
  // Test 1: Unauthenticated protection
  // -------------------------------------------------------------------------
  await runner.test('1.1: Unauthenticated getRecentNotifications() returns empty with 0 unread', async () => {
    currentTestCookie = null;
    const res = await notificationActions.getRecentNotifications();
    if (res.notifications.length !== 0 || res.unreadCount !== 0) {
      throw new Error(`Expected empty result for unauthenticated caller, got ${JSON.stringify(res)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 2: Role-based isolation for financial (payment) notifications
  // -------------------------------------------------------------------------
  await runner.test('2.1: Editor and Viewer cannot view financial payment notifications', async () => {
    mockNotifications = [
      {
        _id: 'n_pay_01',
        type: 'payment',
        message: 'New Income received: $15,000 from Enterprise Client',
        targetRoles: ['owner', 'admin'],
        readBy: [],
        dismissedBy: [],
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Editor test
    currentTestCookie = editorAToken;
    const editorRes = await notificationActions.getRecentNotifications();
    if (editorRes.notifications.some(n => n._id === 'n_pay_01')) {
      throw new Error('Data Leak: Editor was able to view payment notification restricted to owner/admin');
    }
    if (editorRes.unreadCount !== 0) {
      throw new Error(`Expected 0 unread for Editor, got ${editorRes.unreadCount}`);
    }

    // Viewer test
    currentTestCookie = viewerToken;
    const viewerRes = await notificationActions.getRecentNotifications();
    if (viewerRes.notifications.some(n => n._id === 'n_pay_01')) {
      throw new Error('Data Leak: Viewer was able to view payment notification restricted to owner/admin');
    }
  });

  await runner.test('2.2: Admin and Owner CAN view financial payment notifications', async () => {
    // Admin test
    currentTestCookie = adminToken;
    const adminRes = await notificationActions.getRecentNotifications();
    if (!adminRes.notifications.some(n => n._id === 'n_pay_01')) {
      throw new Error('Expected Admin to be able to view financial payment notification');
    }
    if (adminRes.unreadCount !== 1) {
      throw new Error(`Expected unreadCount=1 for Admin, got ${adminRes.unreadCount}`);
    }

    // Owner test
    currentTestCookie = ownerToken;
    const ownerRes = await notificationActions.getRecentNotifications();
    if (!ownerRes.notifications.some(n => n._id === 'n_pay_01')) {
      throw new Error('Expected Owner to be able to view financial payment notification');
    }
  });

  // -------------------------------------------------------------------------
  // Test 3: ADVERSARIAL: User-targeted private notifications with populated targetRoles
  // -------------------------------------------------------------------------
  await runner.test('3.1: Adversarial - Private notification with targetRoles: [editor, owner, admin] is strictly isolated to User B', async () => {
    mockNotifications = [
      {
        _id: 'n_private_b',
        type: 'system',
        message: 'Security Alert: Personal 2FA secret reset for User B',
        userId: 'user_editor_B',
        // Adversarial setup: targetRoles contains editor, owner, and admin!
        targetRoles: ['editor', 'owner', 'admin'],
        readBy: [],
        dismissedBy: [],
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // User A (editor) must NOT see it despite role match
    currentTestCookie = editorAToken;
    const resA = await notificationActions.getRecentNotifications();
    if (resA.notifications.some(n => n._id === 'n_private_b') || resA.unreadCount !== 0) {
      throw new Error('Data Leak: User A (editor) was able to view User B\'s private notification via role matching!');
    }

    // Admin must NOT see it despite role match
    currentTestCookie = adminToken;
    const resAdmin = await notificationActions.getRecentNotifications();
    if (resAdmin.notifications.some(n => n._id === 'n_private_b') || resAdmin.unreadCount !== 0) {
      throw new Error('Data Leak: Admin was able to view User B\'s private notification via role matching!');
    }

    // Owner must NOT see it despite role match
    currentTestCookie = ownerToken;
    const resOwner = await notificationActions.getRecentNotifications();
    if (resOwner.notifications.some(n => n._id === 'n_private_b') || resOwner.unreadCount !== 0) {
      throw new Error('Data Leak: Owner was able to view User B\'s private notification via role matching!');
    }

    // User B CAN see their own private notification
    currentTestCookie = editorBToken;
    const resB = await notificationActions.getRecentNotifications();
    if (!resB.notifications.some(n => n._id === 'n_private_b')) {
      throw new Error('Expected User B to view their own private notification');
    }
    if (resB.unreadCount !== 1) {
      throw new Error(`Expected unreadCount=1 for User B, got ${resB.unreadCount}`);
    }
  });

  await runner.test('3.2: Adversarial - Unauthorized users cannot mark User B\'s private notification read', async () => {
    // User A attempts to mark User B's notification read
    currentTestCookie = editorAToken;
    const resA = await notificationActions.markNotificationAsRead('n_private_b');
    if (resA.success !== false) {
      throw new Error('Expected User A mutation attempt to fail');
    }

    // Admin attempts to mark User B's notification read
    currentTestCookie = adminToken;
    const resAdmin = await notificationActions.markNotificationAsRead('n_private_b');
    if (resAdmin.success !== false) {
      throw new Error('Expected Admin mutation attempt to fail');
    }

    const doc = mockNotifications.find(n => n._id === 'n_private_b');
    if (doc?.readBy.includes('user_editor_A') || doc?.readBy.includes('user_admin_001')) {
      throw new Error('Unauthorized user was added to readBy array of User B\'s notification');
    }
  });

  await runner.test('3.3: Adversarial - Unauthorized users cannot dismiss User B\'s private notification', async () => {
    currentTestCookie = editorAToken;
    await notificationActions.clearReadNotifications();

    const doc = mockNotifications.find(n => n._id === 'n_private_b');
    if (doc?.dismissedBy.includes('user_editor_A')) {
      throw new Error('User A unauthorizedly dismissed User B\'s private notification');
    }
  });

  await runner.test('3.4: Broadcast notification without userId remains accessible to all authorized roles', async () => {
    mockNotifications.push({
      _id: 'n_broadcast_01',
      type: 'system',
      message: 'System-wide maintenance scheduled at midnight',
      userId: null,
      targetRoles: ['editor', 'admin', 'owner'],
      readBy: [],
      dismissedBy: [],
      isRead: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // User A (editor) sees it
    currentTestCookie = editorAToken;
    const resA = await notificationActions.getRecentNotifications();
    if (!resA.notifications.some(n => n._id === 'n_broadcast_01')) {
      throw new Error('Expected User A to view broadcast notification');
    }

    // Admin sees it
    currentTestCookie = adminToken;
    const resAdmin = await notificationActions.getRecentNotifications();
    if (!resAdmin.notifications.some(n => n._id === 'n_broadcast_01')) {
      throw new Error('Expected Admin to view broadcast notification');
    }

    // Owner sees it
    currentTestCookie = ownerToken;
    const resOwner = await notificationActions.getRecentNotifications();
    if (!resOwner.notifications.some(n => n._id === 'n_broadcast_01')) {
      throw new Error('Expected Owner to view broadcast notification');
    }
  });

  // -------------------------------------------------------------------------
  // Test 4: Independent per-user read state tracking (multi-user isolation)
  // -------------------------------------------------------------------------
  await runner.test('4.1: markAllNotificationsAsRead() affects only the current user', async () => {
    mockNotifications = [
      {
        _id: 'n_shared_lead',
        type: 'lead',
        message: 'New HVAC Lead: AC Services Dallas',
        targetRoles: ['owner', 'admin', 'editor'],
        readBy: [],
        dismissedBy: [],
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // User A marks all as read
    currentTestCookie = editorAToken;
    const markRes = await notificationActions.markAllNotificationsAsRead();
    if (!markRes.success) {
      throw new Error(`Failed to mark all as read: ${markRes.error}`);
    }

    // Verify User A sees it as read
    const resA = await notificationActions.getRecentNotifications();
    const notifA = resA.notifications.find(n => n._id === 'n_shared_lead');
    if (!notifA?.isRead || resA.unreadCount !== 0) {
      throw new Error('Expected notification to be marked as read for User A');
    }

    // Verify User B STILL sees it as unread (isolated multi-user tracking)
    currentTestCookie = editorBToken;
    const resB = await notificationActions.getRecentNotifications();
    const notifB = resB.notifications.find(n => n._id === 'n_shared_lead');
    if (notifB?.isRead || resB.unreadCount !== 1) {
      throw new Error('Multi-User Breach: User A marking read marked it read for User B as well!');
    }
  });

  // -------------------------------------------------------------------------
  // Test 5: Independent per-user clear/dismiss tracking
  // -------------------------------------------------------------------------
  await runner.test('5.1: clearReadNotifications() dismisses only current user\'s view', async () => {
    // User A clears read notifications
    currentTestCookie = editorAToken;
    const clearRes = await notificationActions.clearReadNotifications();
    if (!clearRes.success) {
      throw new Error(`Failed to clear read notifications: ${clearRes.error}`);
    }

    // Notification is dismissed for User A
    const resA = await notificationActions.getRecentNotifications();
    if (resA.notifications.some(n => n._id === 'n_shared_lead')) {
      throw new Error('Expected dismissed notification to disappear from User A\'s list');
    }

    // Document is NOT deleted from database and is STILL visible for User B
    const rawDoc = mockNotifications.find(n => n._id === 'n_shared_lead');
    if (!rawDoc) {
      throw new Error('Destructive Bug: clearReadNotifications deleted document from database entirely!');
    }

    currentTestCookie = editorBToken;
    const resB = await notificationActions.getRecentNotifications();
    if (!resB.notifications.some(n => n._id === 'n_shared_lead')) {
      throw new Error('User B lost visibility of notification when User A cleared their own view');
    }
  });

  // -------------------------------------------------------------------------
  // Test 6: Legacy record safe fallback & Read State Consistency
  // -------------------------------------------------------------------------
  await runner.test('6.1: Legacy unclassified unread notifications default safely to Owner fallback', async () => {
    mockNotifications = [
      {
        _id: 'n_legacy_01',
        type: 'payment',
        message: 'Legacy unclassified unread transaction',
        readBy: [],
        dismissedBy: [],
        isRead: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Editor must NOT see legacy ambiguous record
    currentTestCookie = editorAToken;
    const resEditor = await notificationActions.getRecentNotifications();
    if (resEditor.notifications.some(n => n._id === 'n_legacy_01') || resEditor.unreadCount !== 0) {
      throw new Error('Security Breach: Editor was shown legacy unclassified notification!');
    }

    // Owner CAN see legacy record
    currentTestCookie = ownerToken;
    const resOwner = await notificationActions.getRecentNotifications();
    if (!resOwner.notifications.some(n => n._id === 'n_legacy_01')) {
      throw new Error('Expected Owner to be able to see legacy fallback notification');
    }
    if (resOwner.unreadCount !== 1) {
      throw new Error(`Expected Owner unreadCount=1, got ${resOwner.unreadCount}`);
    }
  });

  await runner.test('6.2: Legacy notification with isRead: true does NOT inflate unread count and matches list isRead', async () => {
    mockNotifications = [
      {
        _id: 'n_legacy_read',
        type: 'system',
        message: 'Legacy already-read notification',
        readBy: [],
        dismissedBy: [],
        isRead: true, // Legacy global read flag
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    currentTestCookie = ownerToken;
    const resOwner = await notificationActions.getRecentNotifications();
    const notif = resOwner.notifications.find(n => n._id === 'n_legacy_read');
    if (!notif) {
      throw new Error('Expected Owner to see legacy notification');
    }
    if (!notif.isRead) {
      throw new Error('Expected legacy notification with isRead: true to be serialized as isRead=true');
    }
    if (resOwner.unreadCount !== 0) {
      throw new Error(`Badge inflation bug: Expected unreadCount=0 for legacy isRead:true, got ${resOwner.unreadCount}`);
    }
  });

  await runner.test('6.3: Migrated notification with isRead: true preserves read state across targetRoles', async () => {
    mockNotifications = [
      {
        _id: 'n_migrated_read',
        type: 'payment',
        message: 'Migrated financial notification previously read',
        targetRoles: ['owner', 'admin'],
        readBy: [],
        dismissedBy: [],
        isRead: true, // Migrated legacy record retaining isRead: true
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Admin view
    currentTestCookie = adminToken;
    const resAdmin = await notificationActions.getRecentNotifications();
    const notifAdmin = resAdmin.notifications.find(n => n._id === 'n_migrated_read');
    if (!notifAdmin?.isRead || resAdmin.unreadCount !== 0) {
      throw new Error(`Read state loss: Expected migrated isRead:true to remain read with 0 unread for Admin, got ${JSON.stringify(resAdmin)}`);
    }

    // Owner view
    currentTestCookie = ownerToken;
    const resOwner = await notificationActions.getRecentNotifications();
    const notifOwner = resOwner.notifications.find(n => n._id === 'n_migrated_read');
    if (!notifOwner?.isRead || resOwner.unreadCount !== 0) {
      throw new Error(`Read state loss: Expected migrated isRead:true to remain read with 0 unread for Owner, got ${JSON.stringify(resOwner)}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 7: Notification service secure role defaults
  // -------------------------------------------------------------------------
  await runner.test('7.1: createNotification() assigns secure default roles based on category', async () => {
    mockNotifications = [];

    // Financial payment default
    await notificationService.createNotification('payment', 'Payment of $500 received.', '/finance');
    const payDoc = mockNotifications[mockNotifications.length - 1];
    if (!payDoc.targetRoles?.includes('owner') || !payDoc.targetRoles?.includes('admin') || payDoc.targetRoles?.includes('editor')) {
      throw new Error(`Unexpected payment default roles: ${JSON.stringify(payDoc.targetRoles)}`);
    }

    // Lead default
    await notificationService.createNotification('lead', 'New prospect captured', '/lead-gen');
    const leadDoc = mockNotifications[mockNotifications.length - 1];
    if (!leadDoc.targetRoles?.includes('editor') || !leadDoc.targetRoles?.includes('marketplace_team')) {
      throw new Error(`Unexpected lead default roles: ${JSON.stringify(leadDoc.targetRoles)}`);
    }

    // Explicit user-targeting option
    await notificationService.createNotification('system', 'Private task assigned', '/tasks', {
      userId: 'user_editor_B',
      targetRoles: ['editor']
    });
    const privDoc = mockNotifications[mockNotifications.length - 1];
    if (privDoc.userId?.toString() !== 'user_editor_B') {
      throw new Error(`Expected userId=user_editor_B, got ${privDoc.userId}`);
    }
  });

  // -------------------------------------------------------------------------
  // Test 8: Viewer accounts & Input validation protection
  // -------------------------------------------------------------------------
  await runner.test('8.1: Viewer accounts fail-closed on mark-read, mark-all-read, and clear-read', async () => {
    currentTestCookie = viewerToken;

    const resMark = await notificationActions.markNotificationAsRead('n_shared_lead');
    if (resMark.success !== false) {
      throw new Error('Expected Viewer to be rejected from markNotificationAsRead');
    }

    const resMarkAll = await notificationActions.markAllNotificationsAsRead();
    if (resMarkAll.success !== false) {
      throw new Error('Expected Viewer to be rejected from markAllNotificationsAsRead');
    }

    const resClear = await notificationActions.clearReadNotifications();
    if (resClear.success !== false) {
      throw new Error('Expected Viewer to be rejected from clearReadNotifications');
    }
  });

  await runner.test('8.2: Malformed or non-existent notification IDs fail safely on mutations', async () => {
    currentTestCookie = adminToken;

    // Empty string ID
    const resEmpty = await notificationActions.markNotificationAsRead('');
    if (resEmpty.success !== false || resEmpty.error !== 'Invalid notification ID') {
      throw new Error(`Expected invalid notification ID error for empty string, got ${JSON.stringify(resEmpty)}`);
    }

    // Whitespace string ID
    const resWhitespace = await notificationActions.markNotificationAsRead('   ');
    if (resWhitespace.success !== false || resWhitespace.error !== 'Invalid notification ID') {
      throw new Error(`Expected invalid notification ID error for whitespace string, got ${JSON.stringify(resWhitespace)}`);
    }

    // Non-existent ID
    const resMissing = await notificationActions.markNotificationAsRead('non_existent_id_999');
    if (resMissing.success !== false || resMissing.error !== 'Notification not found or access denied') {
      throw new Error(`Expected access denied / not found for non-existent ID, got ${JSON.stringify(resMissing)}`);
    }
  });

  console.log('\n---------------------------------------------------------------');
  console.log(`Results: ${runner.passed} passed, ${runner.failed} failed out of ${runner.passed + runner.failed} tests.`);
  console.log('---------------------------------------------------------------\n');

  if (runner.failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
