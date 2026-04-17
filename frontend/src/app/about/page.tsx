'use client';

import Link from 'next/link';
import { HiOutlineShieldCheck, HiOutlineTruck, HiOutlineRefresh, HiOutlinePhone, HiOutlineHeart, HiOutlineStar } from 'react-icons/hi';
import { useSettingsStore } from '@/store/settings.store';
import { useEffect } from 'react';

export default function AboutPage() {
  const { settings, fetchSettings } = useSettingsStore();
  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const siteName = settings?.siteName || 'AMOHA Mobiles';

  const values = [
    { icon: HiOutlineShieldCheck, title: 'Genuine Products', description: 'Every device we sell is 100% authentic with brand warranty. No refurbished items unless clearly labeled.' },
    { icon: HiOutlineTruck, title: 'Fast Delivery', description: 'Order online and get your device delivered within 2-3 business days. Free shipping on orders above Rs.999.' },
    { icon: HiOutlineRefresh, title: 'Easy Returns', description: '7-day hassle-free return policy. If you are not satisfied, we will make it right.' },
    { icon: HiOutlinePhone, title: 'Expert Repairs', description: 'Our trained technicians handle everything from screen replacements to motherboard repairs with genuine parts.' },
    { icon: HiOutlineHeart, title: 'Customer First', description: 'We believe in building lasting relationships. Our support team is here to help before, during, and after your purchase.' },
    { icon: HiOutlineStar, title: 'Best Prices', description: 'Competitive pricing on all mobiles and accessories. We match prices and offer exclusive in-store deals.' },
  ];

  return (
    <main className="min-h-screen">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-br from-primary-50 via-white to-accent-50 dark:border-white/5 dark:from-primary-950/50 dark:via-[var(--background)] dark:to-accent-950/30">
        <div className="page-container py-16 text-center sm:py-20 lg:py-24">
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-4xl lg:text-5xl">
            About {siteName}
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
            Your trusted neighbourhood mobile store &mdash; now online. We sell genuine smartphones, accessories, and provide expert repair services all under one roof.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-12 sm:py-16">
        <div className="page-container max-w-3xl">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Our Story</h2>
          <div className="mt-6 space-y-4 text-sm leading-relaxed text-gray-600 dark:text-gray-400 sm:text-base sm:leading-relaxed">
            <p>
              {siteName} started as a small mobile shop with a simple goal: to offer genuine products at fair prices with honest advice. Over the years, we have grown into a trusted destination for thousands of customers who rely on us for their mobile needs.
            </p>
            <p>
              Whether you are looking for the latest flagship smartphone, a budget-friendly option, quality accessories, or professional repair services &mdash; we have you covered. Our team of trained technicians and knowledgeable staff ensures you always get the best experience.
            </p>
            <p>
              With our online store, we have made it easier than ever to shop from the comfort of your home. Every product comes with brand warranty, and our dedicated support team is just a call away.
            </p>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="border-y border-gray-100 bg-gray-50/50 py-12 dark:border-white/5 dark:bg-white/[0.01] sm:py-16">
        <div className="page-container">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Why Choose Us</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">What makes {siteName} different</p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3">
            {values.map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-100 bg-white p-5 transition-shadow hover:shadow-md dark:border-white/[0.06] dark:bg-white/[0.02] sm:p-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                  <item.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-900 dark:text-white sm:text-base">{item.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-16">
        <div className="page-container text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Ready to Shop?</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 sm:text-base">
            Browse our collection or visit us at our store
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/products"
              className="inline-flex items-center justify-center rounded-xl bg-primary-600 px-8 py-3.5 text-sm font-bold text-white transition-all hover:bg-primary-500 hover:shadow-lg active:scale-[0.98]"
            >
              Browse Products
            </Link>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-8 py-3.5 text-sm font-bold text-gray-700 transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-[0.98] dark:border-white/10 dark:bg-white/[0.03] dark:text-gray-300 dark:hover:bg-white/[0.06]"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
