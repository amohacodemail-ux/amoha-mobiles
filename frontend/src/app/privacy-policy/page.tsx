import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description: 'AMOHA Mobiles privacy policy – how we collect, use, and protect your personal data when you shop with us.',
};

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-white/5 bg-gradient-to-b from-primary-50 to-white dark:from-primary-950 dark:to-surface-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="page-container relative py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Privacy <span className="text-primary-500 dark:text-primary-400">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 1, 2026</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.</p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14 max-w-4xl mx-auto">

        {/* Applicable Laws Notice */}
        <div className="glass-card p-4 sm:p-5 mb-8 rounded-xl border-l-4 border-emerald-500">
          <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-1">Regulatory Compliance</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">This Privacy Policy is compliant with the <strong className="text-gray-700 dark:text-gray-200">Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong className="text-gray-700 dark:text-gray-200">Information Technology (Reasonable Security Practices) Rules, 2011</strong>, the <strong className="text-gray-700 dark:text-gray-200">Consumer Protection (E-Commerce) Rules, 2020</strong>, and where applicable, the <strong className="text-gray-700 dark:text-gray-200">General Data Protection Regulation (GDPR)</strong> for EU/UK users and the <strong className="text-gray-700 dark:text-gray-200">California Consumer Privacy Act (CCPA)</strong> for California residents.</p>
        </div>

        <div className="space-y-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">

          <div className="glass-card p-6 sm:p-8 rounded-xl space-y-7">

            {/* 1 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">1</span>
                Who We Are (Data Controller)
              </h2>
              <p className="mb-2">AMOHA Mobiles acts as the <strong className="text-gray-700 dark:text-gray-200">Data Fiduciary / Data Controller</strong> for all personal data collected through our Platform.</p>
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 space-y-1 text-xs">
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Company:</span> AMOHA Mobiles</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Address:</span> MG Road, Mumbai, Maharashtra – 400 001, India</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Data Protection Officer / Grievance Officer:</span> Mr. Amoha Kumar</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span> <span className="text-primary-500">privacy@amoha.in</span></p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> +91 98765 43210 (Mon–Sat, 10 AM – 6 PM IST)</p>
              </div>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">2</span>
                Personal Data We Collect
              </h2>
              <p className="mb-3">We collect personal data only to the extent necessary to provide our services (&quot;data minimisation&quot; principle). We collect the following categories of data:</p>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Category</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Examples</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">When Collected</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Identity Data</td>
                      <td className="px-4 py-2.5">Name, date of birth, gender</td>
                      <td className="px-4 py-2.5">Account registration</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Contact Data</td>
                      <td className="px-4 py-2.5">Email, phone, delivery address</td>
                      <td className="px-4 py-2.5">Registration, order, service request</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Financial Data</td>
                      <td className="px-4 py-2.5">Masked card details, transaction IDs (we do NOT store full card numbers or CVVs)</td>
                      <td className="px-4 py-2.5">Payment processing</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Transaction Data</td>
                      <td className="px-4 py-2.5">Orders placed, returns, service history</td>
                      <td className="px-4 py-2.5">Every transaction</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Technical Data</td>
                      <td className="px-4 py-2.5">IP address, browser type, device info, cookies</td>
                      <td className="px-4 py-2.5">Every website visit</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Usage Data</td>
                      <td className="px-4 py-2.5">Pages viewed, search queries, clicks</td>
                      <td className="px-4 py-2.5">Every session</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Communications Data</td>
                      <td className="px-4 py-2.5">Support tickets, emails, chat logs</td>
                      <td className="px-4 py-2.5">Customer support</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">KYC / ID Data</td>
                      <td className="px-4 py-2.5">Aadhaar (masked), PAN (optional, for GST invoices)</td>
                      <td className="px-4 py-2.5">Profile verification, B2B invoicing</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5 font-medium text-gray-700 dark:text-gray-300">Device Repair Data</td>
                      <td className="px-4 py-2.5">IMEI, device model, fault description</td>
                      <td className="px-4 py-2.5">Service request only</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs text-amber-600 dark:text-amber-400">We do not collect Sensitive Personal Data such as passwords in plain text, biometrics, health data, or religious/political beliefs.</p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">3</span>
                Legal Basis for Processing
              </h2>
              <p className="mb-2">We process your personal data under the following lawful bases:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong className="text-gray-700 dark:text-gray-200">Consent:</strong> Where you have given explicit consent (e.g., marketing emails, push notifications).</li>
                <li><strong className="text-gray-700 dark:text-gray-200">Contractual Necessity:</strong> To fulfil your orders, process payments, and provide services you have requested.</li>
                <li><strong className="text-gray-700 dark:text-gray-200">Legal Obligation:</strong> To comply with applicable laws, tax audits, court orders, or regulatory requirements.</li>
                <li><strong className="text-gray-700 dark:text-gray-200">Legitimate Interest:</strong> For fraud prevention, platform security, improving services, and internal analytics — balanced against your rights.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">4</span>
                How We Use Your Personal Data
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Process and fulfil orders, manage returns, and provide repair services.</li>
                <li>Send transactional notifications (order confirmation, shipping updates, delivery alerts) via email and SMS.</li>
                <li>Manage your user account and authentication.</li>
                <li>Process payment transactions securely.</li>
                <li>Send promotional offers, new arrivals, and discount alerts — <strong className="text-gray-700 dark:text-gray-200">only with your explicit consent</strong>. You can opt out anytime.</li>
                <li>Personalise your shopping experience (product recommendations based on browsing history).</li>
                <li>Detect and prevent fraudulent transactions, account abuse, and security threats.</li>
                <li>Analyse site performance, conduct A/B tests, and improve our services.</li>
                <li>Comply with legal, accounting, and regulatory obligations.</li>
                <li>Respond to your support queries and complaints.</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">5</span>
                Data Sharing &amp; Third-Party Disclosure
              </h2>
              <p className="mb-2">We <strong className="text-gray-700 dark:text-gray-200">never sell or rent</strong> your personal data. We share it only with trusted parties and only to the extent necessary:</p>
              <div className="space-y-2">
                {[
                  ["Payment Processors", "Razorpay Payments Pvt. Ltd. — for processing payments securely. Razorpay is PCI-DSS Level 1 certified and RBI regulated."],
                  ["Logistics Partners", "DHL, Professional Courier, BlueDart, and similar carriers — for shipping and delivery of orders. Only name, phone, and address are shared."],
                  ["Cloud & Hosting", "MongoDB Atlas (MongoDB Inc., USA) for database; Vercel (USA) for web hosting — under strict data processing agreements."],
                  ["Communication Tools", "SMS / email service providers for transactional notifications (e.g., Twilio, MSG91) — subject to applicable data protection agreements."],
                  ["Analytics", "Anonymised, aggregated analytics data may be shared with tools like Google Analytics."],
                  ["Legal Authorities", "If required by law, court order, or government directive — only the minimum required data will be disclosed."],
                  ["Business Transfers", "In the event of a merger, acquisition, or sale of assets, your data may be transferred. You will be notified before such transfer."],
                ].map(([title, desc], i) => (
                  <div key={i} className="flex gap-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-3">
                    <div className="mt-0.5 h-2 w-2 flex-shrink-0 rounded-full bg-primary-500 mt-1" />
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-300">{title}</p>
                      <p className="text-xs mt-0.5">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">6</span>
                International Data Transfers
              </h2>
              <p>Some of our technology partners (e.g., MongoDB Atlas, Vercel) process data in data centres outside India. Where personal data is transferred internationally, we ensure:</p>
              <ul className="mt-2 list-disc list-inside space-y-1.5">
                <li>The recipient country provides adequate protection, or</li>
                <li>Appropriate safeguards are in place (e.g., Standard Contractual Clauses for GDPR, Data Processing Agreements), or</li>
                <li>The transfer is necessary to perform a contract with you (e.g., processing your payment).</li>
              </ul>
              <p className="mt-2">All international transfers comply with the DPDP Act, 2023 and applicable RBI regulations.</p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">7</span>
                Data Retention
              </h2>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Data Type</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Retention Period</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    <tr><td className="px-4 py-2.5">Account data</td><td className="px-4 py-2.5">Duration of account + 3 years</td><td className="px-4 py-2.5">Service delivery, legal claims</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Transaction / order records</td><td className="px-4 py-2.5">7 years</td><td className="px-4 py-2.5">Tax laws (Income Tax Act, GST Act)</td></tr>
                    <tr><td className="px-4 py-2.5">Payment data</td><td className="px-4 py-2.5">As required by Razorpay &amp; RBI (typically 5 years)</td><td className="px-4 py-2.5">RBI regulations, fraud prevention</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Communication / support logs</td><td className="px-4 py-2.5">3 years</td><td className="px-4 py-2.5">Legal disputes, quality audit</td></tr>
                    <tr><td className="px-4 py-2.5">Marketing preferences</td><td className="px-4 py-2.5">Until you opt out or delete account</td><td className="px-4 py-2.5">Consent management</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Cookie / analytics data</td><td className="px-4 py-2.5">Up to 13 months</td><td className="px-4 py-2.5">Session management, analytics</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">8</span>
                Data Security
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>All data is stored on servers with <strong className="text-gray-700 dark:text-gray-200">AES-256 encryption at rest</strong> and transmitted using <strong className="text-gray-700 dark:text-gray-200">TLS 1.2+ (HTTPS)</strong>.</li>
                <li>Passwords are hashed using bcrypt with salt rounds and never stored in plain text.</li>
                <li>Access to personal data is restricted to authorised personnel on a need-to-know basis.</li>
                <li>Regular security audits, penetration testing, and vulnerability assessments are conducted.</li>
                <li>Authentication tokens (JWT) are short-lived and stored in HTTP-only secure cookies.</li>
                <li>In the event of a data breach, we will notify affected users and relevant authorities within <strong className="text-gray-700 dark:text-gray-200">72 hours</strong> as required under applicable law.</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">9</span>
                Cookies &amp; Tracking Technologies
              </h2>
              <p className="mb-2">We use cookies and similar technologies (web beacons, local storage) for the following purposes:</p>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Cookie Type</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Purpose</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Can be disabled?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    <tr><td className="px-4 py-2.5">Strictly Necessary</td><td className="px-4 py-2.5">Login session, cart persistence, security tokens</td><td className="px-4 py-2.5 text-red-500">No — required for the site to function</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Functional</td><td className="px-4 py-2.5">Language preference, dark/light mode, recently viewed products</td><td className="px-4 py-2.5 text-amber-500">Optional</td></tr>
                    <tr><td className="px-4 py-2.5">Analytics</td><td className="px-4 py-2.5">Page visits, bounce rate, user flows (anonymised)</td><td className="px-4 py-2.5 text-amber-500">Optional — disable in browser</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Marketing</td><td className="px-4 py-2.5">Personalised ads, retargeting (only with consent)</td><td className="px-4 py-2.5 text-amber-500">Optional — withdraw consent anytime</td></tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-2">You can manage cookie preferences through your browser settings at any time. Disabling certain cookies may affect the functionality of our Platform.</p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">10</span>
                Your Rights as a Data Principal
              </h2>
              <p className="mb-3">Under the DPDP Act 2023 (India) and where applicable, GDPR (EU/UK), you have the following rights regarding your personal data:</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {[
                  ["Right to Access", "Request a copy of all personal data we hold about you."],
                  ["Right to Correction", "Request correction of inaccurate or incomplete data."],
                  ["Right to Erasure", "Request deletion of your personal data (subject to legal retention obligations)."],
                  ["Right to Withdraw Consent", "Withdraw consent for marketing emails or data processing at any time without penalty."],
                  ["Right to Data Portability", "Receive your data in a structured, machine-readable format."],
                  ["Right to Object", "Object to processing based on legitimate interest, including direct marketing."],
                  ["Right of Nomination", "Nominate another person to exercise your rights in case of death or incapacity (DPDP Act)."],
                  ["Right to Grievance Redressal", "File a complaint with our Grievance Officer or with the Data Protection Board of India."],
                ].map(([title, desc], i) => (
                  <div key={i} className="rounded-lg border border-gray-200 dark:border-white/10 p-3">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-200 mb-1">{title}</p>
                    <p className="text-xs">{desc}</p>
                  </div>
                ))}
              </div>
              <p className="mt-3">To exercise any right, email <span className="text-primary-500">privacy@amoha.in</span>. We will respond within <strong className="text-gray-700 dark:text-gray-200">30 days</strong> (or as required by law). We may verify your identity before processing your request.</p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">11</span>
                Children&apos;s Privacy
              </h2>
              <p>Our Platform is not directed at children under <strong className="text-gray-700 dark:text-gray-200">18 years of age</strong>. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected data from a child, we will delete it promptly. If you believe a child&apos;s data has been submitted to our Platform, please contact us at <span className="text-primary-500">privacy@amoha.in</span> immediately.</p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">12</span>
                Third-Party Links &amp; Services
              </h2>
              <p>Our Platform may contain links to third-party websites (e.g., brand websites, social media). We are <strong className="text-gray-700 dark:text-gray-200">not responsible</strong> for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party site you visit.</p>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">13</span>
                California Residents (CCPA)
              </h2>
              <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete it, the right to opt out of the sale of your data, and the right to non-discrimination. We do not sell personal information. To exercise CCPA rights, email <span className="text-primary-500">privacy@amoha.in</span> with &quot;CCPA Request&quot; in the subject line.</p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">14</span>
                Changes to This Privacy Policy
              </h2>
              <p>We may update this Privacy Policy periodically to reflect changes in law, technology, or our services. Material changes will be announced via email and a prominent notice on the Platform at least <strong className="text-gray-700 dark:text-gray-200">15 days</strong> before they take effect. The &quot;Last Updated&quot; date at the top of this page will always reflect the most recent version.</p>
            </section>

          </div>
        </div>

        {/* Contact / DPO Box */}
        <div className="mt-8 glass-card p-6 sm:p-8 rounded-xl">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Contact Our Data Protection Officer</h2>
          <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 space-y-2 text-sm">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">DPO / Grievance Officer:</span> Mr. Amoha Kumar</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span> <span className="text-primary-500">privacy@amoha.in</span></p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> <span className="text-primary-500">+91 98765 43210</span></p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Address:</span> AMOHA Mobiles, MG Road, Mumbai, Maharashtra – 400 001, India</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">For EU/UK users: If you are not satisfied with our response, you have the right to lodge a complaint with your local Data Protection Supervisory Authority.</p>
            <p className="text-xs text-gray-400 dark:text-gray-500">For Indian users: You may escalate unresolved complaints to the <strong>Data Protection Board of India</strong> once operational under the DPDP Act, 2023.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
