import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shipping Information',
  description: 'AMOHA Mobiles shipping info – delivery timelines, charges, domestic and international shipping details.',
};

export default function ShippingInfoPage() {
  return (
    <div className="min-h-screen">
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-white/5 bg-gradient-to-b from-primary-50 to-white dark:from-primary-950 dark:to-surface-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="page-container relative py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Shipping <span className="text-primary-500 dark:text-primary-400">Information</span>
          </h1>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Effective Date: April 1, 2026 &nbsp;|&nbsp; Last Updated: April 1, 2026</p>
          <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">Domestic and international delivery guidelines, charges, timelines, and customer rights</p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14 max-w-4xl mx-auto">
        <div className="glass-card p-5 sm:p-6 mb-8 rounded-xl">
          <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-4">Shipping Summary</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              ["1–2 Days", "Order processing time"],
              ["Free", "Shipping above ₹999"],
              ["3 Attempts", "Delivery attempts before return"],
              ["24/7", "Online order tracking"],
            ].map(([value, label]) => (
              <div key={value} className="rounded-xl bg-primary-500/10 p-4">
                <p className="text-xl font-bold text-primary-500">{value}</p>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          <div className="glass-card p-6 sm:p-8 rounded-xl space-y-7">
            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">1</span>
                Domestic Shipping Coverage
              </h2>
              <p>
                We currently deliver across most serviceable PIN codes in India through trusted courier partners. Orders are shipped
                from our warehouse or authorised store locations and are subject to stock availability, payment confirmation, address
                verification, and courier serviceability.
              </p>
              <ul className="list-disc list-inside mt-3 space-y-1.5">
                <li>Shipping is available to metro cities, Tier 2 and Tier 3 towns, and most semi-urban locations.</li>
                <li>Remote or high-risk areas may take longer or may require prepaid orders only.</li>
                <li>Orders are processed on business days only, excluding Sundays and public holidays.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">2</span>
                Order Processing & Courier Partners
              </h2>
              <p className="mb-3">After successful order placement, most orders are packed and dispatched within <strong className="text-gray-700 dark:text-gray-200">1–2 business days</strong>.</p>
              <div className="grid sm:grid-cols-2 gap-2">
                {[
                  "Blue Dart — premium domestic delivery",
                  "Delhivery — wide national coverage",
                  "DTDC / XpressBees — standard regional logistics",
                  "DHL / FedEx — selected express and international shipments",
                ].map((item, index) => (
                  <div key={index} className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.02] p-3 text-xs">
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">3</span>
                Estimated Delivery Timeline
              </h2>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Location</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Standard Delivery</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Express Delivery</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    <tr>
                      <td className="px-4 py-2.5">Metro Cities</td>
                      <td className="px-4 py-2.5">3–5 business days</td>
                      <td className="px-4 py-2.5">1–2 business days</td>
                    </tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]">
                      <td className="px-4 py-2.5">Tier 2 Cities</td>
                      <td className="px-4 py-2.5">4–7 business days</td>
                      <td className="px-4 py-2.5">2–3 business days</td>
                    </tr>
                    <tr>
                      <td className="px-4 py-2.5">Rural / Remote Areas</td>
                      <td className="px-4 py-2.5">7–10 business days</td>
                      <td className="px-4 py-2.5">3–5 business days</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="mt-3 text-xs">These timelines are estimates only and may be affected by weather events, public holidays, political disruptions, natural disasters, or courier delays outside our control.</p>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">4</span>
                Shipping Charges
              </h2>
              <div className="overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/[0.03]">
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Order Type</th>
                      <th className="px-4 py-2.5 font-semibold text-gray-600 dark:text-gray-300">Charge</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-white/5">
                    <tr><td className="px-4 py-2.5">Orders above ₹999</td><td className="px-4 py-2.5 text-emerald-500 font-semibold">Free Standard Shipping</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Orders below ₹999</td><td className="px-4 py-2.5">₹49 standard shipping</td></tr>
                    <tr><td className="px-4 py-2.5">Express Delivery</td><td className="px-4 py-2.5">Calculated at checkout based on weight and PIN code</td></tr>
                    <tr className="bg-gray-50 dark:bg-white/[0.02]"><td className="px-4 py-2.5">Cash on Delivery</td><td className="px-4 py-2.5">May include a small convenience charge in selected locations</td></tr>
                    <tr><td className="px-4 py-2.5">International Shipping</td><td className="px-4 py-2.5">Calculated separately based on country, weight, and courier</td></tr>
                  </tbody>
                </table>
              </div>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">5</span>
                International Shipping
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>International delivery may be available for selected products and countries subject to customs rules, export restrictions, and courier acceptance.</li>
                <li>All international shipping charges, import duties, VAT/GST, customs clearance fees, and local taxes are generally the buyer&apos;s responsibility unless explicitly stated otherwise.</li>
                <li>International delivery timelines vary by destination and usually range from <strong className="text-gray-700 dark:text-gray-200">5–14 business days</strong> after dispatch.</li>
                <li>We comply with applicable Indian foreign trade, RBI, and FEMA guidelines for cross-border transactions where applicable.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">6</span>
                Order Tracking
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Once your order is shipped, a tracking ID is sent by <strong className="text-gray-700 dark:text-gray-200">SMS, email, and your account dashboard</strong>.</li>
                <li>You can track the shipment anytime from the <span className="text-primary-500">My Orders</span> section.</li>
                <li>If tracking does not update for more than 48 hours, please contact our support team for assistance.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">7</span>
                Packaging, Insurance & Delivery Security
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>All devices are securely packed with protective cushioning and tamper-evident sealing.</li>
                <li>High-value shipments may require OTP-based delivery confirmation or signature on delivery.</li>
                <li>Customers should inspect the package at delivery and report visible damage within <strong className="text-gray-700 dark:text-gray-200">24 hours</strong>.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">8</span>
                Failed or Undelivered Orders
              </h2>
              <ul className="list-disc list-inside space-y-1.5">
                <li>Our courier partners generally make up to <strong className="text-gray-700 dark:text-gray-200">3 delivery attempts</strong>.</li>
                <li>If delivery fails due to customer unavailability, incorrect address, or refusal to accept the parcel, the order may be returned to origin.</li>
                <li>Refunds for prepaid returned-to-origin orders are processed after deducting applicable shipping / handling charges, unless the failure was due to our error.</li>
              </ul>
            </section>

            <section>
              <h2 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary-500/10 text-primary-500 text-xs font-bold">9</span>
                Restricted Items & Non-Serviceable Areas
              </h2>
              <p>
                We may decline or delay shipment for certain items, bulk orders, suspicious transactions, government-restricted products,
                or locations that are temporarily non-serviceable due to courier, legal, weather, or safety reasons.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 glass-card p-6 sm:p-8 rounded-xl">
          <h2 className="text-base font-bold text-gray-900 dark:text-white mb-4">Shipping Support</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">For delivery delays, tracking issues, damaged packages, or address corrections, contact us:</p>
          <div className="rounded-lg bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 p-4 space-y-2 text-sm">
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Email:</span> <span className="text-primary-500">shipping@amoha.in</span></p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Phone:</span> <span className="text-primary-500">+91 98765 43210</span> — Mon to Sat, 10 AM – 6 PM IST</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Order Tracking:</span> Available 24/7 from your account dashboard</p>
            <p><span className="font-semibold text-gray-700 dark:text-gray-300">Registered Office:</span> AMOHA Mobiles, MG Road, Mumbai, Maharashtra – 400 001</p>
          </div>
        </div>
      </div>
    </div>
  );
}
