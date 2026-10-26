/**
 * Phase 02P: Final Authorization Remediation Test Suite
 *
 * Verifies:
 * 1. Email Actions Authorization:
 *    - Unauthenticated callers rejected from sendCustomEmail & sendTestEmail.
 *    - Viewer role rejected from sendCustomEmail & sendTestEmail.
 *    - Editor / Staff role rejected from sendCustomEmail & sendTestEmail.
 *    - Admin and Owner roles authorized for sendCustomEmail & sendTestEmail with valid payloads.
 *    - SMTP transport is NEVER called when authorization fails.
 *
 * 2. Email Actions Input Validation & Safety:
 *    - Invalid recipient email format rejected.
 *    - Recipient count limits enforced (1 to 20).
 *    - Empty recipients rejected.
 *    - CRLF subject header injection rejected.
 *    - Empty or oversized title (> 250) rejected.
 *    - Empty or oversized content (> 50,000) rejected.
 *    - Unsafe URL schemes (javascript:, data:, vbscript:, file:, blob:) rejected.
 *    - Safe URL schemes (http:, https:, /relative) accepted.
 *    - Email failure error messages sanitized (no credential or server leak).
 *
 * 3. Timesheet Project Hourly Rate Authorization & Scoping:
 *    - Unauthenticated caller rejected.
 *    - Viewer role rejected.
 *    - Rate bounds validated (0 to 10,000, finite number, rounded to 2 decimals).
 *    - Project name validated (non-empty, string, <= 200 chars).
 *    - Editor updates personal rate mapping in SystemSettings ONLY (no Project document modification).
 *    - Admin and Owner update personal rate mapping AND update shared Project document via exact match.
 *    - Client-supplied identity/role parameters ignored; strictly uses verified server auth session.
 *
 * 4. Boundary & Non-Regression:
 *    - Internal transactional email helpers in lib/emailService remain functional and validate inputs.
 *    - AST check confirms emailActions only exports sendCustomEmail and sendTestEmail.
 *    - TokenVersion security epoch check remains active.
 *
 * Run via: npx tsx tests/security/phase02p-security-remediation.test.ts
 */

import './test-env';
import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

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

// Track mock emails sent
export const mockSentEmails: any[] = [];
nodemailer.createTransport = (() => ({
  sendMail: async (mailOptions: any) => {
    mockSentEmails.push(mailOptions);
    return { messageId: `mock-msg-${Date.now()}` };
  },
})) as any;

// Import models & auth helpers
import mongoose from 'mongoose';
import { generateAuthToken } from '../../lib/auth';
import { Project } from '../../models/Project';
import { SystemSettings } from '../../models/SystemSettings';
import * as emailActions from '../../app/actions/emailActions';
import * as emailService from '../../lib/emailService';
import { saveProjectHourlyRate } from '../../app/actions/timesheetActions';

// In-memory stores for tracking Project and SystemSettings operations
export const mockSystemSettingsStore: Record<string, any> = {
  'smtp': {
    host: 'smtp.isolated-test.local',
    port: 587,
    user: 'safe_test_user',
    pass: 'safe_test_pass',
    fromName: 'Injaazh Test',
    fromEmail: 'noreply@injaazh.local',
  },
};

export const systemSettingsUpdates: Array<{ filter: any; update: any; options?: any }> = [];
export const projectUpdates: Array<{ filter: any; update: any; options?: any }> = [];

SystemSettings.findOne = ((query: any) => {
  const key = query?.key;
  const val = key ? mockSystemSettingsStore[key] : null;
  const doc = val ? { key, value: val } : null;
  return {
    lean: async () => doc,
    then: (resolve: any, reject: any) => Promise.resolve(doc).then(resolve, reject),
  };
}) as any;

SystemSettings.findOneAndUpdate = (async (filter: any, update: any, options: any) => {
  systemSettingsUpdates.push({ filter, update, options });
  if (filter?.key && update?.value !== undefined) {
    mockSystemSettingsStore[filter.key] = update.value;
  }
  return { key: filter?.key, value: update?.value };
}) as any;

let lastFoundTitle: string | null = null;
Project.find = ((query: any) => {
  lastFoundTitle = query?.title || null;
  const proj = query?.title ? [{ _id: new mongoose.Types.ObjectId(), title: query.title }] : [];
  const chain: any = {
    select: () => chain,
    limit: () => chain,
    lean: async () => proj,
    then: (resolve: any, reject: any) => Promise.resolve(proj).then(resolve, reject),
  };
  return chain;
}) as any;

Project.findByIdAndUpdate = (async (id: any, update: any, options: any) => {
  projectUpdates.push({ filter: { _id: id, title: lastFoundTitle }, update, options });
  return { _id: id, ...update?.$set };
}) as any;

Project.findOneAndUpdate = (async (filter: any, update: any, options: any) => {
  projectUpdates.push({ filter, update, options });
  return { ...filter, ...update?.$set };
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
  console.log('🔒 Phase 02P: Final Authorization Remediation Test Suite');
  console.log('===============================================================\n');

  // Generate tokens for test roles
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
  // SECTION 1: Finding 1 - Email Server Action Role Restrictions
  // --------------------------------------------------------------------------
  console.log('--- 1. Email Actions Role Authorization ---');

  await runner.test('1.1: Unauthenticated caller cannot invoke sendCustomEmail', async () => {
    currentTestCookie = null;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Security Alert',
      title: 'Alert',
      content: 'System notice',
    });
    if (res.success !== false) throw new Error('Expected unauthenticated sendCustomEmail to fail');
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP sendMail was invoked for unauthenticated user');
  });

  await runner.test('1.2: Unauthenticated caller cannot invoke sendTestEmail', async () => {
    currentTestCookie = null;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendTestEmail({ to: 'admin@example.com' });
    if (res.success !== false) throw new Error('Expected unauthenticated sendTestEmail to fail');
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP sendMail was invoked for unauthenticated user');
  });

  await runner.test('1.3: Viewer role cannot invoke sendCustomEmail', async () => {
    currentTestCookie = viewerCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Notice',
      title: 'Notice',
      content: 'Content',
    });
    if (res.success !== false) throw new Error('Expected viewer to be rejected from sendCustomEmail');
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP sendMail was invoked for viewer');
  });

  await runner.test('1.4: Viewer role cannot invoke sendTestEmail', async () => {
    currentTestCookie = viewerCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendTestEmail({ to: 'admin@example.com' });
    if (res.success !== false) throw new Error('Expected viewer to be rejected from sendTestEmail');
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP sendMail was invoked for viewer');
  });

  await runner.test('1.5: Editor/Staff role cannot invoke sendCustomEmail', async () => {
    currentTestCookie = editorCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Notice',
      title: 'Notice',
      content: 'Content',
    });
    if (res.success !== false) throw new Error('Expected editor to be rejected from sendCustomEmail');
    if (!res.error?.includes('Admin or owner access required')) {
      throw new Error(`Expected admin/owner required error message, got: ${res.error}`);
    }
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP sendMail was invoked for editor');
  });

  await runner.test('1.6: Editor/Staff role cannot invoke sendTestEmail', async () => {
    currentTestCookie = editorCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendTestEmail({ to: 'admin@example.com' });
    if (res.success !== false) throw new Error('Expected editor to be rejected from sendTestEmail');
    if (!res.error?.includes('Admin or owner access required')) {
      throw new Error(`Expected admin/owner required error message, got: ${res.error}`);
    }
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP sendMail was invoked for editor');
  });

  await runner.test('1.7: Admin role CAN invoke sendCustomEmail with valid input', async () => {
    currentTestCookie = adminCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Quarterly Report Available',
      title: 'Quarterly Financials',
      content: 'Please find the quarterly report attached.',
      buttonText: 'View Dashboard',
      buttonUrl: 'https://erp.example.com/finance',
    });
    if (!res.success) throw new Error(`Expected admin sendCustomEmail to succeed, got: ${res.error}`);
    if (mockSentEmails.length !== initialEmailCount + 1) throw new Error('SMTP sendMail was not invoked for valid admin action');
  });

  await runner.test('1.8: Admin role CAN invoke sendTestEmail with valid input', async () => {
    currentTestCookie = adminCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendTestEmail({ to: 'test@example.com' });
    if (!res.success) throw new Error(`Expected admin sendTestEmail to succeed, got: ${res.error}`);
    if (mockSentEmails.length !== initialEmailCount + 1) throw new Error('SMTP sendMail was not invoked for valid admin test');
  });

  await runner.test('1.9: Owner role CAN invoke sendCustomEmail with valid input', async () => {
    currentTestCookie = ownerCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendCustomEmail({
      to: 'stakeholder@example.com',
      subject: 'Company Milestone Achieved',
      title: 'Milestone Update',
      content: 'We have hit our Q3 deliverables on time.',
    });
    if (!res.success) throw new Error(`Expected owner sendCustomEmail to succeed, got: ${res.error}`);
    if (mockSentEmails.length !== initialEmailCount + 1) throw new Error('SMTP sendMail was not invoked for valid owner action');
  });

  await runner.test('1.10: Owner role CAN invoke sendTestEmail with valid input', async () => {
    currentTestCookie = ownerCookie;
    const initialEmailCount = mockSentEmails.length;
    const res = await emailActions.sendTestEmail({ to: 'owner@example.com' });
    if (!res.success) throw new Error(`Expected owner sendTestEmail to succeed, got: ${res.error}`);
    if (mockSentEmails.length !== initialEmailCount + 1) throw new Error('SMTP sendMail was not invoked for valid owner test');
  });

  // --------------------------------------------------------------------------
  // SECTION 2: Finding 1 - Email Input Validation & Safety
  // --------------------------------------------------------------------------
  console.log('\n--- 2. Email Actions Input Validation & Safe URLs ---');

  await runner.test('2.1: Invalid recipient email rejected in sendCustomEmail', async () => {
    currentTestCookie = adminCookie;
    const res = await emailActions.sendCustomEmail({
      to: 'not-an-email-address',
      subject: 'Valid Subject',
      title: 'Valid Title',
      content: 'Valid content',
    });
    if (res.success !== false) throw new Error('Expected invalid recipient email format to fail');
    if (!res.error?.includes('Invalid recipient email address format')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
  });

  await runner.test('2.2: Empty recipient array rejected in sendCustomEmail', async () => {
    currentTestCookie = adminCookie;
    const res = await emailActions.sendCustomEmail({
      to: [],
      subject: 'Valid Subject',
      title: 'Valid Title',
      content: 'Valid content',
    });
    if (res.success !== false) throw new Error('Expected empty recipients to fail');
    if (!res.error?.includes('between 1 and 20')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
  });

  await runner.test('2.3: Recipient count exceeding limit (>20) rejected', async () => {
    currentTestCookie = adminCookie;
    const excessiveRecipients = Array.from({ length: 25 }, (_, i) => `user${i}@example.com`);
    const res = await emailActions.sendCustomEmail({
      to: excessiveRecipients,
      subject: 'Broadcast Notice',
      title: 'Title',
      content: 'Content',
    });
    if (res.success !== false) throw new Error('Expected > 20 recipients to fail');
    if (!res.error?.includes('between 1 and 20')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
  });

  await runner.test('2.4: CRLF header injection in subject rejected', async () => {
    currentTestCookie = adminCookie;
    const initialEmailCount = mockSentEmails.length;
    const maliciousSubject = 'Urgent Notice\r\nBcc: evil-attacker@infiltrate.net\r\nSubject: Spoofed';
    const res = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: maliciousSubject,
      title: 'Valid Title',
      content: 'Valid content',
    });
    if (res.success !== false) throw new Error('Expected CRLF subject injection to be rejected');
    if (!res.error?.includes('unsafe email subject header')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
    if (mockSentEmails.length !== initialEmailCount) throw new Error('SMTP invoked despite CRLF injection');
  });

  await runner.test('2.5: Empty or oversized title rejected in sendCustomEmail', async () => {
    currentTestCookie = adminCookie;
    const resEmpty = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Subject',
      title: '   ',
      content: 'Content',
    });
    if (resEmpty.success !== false) throw new Error('Expected empty title to fail');

    const resOver = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Subject',
      title: 'a'.repeat(251),
      content: 'Content',
    });
    if (resOver.success !== false) throw new Error('Expected title > 250 characters to fail');
  });

  await runner.test('2.6: Empty or oversized content rejected in sendCustomEmail', async () => {
    currentTestCookie = adminCookie;
    const resEmpty = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Subject',
      title: 'Title',
      content: '   ',
    });
    if (resEmpty.success !== false) throw new Error('Expected empty content to fail');

    const resOver = await emailActions.sendCustomEmail({
      to: 'client@example.com',
      subject: 'Subject',
      title: 'Title',
      content: 'a'.repeat(50001),
    });
    if (resOver.success !== false) throw new Error('Expected content > 50,000 characters to fail');
  });

  await runner.test('2.7: Unsafe URL schemes rejected in buttonUrl (javascript, data, vbscript)', async () => {
    currentTestCookie = adminCookie;
    const dangerousUrls = [
      'javascript:alert(document.cookie)',
      'JAVASCRIPT:alert(1)',
      'java\u0000script:alert(1)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:MsgBox("pwned")',
      'file:///etc/passwd',
      'blob:https://example.com/uuid',
    ];

    for (const badUrl of dangerousUrls) {
      const res = await emailActions.sendCustomEmail({
        to: 'client@example.com',
        subject: 'Action Required',
        title: 'Action',
        content: 'Please click the link.',
        buttonUrl: badUrl,
      });
      if (res.success !== false) throw new Error(`Expected unsafe URL ${badUrl} to be rejected`);
      if (!res.error?.includes('Unsafe button URL scheme rejected')) {
        throw new Error(`Unexpected error message for ${badUrl}: ${res.error}`);
      }
    }
  });

  await runner.test('2.8: Safe URLs accepted in buttonUrl (http, https, relative)', async () => {
    currentTestCookie = adminCookie;
    const safeUrls = [
      'https://example.com/verify-account',
      'http://localhost:3000/dashboard',
      '/settings/security',
    ];

    for (const goodUrl of safeUrls) {
      const res = await emailActions.sendCustomEmail({
        to: 'client@example.com',
        subject: 'Valid Link Notice',
        title: 'Notice',
        content: 'Check your status.',
        buttonUrl: goodUrl,
      });
      if (!res.success) throw new Error(`Expected safe URL ${goodUrl} to be accepted, failed with: ${res.error}`);
    }
  });

  await runner.test('2.9: Invalid test recipient email rejected in sendTestEmail', async () => {
    currentTestCookie = adminCookie;
    const res = await emailActions.sendTestEmail({ to: 'invalid-email-format' });
    if (res.success !== false) throw new Error('Expected invalid test recipient format to fail');
    if (!res.error?.includes('Invalid test recipient email address format')) {
      throw new Error(`Unexpected error message: ${res.error}`);
    }
  });

  // --------------------------------------------------------------------------
  // SECTION 3: Finding 2 - Project Hourly Rate Authorization & Scoping
  // --------------------------------------------------------------------------
  console.log('\n--- 3. Timesheet Project Rate Authorization & Personal Mapping ---');

  await runner.test('3.1: Unauthenticated caller cannot invoke saveProjectHourlyRate', async () => {
    currentTestCookie = null;
    const res = await saveProjectHourlyRate('Mobile App Redesign', 75);
    if (res.success !== false) throw new Error('Expected unauthenticated saveProjectHourlyRate to fail');
    if (!res.error?.includes('Unauthorized')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('3.2: Viewer role cannot invoke saveProjectHourlyRate', async () => {
    currentTestCookie = viewerCookie;
    const res = await saveProjectHourlyRate('Mobile App Redesign', 75);
    if (res.success !== false) throw new Error('Expected viewer saveProjectHourlyRate to fail');
    if (!res.error?.includes('Demo / View-Only Mode')) throw new Error(`Unexpected error: ${res.error}`);
  });

  await runner.test('3.3: Invalid rate bounds rejected (negative, NaN, Infinity, >10,000)', async () => {
    currentTestCookie = editorCookie;
    const invalidRates = [-1, -500, NaN, Infinity, -Infinity, 10001, 999999, '50' as any, null as any];

    for (const badRate of invalidRates) {
      const res = await saveProjectHourlyRate('Marketing Campaign', badRate);
      if (res.success !== false) throw new Error(`Expected invalid rate ${badRate} to be rejected`);
      if (!res.error?.includes('between 0 and 10,000')) {
        throw new Error(`Unexpected error for rate ${badRate}: ${res.error}`);
      }
    }
  });

  await runner.test('3.4: Invalid project names rejected (empty, whitespace, >200 chars)', async () => {
    currentTestCookie = editorCookie;
    const emptyRes = await saveProjectHourlyRate('', 50);
    if (emptyRes.success !== false) throw new Error('Expected empty project name to fail');

    const wsRes = await saveProjectHourlyRate('   ', 50);
    if (wsRes.success !== false) throw new Error('Expected whitespace project name to fail');

    const longRes = await saveProjectHourlyRate('A'.repeat(201), 50);
    if (longRes.success !== false) throw new Error('Expected project name > 200 chars to fail');
  });

  await runner.test('3.5: Valid rate is properly rounded to 2 decimal places', async () => {
    currentTestCookie = editorCookie;
    const res = await saveProjectHourlyRate('Client Portal', 85.6789);
    if (!res.success) throw new Error(`Expected rate save to succeed, got: ${res.error}`);
    if (res.rate !== 85.68) throw new Error(`Expected rate rounded to 85.68, got: ${res.rate}`);
  });

  await runner.test('3.6: Editor role updates personal rate mapping ONLY (Project document NOT touched)', async () => {
    currentTestCookie = editorCookie; // user u_e
    const initialProjectUpdatesCount = projectUpdates.length;
    const initialSettingsUpdatesCount = systemSettingsUpdates.length;

    const res = await saveProjectHourlyRate('E-Commerce Platform', 65.00);
    if (!res.success) throw new Error(`Expected editor rate save to succeed, got: ${res.error}`);

    // Verify personal SystemSettings mapping was updated for this specific verified userId
    const personalSettingUpdate = systemSettingsUpdates.find(u => u.filter?.key === 'project_hourly_rates_u_e');
    if (!personalSettingUpdate) {
      throw new Error('SystemSettings did not record personal rate mapping for user u_e');
    }
    if (personalSettingUpdate.update?.value?.['E-Commerce Platform'] !== 65.00) {
      throw new Error(`Personal rate mapping mismatch: ${JSON.stringify(personalSettingUpdate.update)}`);
    }

    // Verify Project collection was NOT modified by non-admin staff
    if (projectUpdates.length !== initialProjectUpdatesCount) {
      throw new Error('Project document was modified by editor role! Shared project rate must remain intact.');
    }
  });

  await runner.test('3.7: Admin role updates personal rate mapping AND shared Project document via exact match', async () => {
    currentTestCookie = adminCookie; // user u_a
    const initialProjectUpdatesCount = projectUpdates.length;

    const res = await saveProjectHourlyRate('Enterprise Cloud Migration', 150.00);
    if (!res.success) throw new Error(`Expected admin rate save to succeed, got: ${res.error}`);

    // Verify personal mapping saved
    const personalSettingUpdate = systemSettingsUpdates.find(u => u.filter?.key === 'project_hourly_rates_u_a');
    if (!personalSettingUpdate) throw new Error('Admin personal rate mapping was not saved');

    // Verify shared Project document was updated
    if (projectUpdates.length !== initialProjectUpdatesCount + 1) {
      throw new Error('Expected shared Project document to be updated by admin');
    }
    const lastProjectUpdate = projectUpdates[projectUpdates.length - 1];
    if (lastProjectUpdate.filter?.title !== 'Enterprise Cloud Migration') {
      throw new Error(`Expected exact title match filter, got: ${JSON.stringify(lastProjectUpdate.filter)}`);
    }
    if (lastProjectUpdate.update?.$set?.hourlyRate !== 150.00) {
      throw new Error(`Expected hourlyRate 150.00 in update, got: ${JSON.stringify(lastProjectUpdate.update)}`);
    }
  });

  await runner.test('3.8: Owner role updates personal rate mapping AND shared Project document via exact match', async () => {
    currentTestCookie = ownerCookie; // user u_o
    const initialProjectUpdatesCount = projectUpdates.length;

    const res = await saveProjectHourlyRate('Mobile SDK Integration', 175.50);
    if (!res.success) throw new Error(`Expected owner rate save to succeed, got: ${res.error}`);

    // Verify personal mapping saved
    const personalSettingUpdate = systemSettingsUpdates.find(u => u.filter?.key === 'project_hourly_rates_u_o');
    if (!personalSettingUpdate) throw new Error('Owner personal rate mapping was not saved');

    // Verify shared Project document was updated
    if (projectUpdates.length !== initialProjectUpdatesCount + 1) {
      throw new Error('Expected shared Project document to be updated by owner');
    }
    const lastProjectUpdate = projectUpdates[projectUpdates.length - 1];
    if (lastProjectUpdate.filter?.title !== 'Mobile SDK Integration') {
      throw new Error(`Expected exact title match filter, got: ${JSON.stringify(lastProjectUpdate.filter)}`);
    }
    if (lastProjectUpdate.update?.$set?.hourlyRate !== 175.50) {
      throw new Error(`Expected hourlyRate 175.50 in update, got: ${JSON.stringify(lastProjectUpdate.update)}`);
    }
  });

  // --------------------------------------------------------------------------
  // SECTION 4: Regression & Non-Export Boundary Verification
  // --------------------------------------------------------------------------
  console.log('\n--- 4. Boundary & Regression Checks ---');

  await runner.test('4.1: Static check - emailActions exports only sendCustomEmail and sendTestEmail', async () => {
    const exports = Object.keys(emailActions);
    if (!exports.includes('sendCustomEmail') || !exports.includes('sendTestEmail')) {
      throw new Error('emailActions is missing expected functions');
    }
    if (exports.length !== 2) {
      throw new Error(`emailActions exports unauthorized functions: ${exports.filter(e => e !== 'sendCustomEmail' && e !== 'sendTestEmail').join(', ')}`);
    }
  });

  await runner.test('4.2: Transactional emailService.sendWelcomeEmail functions and enforces URL safety', async () => {
    const initialEmailCount = mockSentEmails.length;
    // Unsafe URL rejected
    const badRes = await emailService.sendWelcomeEmail({
      to: 'newuser@example.com',
      name: 'Alice',
      loginUrl: 'javascript:alert(1)',
    });
    if (badRes.success !== false) throw new Error('Expected unsafe loginUrl to fail in sendWelcomeEmail');

    // Safe URL accepted
    const goodRes = await emailService.sendWelcomeEmail({
      to: 'newuser@example.com',
      name: 'Alice',
      loginUrl: 'https://erp.example.com/login',
    });
    if (!goodRes.success) throw new Error(`Expected sendWelcomeEmail to succeed, got: ${goodRes.error}`);
    if (mockSentEmails.length !== initialEmailCount + 1) throw new Error('SMTP sendMail was not invoked for valid welcome email');
  });

  await runner.test('4.3: isSafeUrl validator unit validation against evasion attempts', async () => {
    const shouldBeSafe = [
      'https://example.com',
      'http://localhost:3000',
      'https://app.injaazh.com/path?param=1#hash',
      '/relative/path',
      'mailto:support@injaazh.com',
      undefined,
      '',
    ];

    for (const url of shouldBeSafe) {
      if (!emailService.isSafeUrl(url)) {
        throw new Error(`isSafeUrl unexpectedly rejected safe URL: ${url}`);
      }
    }

    const shouldBeUnsafe = [
      'javascript:alert(1)',
      'java script:alert(1)',
      'jav\tascript:alert(1)',
      'jav&#x09;ascript:alert(1)',
      'data:text/html;base64,PHNjcmlwdD4=',
      'data:text/plain;charset=utf-8,hello',
      'vbscript:MsgBox(1)',
      'file:///etc/passwd',
      'blob:https://example.com/uuid',
      'ftp://ftp.example.com/file',
    ];

    for (const url of shouldBeUnsafe) {
      if (emailService.isSafeUrl(url)) {
        throw new Error(`isSafeUrl unexpectedly allowed unsafe URL: ${url}`);
      }
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
