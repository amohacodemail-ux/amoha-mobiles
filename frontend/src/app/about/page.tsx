'use client';

import Link from 'next/link';
import Image from 'next/image';
import RedmiImage from '@/images/REDMI 9 POWER.webp';
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
      <section className="relative overflow-hidden bg-white dark:bg-[var(--background)]">
        {/* Background Gradients & Glows */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />
        <div className="absolute left-1/2 top-0 -translate-x-1/2 w-full max-w-3xl h-64 bg-primary-500/10 blur-[100px] dark:bg-primary-500/20 pointer-events-none" />

        <div className="page-container relative py-12 text-center sm:py-16 lg:py-20 flex flex-col items-center justify-center">

          <h1 className="max-w-4xl text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl/tight">
            {siteName} <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">Mobile Shop in Idikarai, Coimbatore</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-400 sm:text-xl/relaxed">
            Your trusted mobile shop in Idikarai, Coimbatore &mdash; now online. We sell genuine smartphones, accessories, and provide expert repair services in Tamil Nadu.
          </p>
        </div>

        {/* Bottom fade border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent dark:via-white/10" />
      </section>

      {/* Story */}
      <section className="py-8 sm:py-12 relative overflow-hidden">
        <style>{`
          @keyframes float {
            0% { transform: translateY(0px); }
            50% { transform: translateY(-15px); }
            100% { transform: translateY(0px); }
          }
          .animate-float { animation: float 6s ease-in-out infinite; }
          .animate-float-delayed-1 { animation: float 7s ease-in-out infinite 1s; }
          .animate-float-delayed-2 { animation: float 5s ease-in-out infinite 2s; }
          
          @keyframes fadeInUp {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .animate-fade-in-up {
            animation: fadeInUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards;
            opacity: 0;
          }
          .delay-100 { animation-delay: 100ms; }
          .delay-200 { animation-delay: 200ms; }
        `}</style>

        {/* Soft Background Gradients */}
        <div className="absolute inset-0 bg-gradient-to-b from-white to-primary-50/30 dark:from-[var(--background)] dark:to-primary-950/10 pointer-events-none" />
        <div className="absolute -left-40 top-20 h-96 w-96 rounded-full bg-primary-100/50 blur-3xl dark:bg-primary-900/20 pointer-events-none" />
        <div className="absolute -right-40 bottom-10 h-80 w-80 rounded-full bg-blue-100/40 blur-3xl dark:bg-blue-900/10 pointer-events-none" />

        <div className="page-container relative">
          {/* Centered Heading */}
          <div className="mb-6 text-center sm:mb-8">
            <h2 className="inline-block text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 sm:text-4xl lg:text-5xl">
              Our Story
            </h2>
            <div className="mt-4 flex justify-center">
              <div className="h-1 w-12 bg-primary-500/50 rounded-full" />
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-2 lg:items-center xl:gap-12">

            {/* Left Content (Timeline) */}
            <div className="order-2 lg:order-1 relative z-10 max-w-2xl mx-auto lg:mx-0 w-full">
              <div className="relative text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">

                {/* Continuous Timeline Line */}
                <div className="absolute left-[7px] top-6 bottom-6 w-[2px] bg-gradient-to-b from-primary-500/40 via-primary-500/40 to-transparent rounded-full dark:from-primary-500/20 dark:via-primary-500/20 dark:to-transparent" />

                {/* Timeline Block 1 */}
                <div className="group relative pl-8 pb-5 transition-all duration-300 animate-fade-in-up">
                  <div className="absolute left-[3px] top-8 h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] z-10 transition-transform duration-300 group-hover:scale-150 group-hover:bg-primary-400" />
                  <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(20,184,166,0.12)] hover:border-primary-100 dark:bg-white/[0.03] dark:border-white/5 dark:hover:border-primary-500/30">
                    <p className="relative text-sm sm:text-base">
                      <span className="font-semibold text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400">{siteName} started as a small mobile shop</span> in <strong className="text-gray-900 dark:text-white font-semibold">Idikarai, Coimbatore</strong> with a simple goal: to offer genuine products at fair prices with honest advice. Over the years, we have grown into the most trusted mobile store in Coimbatore for thousands of customers across Gandhipuram, RS Puram, Saravanampatti, Peelamedu, Singanallur, and the wider Tamil Nadu region.
                    </p>
                  </div>
                </div>

                {/* Timeline Block 2 */}
                <div className="group relative pl-8 pb-5 transition-all duration-300 animate-fade-in-up delay-100">
                  <div className="absolute left-[3px] top-8 h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] z-10 transition-transform duration-300 group-hover:scale-150 group-hover:bg-primary-400" />
                  <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(20,184,166,0.12)] hover:border-primary-100 dark:bg-white/[0.03] dark:border-white/5 dark:hover:border-primary-500/30">
                    <p className="relative text-sm sm:text-base">
                      Whether you are looking for the latest flagship smartphone &mdash; <strong className="text-gray-900 dark:text-white font-semibold">Samsung, Apple iPhone, OnePlus, Xiaomi, Realme, Vivo, Oppo, Nothing Phone</strong> &mdash; a budget-friendly option under ₹10,000, quality accessories, or professional <strong className="text-gray-900 dark:text-white font-semibold">phone repair in Coimbatore</strong>, we have you covered. Our team of certified technicians and knowledgeable staff ensures you always get the best experience.
                    </p>
                  </div>
                </div>

                {/* Timeline Block 3 */}
                <div className="group relative pl-8 transition-all duration-300 animate-fade-in-up delay-200">
                  <div className="absolute left-[3px] top-8 h-2.5 w-2.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(20,184,166,0.6)] z-10 transition-transform duration-300 group-hover:scale-150 group-hover:bg-primary-400" />
                  <div className="rounded-2xl bg-white p-5 sm:p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_8px_30px_-4px_rgba(20,184,166,0.12)] hover:border-primary-100 dark:bg-white/[0.03] dark:border-white/5 dark:hover:border-primary-500/30">
                    <p className="relative text-sm sm:text-base">
                      Located at <strong className="text-gray-900 dark:text-white font-semibold">Therveethi, Idikarai, Coimbatore – 641020</strong>, we are the go-to mobile shop for customers looking for the best mobile deals in Coimbatore. With our online store, customers across Tamil Nadu can shop from the comfort of their homes. Every product comes with brand warranty, and our dedicated support team is just a call or <Link href="/contact" className="text-primary-600 dark:text-primary-400 font-semibold hover:underline transition-colors">WhatsApp</Link> away.
                    </p>
                  </div>
                </div>

              </div>
            </div>

            {/* Right Visual (Premium Composition) */}
            <div className="order-1 lg:order-2 relative mx-auto w-full max-w-md lg:max-w-full">
              <div className="relative aspect-square w-full rounded-3xl sm:aspect-[4/3] lg:aspect-[4/4]">
                {/* Background Box Removed as requested */}
                
                {/* Main Floating Phone Image */}
                <div className="absolute inset-0 flex items-center justify-center animate-float">
                  <div className="relative h-[105%] w-[75%] sm:h-[110%] sm:w-[65%] transition-transform duration-500 hover:scale-105 cursor-pointer">
                    <Image 
                      src={RedmiImage} 
                      alt="Redmi 9 Power" 
                      className="object-contain mix-blend-multiply dark:mix-blend-normal"
                      fill
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  </div>
                </div>

                {/* Floating Element 1 - Shield */}
                <div className="absolute top-[15%] right-[10%] sm:right-[15%] animate-float-delayed-1">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/80 backdrop-blur-xl shadow-lg border border-white/60 dark:bg-slate-800/80 dark:border-white/10 transition-transform duration-300 hover:scale-110 cursor-pointer">
                    <HiOutlineShieldCheck className="h-8 w-8 text-primary-500" />
                  </div>
                </div>

                {/* Floating Element 2 - Delivery */}
                <div className="absolute bottom-[25%] left-[5%] sm:left-[10%] animate-float-delayed-2">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/80 backdrop-blur-xl shadow-lg border border-white/60 dark:bg-slate-800/80 dark:border-white/10 transition-transform duration-300 hover:scale-110 cursor-pointer">
                    <HiOutlineTruck className="h-6 w-6 text-blue-500" />
                  </div>
                </div>

                {/* Floating Element 3 - Quality Badge */}
                <div className="absolute bottom-[10%] right-[15%] sm:right-[20%] animate-float">
                  <div className="flex items-center gap-2 rounded-full bg-white/90 backdrop-blur-xl px-4 py-2 shadow-lg border border-white/60 dark:bg-slate-800/90 dark:border-white/10 transition-transform duration-300 hover:scale-105 cursor-pointer">
                    <HiOutlineStar className="h-5 w-5 text-yellow-500" />
                    <span className="text-xs font-bold text-slate-800 dark:text-white">Premium Quality</span>
                  </div>
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Values */}
      <section className="relative overflow-hidden border-t border-gray-100 bg-slate-50/50 py-16 dark:border-white/5 dark:bg-[var(--background)] sm:py-24">
        {/* Subtle Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary-500/5 blur-[120px] rounded-full pointer-events-none" />

        <div className="page-container relative">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="inline-block text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 sm:text-4xl">Why Choose Us</h2>
            <div className="mt-4 flex justify-center">
              <div className="h-1 w-12 bg-primary-500 rounded-full" />
            </div>
            <p className="mt-4 text-base text-gray-500 dark:text-gray-400 sm:text-lg">
              What makes <span className="font-semibold text-gray-700 dark:text-gray-300">{siteName}</span> different
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-8">
            {values.map((item) => (
              <div
                key={item.title}
                className="group relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 sm:p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl hover:shadow-primary-500/5 hover:border-primary-200 dark:border-white/5 dark:bg-white/[0.02] dark:hover:bg-white/[0.04] dark:hover:border-primary-500/30"
              >
                {/* Decorative hover gradient in corner */}
                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary-500/5 blur-2xl transition-all duration-500 group-hover:bg-primary-500/10 dark:group-hover:bg-primary-500/20 pointer-events-none" />

                <div className="relative z-10 flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400 dark:group-hover:bg-primary-500/20 shadow-sm">
                  <item.icon className="h-7 w-7 transition-transform duration-300 group-hover:scale-110" />
                </div>

                <h3 className="relative z-10 mt-6 text-lg font-bold text-gray-900 transition-colors duration-300 group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
                  {item.title}
                </h3>

                <p className="relative z-10 mt-3 text-sm leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="page-container max-w-5xl">
          <div className="relative overflow-hidden rounded-[32px] bg-primary-50/50 px-6 py-16 shadow-xl shadow-primary-500/5 ring-1 ring-primary-500/10 dark:bg-white/[0.02] dark:ring-white/10 sm:px-12 sm:py-20 lg:px-16 text-center group transition-transform duration-500 hover:-translate-y-1 hover:shadow-2xl hover:shadow-primary-500/10">
            {/* Background elements */}
            <div className="absolute inset-0 bg-gradient-to-tr from-primary-500/5 via-transparent to-blue-500/5 pointer-events-none transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-primary-500/10 blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-primary-500/20" />
            <div className="absolute -right-24 -bottom-24 h-72 w-72 rounded-full bg-blue-500/10 blur-[80px] pointer-events-none transition-all duration-700 group-hover:bg-blue-500/20" />

            <div className="relative z-10">
              <h2 className="inline-block text-3xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-primary-600 to-blue-600 dark:from-primary-400 dark:to-blue-400 sm:text-4xl lg:text-5xl">
                Ready to Shop?
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600 dark:text-slate-400">
                Browse our collection or visit us at our store
              </p>

              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                  href="/products"
                  className="group/btn relative inline-flex items-center justify-center overflow-hidden rounded-full bg-blue-600 px-8 py-4 text-base font-bold text-white transition-all hover:scale-105 hover:bg-blue-500 hover:shadow-[0_8px_30px_rgba(37,99,235,0.4)] active:scale-95"
                >
                  <span className="relative z-10">Browse Products</span>
                  <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover/btn:translate-x-full" />
                </Link>
                <Link
                  href="/contact"
                  className="inline-flex items-center justify-center rounded-full border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 shadow-sm transition-all hover:border-slate-300 hover:bg-slate-50 hover:scale-105 active:scale-95 dark:border-white/10 dark:bg-white/5 dark:text-white dark:hover:bg-white/10 dark:hover:border-white/20"
                >
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
