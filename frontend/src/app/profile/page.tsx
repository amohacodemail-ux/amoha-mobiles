'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineUser, HiOutlineMail, HiOutlinePhone, HiOutlineLogout, HiOutlineShoppingBag, HiOutlineHeart, HiOutlineLocationMarker, HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiX, HiOutlineShieldCheck, HiOutlineIdentification, HiOutlineUpload, HiOutlinePhotograph } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';
import { userService } from '@/services/user.service';
import { formatDate } from '@/lib/utils';
import type { Address, KycInfo } from '@/types';

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

  useEffect(() => {
    if (isAuthenticated) {
      userService.getKycStatus().then(setKycInfo).catch(() => {});
    }
  }, [isAuthenticated]);

  if (!isAuthenticated || !user) {
    return (
      <div className="page-container flex flex-col items-center justify-center py-32 text-center">
        <HiOutlineShieldCheck className="h-12 w-12 text-gray-400" />
        <h2 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Login Required</h2>
        <p className="mt-2 text-sm text-gray-500">Please sign in to view your profile.</p>
        <Link href="/login" className="mt-6 rounded-xl bg-primary-600 px-8 py-3 text-sm font-semibold text-white hover:bg-primary-500">
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

  const quickLinks = [
    { href: '/orders', icon: HiOutlineShoppingBag, label: 'My Orders', desc: 'Track & manage orders' },
    { href: '/wishlist', icon: HiOutlineHeart, label: 'Wishlist', desc: 'Your saved items' },
  ];

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

  return (
    <div className="page-container py-6 sm:py-10">
      <h1 className="mb-8 text-2xl font-bold text-gray-900 dark:text-white sm:text-3xl">My Profile</h1>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="glass-card p-4 sm:p-6 text-center">
            <div className="relative mx-auto h-20 w-20">
              {user.avatar ? (
                <Image
                  src={user.avatar}
                  alt={user.name || 'Profile'}
                  fill
                  className="rounded-full object-cover"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-accent-500 text-2xl font-bold text-white shadow-glow">
                  {(user.name || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <input
                type="file"
                ref={avatarFileRef}
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleAvatarUpload(file);
                  e.target.value = '';
                }}
              />
              <button
                onClick={() => avatarFileRef.current?.click()}
                disabled={isUploadingAvatar}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-primary-500 text-white shadow-md transition-all hover:bg-primary-400 disabled:opacity-50 dark:border-gray-800"
              >
                {isUploadingAvatar ? (
                  <span className="h-3 w-3 animate-spin rounded-full border-2 border-white border-t-transparent" />
                ) : (
                  <HiOutlinePhotograph className="h-3.5 w-3.5" />
                )}
              </button>
            </div>
            <h2 className="mt-4 text-lg font-bold text-gray-900 dark:text-white">{user.name || 'User'}</h2>
            <p className="mt-0.5 text-sm text-gray-500">Member since {formatDate(user.createdAt)}</p>

            <div className="mt-6 space-y-3 text-left">
              <div className="flex items-center gap-3 rounded-lg bg-gray-100 dark:bg-white/5 p-3">
                <HiOutlineMail className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.email}</span>
              </div>
              <div className="flex items-center gap-3 rounded-lg bg-gray-100 dark:bg-white/5 p-3">
                <HiOutlinePhone className="h-4 w-4 text-primary-400" />
                <span className="text-sm text-gray-600 dark:text-gray-300">{user.phone || 'Not provided'}</span>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
            >
              <HiOutlineLogout className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Details */}
        <div className="space-y-6 lg:col-span-2">
          {/* Quick Links */}
          <div className="grid gap-3 sm:grid-cols-2">
            {quickLinks.map((link) => (
              <Link key={link.href} href={link.href} className="glass-card-sm group flex items-center gap-4 p-4 transition-all hover:border-primary-500/30 hover:shadow-glow">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-500/10 text-primary-400 transition-colors group-hover:bg-primary-500/20">
                  <link.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{link.label}</p>
                  <p className="text-xs text-gray-500">{link.desc}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Saved Addresses */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Saved Addresses</h3>
              <button
                onClick={openAddForm}
                className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-semibold text-white transition-all hover:bg-primary-500"
              >
                <HiOutlinePlus className="h-3.5 w-3.5" /> Add
              </button>
            </div>

            {/* Address Form */}
            {showAddressForm && (
              <div className="mb-4 rounded-xl border border-primary-500/20 bg-primary-500/5 p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {editingAddress ? 'Edit Address' : 'New Address'}
                  </h4>
                  <button onClick={() => setShowAddressForm(false)} className="text-gray-500 hover:text-gray-900 dark:hover:text-white">
                    <HiX className="h-4 w-4" />
                  </button>
                </div>
                <form onSubmit={handleSaveAddress} className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <input name="fullName" value={addressForm.fullName} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="Full Name *" />
                  </div>
                  <div>
                    <input name="phone" value={addressForm.phone} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="Phone *" />
                  </div>
                  <div className="sm:col-span-2">
                    <input name="addressLine1" value={addressForm.addressLine1} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="Address Line 1 *" />
                  </div>
                  <div className="sm:col-span-2">
                    <input name="addressLine2" value={addressForm.addressLine2} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="Address Line 2 (optional)" />
                  </div>
                  <div>
                    <input name="city" value={addressForm.city} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="City *" />
                  </div>
                  <div>
                    <input name="state" value={addressForm.state} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="State *" />
                  </div>
                  <div>
                    <input name="pincode" value={addressForm.pincode} onChange={handleAddressChange} className="glass-input py-2 text-sm" placeholder="Pincode *" maxLength={6} />
                  </div>
                  <div>
                    <select name="type" value={addressForm.type} onChange={handleAddressChange} className="glass-input py-2 text-sm">
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={addressForm.isDefault}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, isDefault: e.target.checked }))}
                        className="rounded border-gray-300 dark:border-white/20 bg-gray-100 dark:bg-white/5 text-primary-500 focus:ring-primary-500/20"
                      />
                      <span className="text-xs text-gray-500 dark:text-gray-400">Set as default</span>
                    </label>
                    <div className="ml-auto flex gap-2">
                      <button type="button" onClick={() => setShowAddressForm(false)} className="rounded-lg border border-gray-200 dark:border-white/10 px-4 py-2 text-xs text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSavingAddress}
                        className="flex items-center gap-1.5 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
                      >
                        {isSavingAddress ? 'Saving...' : 'Save'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {user.addresses && user.addresses.length > 0 ? (
              <div className="space-y-3">
                {user.addresses.map((addr) => (
                  <div key={addr._id} className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 p-4">
                    {addr.isDefault && (
                      <span className="absolute right-3 top-3 rounded-full bg-primary-500/20 px-2 py-0.5 text-[11px] font-semibold text-primary-400">
                        Default
                      </span>
                    )}
                    <div className="flex items-start gap-3">
                      <HiOutlineLocationMarker className="mt-0.5 h-4 w-4 flex-shrink-0 text-primary-400" />
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{addr.fullName}</p>
                        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                          {addr.addressLine1}{addr.addressLine2 ? `, ${addr.addressLine2}` : ''}<br />
                          {addr.city}, {addr.state} – {addr.pincode}
                        </p>
                        <p className="mt-1 text-xs text-gray-500">{addr.phone}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="rounded bg-gray-100 dark:bg-white/5 px-2 py-0.5 text-[11px] uppercase text-gray-600 dark:text-gray-400">
                            {addr.type}
                          </span>
                          <button
                            onClick={() => openEditForm(addr)}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-primary-500 dark:text-primary-400 hover:bg-primary-500/10"
                          >
                            <HiOutlinePencil className="h-3 w-3" /> Edit
                          </button>
                          <button
                            onClick={() => handleDeleteAddress(addr._id)}
                            disabled={deletingId === addr._id}
                            className="flex items-center gap-1 rounded px-2 py-0.5 text-[11px] text-red-500 dark:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                          >
                            <HiOutlineTrash className="h-3 w-3" /> {deletingId === addr._id ? '...' : 'Delete'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 py-8 text-center">
                <HiOutlineLocationMarker className="mx-auto h-8 w-8 text-gray-600" />
                <p className="mt-2 text-sm text-gray-500">No addresses saved yet.</p>
              </div>
            )}
          </div>

          {/* Account Info */}
          <div className="glass-card p-5 sm:p-6">
            <h3 className="mb-4 text-lg font-bold text-gray-900 dark:text-white">Account Information</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</label>
                <div className="relative">
                  <HiOutlineUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input type="text" defaultValue={user.name} className="glass-input pl-10 py-2.5 text-sm" readOnly />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                <div className="relative">
                  <HiOutlineMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input type="email" defaultValue={user.email} className="glass-input pl-10 py-2.5 text-sm" readOnly />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
                <div className="relative">
                  <HiOutlinePhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                  <input type="tel" defaultValue={user.phone} className="glass-input pl-10 py-2.5 text-sm" readOnly />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Account Status</label>
                <div className="flex h-[42px] items-center rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 dark:bg-white/5 px-4">
                  <span className={`text-sm font-medium ${user.isVerified ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {user.isVerified ? 'Verified' : 'Pending Verification'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* KYC Verification */}
          <div className="glass-card p-5 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">KYC Verification</h3>
              {kycInfo && (
                <span className={`text-xs font-semibold ${kycStatusColor[kycInfo.status]}`}>
                  {kycStatusLabel[kycInfo.status]}
                </span>
              )}
            </div>

            {!kycInfo || kycInfo.status === 'not_submitted' ? (
              !showKycForm ? (
                <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 py-8 text-center">
                  <HiOutlineIdentification className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Complete your KYC to verify your identity.</p>
                  <button
                    onClick={() => setShowKycForm(true)}
                    className="mt-4 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500"
                  >
                    Submit KYC
                  </button>
                </div>
              ) : (
                <form onSubmit={handleKycSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Full Name (as per document) *</label>
                    <input
                      type="text"
                      value={kycForm.fullName}
                      onChange={(e) => setKycForm((p) => ({ ...p, fullName: e.target.value }))}
                      className="glass-input py-2.5 text-sm"
                      placeholder="Full legal name"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Document Type *</label>
                    <select
                      value={kycForm.documentType}
                      onChange={(e) => setKycForm((p) => ({ ...p, documentType: e.target.value as 'aadhaar' | 'pan' | 'passport' | 'voter_id' }))}
                      className="glass-input py-2.5 text-sm"
                    >
                      <option value="aadhaar">Aadhaar Card</option>
                      <option value="pan">PAN Card</option>
                      <option value="passport">Passport</option>
                      <option value="voter_id">Voter ID</option>
                    </select>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Document Number *</label>
                    <input
                      type="text"
                      value={kycForm.documentNumber}
                      onChange={(e) => setKycForm((p) => ({ ...p, documentNumber: e.target.value }))}
                      className="glass-input py-2.5 text-sm"
                      placeholder="Enter document number"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Upload Document Image *</label>
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
                      <div className="relative mt-1 inline-block">
                        <div className="relative h-32 w-48 overflow-hidden rounded-lg border border-gray-200 dark:border-white/10">
                          <Image src={kycForm.documentImage} alt="Document" fill className="object-cover" sizes="192px" />
                        </div>
                        <button
                          type="button"
                          onClick={() => setKycForm((p) => ({ ...p, documentImage: '' }))}
                          className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white shadow hover:bg-red-600"
                        >
                          <HiX className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        disabled={isUploadingDoc}
                        onClick={() => kycFileRef.current?.click()}
                        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-gray-300 dark:border-white/15 py-8 text-sm text-gray-500 transition hover:border-primary-400 hover:text-primary-500 dark:text-gray-400 disabled:opacity-50"
                      >
                        {isUploadingDoc ? (
                          <span className="flex items-center gap-2"><span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" /> Uploading...</span>
                        ) : (
                          <><HiOutlineUpload className="h-5 w-5" /> Click to upload Aadhaar / ID proof</>
                        )}
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Accepted: JPEG, PNG, WebP. Max 5MB.</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setShowKycForm(false)} className="rounded-lg border border-gray-200 dark:border-white/10 px-4 py-2 text-xs text-gray-500 hover:text-gray-900 dark:hover:text-white">
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmittingKyc}
                      className="rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500 disabled:opacity-50"
                    >
                      {isSubmittingKyc ? 'Submitting...' : 'Submit KYC'}
                    </button>
                  </div>
                </form>
              )
            ) : kycInfo.status === 'pending' ? (
              <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
                <HiOutlineShieldCheck className="mx-auto h-8 w-8 text-amber-500" />
                <p className="mt-2 text-sm font-medium text-amber-600 dark:text-amber-400">Your KYC is under review</p>
                <p className="mt-1 text-xs text-gray-500">We will verify your documents shortly.</p>
              </div>
            ) : kycInfo.status === 'verified' ? (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4">
                <div className="flex items-center gap-3">
                  <HiOutlineShieldCheck className="h-6 w-6 text-emerald-500" />
                  <div>
                    <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">KYC Verified</p>
                    <p className="text-xs text-gray-500">Your identity has been successfully verified.</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-1 text-gray-700 dark:text-gray-300">{kycInfo.fullName}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Document:</span>
                    <span className="ml-1 uppercase text-gray-700 dark:text-gray-300">{kycInfo.documentType?.replace('_', ' ')}</span>
                  </div>
                </div>
              </div>
            ) : kycInfo.status === 'rejected' ? (
              <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-4 text-center">
                <p className="text-sm font-medium text-red-500">KYC Rejected</p>
                {kycInfo.rejectionReason && (
                  <p className="mt-1 text-xs text-gray-500">Reason: {kycInfo.rejectionReason}</p>
                )}
                <button
                  onClick={() => {
                    setKycForm({ documentType: 'aadhaar', documentNumber: '', fullName: '', documentImage: '' });
                    setShowKycForm(true);
                    setKycInfo(null);
                  }}
                  className="mt-3 rounded-lg bg-primary-600 px-4 py-2 text-xs font-semibold text-white hover:bg-primary-500"
                >
                  Resubmit KYC
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

