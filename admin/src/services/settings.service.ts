import apiClient from '@/lib/api-client';
import type { ApiResponse } from '@/types';

export interface PopupSettings {
  isActive: boolean;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
}

export interface DiscoverBanner {
  _id?: string;
  title: string;
  image: string;
  link: string;
  size: 'large' | 'small';
  order: number;
  isActive: boolean;
}

export interface PromoBanner {
  image: string;
  link: string;
  isActive: boolean;
}

export interface BillingSettings {
  businessName: string;
  gstin: string;
  panNumber: string;
  stateCode: string;
  billingAddress: string;
  billingCity: string;
  billingState: string;
  billingPincode: string;
  billingPhone: string;
  billingEmail: string;
  enableGst: boolean;
  gstRate: number;
  sacCode: string;
  hsnCode: string;
  termsOnInvoice: string;
  invoicePrefix: string;
  footerNote: string;
}

export interface SiteSettings {
  _id?: string;
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  billing: BillingSettings;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
  announcement: string;
  isAnnouncementActive: boolean;
  popup: PopupSettings;
  discoverBanners: DiscoverBanner[];
  promoBanner: PromoBanner;
  policies: {
    termsAndConditions: string;
    privacyPolicy: string;
    returnPolicy: string;
    shippingPolicy: string;
    refundPolicy: string;
  };
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
}

export const settingsService = {
  get: async (): Promise<SiteSettings> => {
    const { data } = await apiClient.get<ApiResponse<SiteSettings>>('/admin/settings');
    return data.data;
  },
  update: async (payload: Partial<SiteSettings>): Promise<SiteSettings> => {
    const { data } = await apiClient.put<ApiResponse<SiteSettings>>('/admin/settings', payload);
    return data.data;
  },
};
