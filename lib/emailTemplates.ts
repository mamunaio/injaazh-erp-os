/**
 * Email Templates
 * Pre-designed HTML email templates for various purposes
 */

interface EmailTemplateData {
  [key: string]: any;
}

/**
 * Base email template wrapper
 */
function baseTemplate(content: string, preheader?: string) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Injaazh ERP</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f3f4f6;
      color: #1f2937;
    }
    .email-wrapper {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .email-header {
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .email-logo {
      font-size: 32px;
      font-weight: 900;
      color: #ffffff;
      text-decoration: none;
      letter-spacing: -1px;
    }
    .email-body {
      padding: 40px 30px;
    }
    .email-footer {
      background-color: #f9fafb;
      padding: 30px;
      text-align: center;
      font-size: 12px;
      color: #6b7280;
      border-top: 1px solid #e5e7eb;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
      color: #ffffff !important;
      text-decoration: none;
      border-radius: 12px;
      font-weight: 700;
      font-size: 15px;
      margin: 20px 0;
      box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
    }
    .button:hover {
      box-shadow: 0 6px 16px rgba(99, 102, 241, 0.4);
    }
    h1 {
      font-size: 28px;
      font-weight: 900;
      color: #111827;
      margin: 0 0 16px 0;
      line-height: 1.2;
    }
    p {
      font-size: 15px;
      line-height: 1.6;
      color: #4b5563;
      margin: 0 0 16px 0;
    }
    .highlight {
      background-color: #fef3c7;
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      color: #92400e;
    }
    .info-box {
      background-color: #eff6ff;
      border-left: 4px solid #3b82f6;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .success-box {
      background-color: #f0fdf4;
      border-left: 4px solid #10b981;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .warning-box {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 16px;
      margin: 20px 0;
      border-radius: 8px;
    }
    .preheader {
      display: none;
      max-height: 0;
      overflow: hidden;
    }
  </style>
</head>
<body>
  ${preheader ? `<div class="preheader">${preheader}</div>` : ''}
  <div class="email-wrapper">
    <div class="email-header">
      <div class="email-logo">Injaazh</div>
    </div>
    <div class="email-body">
      ${content}
    </div>
    <div class="email-footer">
      <p style="margin: 0 0 8px 0;">© ${new Date().getFullYear()} Injaazh ERP. All rights reserved.</p>
      <p style="margin: 0;">Professional Business Management System</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Welcome Email Template
 */
export function welcomeEmail(data: { name: string; loginUrl?: string }) {
  const content = `
    <h1>Welcome to Injaazh ERP! 🎉</h1>
    <p>Hi <strong>${data.name}</strong>,</p>
    <p>We're thrilled to have you on board! Your account has been successfully created and you're all set to start managing your business operations efficiently.</p>
    
    <div class="success-box">
      <p style="margin: 0; font-weight: 600; color: #065f46;">✓ Your account is now active</p>
    </div>

    <p>Injaazh ERP helps you manage:</p>
    <ul style="color: #4b5563; line-height: 1.8;">
      <li>Leads & Client Relationships</li>
      <li>Projects & Proposals</li>
      <li>Financial Tracking</li>
      <li>Email Outreach Campaigns</li>
      <li>And much more...</li>
    </ul>

    ${data.loginUrl ? `
      <center>
        <a href="${data.loginUrl}" class="button">Access Your Dashboard</a>
      </center>
    ` : ''}

    <p>If you have any questions, feel free to reach out to our support team.</p>
    <p>Best regards,<br><strong>The Injaazh Team</strong></p>
  `;

  return baseTemplate(content, 'Welcome to Injaazh ERP - Start managing your business today');
}

/**
 * Password Reset Email Template
 */
export function passwordResetEmail(data: { name: string; resetUrl: string; expiresIn?: string }) {
  const content = `
    <h1>Password Reset Request 🔐</h1>
    <p>Hi <strong>${data.name}</strong>,</p>
    <p>We received a request to reset your password for your Injaazh ERP account.</p>
    
    <div class="info-box">
      <p style="margin: 0; font-weight: 600; color: #1e40af;">Click the button below to reset your password:</p>
    </div>

    <center>
      <a href="${data.resetUrl}" class="button">Reset Password</a>
    </center>

    <p style="font-size: 13px; color: #6b7280;">This link will expire in <span class="highlight">${data.expiresIn || '1 hour'}</span>.</p>

    <div class="warning-box">
      <p style="margin: 0; font-weight: 600; color: #92400e;">⚠️ If you didn't request this, please ignore this email.</p>
    </div>

    <p>For security reasons, never share this link with anyone.</p>
    <p>Best regards,<br><strong>The Injaazh Team</strong></p>
  `;

  return baseTemplate(content, 'Reset your Injaazh ERP password');
}

/**
 * New Lead Notification Email
 */
export function newLeadNotification(data: { 
  leadName: string; 
  leadEmail: string; 
  leadPhone?: string;
  source?: string;
  dashboardUrl?: string;
}) {
  const content = `
    <h1>New Lead Added! 🎯</h1>
    <p>Great news! A new lead has been added to your system.</p>
    
    <div class="success-box">
      <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 16px; color: #065f46;">Lead Details:</p>
      <p style="margin: 0 0 6px 0;"><strong>Name:</strong> ${data.leadName}</p>
      <p style="margin: 0 0 6px 0;"><strong>Email:</strong> ${data.leadEmail}</p>
      ${data.leadPhone ? `<p style="margin: 0 0 6px 0;"><strong>Phone:</strong> ${data.leadPhone}</p>` : ''}
      ${data.source ? `<p style="margin: 0;"><strong>Source:</strong> ${data.source}</p>` : ''}
    </div>

    ${data.dashboardUrl ? `
      <center>
        <a href="${data.dashboardUrl}" class="button">View in Dashboard</a>
      </center>
    ` : ''}

    <p>Make sure to follow up promptly to maximize conversion chances!</p>
    <p>Best regards,<br><strong>Injaazh ERP System</strong></p>
  `;

  return baseTemplate(content, `New lead: ${data.leadName}`);
}

/**
 * Proposal Sent Notification
 */
export function proposalSentEmail(data: {
  clientName: string;
  proposalTitle: string;
  amount?: string;
  viewUrl?: string;
}) {
  const content = `
    <h1>Proposal Sent Successfully! 📄</h1>
    <p>Your proposal has been sent to <strong>${data.clientName}</strong>.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 16px; color: #1e40af;">Proposal Details:</p>
      <p style="margin: 0 0 6px 0;"><strong>Title:</strong> ${data.proposalTitle}</p>
      <p style="margin: 0 0 6px 0;"><strong>Client:</strong> ${data.clientName}</p>
      ${data.amount ? `<p style="margin: 0;"><strong>Amount:</strong> ${data.amount}</p>` : ''}
    </div>

    ${data.viewUrl ? `
      <center>
        <a href="${data.viewUrl}" class="button">View Proposal</a>
      </center>
    ` : ''}

    <p>The client will receive a notification and can review the proposal at their convenience.</p>
    <p>Best regards,<br><strong>Injaazh ERP System</strong></p>
  `;

  return baseTemplate(content, `Proposal sent to ${data.clientName}`);
}

/**
 * Payment Received Notification
 */
export function paymentReceivedEmail(data: {
  amount: string;
  currency?: string;
  clientName?: string;
  projectName?: string;
  transactionId?: string;
  dashboardUrl?: string;
}) {
  const content = `
    <h1>Payment Received! 💰</h1>
    <p>Great news! A payment has been successfully received.</p>
    
    <div class="success-box">
      <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 20px; color: #065f46;">
        ${data.currency || '$'}${data.amount}
      </p>
      ${data.clientName ? `<p style="margin: 0 0 6px 0;"><strong>From:</strong> ${data.clientName}</p>` : ''}
      ${data.projectName ? `<p style="margin: 0 0 6px 0;"><strong>Project:</strong> ${data.projectName}</p>` : ''}
      ${data.transactionId ? `<p style="margin: 0;"><strong>Transaction ID:</strong> ${data.transactionId}</p>` : ''}
    </div>

    ${data.dashboardUrl ? `
      <center>
        <a href="${data.dashboardUrl}" class="button">View Transaction</a>
      </center>
    ` : ''}

    <p>The payment has been recorded in your financial dashboard.</p>
    <p>Best regards,<br><strong>Injaazh ERP System</strong></p>
  `;

  return baseTemplate(content, `Payment received: ${data.currency || '$'}${data.amount}`);
}

/**
 * Project Status Update Email
 */
export function projectStatusEmail(data: {
  projectName: string;
  oldStatus: string;
  newStatus: string;
  clientName?: string;
  projectUrl?: string;
}) {
  const content = `
    <h1>Project Status Updated 📊</h1>
    <p>The status of your project has been updated.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 12px 0; font-weight: 700; font-size: 16px; color: #1e40af;">Project Details:</p>
      <p style="margin: 0 0 6px 0;"><strong>Project:</strong> ${data.projectName}</p>
      ${data.clientName ? `<p style="margin: 0 0 6px 0;"><strong>Client:</strong> ${data.clientName}</p>` : ''}
      <p style="margin: 0 0 6px 0;"><strong>Previous Status:</strong> <span style="text-decoration: line-through;">${data.oldStatus}</span></p>
      <p style="margin: 0;"><strong>New Status:</strong> <span class="highlight">${data.newStatus}</span></p>
    </div>

    ${data.projectUrl ? `
      <center>
        <a href="${data.projectUrl}" class="button">View Project</a>
      </center>
    ` : ''}

    <p>Keep up the great work!</p>
    <p>Best regards,<br><strong>Injaazh ERP System</strong></p>
  `;

  return baseTemplate(content, `${data.projectName} status updated to ${data.newStatus}`);
}

/**
 * Custom Email Template (for manual emails)
 */
export function customEmail(data: {
  title: string;
  content: string;
  buttonText?: string;
  buttonUrl?: string;
}) {
  const content = `
    <h1>${data.title}</h1>
    ${data.content}

    ${data.buttonText && data.buttonUrl ? `
      <center>
        <a href="${data.buttonUrl}" class="button">${data.buttonText}</a>
      </center>
    ` : ''}

    <p>Best regards,<br><strong>The Injaazh Team</strong></p>
  `;

  return baseTemplate(content, data.title);
}

/**
 * Test Email Template
 */
export function testEmail(data: { recipientEmail: string }) {
  const content = `
    <h1>SMTP Test Successful! ✅</h1>
    <p>Congratulations! Your SMTP configuration is working correctly.</p>
    
    <div class="success-box">
      <p style="margin: 0; font-weight: 600; color: #065f46;">
        ✓ Email sent to: <strong>${data.recipientEmail}</strong>
      </p>
    </div>

    <p>This is a test email to verify your SMTP settings in Injaazh ERP.</p>
    
    <div class="info-box">
      <p style="margin: 0 0 8px 0; font-weight: 600; color: #1e40af;">What's working:</p>
      <ul style="margin: 0; padding-left: 20px; color: #4b5563;">
        <li>SMTP connection established</li>
        <li>Authentication successful</li>
        <li>Email delivery confirmed</li>
        <li>HTML rendering working</li>
      </ul>
    </div>

    <p>You can now use Injaazh ERP to send automated emails for:</p>
    <ul style="color: #4b5563; line-height: 1.8;">
      <li>Lead notifications</li>
      <li>Proposal submissions</li>
      <li>Payment confirmations</li>
      <li>Project updates</li>
      <li>Custom campaigns</li>
    </ul>

    <p>Happy emailing!</p>
    <p>Best regards,<br><strong>Injaazh ERP System</strong></p>
  `;

  return baseTemplate(content, 'SMTP Test Email - Configuration Successful');
}
