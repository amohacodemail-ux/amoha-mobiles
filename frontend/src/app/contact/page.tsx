'use client';

import { useState, useEffect } from 'react';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineClock } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { contactService, type ContactFormData } from '@/services/service.service';
import { useSettingsStore } from '@/store/settings.store';

const emptyForm: ContactFormData = { name: '', email: '', phone: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState<ContactFormData>(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings, fetchSettings } = useSettingsStore();

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const siteName = settings?.siteName || 'AMOHA Mobiles';
  const contactEmail = settings?.contactEmail || 'support@amoha.in';
  const contactPhone = settings?.contactPhone || '+91 98765 43210';
  const storeAddress = settings?.address || 'Tamil Nadu, India';

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

  return (
    <div className="min-h-screen">
      {/* Hero */}
      <div className="relative overflow-hidden border-b border-gray-200 dark:border-white/5 bg-gradient-to-b from-primary-50 to-white dark:from-primary-950 dark:to-surface-50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(99,102,241,0.15),transparent_50%)]" />
        <div className="page-container relative py-12 sm:py-16 text-center">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
            Contact <span className="text-primary-500 dark:text-primary-400">Us</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Have a question or need help? Reach out to us and we&apos;ll respond as quickly as possible.
          </p>
        </div>
      </div>

      <div className="page-container py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
          {/* Contact Form */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Send us a Message</h2>
            <form onSubmit={handleSubmit} className="glass-card p-5 sm:p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Name *</label>
                  <input name="name" value={form.name} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="Your name" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                  <input name="phone" value={form.phone} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="Phone number" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Email *</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="Email address" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Subject *</label>
                <input name="subject" value={form.subject} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="What is this about?" />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Message *</label>
                <textarea name="message" value={form.message} onChange={handleChange} className="glass-input py-3 text-sm min-h-[100px] resize-none" placeholder="Write your message..." rows={4} />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>

          {/* Store Locations */}
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-5">Our Store</h2>
            <div className="space-y-5">
              <div className="glass-card p-5">
                <h3 className="text-sm font-bold text-gray-900 dark:text-white">{siteName}</h3>
                <div className="mt-3 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                    <HiOutlineLocationMarker className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary-400" />
                    <span>{storeAddress}</span>
                  </div>
                  <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-400 transition-colors">
                    <HiOutlinePhone className="h-4 w-4 flex-shrink-0 text-primary-400" />
                    <span>{contactPhone}</span>
                  </a>
                  <a href={`mailto:${contactEmail}`} className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-400 transition-colors">
                    <HiOutlineMail className="h-4 w-4 flex-shrink-0 text-primary-400" />
                    <span>{contactEmail}</span>
                  </a>
                  <div className="flex items-center gap-2.5 text-sm text-gray-500 dark:text-gray-400">
                    <HiOutlineClock className="h-4 w-4 flex-shrink-0 text-primary-400" />
                    <span>Mon - Sat: 10:00 AM – 8:00 PM</span>
                  </div>
                </div>
              </div>
            </div>

            {/* General Contact */}
            <div className="glass-card-sm p-5 mt-5">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">General Inquiries</h3>
              <div className="space-y-2">
                <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-400 transition-colors">
                  <HiOutlineMail className="h-4 w-4 text-primary-400" />
                  {contactEmail}
                </a>
                <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-primary-400 transition-colors">
                  <HiOutlinePhone className="h-4 w-4 text-primary-400" />
                  {contactPhone}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
