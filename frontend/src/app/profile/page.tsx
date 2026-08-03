'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLogout, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiX, HiOutlineShieldCheck, HiOutlineIdentification, HiOutlineUpload, HiOutlinePhotograph, HiOutlineCog, HiOutlineChevronRight, HiOutlineClock, HiOutlineTruck, HiOutlineCheckCircle } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { userService } from '@/services/user.service';
import { orderService } from '@/services/order.service';
import { wishlistService } from '@/services/wishlist.service';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Address, KycInfo, Order, WishlistItem } from '@/types';

const emptyAddress = {
  fullName: '',
  phone: '',
  addressLine1: '',
  addressLine2: '',
  city: '',
  state: '',
  pincode: '',
  isDefault: false,
  type: 'home' as 'home' | 'work' | 'other',
};

export default function ProfilePage() {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout, fetchProfile, updateProfile } = useAuthStore();
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addressForm, setAddressForm] = useState(emptyAddress);
  const [isSavingAddress, setIsSavingAddress] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const avatarFileRef = useRef<HTMLInputElement>(null);

  // KYC state
  const [kycInfo, setKycInfo] = useState<KycInfo | null>(null);
  const [showKycForm, setShowKycForm] = useState(false);
  const [kycForm, setKycForm] = useState<{ documentType: 'aadhaar' | 'pan' | 'passport' | 'voter_id'; documentNumber: string; fullName: string; documentImage: string }>({ documentType: 'aadhaar', documentNumber: '', fullName: '', documentImage: '' });
  const [isSubmittingKyc, setIsSubmittingKyc] = useState(false);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const kycFileRef = useRef<HTMLInputElement>(null);
  
  // Dashboard state
  const [orders, setOrders] = useState<Order[]>([]);
  const [wishlistCount, setWishlistCount] = useState(0);
  const [isLoadingStats, setIsLoadingStats] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'addresses', 'kyc'

  useEffect(() => {
    if (isAuthenticated) {
      userService.getKycStatus().then(setKycInfo).catch(() => {});
      
      const fetchStats = async () => {
        try {
          const [ordersData, wishlistData] = await Promise.all([
            orderService.getAll(1, 10),
            wishlistService.getAll()
          ]);
          setOrders(ordersData.orders || []);
          setWishlistCount(wishlistData.length || 0);
        } catch (error) {
          console.error('Failed to fetch stats', error);
        } finally {
          setIsLoadingStats(false);
        }
      };
      fetchStats();
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center bg-gray-50 dark:bg-gray-900 min-h-screen">
        <HiOutlineShieldCheck className="h-16 w-16 text-gray-300 dark:text-gray-600 mb-6" />
        <h2 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">Login Required</h2>
        <p className="mt-3 text-base text-gray-500 max-w-sm">Please sign in to view and manage your profile dashboard.</p>
        <Link href="/login" className="mt-8 rounded-full bg-blue-600 px-10 py-3.5 text-sm font-bold text-white transition-all duration-300 hover:bg-blue-700 shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 hover:-translate-y-0.5 active:scale-95">
          Sign In
        </Link>
      </div>
    );
  }

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    router.push('/');
  };

  const handleAvatarUpload = async (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB');
      return;
    }
    const allowed = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowed.includes(file.type)) {
      toast.error('Only JPEG, PNG, or WebP images allowed');
      return;
    }
    setIsUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const token = document.cookie.split('; ').find(c => c.startsWith('token='))?.split('=')[1] || '';
      const res = await fetch('/api/upload/avatar', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      const data = await res.json();
      if (data.data?.url) {
        await updateProfile({ avatar: data.data.url });
        toast.success('Profile photo updated');
      } else {
        toast.error('Upload failed');
      }
    } catch {
      toast.error('Failed to upload photo');
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const openAddForm = () => {
    setEditingAddress(null);
    setAddressForm(emptyAddress);
    setShowAddressForm(true);
  };

  const openEditForm = (addr: Address) => {
    setEditingAddress(addr);
    setAddressForm({
      fullName: addr.fullName,
      phone: addr.phone,
      addressLine1: addr.addressLine1,
      addressLine2: addr.addressLine2 || '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
      type: addr.type,
    });
    setShowAddressForm(true);
  };

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.addressLine1 || !addressForm.city || !addressForm.state || !addressForm.pincode) {
      toast.error('Please fill all required fields');
      return;
    }
    setIsSavingAddress(true);
    try {
      if (editingAddress) {
        await userService.updateAddress(editingAddress._id, addressForm);
        toast.success('Address updated');
      } else {
        await userService.addAddress(addressForm);
        toast.success('Address added');
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      await fetchProfile();
    } catch {
      toast.error('Failed to save address');
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    setDeletingId(addressId);
    try {
      await userService.deleteAddress(addressId);
      toast.success('Address deleted');
      await fetchProfile();
    } catch {
      toast.error('Failed to delete address');
    } finally {
      setDeletingId(null);
    }
  };

  const handleKycSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.fullName || !kycForm.documentNumber) {
      toast.error('Please fill all required fields');
      return;
    }
    if (!kycForm.documentImage) {
      toast.error('Please upload your document image');
      return;
    }
    setIsSubmittingKyc(true);
    try {
      const result = await userService.submitKyc(kycForm);
      setKycInfo(result);
      setShowKycForm(false);
      toast.success('KYC submitted successfully');
    } catch {
      toast.error('Failed to submit KYC');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  const handleDocUpload = async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    setIsUploadingDoc(true);
    try {
      const res = await fetch(`/api/upload/kyc`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${document.cookie.split('token=')[1]?.split(';')[0] || ''}` },
        body: formData,
      });
      const data = await res.json();
      if (data.data?.url) {
        setKycForm((p) => ({ ...p, documentImage: data.data.url }));
        toast.success('Document uploaded');
      } else {
        toast.error('Upload failed');
      }
    } catch {
      toast.error('Upload failed');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const kycStatusColor = {
    not_submitted: 'text-gray-500',
    pending: 'text-amber-500',
    verified: 'text-emerald-500',
    rejected: 'text-red-500',
  };

  const kycStatusLabel = {
    not_submitted: 'Not Submitted',
    pending: 'Under Review',
    verified: 'Verified',
    rejected: 'Rejected',
  };
  
  // Computed Stats
  const totalOrders = orders.length;
  const deliveredOrders = orders.filter(o => o.orderStatus === 'delivered').length;
  const pendingOrders = orders.filter(o => ['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery'].includes(o.orderStatus)).length;
  
  const navItems = [
    { id: 'overview', icon: HiOutlineUser, label: 'Profile Overview' },
    { id: 'orders', icon: HiOutlineShoppingBag, label: 'My Orders', href: '/orders' },
    { id: 'wishlist', icon: HiOutlineHeart, label: 'Wishlist', href: '/wishlist' },
    { id: 'addresses', icon: HiOutlineLocationMarker, label: 'Saved Addresses' },
    { id: 'kyc', icon: HiOutlineIdentification, label: 'KYC & Verification' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 sm:py-12">
      <div className="page-container max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* LEFT SIDEBAR */}
          <div className="w-full lg:w-80 flex-shrink-0 space-y-6">
            
            {/* Profile Card */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center relative overflow-hidden group">
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10" />
              
              <div className="relative mt-6 mb-4 h-24 w-24 rounded-full p-1 bg-white dark:bg-gray-900 shadow-sm z-10">
                <div className="relative h-full w-full rounded-full overflow-hidden bg-gray-100 dark:bg-gray-800">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={user.name || 'Profile'} fill className="object-cover" sizes="96px" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 text-3xl font-bold text-white shadow-inner">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                  )}
                  
                  {/* Avatar Upload Overlay */}
                  <label className="absolute inset-0 bg-black/50 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {isUploadingAvatar ? (
                      <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    ) : (
                      <>
                        <HiOutlinePhotograph className="h-6 w-6 mb-1" />
                        <span className="text-[10px] font-bold tracking-wider uppercase">Change</span>
                      </>
                    )}
                    <input type="file" ref={avatarFileRef} accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleAvatarUpload(file);
                      e.target.value = '';
                    }} />
                  </label>
                </div>
              </div>
              
              <h2 className="text-xl font-black text-gray-900 dark:text-white z-10">{user.name || 'User'}</h2>
              <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400 z-10">{user.email}</p>
              
              <div className="mt-6 flex w-full">
                <button className="w-full flex items-center justify-center gap-2 rounded-xl bg-gray-50 dark:bg-gray-800 py-3 text-sm font-bold text-gray-700 dark:text-gray-300 transition-all hover:bg-gray-100 dark:hover:bg-gray-700">
                  <HiOutlinePencil className="h-4 w-4" /> Edit Profile
                </button>
              </div>
            </div>

            {/* Navigation Menu */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-3 shadow-sm border border-gray-100 dark:border-gray-800 hidden lg:block">
              <nav className="flex flex-col gap-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id && !item.href;
                  const NavComponent = item.href ? Link : 'button';
                  return (
                    <NavComponent
                      key={item.id}
                      href={item.href || '#'}
                      onClick={() => !item.href && setActiveTab(item.id)}
                      className={`flex items-center justify-between w-full rounded-xl px-4 py-3.5 text-sm font-bold transition-all ${
                        isActive 
                          ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className={`h-5 w-5 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}`} />
                        {item.label}
                      </div>
                      <HiOutlineChevronRight className={`h-4 w-4 ${isActive ? 'text-blue-600 dark:text-blue-400' : 'opacity-0'}`} />
                    </NavComponent>
                  );
                })}
              </nav>
              <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-xl px-4 py-3.5 text-sm font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                  <HiOutlineLogout className="h-5 w-5" /> Sign Out
                </button>
              </div>
            </div>
            
          </div>

          {/* RIGHT CONTENT AREA */}
          <div className="flex-1 min-w-0 space-y-8">
            
            {/* Mobile Navigation (Visible only on mobile) */}
            <div className="lg:hidden overflow-x-auto pb-4 scrollbar-hide flex gap-2">
              {navItems.map((item) => {
                const isActive = activeTab === item.id && !item.href;
                const NavComponent = item.href ? Link : 'button';
                return (
                  <NavComponent
                    key={item.id}
                    href={item.href || '#'}
                    onClick={() => !item.href && setActiveTab(item.id)}
                    className={`flex items-center gap-2 flex-shrink-0 rounded-full px-5 py-2.5 text-sm font-bold transition-all ${
                      isActive 
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20' 
                        : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </NavComponent>
                );
              })}
            </div>

            {activeTab === 'overview' && (
              <>
                {/* Summary Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { title: 'Total Orders', value: totalOrders, icon: HiOutlineShoppingBag, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-500/10' },
                    { title: 'Delivered', value: deliveredOrders, icon: HiOutlineCheckCircle, color: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
                    { title: 'Pending', value: pendingOrders, icon: HiOutlineClock, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                    { title: 'Wishlist', value: wishlistCount, icon: HiOutlineHeart, color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                  ].map((stat, i) => (
                    <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 transition-all hover:shadow-md hover:-translate-y-0.5 group">
                      <div className={`h-10 w-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                        <stat.icon className="h-5 w-5" />
                      </div>
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">{stat.title}</p>
                      <p className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                        {isLoadingStats ? <span className="inline-block h-6 w-12 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" /> : stat.value}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Personal Information */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Personal Information</h3>
                    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider ${user.isVerified ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400'}`}>
                      {user.isVerified ? <HiOutlineShieldCheck className="h-4 w-4" /> : <HiOutlineClock className="h-4 w-4" />}
                      {user.isVerified ? 'Verified Account' : 'Pending Verification'}
                    </div>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Full Name</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.name}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Email Address</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.email}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Phone Number</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{user.phone || 'Not provided'}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400 mb-1">Member Since</p>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Recent Orders */}
                <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">Recent Orders</h3>
                    {orders.length > 0 && (
                      <Link href="/orders" className="text-sm font-bold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">View All</Link>
                    )}
                  </div>
                  
                  {isLoadingStats ? (
                    <div className="space-y-4">
                      {[1, 2].map((i) => <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />)}
                    </div>
                  ) : orders.length > 0 ? (
                    <div className="space-y-4">
                      {orders.slice(0, 3).map((order) => (
                        <Link href="/orders" key={order._id} className="block group">
                          <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-800 transition-all group-hover:border-blue-200 dark:group-hover:border-blue-500/30 group-hover:shadow-sm">
                            <div className="flex items-center gap-4">
                              <div className="h-12 w-12 rounded-xl bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm">
                                <HiOutlineShoppingBag className="h-6 w-6 text-gray-400 group-hover:text-blue-500 transition-colors" />
                              </div>
                              <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-white">{order.orderNumber}</p>
                                <p className="text-xs font-medium text-gray-500">{formatDate(order.createdAt)} • {order.items.length} item(s)</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-black text-gray-900 dark:text-white">{formatPrice(order.totalAmount)}</p>
                              <span className={`inline-block mt-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                                order.orderStatus === 'delivered' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                                order.orderStatus === 'cancelled' ? 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400' :
                                'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400'
                              }`}>
                                {order.orderStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-10 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
                      <HiOutlineShoppingBag className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600 mb-3" />
                      <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">No orders yet.</p>
                      <Link href="/products" className="mt-4 inline-block rounded-lg bg-blue-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-blue-700">Start Shopping</Link>
                    </div>
                  )}
                </div>
              </>
            )}

            {activeTab === 'addresses' && (
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-black text-gray-900 dark:text-white">Saved Addresses</h3>
                  <button
                    onClick={openAddForm}
                    className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-blue-700 shadow-md shadow-blue-600/20 hover:shadow-blue-600/40"
                  >
                    <HiOutlinePlus className="h-4 w-4" /> Add New
                  </button>
                </div>

                {/* Address Form */}
                {showAddressForm && (
                  <div className="mb-8 rounded-2xl border border-blue-100 dark:border-blue-500/20 bg-blue-50/50 dark:bg-blue-500/5 p-5 sm:p-6 shadow-inner">
                    <div className="flex items-center justify-between mb-5">
                      <h4 className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <HiOutlineLocationMarker className="h-5 w-5 text-blue-500" />
                        {editingAddress ? 'Edit Address' : 'New Address'}
                      </h4>
                      <button onClick={() => setShowAddressForm(false)} className="h-8 w-8 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center text-gray-500 hover:text-gray-900 dark:hover:text-white shadow-sm transition-all hover:scale-105">
                        <HiX className="h-4 w-4" />
                      </button>
                    </div>
                    <form onSubmit={handleSaveAddress} className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <input name="fullName" value={addressForm.fullName} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="Full Name *" />
                      </div>
                      <div>
                        <input name="phone" value={addressForm.phone} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="Phone *" />
                      </div>
                      <div className="sm:col-span-2">
                        <input name="addressLine1" value={addressForm.addressLine1} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="Address Line 1 *" />
                      </div>
                      <div className="sm:col-span-2">
                        <input name="addressLine2" value={addressForm.addressLine2} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="Address Line 2 (optional)" />
                      </div>
                      <div>
                        <input name="city" value={addressForm.city} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="City *" />
                      </div>
                      <div>
                        <input name="state" value={addressForm.state} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="State *" />
                      </div>
                      <div>
                        <input name="pincode" value={addressForm.pincode} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm" placeholder="Pincode *" maxLength={6} />
                      </div>
                      <div>
                        <select name="type" value={addressForm.type} onChange={handleAddressChange} className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm">
                          <option value="home">Home</option>
                          <option value="work">Work</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                      <div className="sm:col-span-2 flex items-center justify-between mt-2 pt-4 border-t border-blue-100 dark:border-blue-900/30">
                        <label className="flex items-center gap-2 cursor-pointer group">
                          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${addressForm.isDefault ? 'bg-blue-600 border-blue-600' : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800'}`}>
                            {addressForm.isDefault && <HiOutlineCheckCircle className="h-4 w-4 text-white" />}
                          </div>
                          <input
                            type="checkbox"
                            checked={addressForm.isDefault}
                            onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                            className="hidden"
                          />
                          <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900">Set as default address</span>
                        </label>
                        <div className="flex gap-2">
                          <button type="button" onClick={() => setShowAddressForm(false)} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            Cancel
                          </button>
                          <button
                            type="submit"
                            disabled={isSavingAddress}
                            className="flex items-center gap-1.5 rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                          >
                            {isSavingAddress ? 'Saving...' : 'Save Address'}
                          </button>
                        </div>
                      </div>
                    </form>
                  </div>
                )}

                {user.addresses && user.addresses.length > 0 ? (
                  <div className="grid sm:grid-cols-2 gap-4">
                    {user.addresses.map((addr) => (
                      <div key={addr._id} className="relative rounded-2xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50 p-5 transition-all hover:border-blue-200 dark:hover:border-blue-500/30 hover:shadow-md group">
                        {addr.isDefault && (
                          <span className="absolute right-4 top-4 rounded-full bg-blue-100 dark:bg-blue-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-400 shadow-sm">
                            Default
                          </span>
                        )}
                        <div className="flex items-start gap-3 mb-3">
                          <div className="h-10 w-10 rounded-full bg-white dark:bg-gray-700 flex items-center justify-center shadow-sm flex-shrink-0">
                            <HiOutlineLocationMarker className="h-5 w-5 text-gray-400 group-hover:text-blue-500 transition-colors" />
                          </div>
                          <div className="flex-1 mt-0.5">
                            <p className="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
                              {addr.fullName}
                              <span className="rounded bg-gray-200 dark:bg-gray-700 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                                {addr.type}
                              </span>
                            </p>
                            <p className="mt-1 text-xs font-semibold text-gray-500 dark:text-gray-400">{addr.phone}</p>
                          </div>
                        </div>
                        <div className="pl-13 text-[13px] leading-relaxed text-gray-600 dark:text-gray-300 bg-white dark:bg-gray-900/50 rounded-xl p-3 border border-gray-100 dark:border-gray-800">
                          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                          {addr.city}, {addr.state} – <span className="font-bold">{addr.pincode}</span>
                        </div>
                        <div className="mt-4 flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700/50">
                          <button
                            onClick={() => openEditForm(addr)}
                            className="flex-1 flex justify-center items-center gap-1.5 rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 shadow-sm border border-gray-100 dark:border-gray-700 transition-colors"
                          >
                            <HiOutlinePencil className="h-4 w-4" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            disabled={deletingId === addr._id}
                            className="flex-1 flex justify-center items-center gap-1.5 rounded-lg bg-red-50 dark:bg-red-500/10 px-3 py-2 text-xs font-bold text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20 shadow-sm transition-colors disabled:opacity-50"
                          >
                            <HiOutlineTrash className="h-4 w-4" /> {deletingId === addr._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 py-12 text-center">
                    <HiOutlineLocationMarker className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600 mb-3" />
                    <p className="text-base font-bold text-gray-900 dark:text-white">No saved addresses</p>
                    <p className="mt-1 text-sm font-medium text-gray-500">Add an address for faster checkout.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'kyc' && (
              <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 sm:p-8 shadow-sm border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-100 dark:border-gray-800">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white">KYC Verification</h3>
                    <p className="text-sm font-medium text-gray-500 mt-1">Verify your identity to unlock all features.</p>
                  </div>
                  {kycInfo && (
                    <span className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider ${kycInfo.status === 'verified' ? 'bg-emerald-50 text-emerald-600' : kycInfo.status === 'pending' ? 'bg-amber-50 text-amber-600' : kycInfo.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-gray-100 text-gray-600'}`}>
                      <HiOutlineShieldCheck className="h-4 w-4" />
                      {kycStatusLabel[kycInfo.status]}
                    </span>
                  )}
                </div>

                {!kycInfo || kycInfo.status === 'not_submitted' ? (
                  !showKycForm ? (
                    <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/30 py-12 text-center">
                      <div className="h-16 w-16 mx-auto bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mb-4">
                        <HiOutlineIdentification className="h-8 w-8 text-blue-500" />
                      </div>
                      <p className="text-base font-bold text-gray-900 dark:text-white">Complete your KYC</p>
                      <p className="mt-1 text-sm font-medium text-gray-500 max-w-sm mx-auto">Upload a valid ID document to verify your account and unlock higher transaction limits.</p>
                      <button
                        onClick={() => setShowKycForm(true)}
                        className="mt-6 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all hover:-translate-y-0.5"
                      >
                        Start Verification
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleKycSubmit} className="space-y-5 bg-gray-50 dark:bg-gray-800/30 rounded-2xl p-6 border border-gray-100 dark:border-gray-800">
                      <div className="grid sm:grid-cols-2 gap-5">
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Full Name (as per document) *</label>
                          <input
                            type="text"
                            value={kycForm.fullName}
                            onChange={(e) => setKycForm((p) => ({ ...p, fullName: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                            placeholder="Full legal name"
                          />
                        </div>
                        <div>
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Document Type *</label>
                          <select
                            value={kycForm.documentType}
                            onChange={(e) => setKycForm((p) => ({ ...p, documentType: e.target.value as 'aadhaar' | 'pan' | 'passport' | 'voter_id' }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                          >
                            <option value="aadhaar">Aadhaar Card</option>
                            <option value="pan">PAN Card</option>
                            <option value="passport">Passport</option>
                            <option value="voter_id">Voter ID</option>
                          </select>
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Document Number *</label>
                          <input
                            type="text"
                            value={kycForm.documentNumber}
                            onChange={(e) => setKycForm((p) => ({ ...p, documentNumber: e.target.value }))}
                            className="w-full rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 py-3 text-sm font-medium focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all shadow-sm"
                            placeholder="Enter document number"
                          />
                        </div>
                        <div className="sm:col-span-2">
                          <label className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400">Upload Document Image *</label>
                          <input
                            type="file"
                            ref={kycFileRef}
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) handleDocUpload(file);
                            }}
                          />
                          {kycForm.documentImage ? (
                            <div className="relative mt-2 inline-block group border border-gray-200 dark:border-gray-700 rounded-xl p-1 bg-white dark:bg-gray-900 shadow-sm">
                              <div className="relative h-40 w-60 overflow-hidden rounded-lg">
                                <Image src={kycForm.documentImage} alt="Document" fill className="object-cover" sizes="240px" />
                              </div>
                              <button
                                type="button"
                                onClick={() => setKycForm((p) => ({ ...p, documentImage: '' }))}
                                className="absolute -right-3 -top-3 flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600 hover:scale-110 transition-transform"
                              >
                                <HiX className="h-4 w-4" />
                              </button>
                            </div>
                          ) : (
                            <button
                              type="button"
                              disabled={isUploadingDoc}
                              onClick={() => kycFileRef.current?.click()}
                              className="mt-2 flex w-full flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 py-10 text-sm text-gray-500 transition hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:text-blue-600 dark:text-gray-400 disabled:opacity-50 group"
                            >
                              {isUploadingDoc ? (
                                <span className="flex flex-col items-center gap-3"><span className="h-8 w-8 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" /> <span className="font-bold">Uploading document...</span></span>
                              ) : (
                                <>
                                  <div className="h-12 w-12 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center group-hover:bg-white dark:group-hover:bg-gray-900 shadow-sm transition-colors">
                                    <HiOutlineUpload className="h-6 w-6" />
                                  </div>
                                  <div className="text-center">
                                    <p className="font-bold text-gray-700 dark:text-gray-300 group-hover:text-blue-600">Click to upload document</p>
                                    <p className="text-xs text-gray-400 mt-1">Accepted: JPEG, PNG, WebP. Max 5MB.</p>
                                  </div>
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <button type="button" onClick={() => setShowKycForm(false)} className="rounded-xl bg-white dark:bg-gray-900 px-5 py-2.5 text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-700 transition-colors">
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isSubmittingKyc}
                          className="rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-50 transition-all"
                        >
                          {isSubmittingKyc ? 'Submitting...' : 'Submit Verification'}
                        </button>
                      </div>
                    </form>
                  )
                ) : kycInfo.status === 'pending' ? (
                  <div className="rounded-2xl border border-amber-200 dark:border-amber-500/20 bg-amber-50 dark:bg-amber-500/5 p-8 text-center shadow-inner">
                    <div className="h-16 w-16 mx-auto bg-amber-100 dark:bg-amber-500/20 rounded-full flex items-center justify-center mb-4">
                      <HiOutlineClock className="h-8 w-8 text-amber-500" />
                    </div>
                    <p className="text-lg font-black text-amber-700 dark:text-amber-400">Verification Under Review</p>
                    <p className="mt-2 text-sm font-medium text-amber-600/80 dark:text-amber-400/80 max-w-sm mx-auto">We have received your document and are currently reviewing it. This usually takes 1-2 business days.</p>
                  </div>
                ) : kycInfo.status === 'verified' ? (
                  <div className="rounded-2xl border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 p-8 shadow-inner">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-6">
                      <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <HiOutlineCheckCircle className="h-8 w-8 text-emerald-500" />
                      </div>
                      <div className="flex-1">
                        <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">Account Verified</p>
                        <p className="mt-1 text-sm font-medium text-emerald-600/80 dark:text-emerald-400/80">Your identity has been successfully verified. You have full access to all features.</p>
                        
                        <div className="mt-6 grid sm:grid-cols-2 gap-4 bg-white dark:bg-gray-900 rounded-xl p-4 border border-emerald-100 dark:border-emerald-500/20 shadow-sm">
                          <div>
                            <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Name on Document</span>
                            <span className="text-sm font-bold text-gray-900 dark:text-white">{kycInfo.fullName}</span>
                          </div>
                          <div>
                            <span className="block text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-1">Document Type</span>
                            <span className="text-sm font-bold uppercase text-gray-900 dark:text-white">{kycInfo.documentType?.replace('_', ' ')}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : kycInfo.status === 'rejected' ? (
                  <div className="rounded-2xl border border-red-200 dark:border-red-500/20 bg-red-50 dark:bg-red-500/5 p-8 text-center shadow-inner">
                    <div className="h-16 w-16 mx-auto bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                      <HiX className="h-8 w-8 text-red-500" />
                    </div>
                    <p className="text-lg font-black text-red-700 dark:text-red-400">Verification Rejected</p>
                    {kycInfo.rejectionReason && (
                      <p className="mt-2 text-sm font-medium text-red-600/80 dark:text-red-400/80 bg-red-100/50 dark:bg-red-500/10 p-3 rounded-lg max-w-md mx-auto inline-block border border-red-200 dark:border-red-500/20">
                        <span className="font-bold">Reason:</span> {kycInfo.rejectionReason}
                      </p>
                    )}
                    <div className="mt-6">
                      <button
                        onClick={() => {
                          setKycForm({ documentType: 'aadhaar', documentNumber: '', fullName: '', documentImage: '' });
                          setShowKycForm(true);
                          setKycInfo(null);
                        }}
                        className="rounded-xl bg-red-600 px-6 py-3 text-sm font-bold text-white hover:bg-red-700 shadow-md shadow-red-600/20 transition-all hover:-translate-y-0.5"
                      >
                        Resubmit Document
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
