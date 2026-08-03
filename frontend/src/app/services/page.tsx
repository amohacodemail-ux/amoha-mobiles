'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  HiOutlineDeviceMobile, HiOutlineLightningBolt, HiOutlineChip, HiOutlineShieldCheck, HiOutlineX,
  HiOutlineArrowRight, HiOutlineStar, HiOutlineClock, HiOutlineCog, HiOutlineTruck, HiOutlineThumbUp, HiOutlineCheckCircle,
  HiOutlineUser, HiOutlinePhone, HiOutlineMail, HiOutlineDocumentText, HiOutlinePaperAirplane, HiOutlineChevronDown
} from 'react-icons/hi';
import toast from 'react-hot-toast';
import { serviceRequestService, type ServiceRequestData } from '@/services/service.service';
import { useAuthStore } from '@/store/auth.store';
import Link from 'next/link';

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

const WHY_CHOOSE_US = [
  { title: 'Certified Experts', description: 'Highly trained professionals handling all major brands.', icon: HiOutlineCheckCircle },
  { title: 'Genuine Parts', description: 'Original or highest-quality parts for every repair.', icon: HiOutlineShieldCheck },
  { title: 'Fast Turnaround', description: 'Most repairs are completed within just 2 hours.', icon: HiOutlineClock },
  { title: 'Assured Warranty', description: 'Peace of mind with our solid post-repair warranty.', icon: HiOutlineThumbUp },
];

const PROCESS_STEPS = [
  { step: '01', title: 'Book Service', description: 'Request online or visit our store.', icon: HiOutlineDeviceMobile },
  { step: '02', title: 'Free Diagnosis', description: 'We inspect and provide a free quote.', icon: HiOutlineCog },
  { step: '03', title: 'Expert Repair', description: 'We fix it using genuine parts.', icon: HiOutlineLightningBolt },
  { step: '04', title: 'Fast Delivery', description: 'Get your device back, working perfectly.', icon: HiOutlineTruck },
];

const REVIEWS = [
  { name: 'Arun Kumar', text: 'Amazing service! They replaced my iPhone battery in 30 minutes. Highly recommended for everyone in Coimbatore.', rating: 5 },
  { name: 'Priya Rajan', text: 'Professional and transparent pricing. My Samsung display works perfectly now, looks brand new.', rating: 5 },
  { name: 'Karthik S', text: 'Best mobile repair shop. Honest people, fast delivery, and they actually honor their warranty.', rating: 5 },
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
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [form, setForm] = useState<ServiceRequestData>({
    ...emptyForm,
    customerName: user?.name || '',
    customerEmail: user?.email || '',
    customerPhone: user?.phone || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isCarouselHovered, setIsCarouselHovered] = useState(false);

  useEffect(() => {
    if (!carouselRef.current || isCarouselHovered) return;
    
    const interval = setInterval(() => {
      if (carouselRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          carouselRef.current.scrollTo({ left: 0, behavior: 'smooth' });
        } else {
          carouselRef.current.scrollBy({ left: 350, behavior: 'smooth' });
        }
      }
    }, 3000);
    
    return () => clearInterval(interval);
  }, [isCarouselHovered]);

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

  const scrollToServices = () => {
    document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0a0a0a] selection:bg-blue-500/30">
      {/* Hero Section */}
      <section className="relative overflow-hidden w-full flex items-center justify-center min-h-[70vh] md:min-h-[80vh] lg:min-h-[85vh] py-16 md:py-24 px-4 mt-10 sm:mt-0">
        {/* Video Background */}
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          poster="/hero-poster.jpg"
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        
        {/* Dark Gradient Overlay */}
        <div 
          className="absolute inset-0 z-[1]"
          style={{
            background: 'linear-gradient(180deg, rgba(10,15,35,0.45), rgba(10,15,35,0.55))'
          }}
        />

        <div className="relative z-10 max-w-[1200px] mx-auto text-center px-2">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-white font-semibold text-[12px] sm:text-[13px] mb-6 sm:mb-8 border border-white/20 shadow-lg">
            <HiOutlineCog className="w-4 h-4" /> Professional Repair Services
          </div>
          <h1 className="text-[32px] sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-[1.2] sm:leading-[1.1] mb-4 sm:mb-6">
            Bring Your Device <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-300">Back to Life.</span>
          </h1>
          <p className="text-[15px] sm:text-lg lg:text-xl text-slate-200 max-w-2xl mx-auto font-medium mb-8 sm:mb-10 leading-relaxed px-4">
            Expert mobile repair services in Coimbatore. We fix screens, batteries, and everything in between with genuine parts and a guaranteed warranty.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full px-2 sm:px-0">
            <button 
              onClick={scrollToServices}
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold text-[15px] shadow-[0_8px_30px_rgb(37,99,235,0.3)] transition-all duration-300 hover:scale-105 hover:shadow-[0_15px_40px_rgb(37,99,235,0.4)]"
            >
              Book a Repair
            </button>
            <Link 
              href="/contact"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white font-bold text-[15px] transition-all duration-300 hover:scale-105 hover:bg-white/20 flex items-center justify-center"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 px-4 bg-white dark:bg-[#121212]">
        <div className="max-w-[1200px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Why Choose Us</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Premium service without the premium price tag.</p>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mx-auto w-full">
            {WHY_CHOOSE_US.map((feature, i) => (
              <div key={i} className="group p-4 sm:p-6 lg:p-8 rounded-[20px] lg:rounded-[24px] bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-black/50 hover:bg-white dark:hover:bg-white/10 flex flex-col items-center text-center sm:items-start sm:text-left h-full w-full">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-[14px] lg:rounded-2xl bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 lg:mb-6 transition-transform duration-300 group-hover:scale-110 shrink-0">
                  <feature.icon className="w-6 h-6 lg:w-7 lg:h-7" />
                </div>
                <h3 className="text-[15px] sm:text-lg lg:text-xl font-bold text-slate-900 dark:text-white mb-2 lg:mb-3 leading-tight">{feature.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 text-[13px] lg:text-sm font-medium leading-relaxed flex-grow">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section id="services-section" className="py-24 px-4 bg-slate-50 dark:bg-[#0a0a0a]">
        <div className="max-w-[1400px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Our Services</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium max-w-2xl mx-auto">Select a service below to view pricing and request a repair.</p>
          </div>

          <div className="space-y-24">
            {SERVICE_CATEGORIES.map((category) => (
              <div key={category.title}>
                <div className="flex items-center justify-center gap-4 mb-10">
                  <category.icon className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                  <h3 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">{category.title}</h3>
                </div>
                
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 mx-auto w-full">
                  {category.services.map((service) => {
                    const serviceImages: Record<string, string> = {
                      'Display Change': '/images/service_display.png',
                      'Tempered Glass Application': '/images/service_glass.png',
                      'Panel Change': '/images/service_display.png',
                      'Battery Change': '/images/service_battery.png',
                      'Charging Port Repair': '/images/service_port.png',
                      'Power Module Repair': '/images/service_motherboard.png',
                      'Network Module Repair': '/images/service_network.png',
                      'Audio Module Repair': '/images/service_audio.png',
                      'Camera Repair': '/images/service_camera.png',
                      'Button Repair': '/images/service_button.png',
                      'Fingerprint Sensor Repair': '/images/service_fingerprint.png',
                      'Bluetooth Module Repair': '/images/service_bluetooth.png',
                      'WiFi Module Repair': '/images/service_wifi.png',
                      'Front Case Change': '/images/service_display.png',
                      'Back Case Change': '/images/service_back_case.png'
                    };
                    
                    const imgUrl = (service as any).image || serviceImages[service.name] || '/images/service_motherboard.png';

                    return (
                      <div key={service.name} className="group flex flex-col items-center justify-between p-2 sm:p-3 rounded-[20px] bg-white dark:bg-[#121212] shadow-[0_4px_20px_-10px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-10px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.15)] dark:hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.6)] border border-slate-100 dark:border-white/5 h-full w-full">
                        <div className="w-full flex flex-col items-center text-center">
                          <div className="w-full h-[120px] sm:h-auto sm:aspect-video rounded-[12px] sm:rounded-[14px] overflow-hidden mb-3 sm:mb-4 shrink-0">
                            <img src={imgUrl} alt={service.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                          </div>
                          <div className="px-1 w-full flex flex-col items-center">
                            <h4 className="text-[14px] sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5 sm:mb-2 line-clamp-2 leading-tight">{service.name}</h4>
                            <p className="text-[11.5px] sm:text-[13.5px] text-slate-500 dark:text-slate-400 leading-relaxed line-clamp-2 min-h-[34px] sm:min-h-[40px] italic mb-3 sm:mb-4 w-full">{service.description}</p>
                            <div className="inline-flex items-center justify-center px-2.5 sm:px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[11px] sm:text-[13px] mb-3 sm:mb-4 shrink-0 max-w-full">
                              <span className="truncate">{service.price}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="pb-2 sm:pb-3 mt-auto w-full flex justify-center">
                          <button
                            onClick={() => openRequestForm(service.name)}
                            className="font-bold text-[11px] sm:text-[12px] tracking-[0.1em] sm:tracking-[0.15em] uppercase text-slate-900 dark:text-white border-b-2 border-slate-300 dark:border-slate-600 hover:border-blue-600 hover:text-blue-600 dark:hover:border-blue-400 dark:hover:text-blue-400 transition-all pb-0.5 whitespace-nowrap"
                          >
                            Request Repair
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Service Process */}
      <section className="py-24 px-4 bg-white dark:bg-[#121212] border-y border-slate-200/50 dark:border-white/5 relative overflow-hidden">
        <div className="max-w-[1200px] mx-auto animate-[slideInUp_0.8s_ease-out]">
          <div className="text-center mb-20">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">How It Works</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Four simple steps to get your device back to perfect condition.</p>
          </div>

          <div className="relative flex flex-col lg:flex-row justify-between gap-12 lg:gap-6">
            {/* Horizontal Line Desktop */}
            <div className="hidden lg:block absolute top-[2.75rem] left-[10%] right-[10%] h-0.5 bg-slate-200 dark:bg-white/10 z-0" />
            
            {/* Vertical Line Mobile */}
            <div className="block lg:hidden absolute top-10 bottom-10 left-[2.75rem] w-0.5 bg-slate-200 dark:bg-white/10 z-0" />
            
            {PROCESS_STEPS.map((step, i) => (
              <div key={i} className="relative flex flex-row lg:flex-col items-center lg:text-center gap-6 lg:gap-0 group w-full lg:w-1/4 z-10">
                {/* Connector active line animation layer */}
                <div className="w-[5.5rem] h-[5.5rem] shrink-0 rounded-full bg-white dark:bg-[#1a1a1a] border-4 border-slate-50 dark:border-[#121212] shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] flex items-center justify-center lg:mb-8 transition-all duration-300 group-hover:scale-110 group-hover:-translate-y-2 group-hover:shadow-[0_15px_40px_rgb(37,99,235,0.2)] group-hover:border-blue-50 relative">
                  <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-sm shadow-lg border-2 border-white dark:border-[#1a1a1a]">
                    {i + 1}
                  </div>
                  <step.icon className="w-8 h-8 text-blue-600 dark:text-blue-400 transition-transform duration-300 group-hover:scale-110" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">{step.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 text-sm font-medium leading-relaxed">{step.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Customer Reviews */}
      <section className="py-24 px-4 bg-slate-50 dark:bg-[#0a0a0a] overflow-hidden">
        <div className="max-w-[1200px] mx-auto animate-[slideInUp_0.8s_ease-out]">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Loved by Customers</h2>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Don&apos;t just take our word for it.</p>
          </div>

          <div 
            ref={carouselRef}
            onMouseEnter={() => setIsCarouselHovered(true)}
            onMouseLeave={() => setIsCarouselHovered(false)}
            onTouchStart={() => setIsCarouselHovered(true)}
            onTouchEnd={() => setIsCarouselHovered(false)}
            className="flex overflow-x-auto gap-6 pb-8 snap-x snap-mandatory no-scrollbar"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {/* Duplicate array for seamless infinite scrolling effect if needed, but here we just loop the existing */}
            {[...REVIEWS, ...REVIEWS].map((review, i) => (
              <div key={i} className="min-w-[320px] max-w-[360px] sm:min-w-[350px] shrink-0 snap-center p-8 rounded-[24px] bg-white dark:bg-[#121212] border border-slate-200/50 dark:border-white/10 shadow-sm transition-all duration-300 hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] dark:hover:shadow-[0_20px_40px_rgb(0,0,0,0.4)] hover:-translate-y-2">
                <div className="flex gap-1.5 mb-6">
                  {[...Array(review.rating)].map((_, j) => (
                    <HiOutlineStar key={j} className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-sm" />
                  ))}
                </div>
                <p className="text-slate-700 dark:text-slate-300 font-medium text-[15px] leading-relaxed mb-8">
                  &quot;{review.text}&quot;
                </p>
                <div className="flex items-center gap-4 mt-auto">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-inner ring-4 ring-blue-50 dark:ring-blue-900/20">
                      {review.name.charAt(0)}
                    </div>
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white dark:border-[#121212] rounded-full"></div>
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white text-[15px]">{review.name}</div>
                    <div className="text-xs font-medium text-slate-500">Verified Customer</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-24 px-4 bg-white dark:bg-[#121212]">
        <div className="max-w-[800px] mx-auto animate-[slideInUp_0.8s_ease-out]">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mb-4">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-6">
            {[
              {
                q: 'Where is the best mobile repair shop in Coimbatore?',
                a: 'Amohamobiles at Therveethi, Idikarai, Coimbatore is one of the best mobile repair shops in Coimbatore. We offer screen replacement, battery change, charging port repair, water damage repair and more with genuine parts and warranty.',
              },
              {
                q: 'How much does mobile screen replacement cost in Coimbatore?',
                a: 'Screen replacement at Amohamobiles, Coimbatore starts from ₹799 depending on the device model. We use genuine or high-quality OEM parts for Samsung, iPhone, OnePlus, Xiaomi, Realme and all major brands.',
              },
              {
                q: 'Do you repair iPhones in Coimbatore?',
                a: 'Yes, Amohamobiles provides professional iPhone repair services in Coimbatore. We repair all iPhone models – screen, battery, charging port, back glass and more at competitive prices with warranty.',
              },
              {
                q: 'How long does mobile repair take at your Coimbatore shop?',
                a: 'Most repairs at our Idikarai, Coimbatore store are completed within 30 minutes to 2 hours. Complex repairs like motherboard or water damage may take 1–2 days. Walk in Monday to Saturday, 10AM–8PM.',
              },
              {
                q: 'Do you offer home pickup for mobile repair in Coimbatore?',
                a: 'Yes, Amohamobiles offers doorstep mobile repair service and pickup across Coimbatore – Idikarai, Gandhipuram, RS Puram, Saravanampatti, Peelamedu and nearby areas. Contact us on WhatsApp at +91 63801 23183.',
              },
            ].map(({ q, a }, index) => (
              <div 
                key={q} 
                onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                className={`relative p-6 sm:px-8 rounded-[20px] transition-all duration-350 cursor-pointer overflow-hidden border border-slate-100 dark:border-white/10 ${
                  openFaqIndex === index 
                    ? 'bg-white dark:bg-[#1a1a1a] shadow-[0_8px_30px_rgb(37,99,235,0.1)] dark:shadow-[0_8px_30px_rgb(37,99,235,0.2)]' 
                    : 'bg-white dark:bg-[#1a1a1a] shadow-sm hover:-translate-y-1 hover:shadow-lg'
                }`}
              >
                {/* Gradient Accent Border on Left */}
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-indigo-600" />
                
                <div className="flex justify-between items-center gap-4">
                  <h3 className={`text-[17px] font-bold transition-colors duration-350 ${openFaqIndex === index ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-300'}`}>
                    {q}
                  </h3>
                  <div className={`w-8 h-8 shrink-0 rounded-full flex items-center justify-center transition-all duration-350 ${openFaqIndex === index ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rotate-180' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-slate-500'}`}>
                    <HiOutlineChevronDown className="w-5 h-5" />
                  </div>
                </div>
                <div 
                  className={`overflow-hidden transition-all duration-350 ease-in-out ${
                    openFaqIndex === index ? 'max-h-[300px] opacity-100 mt-5' : 'max-h-0 opacity-0 mt-0'
                  }`}
                >
                  <p className="text-[15px] font-medium text-slate-500 dark:text-slate-400 leading-relaxed pr-8">
                    {a}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Request Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-md transition-opacity">
          <div className="w-full max-w-[480px] max-h-[90vh] overflow-hidden rounded-[20px] bg-white dark:bg-[#0f0f0f] shadow-2xl relative animate-[slideInUp_0.25s_ease-out] flex flex-col">
            
            {/* Header */}
            <div className="relative bg-gradient-to-r from-blue-600 to-indigo-600 p-5 sm:p-6 text-white shrink-0">
              <div className="absolute top-4 right-4">
                <button
                  onClick={() => setShowForm(false)}
                  className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition-all hover:scale-110 active:scale-95"
                >
                  <HiOutlineX className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center backdrop-blur-md shrink-0 shadow-inner">
                  <HiOutlineCog className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight mb-0.5">Request Repair</h2>
                  <p className="text-blue-100 font-medium text-[13px]">Fill in details for {selectedService}</p>
                </div>
              </div>
            </div>
            
            {/* Form */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {/* 1-Column Grid */}
                <div className="grid grid-cols-1 gap-4">
                  {/* Service Type */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Service Type <span className="text-blue-600 dark:text-blue-400">*</span>
                    </label>
                    <div className="relative">
                      <div 
                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className={`relative flex items-center w-full h-[46px] bg-white dark:bg-[#1a1a1a] rounded-[12px] border ${isDropdownOpen ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-slate-200 dark:border-white/10'} transition-all shadow-sm group cursor-pointer`}
                      >
                        <div className={`absolute left-1.5 w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDropdownOpen ? 'bg-blue-100 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400' : 'bg-blue-50 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-500/30'}`}>
                          <HiOutlineCog className="w-[18px] h-[18px]" />
                        </div>
                        <div className="w-full h-full pl-11 pr-10 flex items-center">
                          <span className={`text-[14px] font-medium ${form.serviceType ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                            {form.serviceType || 'Select a service'}
                          </span>
                        </div>
                        <div className={`absolute right-3 transition-transform duration-300 ${isDropdownOpen ? 'rotate-180 text-blue-500' : 'text-slate-400'}`}>
                          <HiOutlineChevronDown className="w-[18px] h-[18px]" />
                        </div>
                      </div>

                      {isDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
                          <div className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 max-h-[220px] overflow-y-auto rounded-[12px] border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-[#121212]/95 animate-[slideInUp_0.15s_ease-out]">
                            <div className="p-1.5 space-y-0.5">
                              {ALL_SERVICE_NAMES.map((s) => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => {
                                    setForm({ ...form, serviceType: s });
                                    setIsDropdownOpen(false);
                                  }}
                                  className={`flex w-full items-center px-3 py-2.5 rounded-[8px] text-left text-[13px] font-medium transition-all ${
                                    form.serviceType === s
                                      ? 'bg-blue-500 text-white shadow-md'
                                      : 'text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/10'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {/* Name */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Your Name <span className="text-blue-600 dark:text-blue-400">*</span>
                    </label>
                    <div className="relative flex items-center w-full h-[46px] bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-sm group">
                      <div className="absolute left-1.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-focus-within:bg-blue-100 dark:group-focus-within:bg-blue-500/30 transition-colors">
                        <HiOutlineUser className="w-[18px] h-[18px]" />
                      </div>
                      <input 
                        name="customerName" 
                        value={form.customerName} 
                        onChange={handleChange} 
                        className="w-full h-full pl-11 pr-3 rounded-[12px] bg-transparent outline-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal" 
                        placeholder="e.g. John Doe" 
                      />
                    </div>
                  </div>

                  {/* Phone & Email (2 columns only on very large, or just keep them 1 column) */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Phone <span className="text-blue-600 dark:text-blue-400">*</span>
                      </label>
                      <div className="relative flex items-center w-full h-[46px] bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-sm group">
                        <div className="absolute left-1.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-focus-within:bg-blue-100 dark:group-focus-within:bg-blue-500/30 transition-colors">
                          <HiOutlinePhone className="w-[18px] h-[18px]" />
                        </div>
                        <input 
                          name="customerPhone" 
                          value={form.customerPhone} 
                          onChange={handleChange} 
                          className="w-full h-full pl-11 pr-3 rounded-[12px] bg-transparent outline-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal" 
                          placeholder="+91 98765..." 
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Email <span className="text-blue-600 dark:text-blue-400">*</span>
                      </label>
                      <div className="relative flex items-center w-full h-[46px] bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-sm group">
                        <div className="absolute left-1.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-focus-within:bg-blue-100 dark:group-focus-within:bg-blue-500/30 transition-colors">
                          <HiOutlineMail className="w-[18px] h-[18px]" />
                        </div>
                        <input 
                          name="customerEmail" 
                          type="email" 
                          value={form.customerEmail} 
                          onChange={handleChange} 
                          className="w-full h-full pl-11 pr-3 rounded-[12px] bg-transparent outline-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal" 
                          placeholder="hello@.." 
                        />
                      </div>
                    </div>
                  </div>
                  
                  {/* Device Brand & Model */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Brand <span className="text-blue-600 dark:text-blue-400">*</span>
                      </label>
                      <div className="relative flex items-center w-full h-[46px] bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-sm group">
                        <div className="absolute left-1.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-focus-within:bg-blue-100 dark:group-focus-within:bg-blue-500/30 transition-colors">
                          <HiOutlineDeviceMobile className="w-[18px] h-[18px]" />
                        </div>
                        <input 
                          name="deviceBrand" 
                          value={form.deviceBrand} 
                          onChange={handleChange} 
                          className="w-full h-full pl-11 pr-3 rounded-[12px] bg-transparent outline-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal" 
                          placeholder="Apple" 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                        Model <span className="text-blue-600 dark:text-blue-400">*</span>
                      </label>
                      <div className="relative flex items-center w-full h-[46px] bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-sm group">
                        <div className="absolute left-1.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-focus-within:bg-blue-100 dark:group-focus-within:bg-blue-500/30 transition-colors">
                          <HiOutlineDeviceMobile className="w-[18px] h-[18px]" />
                        </div>
                        <input 
                          name="deviceModel" 
                          value={form.deviceModel} 
                          onChange={handleChange} 
                          className="w-full h-full pl-11 pr-3 rounded-[12px] bg-transparent outline-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal" 
                          placeholder="iPhone 14" 
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Details */}
                  <div>
                    <label className="block text-[12px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
                      Additional Details
                    </label>
                    <div className="relative flex w-full bg-white dark:bg-[#1a1a1a] rounded-[12px] border border-slate-200 dark:border-white/10 focus-within:border-blue-500 focus-within:ring-4 focus-within:ring-blue-500/20 transition-all shadow-sm group">
                      <div className="absolute left-1.5 top-1.5 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 group-focus-within:bg-blue-100 dark:group-focus-within:bg-blue-500/30 transition-colors">
                        <HiOutlineDocumentText className="w-[18px] h-[18px]" />
                      </div>
                      <textarea
                        name="description"
                        value={form.description}
                        onChange={handleChange}
                        className="w-full pl-11 pr-3 py-2.5 rounded-[12px] bg-transparent outline-none text-[14px] font-medium text-slate-900 dark:text-white placeholder:text-slate-400 placeholder:font-normal min-h-[72px] resize-y"
                        placeholder="Describe the issue..."
                      />
                    </div>
                  </div>
                </div>
                
                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full h-[46px] flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-blue-600 to-indigo-600 text-[14px] font-bold text-white transition-all duration-300 hover:shadow-[0_8px_24px_rgb(37,99,235,0.25)] hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:active:scale-100"
                  >
                    <HiOutlinePaperAirplane className={`w-[18px] h-[18px] ${isSubmitting ? 'animate-pulse' : 'rotate-90'}`} />
                    {isSubmitting ? 'Submitting...' : 'Send Request'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
