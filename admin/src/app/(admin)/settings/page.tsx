'use client';
import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { User, Lock, Save, Globe, Image, Truck, Megaphone, Mail, Sparkles, MonitorPlay, Layers, Plus, Receipt } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { ImageUploader } from '@/components/shared/image-uploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { authService } from '@/services/auth.service';
import { settingsService, type SiteSettings } from '@/services/settings.service';
import { useAuthStore } from '@/store/auth.store';

const profileSchema = z.object({
  name: z.string().min(2, 'Name required'),
  email: z.string().email('Invalid email'),
  phone: z.string().optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password required'),
  newPassword: z.string().min(6, 'At least 6 characters'),
  confirmPassword: z.string(),
}).refine((d) => d.newPassword === d.confirmPassword, { message: 'Passwords do not match', path: ['confirmPassword'] });

const siteSchema = z.object({
  siteName: z.string().min(1, 'Site name required'),
  tagline: z.string(),
  logo: z.string(),
  favicon: z.string(),
  contactEmail: z.string().email('Invalid email').or(z.literal('')),
  contactPhone: z.string(),
  address: z.string(),
  deliveryCharge: z.coerce.number().min(0),
  freeDeliveryAbove: z.coerce.number().min(0),
  announcement: z.string(),
  isAnnouncementActive: z.boolean(),
  socialFacebook: z.string(),
  socialInstagram: z.string(),
  socialTwitter: z.string(),
  socialYoutube: z.string(),
  // Popup
  popupIsActive: z.boolean(),
  popupTitle: z.string(),
  popupSubtitle: z.string(),
  popupDescription: z.string(),
  popupImage: z.string(),
  popupButtonText: z.string(),
  popupButtonLink: z.string(),
  popupBgColor: z.string(),
  // Promo banner
  promoBannerImage: z.string(),
  promoBannerLink: z.string(),
  promoBannerIsActive: z.boolean(),
  // SMTP
  smtpHost: z.string(),
  smtpPort: z.coerce.number().min(0),
  smtpUser: z.string(),
  smtpPass: z.string(),
  smtpFrom: z.string(),
  // Billing & GST
  billingBusinessName: z.string(),
  billingGstin: z.string(),
  billingPanNumber: z.string(),
  billingStateCode: z.string(),
  billingAddress: z.string(),
  billingCity: z.string(),
  billingState: z.string(),
  billingPincode: z.string(),
  billingPhone: z.string(),
  billingEmail: z.string(),
  billingEnableGst: z.boolean(),
  billingGstRate: z.coerce.number().min(0).max(100),
  billingSacCode: z.string(),
  billingHsnCode: z.string(),
  billingTermsOnInvoice: z.string(),
  billingInvoicePrefix: z.string(),
  billingFooterNote: z.string(),
  // Discover banners
  discoverBanners: z.array(z.object({
    title: z.string(),
    image: z.string(),
    link: z.string(),
    size: z.enum(['large', 'small']),
    order: z.coerce.number(),
    isActive: z.boolean(),
  })),
});

type ProfileData = z.infer<typeof profileSchema>;
type PasswordData = z.infer<typeof passwordSchema>;
type SiteData = z.infer<typeof siteSchema>;

const tabs = [
  { id: 'site', label: 'Site Settings', icon: Globe },
  { id: 'popup', label: 'Popup & Banners', icon: Sparkles },
  { id: 'billing', label: 'Billing & GST', icon: Receipt },
  { id: 'email', label: 'Email (SMTP)', icon: Mail },
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'password', label: 'Password', icon: Lock },
] as const;

type TabId = typeof tabs[number]['id'];

export default function SettingsPage() {
  const { user, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState<TabId>('site');
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [siteLoading, setSiteLoading] = useState(false);
  const [siteDataLoading, setSiteDataLoading] = useState(true);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '', email: user?.email ?? '', phone: user?.phone ?? '' },
  });

  const passwordForm = useForm<PasswordData>({ resolver: zodResolver(passwordSchema) });

  const siteForm = useForm<SiteData>({
    resolver: zodResolver(siteSchema),
    defaultValues: {
      siteName: '', tagline: '', logo: '', favicon: '',
      contactEmail: '', contactPhone: '', address: '',
      deliveryCharge: 49, freeDeliveryAbove: 999,
      announcement: '', isAnnouncementActive: false,
      socialFacebook: '', socialInstagram: '', socialTwitter: '', socialYoutube: '',
      popupIsActive: false, popupTitle: '', popupSubtitle: '', popupDescription: '',
      popupImage: '', popupButtonText: 'Shop Now', popupButtonLink: '/products', popupBgColor: '#1a1a2e',
      promoBannerImage: '', promoBannerLink: '', promoBannerIsActive: false,
      smtpHost: '', smtpPort: 587, smtpUser: '', smtpPass: '', smtpFrom: '',
      billingBusinessName: '', billingGstin: '', billingPanNumber: '', billingStateCode: '',
      billingAddress: '', billingCity: '', billingState: '', billingPincode: '',
      billingPhone: '', billingEmail: '', billingEnableGst: false, billingGstRate: 18,
      billingSacCode: '', billingHsnCode: '', billingTermsOnInvoice: '', billingInvoicePrefix: 'INV',
      billingFooterNote: 'Thank you for your purchase!',
      discoverBanners: [],
    },
  });

  const { fields: discoverFields, append: addDiscover, remove: removeDiscover } = useFieldArray({
    control: siteForm.control,
    name: 'discoverBanners',
  });

  useEffect(() => {
    settingsService.get().then((s) => {
      siteForm.reset({
        siteName: s.siteName || '',
        tagline: s.tagline || '',
        logo: s.logo || '',
        favicon: s.favicon || '',
        contactEmail: s.contactEmail || '',
        contactPhone: s.contactPhone || '',
        address: s.address || '',
        deliveryCharge: s.deliveryCharge ?? 49,
        freeDeliveryAbove: s.freeDeliveryAbove ?? 999,
        announcement: s.announcement || '',
        isAnnouncementActive: s.isAnnouncementActive ?? false,
        socialFacebook: s.socialLinks?.facebook || '',
        socialInstagram: s.socialLinks?.instagram || '',
        socialTwitter: s.socialLinks?.twitter || '',
        socialYoutube: s.socialLinks?.youtube || '',
        popupIsActive: s.popup?.isActive ?? false,
        popupTitle: s.popup?.title || '',
        popupSubtitle: s.popup?.subtitle || '',
        popupDescription: s.popup?.description || '',
        popupImage: s.popup?.image || '',
        popupButtonText: s.popup?.buttonText || 'Shop Now',
        popupButtonLink: s.popup?.buttonLink || '/products',
        popupBgColor: s.popup?.bgColor || '#1a1a2e',
        promoBannerImage: s.promoBanner?.image || '',
        promoBannerLink: s.promoBanner?.link || '',
        promoBannerIsActive: s.promoBanner?.isActive ?? false,
        smtpHost: s.smtpHost || '',
        smtpPort: s.smtpPort ?? 587,
        smtpUser: s.smtpUser || '',
        smtpPass: s.smtpPass || '',
        smtpFrom: s.smtpFrom || '',
        billingBusinessName: s.billing?.businessName || '',
        billingGstin: s.billing?.gstin || '',
        billingPanNumber: s.billing?.panNumber || '',
        billingStateCode: s.billing?.stateCode || '',
        billingAddress: s.billing?.billingAddress || '',
        billingCity: s.billing?.billingCity || '',
        billingState: s.billing?.billingState || '',
        billingPincode: s.billing?.billingPincode || '',
        billingPhone: s.billing?.billingPhone || '',
        billingEmail: s.billing?.billingEmail || '',
        billingEnableGst: s.billing?.enableGst ?? false,
        billingGstRate: s.billing?.gstRate ?? 18,
        billingSacCode: s.billing?.sacCode || '',
        billingHsnCode: s.billing?.hsnCode || '',
        billingTermsOnInvoice: s.billing?.termsOnInvoice || '',
        billingInvoicePrefix: s.billing?.invoicePrefix || 'INV',
        billingFooterNote: s.billing?.footerNote || 'Thank you for your purchase!',
        discoverBanners: s.discoverBanners || [],
      });
    }).catch(() => {}).finally(() => setSiteDataLoading(false));
  }, []);

  const onProfileSubmit = async (data: ProfileData) => {
    setProfileLoading(true);
    try {
      const updated = await authService.updateProfile(data);
      setUser(updated);
      toast.success('Profile updated successfully');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Update failed');
    } finally {
      setProfileLoading(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordData) => {
    setPasswordLoading(true);
    try {
      await authService.changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Password changed successfully');
      passwordForm.reset();
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Password change failed');
    } finally {
      setPasswordLoading(false);
    }
  };

  const onSiteSubmit = async (data: SiteData) => {
    setSiteLoading(true);
    try {
      await settingsService.update({
        siteName: data.siteName,
        tagline: data.tagline,
        logo: data.logo,
        favicon: data.favicon,
        contactEmail: data.contactEmail,
        contactPhone: data.contactPhone,
        address: data.address,
        deliveryCharge: data.deliveryCharge,
        freeDeliveryAbove: data.freeDeliveryAbove,
        announcement: data.announcement,
        isAnnouncementActive: data.isAnnouncementActive,
        socialLinks: {
          facebook: data.socialFacebook,
          instagram: data.socialInstagram,
          twitter: data.socialTwitter,
          youtube: data.socialYoutube,
        },
        popup: {
          isActive: data.popupIsActive,
          title: data.popupTitle,
          subtitle: data.popupSubtitle,
          description: data.popupDescription,
          image: data.popupImage,
          buttonText: data.popupButtonText,
          buttonLink: data.popupButtonLink,
          bgColor: data.popupBgColor,
        },
        discoverBanners: data.discoverBanners,
        promoBanner: {
          image: data.promoBannerImage,
          link: data.promoBannerLink,
          isActive: data.promoBannerIsActive,
        },
        smtpHost: data.smtpHost,
        smtpPort: data.smtpPort,
        smtpUser: data.smtpUser,
        smtpPass: data.smtpPass,
        smtpFrom: data.smtpFrom,
        billing: {
          businessName: data.billingBusinessName,
          gstin: data.billingGstin,
          panNumber: data.billingPanNumber,
          stateCode: data.billingStateCode,
          billingAddress: data.billingAddress,
          billingCity: data.billingCity,
          billingState: data.billingState,
          billingPincode: data.billingPincode,
          billingPhone: data.billingPhone,
          billingEmail: data.billingEmail,
          enableGst: data.billingEnableGst,
          gstRate: data.billingGstRate,
          sacCode: data.billingSacCode,
          hsnCode: data.billingHsnCode,
          termsOnInvoice: data.billingTermsOnInvoice,
          invoicePrefix: data.billingInvoicePrefix,
          footerNote: data.billingFooterNote,
        },
      });
      toast.success('Settings updated');
    } catch (err: any) {
      toast.error(err?.response?.data?.message ?? 'Update failed');
    } finally {
      setSiteLoading(false);
    }
  };

  return (
    <div>
      <PageHeader title="Settings" description="Manage site settings and your admin account" />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 border-b border-border overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors -mb-px whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Site Settings Tab */}
        {activeTab === 'site' && (
          <>
            {siteDataLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading settings...</CardContent></Card>
            ) : (
              <form onSubmit={siteForm.handleSubmit(onSiteSubmit)} className="space-y-6">
                {/* Branding */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Image className="h-5 w-5" />Branding</CardTitle>
                    <CardDescription>Site name, logo, and favicon displayed across the store.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Site Name" error={siteForm.formState.errors.siteName?.message} {...siteForm.register('siteName')} />
                    <Input label="Tagline" placeholder="Explore Plus" {...siteForm.register('tagline')} />
                    <ImageUploader value={siteForm.watch('logo')} onChange={(url) => siteForm.setValue('logo', url)} folder="branding" label="Logo" />
                    <ImageUploader value={siteForm.watch('favicon')} onChange={(url) => siteForm.setValue('favicon', url)} folder="branding" label="Favicon" />
                  </CardContent>
                </Card>

                {/* Contact Info */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />Contact Information</CardTitle>
                    <CardDescription>Contact details shown on the website.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Email" type="email" {...siteForm.register('contactEmail')} />
                    <Input label="Phone" {...siteForm.register('contactPhone')} />
                    <Input label="Address" {...siteForm.register('address')} />
                  </CardContent>
                </Card>

                {/* Delivery */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="h-5 w-5" />Delivery Settings</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Delivery Charge (Rs.)" type="number" {...siteForm.register('deliveryCharge')} />
                    <Input label="Free Delivery Above (Rs.)" type="number" {...siteForm.register('freeDeliveryAbove')} />
                  </CardContent>
                </Card>

                {/* Announcement */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Megaphone className="h-5 w-5" />Announcement Bar</CardTitle>
                    <CardDescription>Show an announcement banner at the top of the store.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Announcement Text" placeholder="Free shipping on orders above Rs.999" {...siteForm.register('announcement')} />
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" {...siteForm.register('isAnnouncementActive')} />
                      <span className="text-sm text-foreground">Show announcement bar</span>
                    </label>
                  </CardContent>
                </Card>

                {/* Social Links */}
                <Card>
                  <CardHeader>
                    <CardTitle>Social Media Links</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Facebook" placeholder="https://facebook.com/..." {...siteForm.register('socialFacebook')} />
                    <Input label="Instagram" placeholder="https://instagram.com/..." {...siteForm.register('socialInstagram')} />
                    <Input label="Twitter / X" placeholder="https://x.com/..." {...siteForm.register('socialTwitter')} />
                    <Input label="YouTube" placeholder="https://youtube.com/..." {...siteForm.register('socialYoutube')} />
                  </CardContent>
                </Card>

                <Button type="submit" loading={siteLoading}>
                  <Save className="h-4 w-4" />Save Site Settings
                </Button>
              </form>
            )}
          </>
        )}

        {/* Popup & Banners Tab */}
        {activeTab === 'popup' && (
          <>
            {siteDataLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : (
              <form onSubmit={siteForm.handleSubmit(onSiteSubmit)} className="space-y-6">
                {/* Second-hand Phones Popup */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5" />Offer Popup</CardTitle>
                    <CardDescription>A popup that appears for visitors with special offers (e.g. second-hand phones).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" {...siteForm.register('popupIsActive')} />
                      <span className="text-sm font-medium text-foreground">Enable popup</span>
                    </label>
                    <Input label="Title" placeholder="Second-Hand Phones Sale!" {...siteForm.register('popupTitle')} />
                    <Input label="Subtitle" placeholder="Up to 60% OFF on certified pre-owned devices" {...siteForm.register('popupSubtitle')} />
                    <Textarea label="Description" placeholder="All phones come with 6-month warranty..." {...siteForm.register('popupDescription')} />
                    <ImageUploader value={siteForm.watch('popupImage')} onChange={(url) => siteForm.setValue('popupImage', url)} folder="popup" label="Popup Image" />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Button Text" placeholder="Shop Now" {...siteForm.register('popupButtonText')} />
                      <Input label="Button Link" placeholder="/products?tag=refurbished" {...siteForm.register('popupButtonLink')} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Background Color</label>
                      <div className="flex gap-2 items-center">
                        <input type="color" {...siteForm.register('popupBgColor')} className="h-9 w-14 rounded border border-border cursor-pointer" />
                        <Input className="flex-1" {...siteForm.register('popupBgColor')} />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Promotional Banner (full-width) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><MonitorPlay className="h-5 w-5" />Promotional Banner</CardTitle>
                    <CardDescription>A full-width banner displayed on the homepage (e.g. "Gear Up With Pro Displays").</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" {...siteForm.register('promoBannerIsActive')} />
                      <span className="text-sm font-medium text-foreground">Show promotional banner</span>
                    </label>
                    <ImageUploader value={siteForm.watch('promoBannerImage')} onChange={(url) => siteForm.setValue('promoBannerImage', url)} folder="promo" label="Banner Image" />
                    <Input label="Link URL" placeholder="/products?category=monitors" {...siteForm.register('promoBannerLink')} />
                  </CardContent>
                </Card>

                {/* Discover More Banners */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Layers className="h-5 w-5" />Discover More Banners</CardTitle>
                    <CardDescription>Upload exactly 4 banners for the homepage grid: Banner 1 (tall left), Banner 2 (wide top-right), Banners 3 & 4 (bottom-right pair).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Recommended sizes info */}
                    <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p className="font-semibold">Recommended Image Sizes:</p>
                      <ul className="list-disc list-inside space-y-0.5">
                        <li><strong>Banner 1 (Tall Left):</strong> 600 x 800 px (portrait 3:4)</li>
                        <li><strong>Banner 2 (Wide Top Right):</strong> 1200 x 400 px (landscape 3:1)</li>
                        <li><strong>Banners 3 &amp; 4 (Bottom):</strong> 600 x 450 px (landscape 4:3)</li>
                      </ul>
                      <p className="text-blue-600 dark:text-blue-400">Images will be cropped to fill &mdash; center your subject in the image.</p>
                    </div>
                    {/* Visual layout preview */}
                    <div className="grid grid-cols-3 grid-rows-2 gap-2 p-3 bg-secondary/30 rounded-lg text-xs text-center text-muted-foreground" style={{ minHeight: '120px' }}>
                      <div className="col-span-1 row-span-2 bg-secondary rounded-md flex items-center justify-center border-2 border-dashed border-border">1 (Tall)</div>
                      <div className="col-span-2 row-span-1 bg-secondary rounded-md flex items-center justify-center border-2 border-dashed border-border">2 (Wide)</div>
                      <div className="col-span-1 row-span-1 bg-secondary rounded-md flex items-center justify-center border-2 border-dashed border-border">3</div>
                      <div className="col-span-1 row-span-1 bg-secondary rounded-md flex items-center justify-center border-2 border-dashed border-border">4</div>
                    </div>

                    {discoverFields.length === 0 && (
                      <Button
                        type="button"
                        variant="outline"
                        className="w-full"
                        onClick={() => {
                          addDiscover({ title: '', image: '', link: '', size: 'large', order: 0, isActive: true });
                          addDiscover({ title: '', image: '', link: '', size: 'small', order: 1, isActive: true });
                          addDiscover({ title: '', image: '', link: '', size: 'small', order: 2, isActive: true });
                          addDiscover({ title: '', image: '', link: '', size: 'small', order: 3, isActive: true });
                        }}
                      >
                        <Plus className="h-4 w-4" /> Initialize 4 Banner Slots
                      </Button>
                    )}

                    {discoverFields.map((field, index) => {
                      const posLabels = ['Banner 1 — Tall Left', 'Banner 2 — Wide Top Right', 'Banner 3 — Bottom Left', 'Banner 4 — Bottom Right'];
                      const sizeHints = ['600 x 800 px (portrait)', '1200 x 400 px (landscape)', '600 x 450 px', '600 x 450 px'];
                      return (
                        <div key={field.id} className="p-4 border border-border rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-semibold text-foreground">{posLabels[index] || `Banner ${index + 1}`}</span>
                            <div className="flex items-center gap-3">
                              <label className="flex items-center gap-1.5 cursor-pointer">
                                <input type="checkbox" className="rounded border-border" {...siteForm.register(`discoverBanners.${index}.isActive`)} />
                                <span className="text-xs text-foreground">Active</span>
                              </label>
                              <button type="button" onClick={() => removeDiscover(index)} className="text-xs text-destructive hover:underline">Remove</button>
                            </div>
                          </div>
                          <ImageUploader
                            value={siteForm.watch(`discoverBanners.${index}.image`)}
                            onChange={(url) => siteForm.setValue(`discoverBanners.${index}.image`, url)}
                            folder="discover"
                            label="Image"
                          />
                          <p className="text-xs text-muted-foreground -mt-1">Recommended: {sizeHints[index] || '600 x 450 px'}</p>
                          <div className="grid grid-cols-2 gap-3">
                            <Input label="Title" placeholder="e.g. New Arrivals" {...siteForm.register(`discoverBanners.${index}.title`)} />
                            <Input label="Link" placeholder="/products?category=gaming" {...siteForm.register(`discoverBanners.${index}.link`)} />
                          </div>
                        </div>
                      );
                    })}

                    {discoverFields.length > 0 && discoverFields.length < 4 && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addDiscover({ title: '', image: '', link: '', size: 'small', order: discoverFields.length, isActive: true })}
                      >
                        <Plus className="h-4 w-4" /> Add Banner ({discoverFields.length}/4)
                      </Button>
                    )}
                  </CardContent>
                </Card>

                <Button type="submit" loading={siteLoading}>
                  <Save className="h-4 w-4" />Save Popup & Banners
                </Button>
              </form>
            )}
          </>
        )}

        {/* Billing & GST Tab */}
        {activeTab === 'billing' && (
          <>
            {siteDataLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : (
              <form onSubmit={siteForm.handleSubmit(onSiteSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5" />Business Details</CardTitle>
                    <CardDescription>Your registered business details for invoices and GST filing.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Business Name" placeholder="AMOHA Mobiles" {...siteForm.register('billingBusinessName')} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="GSTIN" placeholder="29AABCU9603R1ZM" {...siteForm.register('billingGstin')} />
                      <Input label="PAN Number" placeholder="AABCU9603R" {...siteForm.register('billingPanNumber')} />
                    </div>
                    <Input label="State Code" placeholder="29" {...siteForm.register('billingStateCode')} />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Billing Address</CardTitle>
                    <CardDescription>This address appears on invoices and receipts.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Address" placeholder="Shop no. 123, Main Road" {...siteForm.register('billingAddress')} />
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="City" placeholder="Bengaluru" {...siteForm.register('billingCity')} />
                      <Input label="State" placeholder="Karnataka" {...siteForm.register('billingState')} />
                      <Input label="Pincode" placeholder="560001" {...siteForm.register('billingPincode')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Phone" placeholder="+91 9876543210" {...siteForm.register('billingPhone')} />
                      <Input label="Email" placeholder="billing@amoha.com" {...siteForm.register('billingEmail')} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>GST Settings</CardTitle>
                    <CardDescription>Enable GST to show tax breakup on POS invoices. GST is calculated as inclusive (extracted from selling price).</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" className="rounded border-border" {...siteForm.register('billingEnableGst')} />
                      <span className="text-sm font-medium text-foreground">Enable GST on invoices</span>
                    </label>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="GST Rate (%)" type="number" placeholder="18" {...siteForm.register('billingGstRate')} />
                      <Input label="SAC Code" placeholder="998314" {...siteForm.register('billingSacCode')} />
                      <Input label="HSN Code" placeholder="8517" {...siteForm.register('billingHsnCode')} />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Invoice Settings</CardTitle>
                    <CardDescription>Customize invoice prefix, footer, and terms.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="Invoice Prefix" placeholder="INV" {...siteForm.register('billingInvoicePrefix')} />
                    <Input label="Footer Note" placeholder="Thank you for your purchase!" {...siteForm.register('billingFooterNote')} />
                    <Textarea label="Terms on Invoice" placeholder="Goods once sold are not returnable..." {...siteForm.register('billingTermsOnInvoice')} rows={3} />
                  </CardContent>
                </Card>

                <Button type="submit" loading={siteLoading}>
                  <Save className="h-4 w-4" />Save Billing & GST Settings
                </Button>
              </form>
            )}
          </>
        )}

        {/* Email SMTP Tab */}
        {activeTab === 'email' && (
          <>
            {siteDataLoading ? (
              <Card><CardContent className="py-8 text-center text-muted-foreground">Loading...</CardContent></Card>
            ) : (
              <form onSubmit={siteForm.handleSubmit(onSiteSubmit)} className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Mail className="h-5 w-5" />SMTP Configuration</CardTitle>
                    <CardDescription>Configure email settings for order confirmations, login alerts, and KYC notifications.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Input label="SMTP Host" placeholder="smtp.gmail.com" {...siteForm.register('smtpHost')} />
                    <Input label="SMTP Port" type="number" placeholder="587" {...siteForm.register('smtpPort')} />
                    <Input label="SMTP Username" placeholder="your-email@gmail.com" {...siteForm.register('smtpUser')} />
                    <Input label="SMTP Password" type="password" placeholder="App password" {...siteForm.register('smtpPass')} />
                    <Input label="From Address" placeholder="AMOHA Mobiles <noreply@amoha.com>" {...siteForm.register('smtpFrom')} />
                    <p className="text-xs text-muted-foreground">Emails will be sent for: user registration, login alerts, order confirmations, order status updates, and KYC status changes.</p>
                  </CardContent>
                </Card>
                <Button type="submit" loading={siteLoading}>
                  <Save className="h-4 w-4" />Save Email Settings
                </Button>
              </form>
            )}
          </>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" />Profile Information</CardTitle>
              <CardDescription>Update your display name, email and phone number.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
                <Input label="Full Name" error={profileForm.formState.errors.name?.message} {...profileForm.register('name')} />
                <Input label="Email Address" type="email" error={profileForm.formState.errors.email?.message} {...profileForm.register('email')} />
                <Input label="Phone Number" type="tel" placeholder="+91 9999999999" {...profileForm.register('phone')} />
                <Button type="submit" loading={profileLoading}><Save className="h-4 w-4" />Save Changes</Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Password Tab */}
        {activeTab === 'password' && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Change Password</CardTitle>
              <CardDescription>Choose a strong password with at least 6 characters.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
                <Input label="Current Password" type="password" error={passwordForm.formState.errors.currentPassword?.message} {...passwordForm.register('currentPassword')} />
                <Input label="New Password" type="password" error={passwordForm.formState.errors.newPassword?.message} {...passwordForm.register('newPassword')} />
                <Input label="Confirm New Password" type="password" error={passwordForm.formState.errors.confirmPassword?.message} {...passwordForm.register('confirmPassword')} />
                <Button type="submit" loading={passwordLoading}><Lock className="h-4 w-4" />Change Password</Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
