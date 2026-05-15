'use client';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineMail, HiOutlinePhone, HiOutlineLocationMarker, HiOutlineChat } from 'react-icons/hi';
import { useSettingsStore } from '@/store/settings.store';

const footerLinks = {
  shop: [
    { label: 'All Mobiles', href: '/products' },
    { label: 'Featured Deals', href: '/products?sort=popular' },
    { label: 'New Arrivals', href: '/products?sort=newest' },
    { label: 'Repair Services', href: '/services' },
    { label: 'Shop in Coimbatore', href: '/products' },
  ],
  account: [
    { label: 'My Profile', href: '/profile' },
    { label: 'My Orders', href: '/orders' },
    { label: 'Wishlist', href: '/wishlist' },
    { label: 'Contact Us', href: '/contact' },
    { label: 'About Us', href: '/about' },
  ],
  policies: [
    { label: 'Privacy Policy', href: '/privacy-policy' },
    { label: 'Terms of Service', href: '/terms' },
    { label: 'Return Policy', href: '/return-policy' },
    { label: 'Shipping Info', href: '/shipping-info' },
  ],
};

const footerHighlights = ['Secure Payments', 'Easy Returns', 'Fast Shipping', 'Trusted Support'];

export default function Footer() {
  const { settings } = useSettingsStore();
  const siteName = settings?.siteName || 'AMOHA Mobiles';
  const contactEmail = settings?.contactEmail || 'support@amoha.in';
  const contactPhone = settings?.contactPhone || '+91 63801 23183';
  const address = settings?.address || 'Therveethi, Idikarai, Coimbatore, Tamil Nadu';

  return (
    <footer className="border-t border-slate-200/80 bg-slate-50 dark:border-white/[0.05] dark:bg-surface-50">
      <div className="page-container py-8 sm:py-10 lg:py-14">
        <div className="grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4 lg:gap-12">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" prefetch={true} className="flex items-center gap-2">
              {settings?.logo ? (
                <Image
                  src={settings.logo}
                  alt={siteName}
                  width={36}
                  height={36}
                  className="h-9 w-9 rounded-xl object-contain"
                />
              ) : (
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary font-bold text-white">
                  {siteName.charAt(0)}
                </div>
              )}
              <span className="text-lg font-bold text-slate-900 dark:text-white">{siteName}</span>
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
              Amohamobiles – your trusted mobile shop in Idikarai, Coimbatore. Buy latest smartphones, accessories & get expert phone repairs at the best prices in Tamil Nadu.
            </p>
            <div className="mt-5 space-y-2.5">
              <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-accent-600 dark:hover:text-accent-400 break-all">
                <HiOutlineMail className="h-4 w-4 flex-shrink-0" />
                {contactEmail}
              </a>
              <a href={`tel:${contactPhone.replace(/\s/g, '')}`} className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 transition-colors hover:text-accent-600 dark:hover:text-accent-400">
                <HiOutlinePhone className="h-4 w-4 flex-shrink-0" />
                {contactPhone}
              </a>
              <a
                href={`https://wa.me/${contactPhone.replace(/[^0-9]/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 transition-colors hover:text-green-500"
              >
                <HiOutlineChat className="h-4 w-4 flex-shrink-0" />
                WhatsApp Us
              </a>
              <a
              href="https://maps.google.com/?q=Idikarai,Coimbatore,Tamil+Nadu"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-start gap-2 text-sm text-slate-500 dark:text-slate-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors"
            >
              <HiOutlineLocationMarker className="h-4 w-4 flex-shrink-0 mt-0.5" />
              <span>{address}</span>
            </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              {footerHighlights.map((item) => (
                <span
                  key={item}
                  className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-medium text-slate-600 dark:border-white/[0.08] dark:bg-surface-200 dark:text-slate-400"
                >
                  {item}
                </span>
              ))}
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              Supports UPI, cards, wallets, EMI, COD, and selected international payments.
            </p>
          </div>

          {/* Shop */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Shop</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.shop.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} prefetch={true} className="text-sm text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Account */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Account</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.account.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} prefetch={true} className="text-sm text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Legal & Policies</h3>
            <ul className="mt-4 space-y-3">
              {footerLinks.policies.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} prefetch={true} className="text-sm text-slate-500 transition-colors hover:text-slate-800 dark:hover:text-slate-200">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs leading-relaxed text-slate-400 dark:text-slate-500">
              Review our privacy, returns, shipping, and service terms before placing an order.
            </p>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-8 border-t border-slate-200/60 pt-6 dark:border-white/[0.04] sm:mt-10 sm:pt-8">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500 sm:text-sm">
              &copy; {new Date().getFullYear()} {siteName} Mobiles. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {footerLinks.policies.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  prefetch={true}
                  className="rounded-full border border-slate-200 px-2 py-0.5 text-[11px] text-slate-500 transition-colors hover:border-slate-400 hover:text-slate-700 dark:border-white/[0.07] dark:text-slate-400 dark:hover:border-white/[0.15] dark:hover:text-slate-200 sm:px-3 sm:py-1 sm:text-xs"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400 dark:text-slate-500">
              Accepted payments: UPI, Visa, Mastercard, RuPay, net banking, EMI, COD, and selected international cards.
            </p>
            <span className="text-xs text-slate-400 dark:text-slate-500">
              Mobile Shop in Idikarai, Coimbatore, Tamil Nadu
            </span>
          </div>
        </div>
      </div>

      {/* Hide Vercel "Powered by Next.js" badge */}
      <style jsx global>{`
        [data-testid="vercel-footer"] {
          display: none !important;
        }
      `}</style>
    </footer>
  );
}
