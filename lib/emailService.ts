/**
 * Internal Email Service
 *
 * Server-side transactional email helpers.
 * This module does NOT declare 'use server' to ensure sensitive email dispatch
 * functions cannot be invoked directly as public Next.js Server Action RPCs.
 */

import { sendEmail } from '@/lib/email';
import * as templates from '@/lib/emailTemplates';

/**
 * Validates email format
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== 'string') return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email.trim());
}

/**
 * Validates URL safety (prevents javascript:, data:, etc.)
 */
export function isSafeUrl(url?: string): boolean {
  if (!url || typeof url !== 'string') return true;
  let trimmed = url.trim();
  if (!trimmed) return true;

  // Decode URI component if percent-encoded
  try {
    trimmed = decodeURIComponent(trimmed);
  } catch {
    // Keep as is if invalid percent encoding
  }

  // Strip HTML entities (hex, decimal, named) that browser HTML parsers decode in href attributes
  const strippedEntities = trimmed
    .replace(/&#[xX][0-9a-fA-F]+;?/g, '')
    .replace(/&#[0-9]+;?/g, '')
    .replace(/&[a-zA-Z]+;?/g, '');

  // Block dangerous schemes even with embedded whitespace or control characters
  const lower = strippedEntities.replace(/[\u0000-\u001F\u007F-\u009F\s]/g, '').toLowerCase();
  if (
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:') ||
    lower.startsWith('file:') ||
    lower.startsWith('blob:')
  ) {
    return false;
  }
  try {
    const parsed = new URL(trimmed, 'https://injaazh.local');
    return ['http:', 'https:', 'mailto:'].includes(parsed.protocol);
  } catch {
    return false;
  }
}

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: {
  to: string;
  name: string;
  loginUrl?: string;
}) {
  try {
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid recipient email' };
    }
    if (!isSafeUrl(data.loginUrl)) {
      return { success: false, error: 'Unsafe login URL provided' };
    }

    const html = templates.welcomeEmail({
      name: data.name || 'Team Member',
      loginUrl: data.loginUrl,
    });

    const result = await sendEmail({
      to: data.to.trim(),
      subject: 'Welcome to Injaazh ERP! 🎉',
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error?.message || 'Unknown error');
    return {
      success: false,
      error: error?.message || 'Failed to send welcome email',
    };
  }
}

/**
 * Send password reset email
 * Callable only from trusted internal server-side authentication flows.
 */
export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetUrl: string;
  expiresIn?: string;
}) {
  try {
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid recipient email' };
    }
    if (!data.resetUrl || !isSafeUrl(data.resetUrl)) {
      return { success: false, error: 'Unsafe or invalid reset URL provided' };
    }

    const html = templates.passwordResetEmail({
      name: data.name || 'User',
      resetUrl: data.resetUrl,
      expiresIn: data.expiresIn || '1 hour',
    });

    const result = await sendEmail({
      to: data.to.trim(),
      subject: 'Reset Your Injaazh ERP Password 🔐',
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error?.message || 'Unknown error');
    return {
      success: false,
      error: error?.message || 'Failed to send password reset email',
    };
  }
}

/**
 * Send new lead notification
 */
export async function sendNewLeadNotification(data: {
  to: string;
  leadName: string;
  leadEmail: string;
  leadPhone?: string;
  source?: string;
  dashboardUrl?: string;
}) {
  try {
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid recipient email' };
    }
    if (!isSafeUrl(data.dashboardUrl)) {
      return { success: false, error: 'Unsafe dashboard URL provided' };
    }

    const html = templates.newLeadNotification({
      leadName: data.leadName,
      leadEmail: data.leadEmail,
      leadPhone: data.leadPhone,
      source: data.source,
      dashboardUrl: data.dashboardUrl,
    });

    const result = await sendEmail({
      to: data.to.trim(),
      subject: `New Lead: ${data.leadName} 🎯`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send new lead notification:', error?.message || 'Unknown error');
    return {
      success: false,
      error: error?.message || 'Failed to send new lead notification',
    };
  }
}

/**
 * Send proposal notification
 */
export async function sendProposalNotification(data: {
  to: string;
  clientName: string;
  proposalTitle: string;
  amount?: string;
  viewUrl?: string;
}) {
  try {
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid recipient email' };
    }
    if (!isSafeUrl(data.viewUrl)) {
      return { success: false, error: 'Unsafe view URL provided' };
    }

    const html = templates.proposalSentEmail({
      clientName: data.clientName,
      proposalTitle: data.proposalTitle,
      amount: data.amount,
      viewUrl: data.viewUrl,
    });

    const result = await sendEmail({
      to: data.to.trim(),
      subject: `Proposal Sent: ${data.proposalTitle} 📄`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send proposal notification:', error?.message || 'Unknown error');
    return {
      success: false,
      error: error?.message || 'Failed to send proposal notification',
    };
  }
}

/**
 * Send payment received notification
 */
export async function sendPaymentNotification(data: {
  to: string;
  amount: string;
  currency?: string;
  clientName?: string;
  projectName?: string;
  transactionId?: string;
  dashboardUrl?: string;
}) {
  try {
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid recipient email' };
    }
    if (!isSafeUrl(data.dashboardUrl)) {
      return { success: false, error: 'Unsafe dashboard URL provided' };
    }

    const html = templates.paymentReceivedEmail({
      amount: data.amount,
      currency: data.currency,
      clientName: data.clientName,
      projectName: data.projectName,
      transactionId: data.transactionId,
      dashboardUrl: data.dashboardUrl,
    });

    const result = await sendEmail({
      to: data.to.trim(),
      subject: `Payment Received: ${data.currency || '$'}${data.amount} 💰`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send payment notification:', error?.message || 'Unknown error');
    return {
      success: false,
      error: error?.message || 'Failed to send payment notification',
    };
  }
}

/**
 * Send project status update
 */
export async function sendProjectStatusEmail(data: {
  to: string;
  projectName: string;
  oldStatus: string;
  newStatus: string;
  clientName?: string;
  projectUrl?: string;
}) {
  try {
    if (!isValidEmail(data.to)) {
      return { success: false, error: 'Invalid recipient email' };
    }
    if (!isSafeUrl(data.projectUrl)) {
      return { success: false, error: 'Unsafe project URL provided' };
    }

    const html = templates.projectStatusEmail({
      projectName: data.projectName,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      clientName: data.clientName,
      projectUrl: data.projectUrl,
    });

    const result = await sendEmail({
      to: data.to.trim(),
      subject: `Project Update: ${data.projectName} - ${data.newStatus} 📊`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send project status email:', error?.message || 'Unknown error');
    return {
      success: false,
      error: error?.message || 'Failed to send project status email',
    };
  }
}
