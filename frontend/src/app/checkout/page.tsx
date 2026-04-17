'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Script from 'next/script';
import { HiOutlineLocationMarker, HiOutlineShieldCheck } from 'react-icons/hi';
import toast from 'react-hot-toast';
import type { Address } from '@/types';
import { useCartStore } from '@/store/cart.store';
import { useAuthStore } from '@/store/auth.store';
import { orderService } from '@/services/order.service';
import { formatPrice } from '@/lib/utils';

const paymentMethods = [
  { id: 'razorpay', label: 'Pay Online (Razorpay)', icon: '💳', description: 'UPI · Cards · Net Banking · Wallets · EMI' },
  { id: 'cod', label: 'Cash on Delivery', icon: '💵', description: 'Pay in cash at delivery' },
];

export default function CheckoutPage() {
  const router = useRouter();
  const { items, subtotal, discount, deliveryCharge, totalAmount, coupon, clearCart } = useCartStore();
  const { isAuthenticated, user } = useAuthStore();

  const [selectedPayment, setSelectedPayment] = useState('razorpay');
  const [isPlacing, setIsPlacing] = useState(false);
  const [razorpayLoaded, setRazorpayLoaded] = useState(
    typeof window !== 'undefined' && typeof (window as any).Razorpay !== 'undefined',
  );

  // Sync razorpayLoaded if the script was already in the DOM on mount
  // (happens when navigating back to checkout without a full page reload)
  useEffect(() => {
    if (typeof (window as any).Razorpay !== 'undefined') {
      setRazorpayLoaded(true);
    }
  }, []);
  const [address, setAddress] = useState<Omit<Address, '_id' | 'isDefault'>>({
    fullName: user?.name || '',
    phone: user?.phone || '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: '',
    type: 'home',
  });

  if (!isAuthenticated) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <p className="text-5xl"></p>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Login Required</h2>
        <p className="mt-2 text-sm text-gray-500">Please login to proceed with checkout.</p>
        <button onClick={() => router.push('/login')} className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
          Sign In
        </button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <p className="text-5xl"></p>
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Cart is empty</h2>
        <p className="mt-2 text-sm text-gray-500">Add items to your cart before checkout.</p>
        <button onClick={() => router.push('/')} className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
          Shop Now
        </button>
      </div>
    );
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setAddress((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const validateAddress = () => {
    if (!address.fullName || !address.phone || !address.addressLine1 || !address.city || !address.state || !address.pincode) {
      toast.error('Please fill all required address fields');
      return false;
    }
    const phoneDigits = address.phone.replace(/[^0-9]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 12) {
      toast.error('Please enter a valid phone number');
      return false;
    }
    if (!/^\d{6}$/.test(address.pincode)) {
      toast.error('Pincode must be 6 digits');
      return false;
    }
    return true;
  };

  /** Load Razorpay checkout.js on-demand and resolve once window.Razorpay is available. */
  const ensureRazorpayLoaded = (): Promise<void> =>
    new Promise<void>((resolve, reject) => {
      if (typeof (window as any).Razorpay !== 'undefined') {
        resolve();
        return;
      }
      const TIMEOUT_MS = 12_000;
      const timer = setTimeout(
        () => reject(new Error('Payment gateway timed out. Check your internet connection and try again.')),
        TIMEOUT_MS,
      );
      const onLoad = () => { clearTimeout(timer); setRazorpayLoaded(true); resolve(); };
      const onError = () => { clearTimeout(timer); reject(new Error('Payment gateway failed to load. Please refresh the page.')); };
      // If the <Script> tag is already in the DOM (strategy=afterInteractive added it), listen on it
      const existing = document.querySelector<HTMLScriptElement>('script[src*="razorpay"]');
      if (existing) {
        existing.addEventListener('load', onLoad, { once: true });
        existing.addEventListener('error', onError, { once: true });
      } else {
        // Fallback: inject the script ourselves
        const s = document.createElement('script');
        s.src = 'https://checkout.razorpay.com/v1/checkout.js';
        s.async = true;
        s.addEventListener('load', onLoad, { once: true });
        s.addEventListener('error', onError, { once: true });
        document.head.appendChild(s);
      }
    });

  const handleRazorpayPayment = async () => {
    setIsPlacing(true);

    // Ensure the SDK is ready — load it on-demand if needed instead of hard-failing
    if (typeof (window as any).Razorpay === 'undefined') {
      const loadingToast = toast.loading('Loading payment gateway…');
      try {
        await ensureRazorpayLoaded();
        toast.dismiss(loadingToast);
      } catch (loadErr: any) {
        toast.dismiss(loadingToast);
        toast.error(loadErr?.message || 'Payment gateway failed to load. Please refresh.');
        setIsPlacing(false);
        return;
      }
    }
    try {
      const rzpOrder = await orderService.createRazorpayOrder(coupon?.code);

      const options: RazorpayOptions = {
        key: rzpOrder.keyId,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        name: 'AMOHA Mobiles',
        description: 'Order Payment',
        order_id: rzpOrder.razorpayOrderId,
        prefill: {
          name: address.fullName,
          contact: address.phone,
          email: user?.email || '',
        },
        theme: { color: '#6d28d9' },
        modal: {
          ondismiss: () => {
            document.body.style.overflow = '';
            document.body.style.paddingRight = '';
            setIsPlacing(false);
            toast.error('Payment cancelled');
          },
        },
        handler: async (response: RazorpayPaymentResponse) => {
          document.body.style.overflow = '';
          document.body.style.paddingRight = '';
          try {
            const order = await orderService.verifyPayment({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              shippingAddress: { ...address, _id: '', isDefault: false },
              couponCode: coupon?.code,
            });
            await clearCart();
            router.push(`/order-success?id=${order._id}`);
          } catch {
            toast.error('Payment verification failed. Please contact support.');
            setIsPlacing(false);
          }
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: any) => {
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        const msg =
          response?.error?.description ||
          response?.error?.reason ||
          'Payment failed. Please try again.';
        toast.error(msg);
        setIsPlacing(false);
      });
      rzp.open();
    } catch (err: any) {
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
      const msg = err?.response?.data?.message || 'Failed to initiate payment. Please try again.';
      toast.error(msg);
      setIsPlacing(false);
    }
  };

  const handleCodOrder = async () => {
    setIsPlacing(true);
    try {
      const order = await orderService.create({
        shippingAddress: { ...address, _id: '', isDefault: false },
        paymentMethod: 'cod',
        couponCode: coupon?.code,
      });
      await clearCart();
      router.push(`/order-success?id=${order._id}`);
    } catch {
      toast.error('Failed to place order. Please try again.');
      setIsPlacing(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!validateAddress()) return;
    if (selectedPayment === 'razorpay') {
      await handleRazorpayPayment();
    } else {
      await handleCodOrder();
    }
  };

  const buttonLabel = isPlacing
    ? selectedPayment === 'razorpay'
      ? 'Opening Payment...'
      : 'Placing Order...'
    : selectedPayment === 'razorpay'
    ? `Pay Now · ${formatPrice(totalAmount)}`
    : `Place Order · ${formatPrice(totalAmount)}`;

  return (
    <>
      {/* Load Razorpay SDK — afterInteractive fires as soon as Next.js hydrates the page,
           much faster than lazyOnload which waits for all assets to finish loading. */}
      <Script
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
        onLoad={() => setRazorpayLoaded(true)}
        onError={() => toast.error('Payment gateway script failed to load. Please refresh.')}
      />

      <div className="page-container py-6 sm:py-10">
        <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">Checkout</h1>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="min-w-0 space-y-6 lg:col-span-2">
            {/* Shipping Address */}
            <div className="glass-card p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <HiOutlineLocationMarker className="h-5 w-5 text-primary-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">Shipping Address</h2>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Full Name *</label>
                  <input name="fullName" value={address.fullName} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="John Doe" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Phone *</label>
                  <input name="phone" value={address.phone} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="+91 98765 43210" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Address Line 1 *</label>
                  <input name="addressLine1" value={address.addressLine1} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="House/Flat No., Street" />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Address Line 2</label>
                  <input name="addressLine2" value={address.addressLine2} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="Landmark (optional)" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">City *</label>
                  <input name="city" value={address.city} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="Mumbai" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">State *</label>
                  <input name="state" value={address.state} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="Maharashtra" />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Pincode *</label>
                  <input name="pincode" value={address.pincode} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm" placeholder="400001" maxLength={6} />
                </div>
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">Address Type</label>
                  <select name="type" value={address.type} onChange={handleInputChange} className="glass-input py-2.5 text-base sm:text-sm">
                    <option value="home" className="bg-surface-100">Home</option>
                    <option value="work" className="bg-surface-100">Work</option>
                    <option value="other" className="bg-surface-100">Other</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Payment Method */}
            <div className="glass-card p-4 sm:p-5 md:p-6">
              <div className="flex items-center gap-2 mb-4 sm:mb-5">
                <HiOutlineShieldCheck className="h-5 w-5 text-primary-400" />
                <h2 className="text-base font-bold text-gray-900 dark:text-white sm:text-lg">Payment Method</h2>
              </div>
              <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedPayment(method.id)}
                    className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition-all sm:gap-3 sm:p-4 ${
                      selectedPayment === method.id
                        ? 'border-primary-500 bg-primary-500/10 shadow-glow'
                        : 'border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 hover:border-gray-300 dark:hover:border-white/20'
                    }`}
                  >
                    <span className="text-xl sm:text-2xl flex-shrink-0">{method.icon}</span>
                    <div className="min-w-0">
                      <span className={`block text-sm font-medium ${selectedPayment === method.id ? 'text-primary-400' : 'text-gray-900 dark:text-white'}`}>
                        {method.label}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{method.description}</span>
                    </div>
                  </button>
                ))}
              </div>
              {selectedPayment === 'razorpay' && (
                <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                  <p className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <HiOutlineShieldCheck className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                    <span>Secured by <strong className="text-gray-700 dark:text-gray-200">Razorpay</strong> · PCI-DSS Level 1 · 256-bit SSL</span>
                  </p>
                  <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">Accepts: UPI (GPay, PhonePe, Paytm) · Debit/Credit Cards · Net Banking (50+ banks) · Wallets · EMI</p>
                </div>
              )}
              {selectedPayment === 'cod' && (
                <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                  <HiOutlineShieldCheck className="h-4 w-4 text-amber-400" />
                  Cash on Delivery available up to ₹50,000 · COD fee of ₹49 may apply on orders below ₹999
                </p>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="min-w-0 lg:col-span-1">
            <div className="glass-card sticky top-20 p-4 sm:top-24 sm:p-5">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Order Summary</h3>

              <div className="mt-4 max-h-60 space-y-3 overflow-y-auto pr-1">
                {items.filter((i) => i.product).map((item) => (
                  <div key={item._id} className="flex gap-3">
                    <div className="relative h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-white/5">
                      <Image src={item.product?.thumbnail || '/images/no-product.svg'} alt={item.product?.name || 'Product'} fill className="object-cover" sizes="56px" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{item.product?.name || 'Product'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                    </div>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">{formatPrice(item.totalPrice)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-t border-gray-200 dark:border-white/5 pt-4">
                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Subtotal</span><span className="text-gray-900 dark:text-white">{formatPrice(subtotal)}</span></div>
                {discount > 0 && <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Discount</span><span className="text-emerald-400">−{formatPrice(discount)}</span></div>}
                <div className="flex justify-between text-sm"><span className="text-gray-500 dark:text-gray-400">Delivery</span><span className={deliveryCharge === 0 ? 'text-emerald-400' : 'text-gray-900 dark:text-white'}>{deliveryCharge === 0 ? 'FREE' : formatPrice(deliveryCharge)}</span></div>
                <div className="flex justify-between border-t border-gray-200 dark:border-white/10 pt-3 text-base font-bold"><span className="text-gray-900 dark:text-white">Total</span><span className="gradient-text">{formatPrice(totalAmount)}</span></div>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={isPlacing}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isPlacing ? (
                  <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> {buttonLabel}</>
                ) : buttonLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
