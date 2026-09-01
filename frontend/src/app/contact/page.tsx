'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineClock, HiOutlineChat, HiChevronDown, HiOutlineCheckCircle } from 'react-icons/hi';
import { HiStar, HiUsers, HiDevicePhoneMobile, HiCheckBadge } from 'react-icons/hi2';
import toast from 'react-hot-toast';
import { contactService, type ContactFormData } from '@/services/service.service';
import { useSettingsStore } from '@/store/settings.store';

const emptyForm: ContactFormData = { name: '', email: '', phone: '', subject: '', message: '' };

// --- Hooks ---
function useCountUp(end: number, duration: number = 2000, start: number = 0) {
  const [count, setCount] = useState(start);
  const countRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );
    if (countRef.current) observer.observe(countRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeOut = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(easeOut * (end - start) + start));
      if (progress < 1) window.requestAnimationFrame(step);
      else setCount(end);
    };
    window.requestAnimationFrame(step);
  }, [isVisible, end, duration, start]);

  return { count, countRef, isVisible };
}

// --- Components ---
function StatItem({ end, label, prefix = '', suffix = '', decimals = 0 }: { end: number, label: string, prefix?: string, suffix?: string, decimals?: number }) {
  const multiplier = Math.pow(10, decimals);
  const { count, countRef } = useCountUp(end * multiplier, 2000);
  const displayValue = (count / multiplier).toFixed(decimals);

  return (
    <div ref={countRef} className="flex flex-col items-center justify-center p-6 text-center">
      <p className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
        {prefix}{displayValue}{suffix === '★' ? <span className="ml-1 text-2xl text-amber-400">★</span> : suffix}
      </p>
      <p className="mt-2 text-sm font-medium text-slate-500 dark:text-slate-400">{label}</p>
    </div>
  );
}

function AccordionItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="overflow-hidden rounded-[20px] border border-slate-100 bg-white transition-all dark:border-white/5 dark:bg-zinc-900/50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-slate-50 dark:hover:bg-zinc-800/50"
      >
        <span className="text-base font-bold text-slate-900 dark:text-white">{question}</span>
        <HiChevronDown className={`h-5 w-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid transition-all duration-300 ease-in-out ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="overflow-hidden">
          <p className="p-5 pt-0 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{answer}</p>
        </div>
      </div>
    </div>
  );
}

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const siteName = settings?.siteName || 'AMOHA Mobiles';
  const contactEmail = settings?.contactEmail || 'support@amoha.in';
  const contactPhone = settings?.contactPhone || '+91 63801 23183';
  const storeAddress = settings?.address || 'Therveethi, Idikarai, Coimbatore, Tamil Nadu 641020';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.subject || !form.message) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      await contactService.submit(form);
      toast.success('Message sent! We\'ll get back to you soon.');
      setForm(emptyForm);
    } catch {
      toast.error('Failed to send message. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const faqs = [
    { q: 'How long does mobile repair take?', a: 'Most screen and battery replacements take about 1-2 hours. More complex repairs may take 24-48 hours depending on parts availability.' },
    { q: 'Do you sell genuine products?', a: 'Yes, absolutely! We only sell 100% genuine and original products with official manufacturer warranties.' },
    { q: 'Is warranty available?', a: 'Yes, all new smartphones and accessories come with official brand warranties. We also provide our own service warranty for repairs.' },
    { q: 'Can I order online?', a: 'Yes, you can browse our catalog online, place an order, and choose either store pickup or fast delivery.' },
    { q: 'How can I track my order?', a: 'Once your order is placed, you will receive a tracking link via email and SMS. You can also track it from your account dashboard.' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[var(--background)]">
      
      {/* ────────────────────────
          HERO SECTION
          ──────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-50/60 to-slate-50 pb-20 pt-24 sm:pb-24 sm:pt-32 dark:from-blue-950/20 dark:to-transparent">
        {/* Blurred gradient circles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-[10%] top-0 h-[500px] w-[500px] rounded-full bg-blue-400/10 blur-[100px] dark:bg-blue-600/10" />
          <div className="absolute -right-[10%] top-20 h-[400px] w-[400px] rounded-full bg-purple-400/10 blur-[100px] dark:bg-purple-600/10" />
        </div>
        
        <div className="page-container relative z-10 text-center animate-fade-in-up">
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-5xl lg:text-6xl">
            Contact Amoha Mobiles
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600 dark:text-slate-400">
            Visit our showroom in Idikarai, Coimbatore or connect with us online. We're here to help you with smartphones, accessories, repairs, and customer support.
          </p>
          
          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row sm:gap-6">
            <a
              href={`tel:${contactPhone.replace(/\s/g, '')}`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-8 py-4 text-sm font-bold text-white shadow-lg transition-all hover:scale-105 hover:bg-slate-800 hover:shadow-xl dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100 sm:w-auto"
            >
              <HiOutlinePhone className="h-5 w-5" />
              Call Now
            </a>
            <a
              href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-8 py-4 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 hover:bg-emerald-600 hover:shadow-emerald-500/30 sm:w-auto"
            >
              <HiOutlineChat className="h-5 w-5" />
              Chat on WhatsApp
            </a>
          </div>
        </div>
      </section>

      <div className="page-container -mt-8 pb-20 relative z-20">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-12 lg:gap-12">
          
          {/* ────────────────────────
              STORE INFO & MAP (Left Column)
              ──────────────────────── */}
          <div className="flex flex-col gap-8 lg:col-span-5">
            
            {/* Store Information List */}
            <div className="rounded-[32px] border border-slate-100 bg-white p-8 shadow-[0_8px_40px_rgb(0,0,0,0.03)] dark:border-white/5 dark:bg-zinc-900/50">
              <h2 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Store Information</h2>
              <div className="flex flex-col divide-y divide-slate-100 dark:divide-white/5">
                
                <div className="group flex items-start gap-4 py-4 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
                    <HiOutlineLocationMarker className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Address</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{storeAddress}</p>
                  </div>
                </div>

                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="group flex items-start gap-4 py-4 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
                    <HiOutlinePhone className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Phone</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{contactPhone}</p>
                  </div>
                </a>

                <a href={`mailto:${contactEmail}`} className="group flex items-start gap-4 py-4 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
                    <HiOutlineMail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Email</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{contactEmail}</p>
                  </div>
                </a>

                <div className="group flex items-start gap-4 py-4 transition-colors hover:text-blue-600 dark:hover:text-blue-400">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-slate-50 text-slate-500 transition-colors group-hover:bg-blue-50 group-hover:text-blue-600 dark:bg-white/5 dark:text-slate-400 dark:group-hover:bg-blue-900/30 dark:group-hover:text-blue-400">
                    <HiOutlineClock className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Working Hours</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Mon - Sat: 10:00 AM – 8:00 PM</p>
                  </div>
                </div>

              </div>
            </div>

            {/* Google Map */}
            <div className="relative overflow-hidden rounded-[32px] border border-slate-100 bg-white p-2 shadow-[0_8px_40px_rgb(0,0,0,0.03)] dark:border-white/5 dark:bg-zinc-900/50">
              <div className="relative h-[250px] w-full overflow-hidden rounded-[24px]">
                <iframe
                  title="Amohamobiles location"
                  src="https://maps.google.com/maps?q=Idikarai,Coimbatore,Tamil+Nadu&t=&z=14&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="absolute inset-0"
                />
                
                {/* Floating Map Badge */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-3 rounded-2xl bg-white/95 p-3 shadow-lg backdrop-blur-sm dark:bg-zinc-900/95 sm:right-auto">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400">
                    <HiOutlineLocationMarker className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">Amoha Mobiles</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">Idikarai, Coimbatore</p>
                  </div>
                </div>
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2 mt-2">
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  <HiOutlinePhone className="h-5 w-5 text-blue-500" />
                  Call Now
                </a>
                <a href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  <HiOutlineChat className="h-5 w-5 text-emerald-500" />
                  WhatsApp
                </a>
                <a href="https://maps.google.com/?q=Idikarai,Coimbatore,Tamil+Nadu" target="_blank" rel="noopener noreferrer" className="flex flex-col items-center justify-center gap-1.5 rounded-xl bg-slate-50 py-3 text-xs font-bold text-slate-700 transition-colors hover:bg-slate-100 dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10">
                  <HiOutlineLocationMarker className="h-5 w-5 text-purple-500" />
                  Directions
                </a>
              </div>
            </div>
          </div>

          {/* ────────────────────────
              CONTACT FORM (Right Column)
              ──────────────────────── */}
          <div className="lg:col-span-7">
            <div className="rounded-[32px] border border-slate-100 bg-white p-6 shadow-[0_8px_40px_rgb(0,0,0,0.03)] dark:border-white/5 dark:bg-zinc-900/50 sm:p-10">
              <h2 className="mb-2 text-2xl font-bold text-slate-900 dark:text-white">Send us a Message</h2>
              <p className="mb-8 text-sm text-slate-500 dark:text-slate-400">Fill out the form below and our team will get back to you immediately.</p>
              
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Name *</label>
                    <input name="name" value={form.name} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-zinc-800" placeholder="John Doe" />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Phone</label>
                    <input name="phone" value={form.phone} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-zinc-800" placeholder="+91 98765 43210" />
                  </div>
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Email *</label>
                  <input name="email" type="email" value={form.email} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-zinc-800" placeholder="john@example.com" />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Subject *</label>
                  <input name="subject" value={form.subject} onChange={handleChange} className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-zinc-800" placeholder="Product Inquiry / Repair" />
                </div>
                
                <div>
                  <label className="mb-2 block text-sm font-semibold text-slate-700 dark:text-slate-300">Message *</label>
                  <textarea name="message" value={form.message} onChange={handleChange} className="w-full min-h-[140px] resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3.5 text-sm text-slate-900 outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 dark:border-white/10 dark:bg-zinc-900/50 dark:text-white dark:focus:border-blue-500 dark:focus:bg-zinc-800" placeholder="How can we help you today?" />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 text-sm font-bold text-white shadow-[0_10px_30px_rgb(59,130,246,0.3)] transition-all hover:-translate-y-1 hover:shadow-[0_15px_40px_rgb(59,130,246,0.4)] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                </button>
                
                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-slate-500 dark:text-slate-400">
                  <HiOutlineCheckCircle className="h-4 w-4 text-emerald-500" />
                  We usually respond within 24 hours.
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────
          STORE GALLERY
          ──────────────────────── */}
      <section className="border-t border-slate-100 bg-white py-20 dark:border-white/5 dark:bg-[var(--background)]">
        <div className="page-container">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Inside Our Store</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Experience premium shopping directly at our showroom.</p>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
            {['/images/gallery/interior.png', '/images/gallery/smartphones.png', '/images/gallery/accessories.png', '/images/gallery/repairs.png'].map((img, idx) => (
              <div key={idx} className="group relative aspect-square overflow-hidden rounded-[24px] bg-slate-100 dark:bg-zinc-900 shadow-sm">
                <Image src={img} alt={['Store Interior', 'Smartphones', 'Accessories', 'Repair Desk'][idx]} fill className="object-cover transition-transform duration-700 group-hover:scale-110" sizes="(max-width: 768px) 50vw, 25vw" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                <div className="absolute bottom-4 sm:bottom-6 left-4 sm:left-6 right-4 text-white font-bold text-sm sm:text-base drop-shadow-md">
                  {['Store Interior', 'Smartphones', 'Accessories', 'Repair Desk'][idx]}
                </div>
                <div className="absolute inset-0 border border-black/5 rounded-[24px] dark:border-white/5 pointer-events-none" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          FAQ SECTION
          ──────────────────────── */}
      <section className="bg-slate-50 py-20 dark:bg-[var(--background)]">
        <div className="page-container max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white">Frequently Asked Questions</h2>
            <p className="mt-4 text-slate-500 dark:text-slate-400">Everything you need to know about our products and services.</p>
          </div>
          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} question={faq.q} answer={faq.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ────────────────────────
          CUSTOMER TRUST SECTION
          ──────────────────────── */}
      <section className="border-y border-slate-100 bg-white py-16 dark:border-white/5 dark:bg-[var(--background)]">
        <div className="page-container">
          <div className="grid grid-cols-2 divide-x divide-y divide-slate-100 dark:divide-white/5 sm:grid-cols-4 sm:divide-y-0">
            <StatItem end={10000} suffix="+" label="Happy Customers" />
            <StatItem end={5000} suffix="+" label="Mobiles Sold" />
            <StatItem end={4.9} decimals={1} suffix="★" label="Customer Rating" />
            <StatItem end={100} suffix="%" label="Genuine Products" />
          </div>
        </div>
      </section>

      {/* ────────────────────────
          VISIT US BANNER
          ──────────────────────── */}
      <section className="py-20">
        <div className="page-container">
          <div className="relative overflow-hidden rounded-[40px] bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-16 text-center shadow-[0_20px_50px_rgb(59,130,246,0.25)] sm:px-12 sm:py-20 lg:px-24">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent_70%)]" />
            <div className="relative z-10 mx-auto max-w-2xl">
              <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Visit Our Store Today
              </h2>
              <p className="mx-auto mt-6 text-lg text-blue-100">
                Experience the latest smartphones, genuine accessories, and expert service at Amoha Mobiles.
              </p>
              
              <div className="mt-8 mb-10 flex items-center justify-center gap-3">
                <div className="inline-flex h-11 sm:h-12 items-center justify-center rounded-full bg-black/20 px-4 sm:px-6 backdrop-blur-md border border-white/10 text-white font-medium text-[13px] sm:text-base whitespace-nowrap">
                  <HiOutlineClock className="mr-1.5 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5 opacity-80 shrink-0" />
                  Mon – Sat: 10:00 AM – 8:00 PM
                </div>
              </div>
              
              <a
                href="https://maps.google.com/?q=Idikarai,Coimbatore,Tamil+Nadu"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-8 py-4 text-base font-bold text-blue-600 shadow-xl transition-all hover:scale-105 hover:bg-slate-50"
              >
                <HiOutlineLocationMarker className="h-5 w-5" />
                Get Directions
              </a>
            </div>
          </div>
        </div>
      </section>
      
    </div>
  );
}
