'use client';

import { useState, useEffect, useRef } from 'react';
import { HiOutlineShieldCheck, HiChevronDown, HiOutlineLockClosed } from 'react-icons/hi';

const headings = [
  { id: 'sec-1', title: 'Company Information' },
  { id: 'sec-2', title: 'Definitions' },
  { id: 'sec-3', title: 'Eligibility' },
  { id: 'sec-4', title: 'Products & Services' },
  { id: 'sec-5', title: 'Pricing, Taxes & GST' },
  { id: 'sec-6', title: 'Orders & Cancellation' },
  { id: 'sec-7', title: 'Payment Methods' },
  { id: 'sec-8', title: 'User Accounts & Security' },
  { id: 'sec-9', title: 'Repair Services' },
  { id: 'sec-10', title: 'Intellectual Property' },
  { id: 'sec-11', title: 'Prohibited Activities' },
  { id: 'sec-12', title: 'Disclaimer of Warranties & Limitation of Liability' },
  { id: 'sec-13', title: 'Indemnification' },
  { id: 'sec-14', title: 'Dispute Resolution & Arbitration' },
  { id: 'sec-15', title: 'Governing Law & Jurisdiction' },
  { id: 'sec-16', title: 'Your Consumer Rights (India)' },
  { id: 'sec-17', title: 'Amendments to These Terms' },
  { id: 'sec-18', title: 'Severability & Waiver' },
];

export default function TermsOfServiceClient() {
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
          <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            Terms of <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-500 to-indigo-500">Service</span>
          </h1>
          <p className="mt-6 text-sm font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-white/5 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
            <HiOutlineLockClosed className="h-4 w-4" />
            Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 1, 2026
          </p>
          <p className="mt-4 text-base text-gray-600 dark:text-gray-400 max-w-2xl">
            Please read these terms carefully before using our services.
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

            {/* Preamble */}
            <div className="bg-white dark:bg-surface-50 p-6 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm relative overflow-hidden group hover:shadow-md transition-shadow">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400">
                  <HiOutlineShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    These Terms of Service (&quot;<strong className="text-gray-800 dark:text-gray-200 font-semibold">Terms</strong>&quot;) constitute a legally binding agreement between you (&quot;<strong className="text-gray-800 dark:text-gray-200 font-semibold">User</strong>&quot;, &quot;you&quot;, &quot;your&quot;) and <strong className="text-gray-800 dark:text-gray-200 font-semibold">AMOHA Mobiles</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) governing your access to and use of our website located at <span className="text-primary-600 dark:text-primary-400 font-medium">www.amoha.in</span> and all related services offered by us. By accessing, browsing, or using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must immediately discontinue use of our services.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-surface-50 p-6 sm:p-10 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm space-y-12">
              
              {/* 1 */}
              <section id="sec-1" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">1</span>
                  Company Information
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <div className="rounded-xl bg-gray-50 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 p-5 grid sm:grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Legal Name</p>
                      <p className="font-medium text-gray-900 dark:text-white">AMOHA Mobiles</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Business Type</p>
                      <p className="font-medium text-gray-900 dark:text-white">Sole Proprietorship / Private Limited Company</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Registered Address</p>
                      <p className="font-medium text-gray-900 dark:text-white">MG Road, Mumbai, Maharashtra – 400 001, India</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">GST Registration No.</p>
                      <p className="font-medium text-gray-900 dark:text-white">27AABCA1234Q1ZX</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
                      <p className="font-medium text-primary-600 dark:text-primary-400">legal@amoha.in</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                      <p className="font-medium text-gray-900 dark:text-white">+91 98765 43210</p>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 2 */}
              <section id="sec-2" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">2</span>
                  Definitions
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">&quot;Platform&quot;</strong> means the AMOHA Mobiles website, mobile application, and associated digital services.</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">&quot;Products&quot;</strong> means smartphones, mobile accessories, wearables, and related items listed for sale.</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">&quot;Services&quot;</strong> means mobile repair, servicing, data recovery, and other technical services offered.</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">&quot;Order&quot;</strong> means a confirmed purchase request placed by you on the Platform.</span>
                    </li>
                    <li className="flex items-start gap-2 before:content-[''] before:w-1.5 before:h-1.5 before:rounded-full before:bg-primary-500 before:mt-2 before:mr-2">
                      <span><strong className="text-gray-800 dark:text-gray-200 font-semibold">&quot;Personal Data&quot;</strong> means any information that can be used to identify you as an individual.</span>
                    </li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 3 */}
              <section id="sec-3" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">3</span>
                  Eligibility
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> You must be at least <strong className="text-gray-800 dark:text-gray-200 font-semibold">18 years of age</strong> or the age of majority in your jurisdiction to use our Platform.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Minors (below 18) may use the Platform only under supervision of a parent or legal guardian who agrees to these Terms.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> By using the Platform, you represent that you have the legal authority to enter into binding contracts under applicable law.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We reserve the right to refuse service to anyone for any reason at any time, subject to applicable law.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 4 */}
              <section id="sec-4" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">4</span>
                  Products & Services
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> All products listed are subject to availability. We reserve the right to limit quantities without prior notice.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Product images, specifications, and descriptions are provided for informational purposes. Actual products may vary slightly in colour due to display settings.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We do not guarantee that product descriptions or other content on the Platform are accurate, complete, or error-free.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We reserve the right to discontinue any product or service at any time.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> All smartphones sold are brand-authorised unless explicitly listed as &quot;refurbished&quot; or &quot;open box&quot;. Refurbished products will clearly mention their condition and applicable warranty.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 5 */}
              <section id="sec-5" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">5</span>
                  Pricing, Taxes & GST
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> All prices are displayed in <strong className="text-gray-800 dark:text-gray-200 font-semibold">Indian Rupees (INR)</strong> and include applicable Goods and Services Tax (GST) as per the GST Act, 2017, unless stated otherwise.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> GST breakdown is available on your invoice, which is generated and sent to your registered email after every successful order.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> For international buyers, prices shown are INR. Applicable customs duties, import taxes, and foreign exchange fees are the sole responsibility of the buyer.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We reserve the right to change prices at any time. The price at the time of order confirmation will be honoured.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> In the event of a pricing error, we will notify you and give you the option to cancel or confirm the order at the correct price.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 6 */}
              <section id="sec-6" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">6</span>
                  Orders & Cancellation
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Placement of an order constitutes an offer to purchase. The contract is formed only upon our written confirmation (order confirmation email).</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We reserve the right to cancel any order due to stock unavailability, pricing errors, suspected fraud, or inability to deliver to your location.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> You may cancel an order before it is marked as <strong className="text-gray-800 dark:text-gray-200 font-semibold">&quot;Shipped&quot;</strong> through your account under My Orders.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Orders cancelled after dispatch will be treated as returns and are subject to our Return Policy.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Full refund will be issued for any order cancelled by us within 5–7 business days via the original payment method.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 7 */}
              <section id="sec-7" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">7</span>
                  Payment Methods
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11 space-y-8">
                  <p>We accept a wide range of payment methods through our secure payment gateway partner <strong className="text-gray-800 dark:text-gray-200 font-semibold">Razorpay</strong>, which is compliant with RBI regulations, PCI-DSS Level 1, and ISO 27001 security standards. All transactions are encrypted using 256-bit SSL/TLS technology.</p>

                  <div className="space-y-6">
                    <div>
                      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">🇮🇳 Domestic Payment Methods (India)</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">UPI (Unified Payments Interface)</p>
                          <p>Instant, real-time payments via:</p>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">PhonePe · Google Pay (GPay) · Paytm · BHIM · Amazon Pay · Cred Pay · iMobile Pay · SuperMoney · NAVI · Juspay</p>
                          <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">Free · Instant · Refunds in 2–3 business days</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Credit Cards</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Visa · Mastercard · American Express · Diners Club · RuPay Credit Card · HDFC · ICICI · Axis · SBI · Kotak · Yes Bank</p>
                          <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">3D Secure authentication applied on all transactions</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Debit Cards</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Visa Debit · Mastercard Debit · RuPay Debit · Maestro · All major Indian bank debit cards — SBI, HDFC, ICICI, Axis, PNB, Bank of Baroda, Canara Bank & more</p>
                          <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">OTP / 3D Secure authentication required</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Net Banking</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">50+ supported banks including HDFC · SBI · ICICI · Axis · Kotak Mahindra · Yes Bank · IndusInd · IDFC First · Federal Bank · UCO Bank · RBL Bank and more</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Mobile Wallets</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Paytm Wallet · PhonePe Wallet · Amazon Pay Wallet · Freecharge · Mobikwik · Airtel Money · JioMoney · Ola Money</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">EMI Options</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Credit Card EMI (3 / 6 / 9 / 12 / 18 / 24 months) · Debit Card EMI · Cardless EMI via ZestMoney · EarlySalary · Flexmoney</p>
                          <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">Interest rates and eligibility depend on your bank or NBFC.</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Buy Now, Pay Later (BNPL)</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">LazyPay · Simpl · ICICI PayLater · Kotak Pay Later · Ola Money Postpaid · Amazon Pay Later · FlexiPay</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Cash on Delivery (COD)</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Available for orders up to <strong>₹50,000</strong> within serviceable PIN codes. Exact cash required at delivery. COD availability varies by location and order value.</p>
                          <p className="mt-2 text-xs font-semibold text-amber-600 dark:text-amber-400">A COD convenience fee of ₹49 may apply on orders below ₹999.</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-gray-800 dark:text-gray-100 mb-4">🌍 International Payment Methods</h3>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">International Credit / Debit Cards</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Visa · Mastercard · American Express (Amex) · Diners Club International · UnionPay (China) · JCB (Japan)</p>
                          <p className="mt-2 text-xs font-semibold text-primary-600 dark:text-primary-400">Charged in INR. Your bank converts to your currency at the prevailing forex rate.</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Google Pay (International)</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Supported for international Google Pay users with valid card credentials linked.</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Apple Pay / Samsung Pay</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Supported on compatible browsers and devices via saved card credentials.</p>
                        </div>
                        <div className="rounded-xl border border-gray-200 dark:border-white/10 p-5 bg-white dark:bg-surface-50 shadow-sm hover:shadow-md hover:border-primary-200 dark:hover:border-primary-900/50 transition-all">
                          <p className="font-bold text-gray-900 dark:text-white mb-2">Wire / Bank Transfer (B2B)</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Available for bulk / wholesale orders only. Contact us at <span className="font-semibold text-primary-600 dark:text-primary-400">b2b@amoha.in</span> for SWIFT / IBAN details.</p>
                        </div>
                      </div>

                      <div className="mt-6 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-5">
                        <p className="font-bold text-amber-800 dark:text-amber-400 mb-2">Important Notice for International Buyers</p>
                        <ul className="text-sm text-amber-700 dark:text-amber-300 space-y-2 list-disc list-inside">
                          <li>All transactions are processed in INR. Currency conversion is handled by your bank or card network.</li>
                          <li>Your bank may charge additional foreign exchange / dynamic currency conversion (DCC) fees.</li>
                          <li>Some international cards may require additional authentication (3D Secure / OTP).</li>
                          <li>Import / customs duties for international shipments are the buyer's sole responsibility.</li>
                          <li>Razorpay processes international payments subject to RBI regulations and FEMA guidelines.</li>
                        </ul>
                      </div>
                    </div>

                    <div className="rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-5">
                      <p className="font-bold text-gray-900 dark:text-white mb-3">Payment Security</p>
                      <ul className="text-sm space-y-2 list-disc list-inside text-gray-600 dark:text-gray-400">
                        <li>We never store your full card number or CVV on our servers.</li>
                        <li>All payment data is tokenised and processed directly by Razorpay (PCI-DSS Level 1 certified).</li>
                        <li>All connections to the payment gateway use TLS 1.2+ encryption.</li>
                        <li>In case of failed transactions, any debited amount is automatically refunded within 5–7 business days.</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 8 */}
              <section id="sec-8" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">8</span>
                  User Accounts & Security
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> You agree to provide accurate, current, and complete information during registration and to keep it updated.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Notify us immediately at <span className="font-medium text-primary-600 dark:text-primary-400">support@amoha.in</span> if you suspect any unauthorised access to your account.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We are not liable for any loss resulting from unauthorised use of your account due to your failure to safeguard credentials.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or are inactive for more than 24 months.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> One person may not maintain multiple accounts. Duplicate accounts may be merged or deleted.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 9 */}
              <section id="sec-9" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">9</span>
                  Repair Services
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Repair estimates shared at intake are indicative only. Final charges will be confirmed after diagnosis and communicated before any work begins.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> You must back up your data before submitting a device for repair. We are <strong className="text-gray-800 dark:text-gray-200 font-semibold">not responsible for any data loss</strong> during servicing.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Unclaimed devices after 60 days of service completion may be disposed of with prior written notice.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> A <strong className="text-gray-800 dark:text-gray-200 font-semibold">30-day warranty</strong> applies on the specific component repaired. This does not cover physical damage, water damage, or misuse post-repair.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We use brand-authorised or OEM-equivalent parts. Use of specific branded parts will be confirmed at intake.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Parts that are replaced remain the property of AMOHA Mobiles unless you request their return and pay applicable refurbishing fees.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 10 */}
              <section id="sec-10" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">10</span>
                  Intellectual Property
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> All content on this Platform — including text, images, logos, trade marks, product descriptions, software, and design — is the exclusive intellectual property of AMOHA Mobiles or its licensors and is protected under the Copyright Act, 1957 and Trade Marks Act, 1999.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> You may not reproduce, distribute, modify, display, or create derivative works of any content without our prior written consent.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Limited, non-exclusive, non-transferable license is granted for personal, non-commercial use of the Platform only.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Third-party brand names and logos are the property of their respective owners and are used for product identification only.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 11 */}
              <section id="sec-11" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">11</span>
                  Prohibited Activities
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p className="mb-4">You agree not to engage in any of the following:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Using the Platform for any unlawful purpose or in violation of these Terms.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Placing fraudulent orders, providing false personal information, or impersonating any person.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Attempting to gain unauthorised access to our systems, databases, or other user accounts.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Using automated bots, scrapers, or crawlers to extract data from the Platform without permission.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Uploading or transmitting viruses, malware, or any other malicious code.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Engaging in price manipulation, coupon abuse, or any form of gaming our promotions.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Reselling products purchased from our Platform without our explicit written consent.</li>
                    <li className="flex items-start gap-2"><span className="text-red-500 mt-1">•</span> Posting defamatory, misleading, or harmful content in reviews or communications.</li>
                  </ul>
                  <p className="mt-6 p-4 bg-gray-50 dark:bg-white/[0.03] rounded-lg border border-gray-100 dark:border-white/5 text-gray-800 dark:text-gray-300 font-medium">
                    Violation of this section may result in immediate account termination and legal action where warranted.
                  </p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 12 */}
              <section id="sec-12" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">12</span>
                  Disclaimer of Warranties & Limitation of Liability
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p className="mb-4">The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or harmful components.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> To the maximum extent permitted by law, our aggregate liability for any claim arising out of or related to these Terms shall not exceed the amount paid by you for the specific transaction giving rise to such claim.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> We shall not be liable for any indirect, incidental, consequential, punitive, or special damages, including loss of profits, data, or business opportunities.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Nothing in these Terms limits liability for death or personal injury caused by our negligence, or any other liability that cannot be limited under applicable Indian law.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 13 */}
              <section id="sec-13" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">13</span>
                  Indemnification
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>You agree to indemnify, defend, and hold harmless AMOHA Mobiles, its directors, officers, employees, agents, and partners from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any content you submit to the Platform.</p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 14 */}
              <section id="sec-14" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">14</span>
                  Dispute Resolution & Arbitration
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <ul className="space-y-4">
                    <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-surface-100">
                      <strong className="text-gray-900 dark:text-white block mb-1">Step 1 – Informal Resolution:</strong> 
                      Before initiating any formal legal proceedings, you agree to first contact us at <span className="text-primary-600 dark:text-primary-400 font-medium">legal@amoha.in</span> to attempt to resolve the dispute amicably within <strong>30 days</strong>.
                    </li>
                    <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-surface-100">
                      <strong className="text-gray-900 dark:text-white block mb-1">Step 2 – Consumer Forum:</strong> 
                      If informal resolution fails, disputes relating to consumer rights may be escalated to the appropriate Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.
                    </li>
                    <li className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-surface-100">
                      <strong className="text-gray-900 dark:text-white block mb-1">Step 3 – Arbitration:</strong> 
                      For commercial disputes, both parties agree to binding arbitration under the Arbitration and Conciliation Act, 1996. The arbitration seat shall be Mumbai, Maharashtra, India. The arbitration shall be conducted in English.
                    </li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 15 */}
              <section id="sec-15" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">15</span>
                  Governing Law & Jurisdiction
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>These Terms are governed by and construed in accordance with the laws of the <strong className="text-gray-800 dark:text-gray-200 font-semibold">Republic of India</strong>, including the Indian Contract Act, 1872, the Consumer Protection Act, 2019, the Information Technology Act, 2000, and the Sale of Goods Act, 1930. Subject to the arbitration clause above, the courts of competent jurisdiction in <strong className="text-gray-800 dark:text-gray-200 font-semibold">Mumbai, Maharashtra</strong> shall have exclusive jurisdiction over any dispute arising out of these Terms.</p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 16 */}
              <section id="sec-16" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">16</span>
                  Your Consumer Rights (India)
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p className="mb-4">Under the <strong className="text-gray-800 dark:text-gray-200 font-semibold">Consumer Protection Act, 2019</strong>, you have the right to:</p>
                  <ul className="space-y-3">
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Be protected against unfair trade practices and misleading advertisements.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Seek redressal against defective goods or deficient services.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> File a complaint with the National Consumer Helpline (NCH) at <strong className="text-gray-800 dark:text-gray-200 font-semibold">1800-11-4000</strong> (Toll Free) or via <span className="font-medium text-primary-600 dark:text-primary-400">consumerhelpline.gov.in</span>.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> File disputes on the Consumer Courts e-filing portal: <span className="font-medium text-primary-600 dark:text-primary-400">edaakhil.nic.in</span>.</li>
                    <li className="flex items-start gap-2"><span className="text-primary-500 mt-1">•</span> Access our internal Grievance Redressal Mechanism — see Section 17 (Contact Us) below.</li>
                  </ul>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 17 */}
              <section id="sec-17" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">17</span>
                  Amendments to These Terms
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>We reserve the right to modify these Terms at any time. Significant changes will be communicated via email or a prominent notice on the Platform at least <strong className="text-gray-800 dark:text-gray-200 font-semibold">15 days</strong> before they take effect. Your continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.</p>
                </div>
              </section>

              <hr className="border-gray-100 dark:border-white/5" />

              {/* 18 */}
              <section id="sec-18" className="scroll-mt-28">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-50 dark:bg-primary-500/10 text-primary-600 dark:text-primary-400 text-sm font-bold">18</span>
                  Severability & Waiver
                </h2>
                <div className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed ml-11">
                  <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</p>
                </div>
              </section>

            </div>

            {/* Contact Box */}
            <div className="bg-white dark:bg-surface-50 p-6 sm:p-10 rounded-2xl border border-gray-200 dark:border-white/10 shadow-sm mt-8">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Contact Us & Grievance Officer</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">For any questions, complaints, or legal notices relating to these Terms, please contact our Grievance Officer as required under the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000:</p>
              
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-100 border border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Grievance Officer</p>
                  <p className="font-medium text-gray-900 dark:text-white">Mr. Amoha Kumar</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-100 border border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Email</p>
                  <p className="font-medium text-primary-600 dark:text-primary-400">legal@amoha.in</p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-100 border border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">+91 98765 43210 <span className="text-sm font-normal text-gray-500 ml-1">(Mon–Sat, 10 AM – 6 PM IST)</span></p>
                </div>
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-surface-100 border border-gray-100 dark:border-white/5">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">AMOHA Mobiles, MG Road, Mumbai, Maharashtra – 400 001, India</p>
                </div>
              </div>
              <p className="mt-6 text-sm text-gray-500 dark:text-gray-400 font-medium">We will acknowledge your complaint within 48 hours and resolve it within 30 days as required by law.</p>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
