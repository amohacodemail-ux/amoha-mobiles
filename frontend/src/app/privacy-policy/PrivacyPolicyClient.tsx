'use client';

import { useState, useEffect, useRef } from 'react';
import { HiOutlineShieldCheck, HiChevronDown, HiOutlineLockClosed } from 'react-icons/hi';

const headings = [
  { id: 'sec-1', title: 'Who We Are (Data Controller)' },
  { id: 'sec-2', title: 'Personal Data We Collect' },
  { id: 'sec-3', title: 'Legal Basis for Processing' },
  { id: 'sec-4', title: 'How We Use Your Personal Data' },
  { id: 'sec-5', title: 'Data Sharing & Third-Party Disclosure' },
  { id: 'sec-6', title: 'International Data Transfers' },
  { id: 'sec-7', title: 'Data Retention' },
  { id: 'sec-8', title: 'Data Security' },
  { id: 'sec-9', title: 'Cookies & Tracking Technologies' },
  { id: 'sec-10', title: 'Your Rights as a Data Principal' },
  { id: 'sec-11', title: 'Children\'s Privacy' },
  { id: 'sec-12', title: 'Third-Party Links & Services' },
  { id: 'sec-13', title: 'California Residents (CCPA)' },
  { id: 'sec-14', title: 'Changes to This Privacy Policy' },
];

export default function PrivacyPolicyClient() {
  const [activeSection, setActiveSection] = useState('sec-1');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    observerRef.current = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        if (visibleEntries.length > 0) {
          // Sort by their top position to find the topmost visible section
          visibleEntries.sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
          setActiveSection(visibleEntries[0].target.id);
        }
      },
      { rootMargin: '-100px 0px -60% 0px', threshold: [0, 0.2, 0.5, 1] }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observerRef.current?.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, []);

  const scrollToSection = (id: string) => {
    setIsMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      const offset = 80; // adjust for sticky header
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a]">
      {/* Premium Hero Header */}
      <div className="relative overflow-hidden bg-white dark:bg-black border-b border-gray-200 dark:border-white/5">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.08),transparent_70%)] pointer-events-none" />
        <div className="page-container relative py-16 sm:py-24 flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm border border-primary-100 dark:border-primary-900/30">
            <HiOutlineShieldCheck className="h-8 w-8" />
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Privacy <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500">Policy</span>
          </h1>
          <p className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
            <HiOutlineLockClosed className="h-4 w-4" />
            Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 1, 2026
          </p>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Your privacy is important to us. This policy explains how we collect, use, and protect your personal data.
          </p>
        </div>
      </div>

      <div className="page-container py-12 max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          
          {/* Mobile Navigation Dropdown */}
          <div className="w-full lg:hidden sticky top-20 z-40 mb-6">
            <div className="bg-white dark:bg-surface-50 border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
              <button 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="w-full flex items-center justify-between p-4 text-sm font-semibold text-gray-900 dark:text-white"
              >
                <span>On this page: {headings.find(h => h.id === activeSection)?.title || 'Navigate'}</span>
                <HiChevronDown className={`h-5 w-5 text-gray-500 transition-transform ${isMobileMenuOpen ? 'rotate-180' : ''}`} />
              </button>
              {isMobileMenuOpen && (
                <div className="border-t border-gray-100 dark:border-white/5 max-h-[50vh] overflow-y-auto">
                  {headings.map((heading) => (
                    <button
                      key={heading.id}
                      onClick={() => scrollToSection(heading.id)}
                      className={`w-full text-left px-4 py-3 text-sm transition-colors ${activeSection === heading.id ? 'bg-primary-50 dark:bg-primary-900/10 text-primary-600 dark:text-primary-400 font-medium border-l-2 border-primary-500' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-white/5 border-l-2 border-transparent'}`}
                    >
                      {heading.title}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Sticky Sidebar */}
          <div className="hidden lg:block w-72 flex-shrink-0 sticky top-24 overflow-y-auto max-h-[calc(100vh-8rem)] scrollbar-hide">
            <div className="pr-6 pb-6">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-900 dark:text-white mb-4 pl-4">On this page</h3>
              <nav className="space-y-1 relative before:absolute before:inset-y-0 before:left-4 before:w-px before:bg-gray-200 dark:before:bg-white/10">
                {headings.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToSection(heading.id)}
                    className={`relative w-full text-left px-4 py-2 pl-8 text-sm transition-all duration-200 ${
                      activeSection === heading.id
                        ? 'text-primary-600 dark:text-primary-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:translate-x-1'
                    }`}
                  >
                    {activeSection === heading.id && (
                      <span className="absolute left-[15.5px] top-1/2 -translate-y-1/2 w-0.5 h-full bg-primary-500 rounded-full shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    )}
                    {heading.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0 w-full space-y-8">
            
            {/* Applicable Laws Notice */}
            <div className="bg-white dark:bg-surface-50 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-2">Regulatory Compliance</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    This Privacy Policy is compliant with the <strong className="text-gray-800 dark:text-gray-200 font-semibold">Digital Personal Data Protection Act, 2023 (DPDP Act)</strong>, the <strong className="text-gray-800 dark:text-gray-200 font-semibold">Information Technology (Reasonable Security Practices) Rules, 2011</strong>, the <strong className="text-gray-800 dark:text-gray-200 font-semibold">Consumer Protection (E-Commerce) Rules, 2020</strong>, and where applicable, the <strong className="text-gray-800 dark:text-gray-200 font-semibold">General Data Protection Regulation (GDPR)</strong> for EU/UK users and the <strong className="text-gray-800 dark:text-gray-200 font-semibold">California Consumer Privacy Act (CCPA)</strong> for California residents.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-50 p-6 sm:p-10 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm space-y-12">
              
              {/* 1 */}
              <section id="sec-1" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">1</span>
                  Who We Are (Data Controller)
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 ml-11">
                  <p>AMOHA Mobiles acts as the <strong className="text-gray-800 dark:text-gray-200 font-semibold">Data Fiduciary / Data Controller</strong> for all personal data collected through our Platform.</p>
                  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-5 grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Company</p>
                      <p className="font-medium text-gray-900 dark:text-white">AMOHA Mobiles</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">MG Road, Mumbai, Maharashtra – 400 001, India</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">DPO / Grievance Officer</p>
                      <p className="font-medium text-gray-900 dark:text-white">Mr. Amoha Kumar</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Contact</p>
                      <p className="font-medium text-primary-600 dark:text-primary-400">privacy@amoha.in <br/> +91 98765 43210 (Mon–Sat, 10 AM – 6 PM IST)</p>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 2 */}
              <section id="sec-2" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">2</span>
                  Personal Data We Collect
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 ml-11">
                  <p>We collect personal data only to the extent necessary to provide our services ("data minimisation" principle). We collect the following categories of data:</p>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Category</th>
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Examples</th>
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">When Collected</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-transparent">
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Identity Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Name, date of birth, gender</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Account registration</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Contact Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Email, phone, delivery address</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Registration, order, service request</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Financial Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Masked card details, transaction IDs (we do NOT store full card numbers or CVVs)</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Payment processing</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Transaction Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Orders placed, returns, service history</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Every transaction</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Technical Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">IP address, browser type, device info, cookies</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Every website visit</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Usage Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Pages viewed, search queries, clicks</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Every session</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Communications Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Support tickets, emails, chat logs</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Customer support</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">KYC / ID Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Aadhaar (masked), PAN (optional, for GST invoices)</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Profile verification, B2B invoicing</td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Device Repair Data</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">IMEI, device model, fault description</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Service request only</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 rounded-xl border border-amber-200 dark:border-amber-500/20">
                    <p className="text-sm font-medium">We do not collect Sensitive Personal Data such as passwords in plain text, biometrics, health data, or religious/political beliefs.</p>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 3 */}
              <section id="sec-3" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">3</span>
                  Legal Basis for Processing
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 ml-11">
                  <p>We process your personal data under the following lawful bases:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">Consent:</strong> Where you have given explicit consent (e.g., marketing emails, push notifications).</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">Contractual Necessity:</strong> To fulfil your orders, process payments, and provide services you have requested.</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">Legal Obligation:</strong> To comply with applicable laws, tax audits, court orders, or regulatory requirements.</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">Legitimate Interest:</strong> For fraud prevention, platform security, improving services, and internal analytics — balanced against your rights.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 4 */}
              <section id="sec-4" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">4</span>
                  How We Use Your Personal Data
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Process and fulfil orders, manage returns, and provide repair services.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Send transactional notifications (order confirmation, shipping updates, delivery alerts) via email and SMS.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Manage your user account and authentication.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Process payment transactions securely.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Send promotional offers, new arrivals, and discount alerts — <strong className="text-gray-800 dark:text-gray-200">only with your explicit consent</strong>. You can opt out anytime.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Personalise your shopping experience (product recommendations based on browsing history).</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Detect and prevent fraudulent transactions, account abuse, and security threats.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Analyse site performance, conduct A/B tests, and improve our services.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Comply with legal, accounting, and regulatory obligations.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Respond to your support queries and complaints.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 5 */}
              <section id="sec-5" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">5</span>
                  Data Sharing & Third-Party Disclosure
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 ml-11">
                  <p>We <strong className="text-gray-800 dark:text-gray-200 font-semibold">never sell or rent</strong> your personal data. We share it only with trusted parties and only to the extent necessary:</p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {[
                      ["Payment Processors", "Razorpay Payments Pvt. Ltd. — for processing payments securely. Razorpay is PCI-DSS Level 1 certified and RBI regulated."],
                      ["Logistics Partners", "DHL, Professional Courier, BlueDart, and similar carriers — for shipping and delivery of orders. Only name, phone, and address are shared."],
                      ["Cloud & Hosting", "MongoDB Atlas (MongoDB Inc., USA) for database; Vercel (USA) for web hosting — under strict data processing agreements."],
                      ["Communication Tools", "SMS / email service providers for transactional notifications (e.g., Twilio, MSG91) — subject to applicable data protection agreements."],
                      ["Analytics", "Anonymised, aggregated analytics data may be shared with tools like Google Analytics."],
                      ["Legal Authorities", "If required by law, court order, or government directive — only the minimum required data will be disclosed."],
                      ["Business Transfers", "In the event of a merger, acquisition, or sale of assets, your data may be transferred. You will be notified before such transfer."],
                    ].map(([title, desc], i) => (
                      <div key={i} className="group p-5 rounded-xl bg-gray-50 dark:bg-surface-100 border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                        <p className="font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary-500 group-hover:scale-150 transition-transform" />
                          {title}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">{desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 6 */}
              <section id="sec-6" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">6</span>
                  International Data Transfers
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 ml-11">
                  <p>Some of our technology partners (e.g., MongoDB Atlas, Vercel) process data in data centres outside India. Where personal data is transferred internationally, we ensure:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span>The recipient country provides adequate protection, or</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span>Appropriate safeguards are in place (e.g., Standard Contractual Clauses for GDPR, Data Processing Agreements), or</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span>The transfer is necessary to perform a contract with you (e.g., processing your payment).</span>
                    </li>
                  </ul>
                  <p className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-300 font-medium">
                    All international transfers comply with the DPDP Act, 2023 and applicable RBI regulations.
                  </p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 7 */}
              <section id="sec-7" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">7</span>
                  Data Retention
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Data Type</th>
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Retention Period</th>
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Reason</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-transparent">
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"><td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Account data</td><td className="px-5 py-4">Duration of account + 3 years</td><td className="px-5 py-4 text-gray-500">Service delivery, legal claims</td></tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]"><td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Transaction / order records</td><td className="px-5 py-4">7 years</td><td className="px-5 py-4 text-gray-500">Tax laws (Income Tax Act, GST Act)</td></tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"><td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Payment data</td><td className="px-5 py-4">As required by Razorpay & RBI (typically 5 years)</td><td className="px-5 py-4 text-gray-500">RBI regulations, fraud prevention</td></tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]"><td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Communication / support logs</td><td className="px-5 py-4">3 years</td><td className="px-5 py-4 text-gray-500">Legal disputes, quality audit</td></tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors"><td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Marketing preferences</td><td className="px-5 py-4">Until you opt out or delete account</td><td className="px-5 py-4 text-gray-500">Consent management</td></tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]"><td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Cookie / analytics data</td><td className="px-5 py-4">Up to 13 months</td><td className="px-5 py-4 text-gray-500">Session management, analytics</td></tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 8 */}
              <section id="sec-8" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">8</span>
                  Data Security
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="grid sm:grid-cols-2 gap-x-6 gap-y-4">
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-1"><HiOutlineShieldCheck className="h-5 w-5"/></span>
                      <span>All data is stored on servers with <strong className="text-gray-800 dark:text-gray-200 font-semibold">AES-256 encryption at rest</strong> and transmitted using <strong className="text-gray-800 dark:text-gray-200 font-semibold">TLS 1.2+ (HTTPS)</strong>.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-1"><HiOutlineShieldCheck className="h-5 w-5"/></span>
                      <span>Passwords are hashed using bcrypt with salt rounds and never stored in plain text.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-1"><HiOutlineShieldCheck className="h-5 w-5"/></span>
                      <span>Access to personal data is restricted to authorised personnel on a need-to-know basis.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-1"><HiOutlineShieldCheck className="h-5 w-5"/></span>
                      <span>Regular security audits, penetration testing, and vulnerability assessments are conducted.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-1"><HiOutlineShieldCheck className="h-5 w-5"/></span>
                      <span>Authentication tokens (JWT) are short-lived and stored in HTTP-only secure cookies.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="text-emerald-500 mt-1"><HiOutlineShieldCheck className="h-5 w-5"/></span>
                      <span>In the event of a data breach, we will notify affected users and relevant authorities within <strong className="text-gray-800 dark:text-gray-200 font-semibold">72 hours</strong> as required under applicable law.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 9 */}
              <section id="sec-9" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">9</span>
                  Cookies & Tracking Technologies
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-4 ml-11">
                  <p>We use cookies and similar technologies (web beacons, local storage) for the following purposes:</p>
                  <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    <table className="w-full text-left text-sm whitespace-nowrap sm:whitespace-normal">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Cookie Type</th>
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Purpose</th>
                          <th className="px-5 py-4 font-semibold text-gray-900 dark:text-white">Can be disabled?</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 dark:divide-white/5 bg-white dark:bg-transparent">
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Strictly Necessary</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Login session, cart persistence, security tokens</td>
                          <td className="px-5 py-4"><span className="inline-flex items-center rounded-md bg-red-50 dark:bg-red-500/10 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-400 ring-1 ring-inset ring-red-600/10 dark:ring-red-500/20">No — required for the site to function</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Functional</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Language preference, dark/light mode, recently viewed products</td>
                          <td className="px-5 py-4"><span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/10 dark:ring-amber-500/20">Optional</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Analytics</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Page visits, bounce rate, user flows (anonymised)</td>
                          <td className="px-5 py-4"><span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/10 dark:ring-amber-500/20">Optional — disable in browser</span></td>
                        </tr>
                        <tr className="hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors bg-gray-50/50 dark:bg-white/[0.01]">
                          <td className="px-5 py-4 font-medium text-gray-900 dark:text-gray-200">Marketing</td>
                          <td className="px-5 py-4 text-gray-600 dark:text-gray-400">Personalised ads, retargeting (only with consent)</td>
                          <td className="px-5 py-4"><span className="inline-flex items-center rounded-md bg-amber-50 dark:bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400 ring-1 ring-inset ring-amber-600/10 dark:ring-amber-500/20">Optional — withdraw consent anytime</span></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  <p className="mt-4 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-100 dark:border-white/5">
                    You can manage cookie preferences through your browser settings at any time. Disabling certain cookies may affect the functionality of our Platform.
                  </p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 10 */}
              <section id="sec-10" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">10</span>
                  Your Rights as a Data Principal
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed space-y-6 ml-11">
                  <p>Under the DPDP Act 2023 (India) and where applicable, GDPR (EU/UK), you have the following rights regarding your personal data:</p>
                  <div className="grid sm:grid-cols-2 gap-4">
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
                      <div key={i} className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-surface-100 shadow-sm hover:shadow-md transition-shadow">
                        <p className="font-semibold text-gray-900 dark:text-white mb-1">{title}</p>
                        <p className="text-gray-600 dark:text-gray-400 text-sm">{desc}</p>
                      </div>
                    ))}
                  </div>
                  <p className="p-4 bg-primary-50 dark:bg-primary-900/10 rounded-xl border border-primary-100 dark:border-primary-900/20 text-primary-900 dark:text-primary-200 font-medium">
                    To exercise any right, email <span className="font-bold text-primary-600 dark:text-primary-400">privacy@amoha.in</span>. We will respond within <strong className="font-bold">30 days</strong> (or as required by law). We may verify your identity before processing your request.
                  </p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 11 */}
              <section id="sec-11" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">11</span>
                  Children's Privacy
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>Our Platform is not directed at children under <strong className="text-gray-800 dark:text-gray-200 font-semibold">18 years of age</strong>. We do not knowingly collect personal data from minors. If we become aware that we have inadvertently collected data from a child, we will delete it promptly. If you believe a child's data has been submitted to our Platform, please contact us at <span className="text-primary-600 dark:text-primary-400 font-medium">privacy@amoha.in</span> immediately.</p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 12 */}
              <section id="sec-12" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">12</span>
                  Third-Party Links & Services
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>Our Platform may contain links to third-party websites (e.g., brand websites, social media). We are <strong className="text-gray-800 dark:text-gray-200 font-semibold">not responsible</strong> for the privacy practices of those sites. We encourage you to review the privacy policies of any third-party site you visit.</p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 13 */}
              <section id="sec-13" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">13</span>
                  California Residents (CCPA)
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), including the right to know what personal information is collected, the right to delete it, the right to opt out of the sale of your data, and the right to non-discrimination. We do not sell personal information. To exercise CCPA rights, email <span className="text-primary-600 dark:text-primary-400 font-medium">privacy@amoha.in</span> with "CCPA Request" in the subject line.</p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 14 */}
              <section id="sec-14" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">14</span>
                  Changes to This Privacy Policy
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>We may update this Privacy Policy periodically to reflect changes in law, technology, or our services. Material changes will be announced via email and a prominent notice on the Platform at least <strong className="text-gray-800 dark:text-gray-200 font-semibold">15 days</strong> before they take effect. The "Last Updated" date at the top of this page will always reflect the most recent version.</p>
                </div>
              </section>

            </div>

            {/* Contact / DPO Box */}
            <div className="bg-gradient-to-br from-gray-900 to-slate-800 dark:from-surface-100 dark:to-surface-50 p-8 rounded-2xl shadow-lg relative overflow-hidden">
              <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
                <HiOutlineShieldCheck className="w-32 h-32 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white mb-6 relative z-10">Contact Our Data Protection Officer</h2>
              <div className="grid sm:grid-cols-2 gap-6 relative z-10">
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">DPO / Grievance Officer</p>
                    <p className="font-medium text-white">Mr. Amoha Kumar</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Email</p>
                    <p className="font-medium text-primary-400">privacy@amoha.in</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Phone</p>
                    <p className="font-medium text-white">+91 98765 43210</p>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-gray-400 mb-1">Address</p>
                    <p className="font-medium text-white">AMOHA Mobiles, MG Road, Mumbai, Maharashtra – 400 001, India</p>
                  </div>
                  <div className="pt-2">
                    <p className="text-xs text-gray-400 leading-relaxed">For EU/UK users: If you are not satisfied with our response, you have the right to lodge a complaint with your local Data Protection Supervisory Authority.</p>
                    <p className="text-xs text-gray-400 leading-relaxed mt-2">For Indian users: You may escalate unresolved complaints to the <strong className="text-white">Data Protection Board of India</strong> once operational under the DPDP Act, 2023.</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
