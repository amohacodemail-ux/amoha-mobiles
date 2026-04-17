'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { HiOutlineMail, HiOutlineLockClosed, HiOutlineEye, HiOutlineEyeOff, HiOutlineUser, HiOutlinePhone, HiOutlineCamera } from 'react-icons/hi';
import toast from 'react-hot-toast';
import { useAuthStore } from '@/store/auth.store';

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, isAuthenticated, updateProfile } = useAuthStore();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      router.replace('/');
    }
  }, [isAuthenticated, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be under 5MB');
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.password || !form.confirmPassword) {
      toast.error('Please fill all fields');
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (form.password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    try {
      await register(form.name, form.email, form.phone, form.password, form.confirmPassword);

      // Upload avatar if selected (user now has token from register)
      if (avatarFile) {
        try {
          const token = useAuthStore.getState().token;
          const formData = new FormData();
          formData.append('image', avatarFile);
          const res = await fetch(`/api/upload/kyc`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
            body: formData,
          });
          const data = await res.json();
          if (data.data?.url) {
            await updateProfile({ avatar: data.data.url });
          }
        } catch {
          // Avatar upload failed but registration succeeded
        }
      }

      toast.success('Account created successfully!');
      router.push('/');
    } catch {
      toast.error('Registration failed');
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center px-3 py-8 sm:px-4 sm:py-12">
      <div className="relative w-full max-w-md">
        <div className="absolute -inset-4 rounded-3xl bg-gradient-to-r from-primary-600/20 to-accent-600/20 blur-3xl" />
        <div className="glass-card relative p-5 sm:p-8 md:p-10">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500 to-accent-500 text-lg font-bold text-white shadow-glow">
              A
            </div>
            <h1 className="mt-4 text-2xl font-bold text-gray-900 dark:text-white">Create Account</h1>
            <p className="mt-1 text-sm text-gray-500">Join AMOHA Mobiles today</p>
          </div>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {/* Avatar Upload */}
            <div className="flex justify-center">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-20 w-20 overflow-hidden rounded-full border-2 border-dashed border-gray-300 dark:border-white/20 transition-colors hover:border-primary-400"
              >
                {avatarPreview ? (
                  <Image src={avatarPreview} alt="Avatar" fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full flex-col items-center justify-center text-gray-400 group-hover:text-primary-400">
                    <HiOutlineCamera className="h-6 w-6" />
                    <span className="mt-0.5 text-[9px]">Add Photo</span>
                  </div>
                )}
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Full Name</label>
              <div className="relative">
                <HiOutlineUser className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input name="name" type="text" value={form.name} onChange={handleChange} className="glass-input pl-10 py-3 text-sm" placeholder="John Doe" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
              <div className="relative">
                <HiOutlineMail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input name="email" type="email" value={form.email} onChange={handleChange} className="glass-input pl-10 py-3 text-sm" placeholder="you@example.com" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Phone</label>
              <div className="relative">
                <HiOutlinePhone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input name="phone" type="tel" value={form.phone} onChange={handleChange} className="glass-input pl-10 py-3 text-sm" placeholder="+91 98765 43210" />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} className="glass-input pl-10 pr-10 py-3 text-sm" placeholder="Min. 6 characters" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900 dark:hover:text-white">
                  {showPassword ? <HiOutlineEyeOff className="h-4 w-4" /> : <HiOutlineEye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-medium text-gray-500 dark:text-gray-400">Confirm Password</label>
              <div className="relative">
                <HiOutlineLockClosed className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
                <input name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} className="glass-input pl-10 py-3 text-sm" placeholder="Re-enter password" />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary-600 py-3.5 text-sm font-semibold text-white transition-all hover:bg-primary-500 hover:shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isLoading ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> Creating account...</>
              ) : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Already have an account?{' '}
            <Link href="/login" className="font-semibold text-primary-400 hover:text-primary-300">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

