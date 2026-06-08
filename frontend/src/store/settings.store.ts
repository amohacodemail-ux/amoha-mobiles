import { create } from 'zustand';
import apiClient from '@/lib/api-client';

interface PopupSettings {
  isActive: boolean;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
}

interface DiscoverBanner {
  _id?: string;
  title: string;
  image: string;
  link: string;
  size: 'large' | 'small';
  order: number;
  isActive: boolean;
}

interface PromoBanner {
  image: string;
  link: string;
  isActive: boolean;
}

interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
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
}

interface SettingsStore {
  settings: SiteSettings | null;
  loaded: boolean;
  fetchSettings: () => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: null,
  loaded: false,
  fetchSettings: async () => {
    try {
      const { data } = await apiClient.get('/settings');
      set({ settings: data.data, loaded: true });
    } catch {
      set({ loaded: true });
    }
  },
}));
