import nodemailer from 'nodemailer';
import supabase from '../config/supabase';
import logger from './logger.util';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
}

// Cache SMTP settings for 5 minutes to avoid DB round-trip on every email
let smtpCache: { settings: any; from: string; ts: number } | null = null;
const SMTP_CACHE_TTL = 5 * 60 * 1000;

async function getSmtpSettings() {
  if (smtpCache && Date.now() - smtpCache.ts < SMTP_CACHE_TTL) return smtpCache;
  const { data: settings } = await supabase
    .from('site_settings')
    .select('smtp_host, smtp_port, smtp_user, smtp_pass, smtp_from, contact_email')
    .limit(1).maybeSingle();
  const from = settings?.smtp_from || settings?.contact_email || 'noreply@amoha.com';
  smtpCache = { settings, from, ts: Date.now() };
  return smtpCache;
}

async function getTransporter() {
  const { settings } = await getSmtpSettings();
  if (!settings?.smtp_host || !settings?.smtp_user || !settings?.smtp_pass) {
    return null;
  }
  return nodemailer.createTransport({
    host: settings.smtp_host,
    port: settings.smtp_port || 587,
    secure: settings.smtp_port === 465,
    auth: { user: settings.smtp_user, pass: settings.smtp_pass },
  });
}

async function getFromAddress(): Promise<string> {
  const { from } = await getSmtpSettings();
  return from;
}

function wrapHtml(body: string, siteName = 'AMOHA Mobiles'): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>body{margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f4f4f7}
.container{max-width:580px;margin:0 auto;background:#fff;border-radius:8px;overflow:hidden;margin-top:20px;margin-bottom:20px;box-shadow:0 2px 8px rgba(0,0,0,0.08)}
.header{background:linear-gradient(135deg,#6366f1,#8b5cf6);padding:24px 32px;text-align:center}
.header h1{color:#fff;margin:0;font-size:22px;font-weight:700}
.body{padding:32px}
.body h2{color:#1f2937;margin:0 0 16px;font-size:20px}
.body p{color:#4b5563;line-height:1.6;margin:0 0 12px}
.btn{display:inline-block;background:#6366f1;color:#fff !important;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:14px;margin-top:8px}
.footer{padding:20px 32px;background:#f9fafb;text-align:center;font-size:12px;color:#9ca3af}
.info-row{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #f3f4f6}
.info-label{color:#6b7280;font-size:13px}.info-value{color:#1f2937;font-size:13px;font-weight:500}
table{width:100%;border-collapse:collapse}
td{padding:8px 0;font-size:13px;color:#4b5563;border-bottom:1px solid #f3f4f6}
</style></head><body>
<div class="container">
<div class="header"><h1>${siteName}</h1></div>
<div class="body">${body}</div>
<div class="footer">&copy; ${new Date().getFullYear()} ${siteName}. All rights reserved.</div>
</div></body></html>`;
}

export async function sendEmail(options: EmailOptions): Promise<boolean> {
  try {
    const transporter = await getTransporter();
    if (!transporter) {
      logger.warn('Email not configured – skipping email to ' + options.to);
      return false;
    }
    const from = await getFromAddress();
    await transporter.sendMail({ from, ...options });
    logger.info(`Email sent to ${options.to}: ${options.subject}`);
    return true;
  } catch (error) {
    logger.error('Email send failed: ' + (error as Error).message);
    return false;
  }
}

// ===== Pre-built email templates =====

export async function sendWelcomeEmail(email: string, name: string) {
  const html = wrapHtml(`
    <h2>Welcome, ${name}!</h2>
    <p>Thank you for creating an account with us. We're excited to have you on board.</p>
    <p>Explore our wide range of smartphones and accessories at the best prices.</p>
    <a href="#" class="btn">Start Shopping</a>
  `);
  return sendEmail({ to: email, subject: 'Welcome to AMOHA Mobiles!', html });
}

export async function sendLoginEmail(email: string, name: string) {
  const html = wrapHtml(`
    <h2>Login Detected</h2>
    <p>Hi ${name}, you've successfully logged into your account.</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    <p>If this wasn't you, please reset your password immediately.</p>
  `);
  return sendEmail({ to: email, subject: 'Login Alert - AMOHA Mobiles', html });
}

export async function sendOrderConfirmationEmail(email: string, name: string, order: { orderNumber: string; totalAmount: number; items: { name: string; quantity: number; price: number }[] }) {
  const itemsHtml = order.items.map(i => `<tr><td>${i.name}</td><td style="text-align:center">${i.quantity}</td><td style="text-align:right">Rs.${i.price.toLocaleString('en-IN')}</td></tr>`).join('');
  const html = wrapHtml(`
    <h2>Order Confirmed!</h2>
    <p>Hi ${name}, your order <strong>#${order.orderNumber}</strong> has been placed successfully.</p>
    <table>
      <tr style="border-bottom:2px solid #e5e7eb"><td style="font-weight:600;color:#1f2937">Item</td><td style="font-weight:600;color:#1f2937;text-align:center">Qty</td><td style="font-weight:600;color:#1f2937;text-align:right">Price</td></tr>
      ${itemsHtml}
    </table>
    <div style="margin-top:16px;padding:16px;background:#f0fdf4;border-radius:8px;text-align:right">
      <span style="font-size:16px;font-weight:700;color:#059669">Total: Rs.${order.totalAmount.toLocaleString('en-IN')}</span>
    </div>
    <p style="margin-top:16px">We'll notify you when your order ships.</p>
  `);
  return sendEmail({ to: email, subject: `Order #${order.orderNumber} Confirmed - AMOHA Mobiles`, html });
}

export async function sendOrderStatusEmail(email: string, name: string, orderNumber: string, status: string, message?: string) {
  const statusLabels: Record<string, string> = {
    confirmed: 'Confirmed',
    processing: 'Processing',
    shipped: 'Shipped',
    out_for_delivery: 'Out for Delivery',
    delivered: 'Delivered',
    cancelled: 'Cancelled',
    returned: 'Returned',
  };
  const statusColors: Record<string, string> = {
    confirmed: '#2563eb',
    processing: '#d97706',
    shipped: '#7c3aed',
    out_for_delivery: '#059669',
    delivered: '#059669',
    cancelled: '#dc2626',
    returned: '#dc2626',
  };
  const label = statusLabels[status] || status;
  const color = statusColors[status] || '#6366f1';
  const html = wrapHtml(`
    <h2>Order Update</h2>
    <p>Hi ${name}, your order <strong>#${orderNumber}</strong> has been updated.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid ${color}">
      <p style="margin:0;font-size:15px;font-weight:600;color:${color}">Status: ${label}</p>
      ${message ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280">${message}</p>` : ''}
    </div>
  `);
  return sendEmail({ to: email, subject: `Order #${orderNumber} - ${label}`, html });
}

export async function sendServiceRequestStatusEmail(email: string, name: string, requestNumber: string, serviceType: string, status: string, adminNotes?: string) {
  const labelMap: Record<string, string> = {
    pending: 'Pending Review',
    accepted: 'Accepted',
    in_progress: 'In Progress',
    completed: 'Completed',
    cancelled: 'Cancelled',
  };
  const colorMap: Record<string, string> = {
    pending: '#f59e0b',
    accepted: '#3b82f6',
    in_progress: '#8b5cf6',
    completed: '#10b981',
    cancelled: '#ef4444',
  };
  const label = labelMap[status] || status;
  const color = colorMap[status] || '#6b7280';
  const html = wrapHtml(`
    <h2>Service Request Update</h2>
    <p>Hi ${name}, your service request has been updated.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid ${color}">
      <p style="margin:0;font-size:13px;color:#6b7280">Request #${requestNumber} &bull; ${serviceType}</p>
      <p style="margin:8px 0 0;font-size:15px;font-weight:600;color:${color}">Status: ${label}</p>
      ${adminNotes ? `<p style="margin:8px 0 0;font-size:13px;color:#374151"><strong>Note:</strong> ${adminNotes}</p>` : ''}
    </div>
    <p style="font-size:13px;color:#6b7280">We will keep you updated on any further progress. Feel free to contact us if you have any questions.</p>
  `);
  return sendEmail({ to: email, subject: `Service Request #${requestNumber} - ${label}`, html });
}

export async function sendPasswordResetEmail(email: string, name: string, resetToken: string, frontendUrl: string) {
  const resetLink = `${frontendUrl}/reset-password?token=${resetToken}`;
  const html = wrapHtml(`
    <h2>Password Reset</h2>
    <p>Hi ${name}, we received a request to reset your password.</p>
    <p>Click the button below to set a new password. This link expires in 1 hour.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="${resetLink}" class="btn">Reset Password</a>
    </div>
    <p style="font-size:12px;color:#9ca3af">If you didn't request this, you can safely ignore this email.</p>
  `);
  return sendEmail({ to: email, subject: 'Password Reset - AMOHA Mobiles', html });
}

export async function sendKycStatusEmail(email: string, name: string, status: 'pending' | 'verified' | 'rejected', reason?: string) {
  const bodies: Record<string, string> = {
    pending: `<h2>KYC Submitted</h2><p>Hi ${name}, your KYC documents have been submitted and are under review. We'll notify you once the verification is complete.</p>`,
    verified: `<h2>KYC Verified</h2><p>Hi ${name}, congratulations! Your KYC has been successfully verified.</p><div style="padding:16px;background:#f0fdf4;border-radius:8px;text-align:center"><p style="margin:0;font-size:15px;font-weight:600;color:#059669">Identity Verified</p></div>`,
    rejected: `<h2>KYC Rejected</h2><p>Hi ${name}, unfortunately your KYC submission was not approved.</p>${reason ? `<div style="padding:16px;background:#fef2f2;border-radius:8px"><p style="margin:0;font-size:13px;color:#dc2626"><strong>Reason:</strong> ${reason}</p></div>` : ''}<p>Please resubmit your documents with the correct information.</p>`,
  };
  const html = wrapHtml(bodies[status] || '');
  return sendEmail({ to: email, subject: `KYC ${status === 'verified' ? 'Approved' : status === 'rejected' ? 'Rejected' : 'Submitted'} - AMOHA Mobiles`, html });
}

// ===== Order Cancellation Email =====
export async function sendOrderCancellationEmail(email: string, name: string, orderNumber: string, reason: string) {
  const html = wrapHtml(`
    <h2>Order Cancelled</h2>
    <p>Hi ${name}, your order <strong>#${orderNumber}</strong> has been cancelled.</p>
    <div style="margin:16px 0;padding:16px;background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626">
      <p style="margin:0;font-size:13px;color:#6b7280"><strong>Reason:</strong> ${reason || 'No reason provided'}</p>
    </div>
    <p>If you paid online, your refund will be processed within 5-7 business days.</p>
    <p style="font-size:13px;color:#6b7280">If you didn't request this cancellation, please contact us immediately.</p>
  `);
  return sendEmail({ to: email, subject: `Order #${orderNumber} Cancelled - AMOHA Mobiles`, html });
}

// ===== Contact Form Auto-Reply =====
export async function sendContactAutoReplyEmail(email: string, name: string, subject: string) {
  const html = wrapHtml(`
    <h2>We Received Your Message</h2>
    <p>Hi ${name}, thank you for reaching out to us.</p>
    <div style="margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #3b82f6">
      <p style="margin:0;font-size:13px;color:#6b7280"><strong>Subject:</strong> ${subject}</p>
    </div>
    <p>Our team will review your message and get back to you within 24-48 hours.</p>
    <p style="font-size:13px;color:#6b7280">If your inquiry is urgent, please call us directly.</p>
  `);
  return sendEmail({ to: email, subject: `We received your message - AMOHA Mobiles`, html });
}

// ===== Contact Form Admin Notification =====
export async function sendContactAdminNotifyEmail(adminEmail: string, contact: { name: string; email: string; phone?: string; subject: string; message: string }) {
  const html = wrapHtml(`
    <h2>New Contact Message</h2>
    <p>A new contact form submission has been received.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px">
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">${contact.name}</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">${contact.email}</span></div>
      ${contact.phone ? `<div class="info-row"><span class="info-label">Phone</span><span class="info-value">${contact.phone}</span></div>` : ''}
      <div class="info-row"><span class="info-label">Subject</span><span class="info-value">${contact.subject}</span></div>
    </div>
    <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px">
      <p style="margin:0;font-size:13px;color:#374151">${contact.message}</p>
    </div>
  `);
  return sendEmail({ to: adminEmail, subject: `New Contact: ${contact.subject} - AMOHA Mobiles`, html });
}

// ===== Return Request Created =====
export async function sendReturnRequestEmail(email: string, name: string, returnNumber: string, orderNumber: string, refundAmount?: number) {
  const html = wrapHtml(`
    <h2>Return Request Submitted</h2>
    <p>Hi ${name}, your return request has been submitted successfully.</p>
    <div style="margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px">
      <div class="info-row"><span class="info-label">Return #</span><span class="info-value">${returnNumber}</span></div>
      <div class="info-row"><span class="info-label">Order #</span><span class="info-value">${orderNumber}</span></div>
      ${refundAmount ? `<div class="info-row"><span class="info-label">Refund Amount</span><span class="info-value">Rs.${refundAmount.toLocaleString('en-IN')}</span></div>` : ''}
    </div>
    <p>Our team will review your request within 24-48 hours and update you on the next steps.</p>
  `);
  return sendEmail({ to: email, subject: `Return #${returnNumber} Submitted - AMOHA Mobiles`, html });
}

// ===== Return Status Update Email =====
export async function sendReturnStatusEmail(email: string, name: string, returnNumber: string, status: string, message?: string) {
  const labelMap: Record<string, string> = {
    requested: 'Requested',
    approved: 'Approved',
    rejected: 'Rejected',
    pickup_scheduled: 'Pickup Scheduled',
    picked_up: 'Picked Up',
    received: 'Item Received',
    inspected: 'Inspection Complete',
    refund_initiated: 'Refund Initiated',
    refund_completed: 'Refund Completed',
    replacement_shipped: 'Replacement Shipped',
    closed: 'Closed',
  };
  const colorMap: Record<string, string> = {
    requested: '#f59e0b',
    approved: '#3b82f6',
    rejected: '#ef4444',
    pickup_scheduled: '#8b5cf6',
    picked_up: '#7c3aed',
    received: '#6366f1',
    inspected: '#0891b2',
    refund_initiated: '#d97706',
    refund_completed: '#059669',
    replacement_shipped: '#059669',
    closed: '#6b7280',
  };
  const label = labelMap[status] || status.replace(/_/g, ' ');
  const color = colorMap[status] || '#6366f1';
  const html = wrapHtml(`
    <h2>Return Update</h2>
    <p>Hi ${name}, your return request <strong>#${returnNumber}</strong> has been updated.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid ${color}">
      <p style="margin:0;font-size:15px;font-weight:600;color:${color}">Status: ${label}</p>
      ${message ? `<p style="margin:8px 0 0;font-size:13px;color:#6b7280">${message}</p>` : ''}
    </div>
    ${status === 'refund_completed' ? '<p style="color:#059669;font-weight:600">Your refund has been processed successfully.</p>' : ''}
    ${status === 'rejected' ? '<p>If you have questions about this decision, please contact our support team.</p>' : ''}
  `);
  return sendEmail({ to: email, subject: `Return #${returnNumber} - ${label}`, html });
}

// ===== Wallet Credit Notification =====
export async function sendWalletCreditEmail(email: string, name: string, amount: number, description: string, newBalance: number) {
  const html = wrapHtml(`
    <h2>Wallet Credited</h2>
    <p>Hi ${name}, your wallet has been credited.</p>
    <div style="margin:16px 0;padding:16px;background:#f0fdf4;border-radius:8px;text-align:center">
      <p style="margin:0;font-size:24px;font-weight:700;color:#059669">+ Rs.${amount.toLocaleString('en-IN')}</p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280">${description}</p>
    </div>
    <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;text-align:center">
      <p style="margin:0;font-size:13px;color:#6b7280">Updated Balance</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#1f2937">Rs.${newBalance.toLocaleString('en-IN')}</p>
    </div>
  `);
  return sendEmail({ to: email, subject: `Wallet Credited Rs.${amount.toLocaleString('en-IN')} - AMOHA Mobiles`, html });
}

// ===== Service Request Created Confirmation =====
export async function sendServiceRequestCreatedEmail(email: string, name: string, requestNumber: string, serviceType: string) {
  const html = wrapHtml(`
    <h2>Service Request Received</h2>
    <p>Hi ${name}, your service request has been submitted successfully.</p>
    <div style="margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px">
      <div class="info-row"><span class="info-label">Request #</span><span class="info-value">${requestNumber}</span></div>
      <div class="info-row"><span class="info-label">Service Type</span><span class="info-value">${serviceType}</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">Pending Review</span></div>
    </div>
    <p>Our team will review your request and contact you shortly with an estimate.</p>
  `);
  return sendEmail({ to: email, subject: `Service Request #${requestNumber} Received - AMOHA Mobiles`, html });
}

// ===== Review Status Notification =====
export async function sendReviewStatusEmail(email: string, name: string, productName: string, status: 'approved' | 'rejected') {
  const isApproved = status === 'approved';
  const html = wrapHtml(`
    <h2>Review ${isApproved ? 'Published' : 'Not Published'}</h2>
    <p>Hi ${name}, your review for <strong>${productName}</strong> has been ${isApproved ? 'approved and is now live' : 'rejected'}.</p>
    <div style="margin:16px 0;padding:16px;background:${isApproved ? '#f0fdf4' : '#fef2f2'};border-radius:8px;border-left:4px solid ${isApproved ? '#059669' : '#dc2626'}">
      <p style="margin:0;font-size:15px;font-weight:600;color:${isApproved ? '#059669' : '#dc2626'}">${isApproved ? 'Your review is now visible to other shoppers.' : 'Your review did not meet our content guidelines.'}</p>
    </div>
    ${!isApproved ? '<p style="font-size:13px;color:#6b7280">If you believe this was an error, please contact our support team.</p>' : '<p>Thank you for helping other customers make informed decisions!</p>'}
  `);
  return sendEmail({ to: email, subject: `Your Review Has Been ${isApproved ? 'Published' : 'Rejected'} - AMOHA Mobiles`, html });
}
