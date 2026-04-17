import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Return & Refund Policy',
  description: 'AMOHA Mobiles return and refund policy – 7-day easy returns, replacement policy, and refund process.',
};

export default function ReturnPolicyPage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-white/5 bg-gradient-to-b from-primary-50 to-white dark:from-primary-950 dark:to-surface-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="page-container relative py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Return &amp; Refund <span className="text-primary-500 dark:text-primary-400">Policy</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 1, 2026</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Governed by the Consumer Protection Act, 2019 &amp; Consumer Protection (E-Commerce) Rules, 2020</p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14 max-w-4xl mx-auto">

        {/* At-a-glance summary */}
        <div className="glass-card p-5 sm:p-6 mb-8 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Quick Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              ["7 Days", "Return window from delivery date"],
              ["5–7 Days", "Refund processing time"],
              ["48 Hours", "Report damaged / defective items"],
              ["30 Days", "Repair service warranty"],
            ].map(([val, label]) => (
              <div key={val} className="rounded-xl bg-primary-500/10 p-4">
                <p className="text-xl font-bold text-primary-500">{val}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          <div className="glass-card p-6 sm:p-8 rounded-xl space-y-7">

            {/* 1 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">1</span>
                Return Eligibility
              </h2>
              <p className="mb-3">You may request a return within <strong className="text-gray-700 dark:text-gray-200">7 calendar days</strong> of the delivery date, subject to the conditions below:</p>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Condition</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Eligible for Return?</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5 text-xs">
                    <tr><td className="px-4 py-2.5">Item received is defective or not working</td><td className="px-4 py-2.5 text-emerald-500 font-semibold">✓ Yes — Full Return / Replacement</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Item not as described / wrong item shipped</td><td className="px-4 py-2.5 text-emerald-500 font-semibold">✓ Yes — Full Return + Shipping Refund</td></tr>
                    <tr><td className="px-4 py-2.5">Item in original, sealed, unused condition (change of mind)</td><td className="px-4 py-2.5 text-emerald-500 font-semibold">✓ Yes — Return within 7 days</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Item opened but unused, original packaging intact</td><td className="px-4 py-2.5 text-amber-500 font-semibold">⚠ Subject to inspection</td></tr>
                    <tr><td className="px-4 py-2.5">Item physically damaged by customer after delivery</td><td className="px-4 py-2.5 text-red-500 font-semibold">✗ Not eligible</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Return requested after 7 days of delivery</td><td className="px-4 py-2.5 text-red-500 font-semibold">✗ Not eligible (unless manufacturer warranty applies)</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">2</span>
                Non-Returnable Items
              </h2>
              <p className="mb-2">The following items <strong className="text-gray-700 dark:text-gray-200">cannot be returned</strong> for hygiene, safety, or licensing reasons:</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  "Nano / Micro / SIM card adapters (once opened)",
                  "Screen protectors and tempered glass (once applied to a device)",
                  "Earphones / In-ear headphones (once opened, for hygiene reasons)",
                  "Batteries (once installed in a device)",
                  "Software / Digital licenses or vouchers (non-transferable once delivered)",
                  "Custom-engraved or personalised items",
                  "Products with tampered, removed, or damaged IMEI stickers",
                  "Products returned without original box, accessories, or documentation",
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 p-2.5">
                    <span className="text-red-500 font-bold text-xs mt-0.5">✗</span>
                    <span className="text-xs text-red-700 dark:text-red-300">{item}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">3</span>
                Return Conditions
              </h2>
              <p className="mb-2">All returned items must meet the following conditions to be accepted:</p>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Item must be returned in its <strong className="text-gray-700 dark:text-gray-200">original manufacturer packaging</strong> with all accessories, chargers, cables, manuals, and warranty cards intact.</li>
                <li>The device must not have been <strong className="text-gray-700 dark:text-gray-200">activated, registered, or linked to any account</strong> (e.g., Google, Apple ID, Samsung account).</li>
                <li>All serial numbers, IMEI stickers, and manufacturer seals must be intact and unaltered.</li>
                <li>A valid <strong className="text-gray-700 dark:text-gray-200">proof of purchase</strong> (order ID or invoice) must be provided with the return.</li>
                <li>For defective / damage claims, clear <strong className="text-gray-700 dark:text-gray-200">photographs or video evidence</strong> must be uploaded when initiating the return.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">4</span>
                How to Initiate a Return
              </h2>
              <div className="space-y-3">
                {[
                  ["Step 1 — Log in &amp; Go to My Orders", "Sign in to your AMOHA account. Go to My Orders and select the order containing the item you wish to return."],
                  ["Step 2 — Select Return Reason", "Choose the appropriate return reason and upload supporting photos/video if the item is defective or damaged."],
                  ["Step 3 — Approval", "Our team will review your request within 24–48 hours and approve or reject it with a reason."],
                  ["Step 4 — Pickup or Drop-off", "For approved returns: we will schedule a free pickup from your delivery address. Alternatively, you may drop the item at our store."],
                  ["Step 5 — Inspection &amp; Refund", "Once we receive and inspect the item (1–2 business days), your refund will be initiated."],
                ].map(([step, desc], i) => (
                  <div key={i} className="flex gap-3 rounded-lg bg-gray-50 dark:bg-white/[0.02] border border-gray-200 dark:border-white/10 p-3.5">
                    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">{i + 1}</span>
                    <div>
                      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200" dangerouslySetInnerHTML={{ __html: step }} />
                      <p className="mt-0.5 text-xs">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">5</span>
                Refund Process &amp; Timelines
              </h2>
              <p className="mb-3">Refunds are initiated within <strong className="text-gray-700 dark:text-gray-200">1–2 business days</strong> of receiving and inspecting the returned item. The time for the amount to reflect in your account depends on your payment method:</p>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Payment Method</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Refund Credited To</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Estimated Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    <tr><td className="px-4 py-2.5">UPI (GPay, PhonePe, Paytm)</td><td className="px-4 py-2.5">Original UPI VPA / account</td><td className="px-4 py-2.5 text-emerald-500 font-medium">2–3 business days</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Credit Card</td><td className="px-4 py-2.5">Credit card statement credit</td><td className="px-4 py-2.5 text-emerald-500 font-medium">5–7 business days</td></tr>
                    <tr><td className="px-4 py-2.5">Debit Card</td><td className="px-4 py-2.5">Bank account linked to debit card</td><td className="px-4 py-2.5 text-emerald-500 font-medium">5–7 business days</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Net Banking</td><td className="px-4 py-2.5">Original bank account</td><td className="px-4 py-2.5 text-emerald-500 font-medium">3–5 business days</td></tr>
                    <tr><td className="px-4 py-2.5">Mobile Wallets (Paytm, PhonePe)</td><td className="px-4 py-2.5">Wallet balance</td><td className="px-4 py-2.5 text-emerald-500 font-medium">1–3 business days</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">BNPL / EMI (LazyPay, ZestMoney)</td><td className="px-4 py-2.5">Reduced outstanding balance with provider</td><td className="px-4 py-2.5 text-amber-500 font-medium">5–10 business days</td></tr>
                    <tr><td className="px-4 py-2.5">Cash on Delivery (COD)</td><td className="px-4 py-2.5">NEFT / IMPS to your bank account</td><td className="px-4 py-2.5 text-amber-500 font-medium">5–7 business days</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">International Credit / Debit Cards</td><td className="px-4 py-2.5">Original card (in INR; your bank applies forex conversion)</td><td className="px-4 py-2.5 text-amber-500 font-medium">7–14 business days</td></tr>
                  </tbody>
                </table>
              </div>
              <div className="mt-4 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 p-3.5 text-xs text-amber-700 dark:text-amber-300">
                <p className="font-semibold mb-1">Important Notes on Refunds</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Original shipping charges are non-refundable unless the return is due to our error (wrong / damaged item).</li>
                  <li>COD convenience fees (if any) are non-refundable.</li>
                  <li>For COD refunds, you must provide your bank account details (account number + IFSC code) within 3 days of return approval.</li>
                  <li>Refunds for international transactions are made in INR and are subject to your bank&apos;s forex rates.</li>
                </ul>
              </div>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">6</span>
                Replacement / Exchange Policy
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>We offer a <strong className="text-gray-700 dark:text-gray-200">free replacement</strong> for items that are Dead on Arrival (DOA), have a manufacturing defect, or were damaged in transit.</li>
                <li>Replacement requests must be raised within <strong className="text-gray-700 dark:text-gray-200">48 hours</strong> of delivery with photo / video evidence.</li>
                <li>Replacement is subject to stock availability. If the same product is unavailable, a full refund will be issued.</li>
                <li>Replacements are dispatched within <strong className="text-gray-700 dark:text-gray-200">3–5 business days</strong> after the original item is received and verified at our warehouse.</li>
                <li>Colour / variant exchanges are accepted within 7 days only if both variants are available and the item is in its original, unopened condition.</li>
              </ul>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">7</span>
                Order Cancellation
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Orders can be cancelled <strong className="text-gray-700 dark:text-gray-200">free of charge</strong> before the order is marked as &quot;Shipped&quot; via My Orders in your account.</li>
                <li>Once shipped, cancellation is not possible. You may initiate a return after delivery.</li>
                <li>For prepaid orders, refunds for cancellation are processed within <strong className="text-gray-700 dark:text-gray-200">3–5 business days</strong>.</li>
                <li>For COD orders cancelled before dispatch, no refund is required as no payment has been collected.</li>
                <li>We reserve the right to cancel orders due to stock unavailability, pricing errors, or logistics constraints. You will receive a full refund within 5 business days.</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">8</span>
                Repair Service Warranty &amp; Returns
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>All repair services carry a <strong className="text-gray-700 dark:text-gray-200">30-day warranty</strong> on the specific component repaired.</li>
                <li>If the same fault recurs within the warranty period, we will re-service at <strong className="text-gray-700 dark:text-gray-200">no additional charge</strong>.</li>
                <li>The warranty does not cover: new physical damage, water damage, electrical surges, or unrelated software issues post-repair.</li>
                <li>Warranty is void if the device is tampered with by another service provider after repair.</li>
                <li>Refund for repair services can only be claimed if we are unable to fix the reported fault. Service fees for unsuccessful repairs are subject to our diagnostic fee policy.</li>
              </ul>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">9</span>
                International Orders
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Returns from international (outside India) orders are accepted only for <strong className="text-gray-700 dark:text-gray-200">defective or wrong items</strong>. Change-of-mind returns are not accepted for international orders.</li>
                <li>Return shipping costs for international orders are the buyer&apos;s responsibility unless the item was defective / wrong.</li>
                <li>Customs duties and import fees paid by the buyer are <strong className="text-gray-700 dark:text-gray-200">non-refundable</strong>.</li>
                <li>Refunds for international orders are credited in INR to the original payment method within <strong className="text-gray-700 dark:text-gray-200">7–14 business days</strong>.</li>
                <li>Contact <span className="text-primary-500">support@amoha.in</span> before shipping any international return for RMA authorisation.</li>
              </ul>
            </section>

          </div>
        </div>

        {/* Contact for Returns */}
        <div className="mt-8 glass-card p-6 sm:p-8 rounded-xl">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Contact for Returns &amp; Refunds</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">For any return, refund, exchange, or cancellation queries, reach our support team:</p>
          <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 space-y-2 text-sm">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span> <span className="text-primary-500">returns@amoha.in</span> — Response within 24 hours</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> <span className="text-primary-500">+91 98765 43210</span> — Mon to Sat, 10 AM – 6 PM IST</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">WhatsApp Support:</span> <span className="text-primary-500">+91 98765 43210</span></p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Store Address:</span> AMOHA Mobiles, MG Road, Mumbai, Maharashtra – 400 001</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Under the Consumer Protection Act, 2019, you also have the right to approach the Consumer Disputes Redressal Commission. National Helpline: <strong>1800-11-4000</strong> | <span className="text-primary-500">consumerhelpline.gov.in</span></p>
          </div>
        </div>

      </div>
    </div>
  );
}
