'use client';

import { useState } from 'react';
import { HiOutlineDeviceMobile, HiOutlineLightningBolt, HiOutlineChip, HiOutlineShieldCheck, HiOutlineX } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { serviceRequestService, type ServiceRequestData } from '@/services/service.service';
import { useAuthStore } from '@/store/auth.store';

const SERVICE_CATEGORIES = [
  {
    title: 'Display & Screen',
    icon: HiOutlineDeviceMobile,
    services: [
      { name: 'Display Change', description: 'Complete display replacement with original or compatible parts', price: '₹1,500 – ₹12,000' },
      { name: 'Tempered Glass Application', description: 'Screen protector installation for all models', price: '₹99 – ₹499' },
      { name: 'Panel Change', description: 'LCD/AMOLED panel replacement', price: '₹2,000 – ₹15,000' },
    ],
  },
  {
    title: 'Battery & Charging',
    icon: HiOutlineLightningBolt,
    services: [
      { name: 'Battery Change', description: 'Battery replacement with genuine or high-quality parts', price: '₹500 – ₹3,000' },
      { name: 'Charging Port Repair', description: 'Fix or replace the charging connector', price: '₹300 – ₹1,500' },
    ],
  },
  {
    title: 'Internal Modules',
    icon: HiOutlineChip,
    services: [
      { name: 'Power Module Repair', description: 'Fix power-related issues, boot loops, and IC replacement', price: '₹500 – ₹3,000' },
      { name: 'Network Module Repair', description: 'Fix signal, SIM detection, and network issues', price: '₹500 – ₹2,500' },
      { name: 'Audio Module Repair', description: 'Speaker, microphone, and earpiece replacement', price: '₹300 – ₹1,500' },
      { name: 'Camera Repair', description: 'Front or rear camera replacement and focus fix', price: '₹500 – ₹4,000' },
      { name: 'Button Repair', description: 'Power, volume, and home button repair/replacement', price: '₹200 – ₹1,000' },
      { name: 'Fingerprint Sensor Repair', description: 'Fingerprint module replacement or re-calibration', price: '₹500 – ₹2,500' },
      { name: 'Bluetooth Module Repair', description: 'Fix Bluetooth connectivity issues', price: '₹400 – ₹1,500' },
      { name: 'WiFi Module Repair', description: 'Fix WiFi connectivity and antenna issues', price: '₹400 – ₹1,500' },
    ],
  },
  {
    title: 'Body & Casing',
    icon: HiOutlineShieldCheck,
    services: [
      { name: 'Front Case Change', description: 'Front housing/frame replacement', price: '₹300 – ₹2,000' },
      { name: 'Back Case Change', description: 'Back panel/cover replacement', price: '₹200 – ₹2,500' },
    ],
  },
];

const ALL_SERVICE_NAMES = SERVICE_CATEGORIES.flatMap((cat) => cat.services.map((s) => s.name));

const emptyForm: ServiceRequestData = {
  customerName: '',
  customerPhone: '',
  customerEmail: '',
  deviceBrand: '',
  deviceModel: '',
  serviceType: '',
  description: '',
};

export default function ServicesPage() {
  const { user } = useAuthStore();
  const [showForm, setShowForm] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [form, setForm] = useState<ServiceRequestData>({
    ...emptyForm,
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openRequestForm = (serviceName: string) => {
    setSelectedService(serviceName);
    setForm((prev) => ({
      ...prev,
      serviceType: serviceName,
      customerName: user?.name || prev.customerName,
      customerEmail: user?.email || prev.customerEmail,
      customerPhone: user?.phone || prev.customerPhone,
    }));
    setShowForm(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone || !form.customerEmail || !form.deviceBrand || !form.deviceModel || !form.serviceType) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await serviceRequestService.submit(form);
      toast.success(`Service request submitted! Ref: ${result.requestNumber}`);
      setShowForm(false);
      setForm({ ...emptyForm });
    } catch {
      toast.error('Failed to submit service request. Please try again.');
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
            What We <span className="text-primary-500 dark:text-primary-400">Offer</span>
          </h1>
          <p className="mt-3 text-sm sm:text-base text-gray-500 dark:text-gray-400 max-w-xl mx-auto">
            Professional mobile repair services by certified technicians. Fast turnaround, genuine parts, and warranty on all repairs.
          </p>
        </div>
      </div>

      {/* Service Categories */}
      <div className="page-container py-10 sm:py-14">
        <div className="space-y-10">
          {SERVICE_CATEGORIES.map((category) => (
            <div key={category.title}>
              <div className="flex items-center gap-3 mb-5">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-500/15 text-primary-400">
                  <category.icon className="h-5 w-5" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{category.title}</h2>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {category.services.map((service) => (
                  <div key={service.name} className="glass-card p-5 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{service.name}</h3>
                      <p className="mt-1.5 text-xs text-gray-500 leading-relaxed">{service.description}</p>
                      <p className="mt-2 text-xs font-medium text-primary-400">{service.price}</p>
                    </div>
                    <button
                      onClick={() => openRequestForm(service.name)}
                      className="mt-4 w-full rounded-lg bg-primary-600/80 px-4 py-3 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow sm:py-2.5 sm:text-xs"
                    >
                      Request Service
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative">
            <button
              onClick={() => setShowForm(false)}
              className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:hover:bg-white/10 dark:hover:text-white transition-colors"
            >
              <HiOutlineX className="h-5 w-5" />
            </button>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Request Service</h2>
            <p className="text-xs text-gray-500 mb-5">Fill in your details and we&apos;ll get back to you shortly.</p>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Service Type *</label>
                  <select
                  name="serviceType"
                  value={form.serviceType}
                  onChange={handleChange}
                  className="glass-input py-3 text-sm"
                >
                  <option value="">Select a service</option>
                  {ALL_SERVICE_NAMES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Your Name *</label>
                  <input name="customerName" value={form.customerName} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="Full name" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Phone *</label>
                  <input name="customerPhone" value={form.customerPhone} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="Phone number" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Email *</label>
                <input name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="Email address" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Device Brand *</label>
                  <input name="deviceBrand" value={form.deviceBrand} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="e.g. Samsung, Apple" />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Device Model *</label>
                  <input name="deviceModel" value={form.deviceModel} onChange={handleChange} className="glass-input py-3 text-sm" placeholder="e.g. Galaxy S24, iPhone 15" />
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Additional Details</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  className="glass-input py-3 text-sm min-h-[70px] resize-none"
                  placeholder="Describe the issue..."
                  rows={3}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

