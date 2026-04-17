export interface IPopupSettings {
  isActive: boolean;
  title: string;
  subtitle: string;
  description: string;
  image: string;
  buttonText: string;
  buttonLink: string;
  bgColor: string;
}

export interface IDiscoverBanner {
  _id?: string;
  id?: string;
  title: string;
  image: string;
  link: string;
  size: 'large' | 'small';
  order: number;
  isActive: boolean;
}

export interface IPromoBanner {
  image: string;
  link: string;
  isActive: boolean;
}

export interface IPolicies {
  termsAndConditions: string;
  privacyPolicy: string;
  returnPolicy: string;
  shippingPolicy: string;
  refundPolicy: string;
}

export interface IBillingSettings {
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

export interface ISiteSettings {
  _id?: string;
  id?: string;
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  billing: IBillingSettings;
  socialLinks: { facebook: string; instagram: string; twitter: string; youtube: string; };
  announcement: string;
  isAnnouncementActive: boolean;
  popup: IPopupSettings;
  discoverBanners: IDiscoverBanner[];
  promoBanner: IPromoBanner;
  policies: IPolicies;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPass: string;
  smtpFrom: string;
  updatedAt?: Date;
}

export const SITE_SETTINGS_TABLE = 'site_settings';
