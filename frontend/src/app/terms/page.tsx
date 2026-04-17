import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description: 'AMOHA Mobiles terms of service – rules, guidelines, and conditions for using our online store.',
};

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-white/5 bg-gradient-to-b from-primary-50 to-white dark:from-primary-950 dark:to-surface-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="page-container relative py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Terms of <span className="text-primary-500 dark:text-primary-400">Service</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 1, 2026</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Please read these terms carefully before using our services.</p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14 max-w-4xl mx-auto">

        {/* Quick Nav */}
        <div className="glass-card p-4 sm:p-5 mb-8 rounded-xl">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Table of Contents</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 text-xs text-primary-500 dark:text-primary-400">
            {["Company Information","Definitions","Eligibility","Products & Services","Pricing & GST","Orders & Cancellation","Payment Methods","User Accounts","Repair Services","Intellectual Property","Prohibited Activities","Disclaimer & Liability","Indemnification","Dispute Resolution","Consumer Rights","Amendments","Contact Us"].map((t, i) => (
              <span key={i} className="hover:text-primary-400 cursor-pointer">{i + 1}. {t}</span>
            ))}
          </div>
        </div>

        <div className="space-y-8 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">

          {/* Preamble */}
          <div className="glass-card p-6 sm:p-8 rounded-xl border-l-4 border-primary-500">
            <p>These Terms of Service (&quot;<strong className="text-gray-700 dark:text-gray-200">Terms</strong>&quot;) constitute a legally binding agreement between you (&quot;<strong className="text-gray-700 dark:text-gray-200">User</strong>&quot;, &quot;you&quot;, &quot;your&quot;) and <strong className="text-gray-700 dark:text-gray-200">AMOHA Mobiles</strong> (&quot;Company&quot;, &quot;we&quot;, &quot;our&quot;, &quot;us&quot;) governing your access to and use of our website located at <span className="text-primary-500">www.amoha.in</span> and all related services offered by us. By accessing, browsing, or using our website, you acknowledge that you have read, understood, and agree to be bound by these Terms. If you do not agree, you must immediately discontinue use of our services.</p>
          </div>

          <div className="glass-card p-6 sm:p-8 rounded-xl space-y-7">

            {/* 1 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">1</span>
                Company Information
              </h2>
              <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 space-y-1.5">
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Legal Name:</span> AMOHA Mobiles</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Business Type:</span> Sole Proprietorship / Private Limited Company</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Registered Address:</span> MG Road, Mumbai, Maharashtra – 400 001, India</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">GST Registration No.:</span> 27AABCA1234Q1ZX</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span> legal@amoha.in</p>
                <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> +91 98765 43210</p>
              </div>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">2</span>
                Definitions
              </h2>
              <ul className="space-y-1.5">
                <li><span className="font-semibold text-gray-700 dark:text-gray-300">&quot;Platform&quot;</span> means the AMOHA Mobiles website, mobile application, and associated digital services.</li>
                <li><span className="font-semibold text-gray-700 dark:text-gray-300">&quot;Products&quot;</span> means smartphones, mobile accessories, wearables, and related items listed for sale.</li>
                <li><span className="font-semibold text-gray-700 dark:text-gray-300">&quot;Services&quot;</span> means mobile repair, servicing, data recovery, and other technical services offered.</li>
                <li><span className="font-semibold text-gray-700 dark:text-gray-300">&quot;Order&quot;</span> means a confirmed purchase request placed by you on the Platform.</li>
                <li><span className="font-semibold text-gray-700 dark:text-gray-300">&quot;Personal Data&quot;</span> means any information that can be used to identify you as an individual.</li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">3</span>
                Eligibility
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>You must be at least <strong className="text-gray-700 dark:text-gray-200">18 years of age</strong> or the age of majority in your jurisdiction to use our Platform.</li>
                <li>Minors (below 18) may use the Platform only under supervision of a parent or legal guardian who agrees to these Terms.</li>
                <li>By using the Platform, you represent that you have the legal authority to enter into binding contracts under applicable law.</li>
                <li>We reserve the right to refuse service to anyone for any reason at any time, subject to applicable law.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">4</span>
                Products &amp; Services
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>All products listed are subject to availability. We reserve the right to limit quantities without prior notice.</li>
                <li>Product images, specifications, and descriptions are provided for informational purposes. Actual products may vary slightly in colour due to display settings.</li>
                <li>We do not guarantee that product descriptions or other content on the Platform are accurate, complete, or error-free.</li>
                <li>We reserve the right to discontinue any product or service at any time.</li>
                <li>All smartphones sold are brand-authorised unless explicitly listed as &quot;refurbished&quot; or &quot;open box&quot;. Refurbished products will clearly mention their condition and applicable warranty.</li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">5</span>
                Pricing, Taxes &amp; GST
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>All prices are displayed in <strong className="text-gray-700 dark:text-gray-200">Indian Rupees (INR)</strong> and include applicable Goods and Services Tax (GST) as per the GST Act, 2017, unless stated otherwise.</li>
                <li>GST breakdown is available on your invoice, which is generated and sent to your registered email after every successful order.</li>
                <li>For international buyers, prices shown are INR. Applicable customs duties, import taxes, and foreign exchange fees are the sole responsibility of the buyer.</li>
                <li>We reserve the right to change prices at any time. The price at the time of order confirmation will be honoured.</li>
                <li>In the event of a pricing error, we will notify you and give you the option to cancel or confirm the order at the correct price.</li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">6</span>
                Orders &amp; Cancellation
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Placement of an order constitutes an offer to purchase. The contract is formed only upon our written confirmation (order confirmation email).</li>
                <li>We reserve the right to cancel any order due to stock unavailability, pricing errors, suspected fraud, or inability to deliver to your location.</li>
                <li>You may cancel an order before it is marked as <strong className="text-gray-700 dark:text-gray-200">&quot;Shipped&quot;</strong> through your account under My Orders.</li>
                <li>Orders cancelled after dispatch will be treated as returns and are subject to our Return Policy.</li>
                <li>Full refund will be issued for any order cancelled by us within 5–7 business days via the original payment method.</li>
              </ul>
            </section>

            {/* 7 - PAYMENT METHODS - MAJOR SECTION */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">7</span>
                Payment Methods
              </h2>
              <p className="mb-4">We accept a wide range of payment methods through our secure payment gateway partner <strong className="text-gray-700 dark:text-gray-200">Razorpay</strong>, which is compliant with RBI regulations, PCI-DSS Level 1, and ISO 27001 security standards. All transactions are encrypted using 256-bit SSL/TLS technology.</p>

              <div className="space-y-5">

                {/* Domestic */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">🇮🇳 Domestic Payment Methods (India)</h3>
                  <div className="grid gap-3 sm:grid-cols-2">

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">UPI (Unified Payments Interface)</p>
                      <p className="text-xs">Instant, real-time payments via:</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">PhonePe · Google Pay (GPay) · Paytm · BHIM · Amazon Pay · Cred Pay · iMobile Pay · SuperMoney · NAVI · Juspay</p>
                      <p className="mt-1.5 text-xs text-primary-500">Free · Instant · Refunds in 2–3 business days</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Credit Cards</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Visa · Mastercard · American Express · Diners Club · RuPay Credit Card · HDFC · ICICI · Axis · SBI · Kotak · Yes Bank</p>
                      <p className="mt-1.5 text-xs text-primary-500">3D Secure authentication applied on all transactions</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Debit Cards</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Visa Debit · Mastercard Debit · RuPay Debit · Maestro · All major Indian bank debit cards — SBI, HDFC, ICICI, Axis, PNB, Bank of Baroda, Canara Bank &amp; more</p>
                      <p className="mt-1.5 text-xs text-primary-500">OTP / 3D Secure authentication required</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Net Banking</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">50+ supported banks including HDFC · SBI · ICICI · Axis · Kotak Mahindra · Yes Bank · IndusInd · IDFC First · Federal Bank · UCO Bank · RBL Bank and more</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Mobile Wallets</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Paytm Wallet · PhonePe Wallet · Amazon Pay Wallet · Freecharge · Mobikwik · Airtel Money · JioMoney · Ola Money</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">EMI Options</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Credit Card EMI (3 / 6 / 9 / 12 / 18 / 24 months) · Debit Card EMI · Cardless EMI via ZestMoney · EarlySalary · Flexmoney</p>
                      <p className="mt-1.5 text-xs text-amber-500">Interest rates and eligibility depend on your bank or NBFC.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Buy Now, Pay Later (BNPL)</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">LazyPay · Simpl · ICICI PayLater · Kotak Pay Later · Ola Money Postpaid · Amazon Pay Later · FlexiPay</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Cash on Delivery (COD)</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Available for orders up to <strong>₹50,000</strong> within serviceable PIN codes. Exact cash required at delivery. COD availability varies by location and order value.</p>
                      <p className="mt-1.5 text-xs text-amber-500">A COD convenience fee of ₹49 may apply on orders below ₹999.</p>
                    </div>

                  </div>
                </div>

                {/* International */}
                <div>
                  <h3 className="text-sm font-bold text-gray-800 dark:text-gray-100 mb-3">🌍 International Payment Methods</h3>
                  <div className="grid gap-3 sm:grid-cols-2">

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">International Credit / Debit Cards</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Visa · Mastercard · American Express (Amex) · Diners Club International · UnionPay (China) · JCB (Japan)</p>
                      <p className="mt-1.5 text-xs text-primary-500">Charged in INR. Your bank converts to your currency at the prevailing forex rate.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Google Pay (International)</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Supported for international Google Pay users with valid card credentials linked.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Apple Pay / Samsung Pay</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Supported on compatible browsers and devices via saved card credentials.</p>
                    </div>

                    <div className="rounded-lg border border-gray-200 dark:border-white/10 p-3.5">
                      <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-1.5">Wire / Bank Transfer (B2B)</p>
                      <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Available for bulk / wholesale orders only. Contact us at <span className="text-primary-500">b2b@amoha.in</span> for SWIFT / IBAN details.</p>
                    </div>

                  </div>

                  <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-4">
                    <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Important Notice for International Buyers</p>
                    <ul className="text-xs text-amber-600 dark:text-amber-300 space-y-1 list-disc list-inside">
                      <li>All transactions are processed in INR. Currency conversion is handled by your bank or card network.</li>
                      <li>Your bank may charge additional foreign exchange / dynamic currency conversion (DCC) fees.</li>
                      <li>Some international cards may require additional authentication (3D Secure / OTP).</li>
                      <li>Import / customs duties for international shipments are the buyer&apos;s sole responsibility.</li>
                      <li>Razorpay processes international payments subject to RBI regulations and FEMA guidelines.</li>
                    </ul>
                  </div>
                </div>

                {/* Payment Security */}
                <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4">
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-200 mb-2">Payment Security</p>
                  <ul className="text-xs space-y-1 list-disc list-inside">
                    <li>We never store your full card number or CVV on our servers.</li>
                    <li>All payment data is tokenised and processed directly by Razorpay (PCI-DSS Level 1 certified).</li>
                    <li>All connections to the payment gateway use TLS 1.2+ encryption.</li>
                    <li>In case of failed transactions, any debited amount is automatically refunded within 5–7 business days.</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">8</span>
                User Accounts &amp; Security
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>You are responsible for maintaining the confidentiality of your login credentials and for all activities under your account.</li>
                <li>You agree to provide accurate, current, and complete information during registration and to keep it updated.</li>
                <li>Notify us immediately at <span className="text-primary-500">support@amoha.in</span> if you suspect any unauthorised access to your account.</li>
                <li>We are not liable for any loss resulting from unauthorised use of your account due to your failure to safeguard credentials.</li>
                <li>We reserve the right to suspend or terminate accounts that violate these Terms, engage in fraudulent activity, or are inactive for more than 24 months.</li>
                <li>One person may not maintain multiple accounts. Duplicate accounts may be merged or deleted.</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">9</span>
                Repair Services
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Repair estimates shared at intake are indicative only. Final charges will be confirmed after diagnosis and communicated before any work begins.</li>
                <li>You must back up your data before submitting a device for repair. We are <strong className="text-gray-700 dark:text-gray-200">not responsible for any data loss</strong> during servicing.</li>
                <li>Unclaimed devices after 60 days of service completion may be disposed of with prior written notice.</li>
                <li>A <strong className="text-gray-700 dark:text-gray-200">30-day warranty</strong> applies on the specific component repaired. This does not cover physical damage, water damage, or misuse post-repair.</li>
                <li>We use brand-authorised or OEM-equivalent parts. Use of specific branded parts will be confirmed at intake.</li>
                <li>Parts that are replaced remain the property of AMOHA Mobiles unless you request their return and pay applicable refurbishing fees.</li>
              </ul>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">10</span>
                Intellectual Property
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>All content on this Platform — including text, images, logos, trade marks, product descriptions, software, and design — is the exclusive intellectual property of AMOHA Mobiles or its licensors and is protected under the Copyright Act, 1957 and Trade Marks Act, 1999.</li>
                <li>You may not reproduce, distribute, modify, display, or create derivative works of any content without our prior written consent.</li>
                <li>Limited, non-exclusive, non-transferable license is granted for personal, non-commercial use of the Platform only.</li>
                <li>Third-party brand names and logos are the property of their respective owners and are used for product identification only.</li>
              </ul>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">11</span>
                Prohibited Activities
              </h2>
              <p className="mb-2">You agree not to engage in any of the following:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Using the Platform for any unlawful purpose or in violation of these Terms.</li>
                <li>Placing fraudulent orders, providing false personal information, or impersonating any person.</li>
                <li>Attempting to gain unauthorised access to our systems, databases, or other user accounts.</li>
                <li>Using automated bots, scrapers, or crawlers to extract data from the Platform without permission.</li>
                <li>Uploading or transmitting viruses, malware, or any other malicious code.</li>
                <li>Engaging in price manipulation, coupon abuse, or any form of gaming our promotions.</li>
                <li>Reselling products purchased from our Platform without our explicit written consent.</li>
                <li>Posting defamatory, misleading, or harmful content in reviews or communications.</li>
              </ul>
              <p className="mt-2">Violation of this section may result in immediate account termination and legal action where warranted.</p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">12</span>
                Disclaimer of Warranties &amp; Limitation of Liability
              </h2>
              <p className="mb-2">The Platform is provided on an &quot;AS IS&quot; and &quot;AS AVAILABLE&quot; basis without warranties of any kind, either express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, or non-infringement.</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>We do not warrant that the Platform will be uninterrupted, error-free, or free of viruses or harmful components.</li>
                <li>To the maximum extent permitted by law, our aggregate liability for any claim arising out of or related to these Terms shall not exceed the amount paid by you for the specific transaction giving rise to such claim.</li>
                <li>We shall not be liable for any indirect, incidental, consequential, punitive, or special damages, including loss of profits, data, or business opportunities.</li>
                <li>Nothing in these Terms limits liability for death or personal injury caused by our negligence, or any other liability that cannot be limited under applicable Indian law.</li>
              </ul>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">13</span>
                Indemnification
              </h2>
              <p>You agree to indemnify, defend, and hold harmless AMOHA Mobiles, its directors, officers, employees, agents, and partners from and against any claims, liabilities, damages, losses, and expenses (including reasonable legal fees) arising from: (a) your use of the Platform; (b) your violation of these Terms; (c) your violation of any third-party rights; or (d) any content you submit to the Platform.</p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">14</span>
                Dispute Resolution &amp; Arbitration
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li><strong className="text-gray-700 dark:text-gray-200">Step 1 – Informal Resolution:</strong> Before initiating any formal legal proceedings, you agree to first contact us at <span className="text-primary-500">legal@amoha.in</span> to attempt to resolve the dispute amicably within <strong>30 days</strong>.</li>
                <li><strong className="text-gray-700 dark:text-gray-200">Step 2 – Consumer Forum:</strong> If informal resolution fails, disputes relating to consumer rights may be escalated to the appropriate Consumer Disputes Redressal Commission under the Consumer Protection Act, 2019.</li>
                <li><strong className="text-gray-700 dark:text-gray-200">Step 3 – Arbitration:</strong> For commercial disputes, both parties agree to binding arbitration under the Arbitration and Conciliation Act, 1996. The arbitration seat shall be Mumbai, Maharashtra, India. The arbitration shall be conducted in English.</li>
              </ul>
            </section>

            {/* 15 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">15</span>
                Governing Law &amp; Jurisdiction
              </h2>
              <p>These Terms are governed by and construed in accordance with the laws of the <strong className="text-gray-700 dark:text-gray-200">Republic of India</strong>, including the Indian Contract Act, 1872, the Consumer Protection Act, 2019, the Information Technology Act, 2000, and the Sale of Goods Act, 1930. Subject to the arbitration clause above, the courts of competent jurisdiction in <strong className="text-gray-700 dark:text-gray-200">Mumbai, Maharashtra</strong> shall have exclusive jurisdiction over any dispute arising out of these Terms.</p>
            </section>

            {/* 16 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">16</span>
                Your Consumer Rights (India)
              </h2>
              <p className="mb-2">Under the <strong className="text-gray-700 dark:text-gray-200">Consumer Protection Act, 2019</strong>, you have the right to:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Be protected against unfair trade practices and misleading advertisements.</li>
                <li>Seek redressal against defective goods or deficient services.</li>
                <li>File a complaint with the National Consumer Helpline (NCH) at <strong className="text-gray-700 dark:text-gray-200">1800-11-4000</strong> (Toll Free) or via <span className="text-primary-500">consumerhelpline.gov.in</span>.</li>
                <li>File disputes on the Consumer Courts e-filing portal: <span className="text-primary-500">edaakhil.nic.in</span>.</li>
                <li>Access our internal Grievance Redressal Mechanism — see Section 17 (Contact Us) below.</li>
              </ul>
            </section>

            {/* 17 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">17</span>
                Amendments to These Terms
              </h2>
              <p>We reserve the right to modify these Terms at any time. Significant changes will be communicated via email or a prominent notice on the Platform at least <strong className="text-gray-700 dark:text-gray-200">15 days</strong> before they take effect. Your continued use of the Platform after changes take effect constitutes acceptance of the updated Terms.</p>
            </section>

            {/* 18 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">18</span>
                Severability &amp; Waiver
              </h2>
              <p>If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect. Our failure to enforce any right or provision of these Terms shall not constitute a waiver of that right or provision.</p>
            </section>

          </div>
        </div>

        {/* Contact Box */}
        <div className="mt-8 glass-card p-6 sm:p-8 rounded-xl">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Contact Us &amp; Grievance Officer</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">For any questions, complaints, or legal notices relating to these Terms, please contact our Grievance Officer as required under the Consumer Protection (E-Commerce) Rules, 2020 and the Information Technology Act, 2000:</p>
          <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 space-y-2 text-sm">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Grievance Officer:</span> <span className="text-gray-600 dark:text-gray-400">Mr. Amoha Kumar</span></p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span> <span className="text-primary-500">legal@amoha.in</span></p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> <span className="text-primary-500">+91 98765 43210</span> (Mon–Sat, 10 AM – 6 PM IST)</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Address:</span> AMOHA Mobiles, MG Road, Mumbai, Maharashtra – 400 001, India</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">We will acknowledge your complaint within 48 hours and resolve it within 30 days as required by law.</p>
          </div>
        </div>

      </div>
    </div>
  );
}
