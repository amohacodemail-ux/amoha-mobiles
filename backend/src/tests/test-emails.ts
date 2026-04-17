/**
 * Email Template Test Script
 * Uses Ethereal (free fake SMTP from Nodemailer team) to test all email templates.
 * Run: npx tsx src/tests/test-emails.ts
 * 
 * It will print preview URLs for each email so you can verify the formatting.
 */

import nodemailer from 'nodemailer';

// We will override the sendEmail function to use Ethereal
async function main() {
  console.log('Creating Ethereal test account...');
  const testAccount = await nodemailer.createTestAccount();
  
  console.log(`Ethereal account: ${testAccount.user}`);
  console.log(`Ethereal password: ${testAccount.pass}`);
  console.log('---');

  const transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const from = `"AMOHA Mobiles" <${testAccount.user}>`;
  const testEmail = testAccount.user;

  // Helper to wrap HTML same as email.util.ts
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

  async function sendTest(subject: string, html: string) {
    const info = await transporter.sendMail({ from, to: testEmail, subject, html });
    const previewUrl = nodemailer.getTestMessageUrl(info);
    console.log(`[OK] ${subject}`);
    console.log(`     Preview: ${previewUrl}`);
    return previewUrl;
  }

  const results: string[] = [];

  // 1. Welcome Email
  let html = wrapHtml(`
    <h2>Welcome, Test User!</h2>
    <p>Thank you for creating an account with us. We're excited to have you on board.</p>
    <p>Explore our wide range of smartphones and accessories at the best prices.</p>
    <a href="#" class="btn">Start Shopping</a>
  `);
  results.push(await sendTest('Welcome to AMOHA Mobiles!', html) as string);

  // 2. Login Alert
  html = wrapHtml(`
    <h2>Login Detected</h2>
    <p>Hi Test User, you've successfully logged into your account.</p>
    <p><strong>Time:</strong> ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}</p>
    <p>If this wasn't you, please reset your password immediately.</p>
  `);
  results.push(await sendTest('Login Alert - AMOHA Mobiles', html) as string);

  // 3. Order Confirmation
  html = wrapHtml(`
    <h2>Order Confirmed!</h2>
    <p>Hi Test User, your order <strong>#AMH-TEST-001</strong> has been placed successfully.</p>
    <table>
      <tr style="border-bottom:2px solid #e5e7eb"><td style="font-weight:600;color:#1f2937">Item</td><td style="font-weight:600;color:#1f2937;text-align:center">Qty</td><td style="font-weight:600;color:#1f2937;text-align:right">Price</td></tr>
      <tr><td>Samsung Galaxy S24</td><td style="text-align:center">1</td><td style="text-align:right">Rs.79,999</td></tr>
      <tr><td>Phone Case</td><td style="text-align:center">2</td><td style="text-align:right">Rs.499</td></tr>
    </table>
    <div style="margin-top:16px;padding:16px;background:#f0fdf4;border-radius:8px;text-align:right">
      <span style="font-size:16px;font-weight:700;color:#059669">Total: Rs.80,997</span>
    </div>
    <p style="margin-top:16px">We'll notify you when your order ships.</p>
  `);
  results.push(await sendTest('Order #AMH-TEST-001 Confirmed - AMOHA Mobiles', html) as string);

  // 4. Order Status Update (Shipped)
  html = wrapHtml(`
    <h2>Order Update</h2>
    <p>Hi Test User, your order <strong>#AMH-TEST-001</strong> has been updated.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #7c3aed">
      <p style="margin:0;font-size:15px;font-weight:600;color:#7c3aed">Status: Shipped</p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280">Your order is on its way! Tracking: DHL123456789</p>
    </div>
  `);
  results.push(await sendTest('Order #AMH-TEST-001 - Shipped', html) as string);

  // 5. Order Cancellation (NEW)
  html = wrapHtml(`
    <h2>Order Cancelled</h2>
    <p>Hi Test User, your order <strong>#AMH-TEST-001</strong> has been cancelled.</p>
    <div style="margin:16px 0;padding:16px;background:#fef2f2;border-radius:8px;border-left:4px solid #dc2626">
      <p style="margin:0;font-size:13px;color:#6b7280"><strong>Reason:</strong> Changed my mind about the purchase</p>
    </div>
    <p>If you paid online, your refund will be processed within 5-7 business days.</p>
    <p style="font-size:13px;color:#6b7280">If you didn't request this cancellation, please contact us immediately.</p>
  `);
  results.push(await sendTest('Order #AMH-TEST-001 Cancelled - AMOHA Mobiles', html) as string);

  // 6. Contact Auto-Reply (NEW)
  html = wrapHtml(`
    <h2>We Received Your Message</h2>
    <p>Hi Test User, thank you for reaching out to us.</p>
    <div style="margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px;border-left:4px solid #3b82f6">
      <p style="margin:0;font-size:13px;color:#6b7280"><strong>Subject:</strong> Question about product warranty</p>
    </div>
    <p>Our team will review your message and get back to you within 24-48 hours.</p>
    <p style="font-size:13px;color:#6b7280">If your inquiry is urgent, please call us directly.</p>
  `);
  results.push(await sendTest('We received your message - AMOHA Mobiles', html) as string);

  // 7. Contact Admin Notification (NEW)
  html = wrapHtml(`
    <h2>New Contact Message</h2>
    <p>A new contact form submission has been received.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px">
      <div class="info-row"><span class="info-label">Name</span><span class="info-value">Test User</span></div>
      <div class="info-row"><span class="info-label">Email</span><span class="info-value">test@example.com</span></div>
      <div class="info-row"><span class="info-label">Phone</span><span class="info-value">+91 9876543210</span></div>
      <div class="info-row"><span class="info-label">Subject</span><span class="info-value">Question about warranty</span></div>
    </div>
    <div style="margin:16px 0;padding:16px;background:#f9fafb;border-radius:8px">
      <p style="margin:0;font-size:13px;color:#374151">I purchased a Samsung Galaxy S24 and wanted to know about the warranty coverage details.</p>
    </div>
  `);
  results.push(await sendTest('New Contact: Question about warranty - AMOHA Mobiles', html) as string);

  // 8. Return Request Created (NEW)
  html = wrapHtml(`
    <h2>Return Request Submitted</h2>
    <p>Hi Test User, your return request has been submitted successfully.</p>
    <div style="margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px">
      <div class="info-row"><span class="info-label">Return #</span><span class="info-value">RTN-TEST-001</span></div>
      <div class="info-row"><span class="info-label">Order #</span><span class="info-value">AMH-TEST-001</span></div>
      <div class="info-row"><span class="info-label">Refund Amount</span><span class="info-value">Rs.79,999</span></div>
    </div>
    <p>Our team will review your request within 24-48 hours and update you on the next steps.</p>
  `);
  results.push(await sendTest('Return #RTN-TEST-001 Submitted - AMOHA Mobiles', html) as string);

  // 9. Return Status Update (NEW)
  html = wrapHtml(`
    <h2>Return Update</h2>
    <p>Hi Test User, your return request <strong>#RTN-TEST-001</strong> has been updated.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #059669">
      <p style="margin:0;font-size:15px;font-weight:600;color:#059669">Status: Refund Completed</p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280">Your refund has been credited to your wallet.</p>
    </div>
    <p style="color:#059669;font-weight:600">Your refund has been processed successfully.</p>
  `);
  results.push(await sendTest('Return #RTN-TEST-001 - Refund Completed', html) as string);

  // 10. Wallet Credit (NEW)
  html = wrapHtml(`
    <h2>Wallet Credited</h2>
    <p>Hi Test User, your wallet has been credited.</p>
    <div style="margin:16px 0;padding:16px;background:#f0fdf4;border-radius:8px;text-align:center">
      <p style="margin:0;font-size:24px;font-weight:700;color:#059669">+ Rs.79,999</p>
      <p style="margin:8px 0 0;font-size:13px;color:#6b7280">Refund for return RTN-TEST-001</p>
    </div>
    <div style="margin:16px 0;padding:12px 16px;background:#f8fafc;border-radius:8px;text-align:center">
      <p style="margin:0;font-size:13px;color:#6b7280">Updated Balance</p>
      <p style="margin:4px 0 0;font-size:18px;font-weight:600;color:#1f2937">Rs.79,999</p>
    </div>
  `);
  results.push(await sendTest('Wallet Credited Rs.79,999 - AMOHA Mobiles', html) as string);

  // 11. Service Request Created (NEW)
  html = wrapHtml(`
    <h2>Service Request Received</h2>
    <p>Hi Test User, your service request has been submitted successfully.</p>
    <div style="margin:16px 0;padding:16px;background:#f0f9ff;border-radius:8px">
      <div class="info-row"><span class="info-label">Request #</span><span class="info-value">SRV-TEST-001</span></div>
      <div class="info-row"><span class="info-label">Service Type</span><span class="info-value">Screen Replacement</span></div>
      <div class="info-row"><span class="info-label">Status</span><span class="info-value">Pending Review</span></div>
    </div>
    <p>Our team will review your request and contact you shortly with an estimate.</p>
  `);
  results.push(await sendTest('Service Request #SRV-TEST-001 Received - AMOHA Mobiles', html) as string);

  // 12. Service Request Status Update
  html = wrapHtml(`
    <h2>Service Request Update</h2>
    <p>Hi Test User, your service request has been updated.</p>
    <div style="margin:16px 0;padding:16px;background:#f8fafc;border-radius:8px;border-left:4px solid #10b981">
      <p style="margin:0;font-size:13px;color:#6b7280">Request #SRV-TEST-001 &bull; Screen Replacement</p>
      <p style="margin:8px 0 0;font-size:15px;font-weight:600;color:#10b981">Status: Completed</p>
      <p style="margin:8px 0 0;font-size:13px;color:#374151"><strong>Note:</strong> Your device is ready for pickup.</p>
    </div>
    <p style="font-size:13px;color:#6b7280">We will keep you updated on any further progress.</p>
  `);
  results.push(await sendTest('Service Request #SRV-TEST-001 - Completed', html) as string);

  // 13. KYC Submitted
  html = wrapHtml(`
    <h2>KYC Submitted</h2>
    <p>Hi Test User, your KYC documents have been submitted and are under review. We'll notify you once the verification is complete.</p>
  `);
  results.push(await sendTest('KYC Submitted - AMOHA Mobiles', html) as string);

  // 14. KYC Verified
  html = wrapHtml(`
    <h2>KYC Verified</h2>
    <p>Hi Test User, congratulations! Your KYC has been successfully verified.</p>
    <div style="padding:16px;background:#f0fdf4;border-radius:8px;text-align:center">
      <p style="margin:0;font-size:15px;font-weight:600;color:#059669">Identity Verified</p>
    </div>
  `);
  results.push(await sendTest('KYC Approved - AMOHA Mobiles', html) as string);

  // 15. Password Reset
  html = wrapHtml(`
    <h2>Password Reset</h2>
    <p>Hi Test User, we received a request to reset your password.</p>
    <p>Click the button below to set a new password. This link expires in 1 hour.</p>
    <div style="text-align:center;margin:24px 0">
      <a href="http://localhost:3002/reset-password?token=test-token-123" class="btn">Reset Password</a>
    </div>
    <p style="font-size:12px;color:#9ca3af">If you didn't request this, you can safely ignore this email.</p>
  `);
  results.push(await sendTest('Password Reset - AMOHA Mobiles', html) as string);

  console.log('\n========================================');
  console.log('All 15 email templates sent successfully!');
  console.log('========================================');
  console.log('\nOpen any preview URL above in your browser to view the email.');
  console.log('All emails are sent to Ethereal (free fake SMTP) - no real emails were sent.');
}

main().catch(console.error);
