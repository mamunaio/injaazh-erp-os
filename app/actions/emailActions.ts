'use server';

import { sendEmail } from '@/lib/email';
import * as templates from '@/lib/emailTemplates';

/**
 * Send welcome email to new user
 */
export async function sendWelcomeEmail(data: {
  to: string;
  name: string;
  loginUrl?: string;
}) {
  try {
    const html = templates.welcomeEmail({
      name: data.name,
      loginUrl: data.loginUrl,
    });

    const result = await sendEmail({
      to: data.to,
      subject: 'Welcome to Injaazh ERP! 🎉',
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send welcome email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send welcome email',
    };
  }
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(data: {
  to: string;
  name: string;
  resetUrl: string;
  expiresIn?: string;
}) {
  try {
    const html = templates.passwordResetEmail({
      name: data.name,
      resetUrl: data.resetUrl,
      expiresIn: data.expiresIn,
    });

    const result = await sendEmail({
      to: data.to,
      subject: 'Reset Your Injaazh ERP Password 🔐',
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send password reset email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send password reset email',
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
    const html = templates.newLeadNotification({
      leadName: data.leadName,
      leadEmail: data.leadEmail,
      leadPhone: data.leadPhone,
      source: data.source,
      dashboardUrl: data.dashboardUrl,
    });

    const result = await sendEmail({
      to: data.to,
      subject: `New Lead: ${data.leadName} 🎯`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send new lead notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send new lead notification',
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
    const html = templates.proposalSentEmail({
      clientName: data.clientName,
      proposalTitle: data.proposalTitle,
      amount: data.amount,
      viewUrl: data.viewUrl,
    });

    const result = await sendEmail({
      to: data.to,
      subject: `Proposal Sent: ${data.proposalTitle} 📄`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send proposal notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send proposal notification',
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
    const html = templates.paymentReceivedEmail({
      amount: data.amount,
      currency: data.currency,
      clientName: data.clientName,
      projectName: data.projectName,
      transactionId: data.transactionId,
      dashboardUrl: data.dashboardUrl,
    });

    const result = await sendEmail({
      to: data.to,
      subject: `Payment Received: ${data.currency || '$'}${data.amount} 💰`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send payment notification:', error);
    return {
      success: false,
      error: error.message || 'Failed to send payment notification',
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
    const html = templates.projectStatusEmail({
      projectName: data.projectName,
      oldStatus: data.oldStatus,
      newStatus: data.newStatus,
      clientName: data.clientName,
      projectUrl: data.projectUrl,
    });

    const result = await sendEmail({
      to: data.to,
      subject: `Project Update: ${data.projectName} - ${data.newStatus} 📊`,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send project status email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send project status email',
    };
  }
}

/**
 * Send custom email
 */
export async function sendCustomEmail(data: {
  to: string | string[];
  subject: string;
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  try {
    const html = templates.customEmail({
      title: data.title,
      content: data.content,
      buttonText: data.buttonText,
      buttonUrl: data.buttonUrl,
    });

    const result = await sendEmail({
      to: data.to,
      subject: data.subject,
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send custom email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send custom email',
    };
  }
}

/**
 * Send test email
 */
export async function sendTestEmail(data: {
  to: string;
}) {
  try {
    const html = templates.testEmail({
      recipientEmail: data.to,
    });

    const result = await sendEmail({
      to: data.to,
      subject: '✅ SMTP Test Email - Injaazh ERP',
      html,
    });

    return result;
  } catch (error: any) {
    console.error('❌ Failed to send test email:', error);
    return {
      success: false,
      error: error.message || 'Failed to send test email',
    };
  }
}
