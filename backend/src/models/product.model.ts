import crypto from 'crypto';

export interface IReview {
  _id?: string;
  id?: string;
  productId?: string;
  userId?: string;
  user?: any;
  rating: number;
  title: string;
  comment: string;
  createdAt?: Date;
}

export interface IProductSpecifications {
  display: string;
  displaySize: string;
  processor: string;
  ram: string;
  storage: string;
  expandableStorage: string;
  battery: string;
  chargingSpeed: string;
  rearCamera: string;
  frontCamera: string;
  os: string;
  network: string;
  sim: string;
  weight: string;
  dimensions: string;
  waterResistant: string;
  fingerprint: string;
  nfc: boolean;
  [key: string]: string | boolean;
}

export interface IProduct {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  barcodeType?: 'EAN13' | 'EAN8' | 'UPCA' | 'CODE128' | 'CODE39';
  brand: string;
  category: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  thumbnail: string;
  videos: string[];
  specifications: IProductSpecifications;
  stock: number;
  inStock: boolean;
  ratings: number;
  numReviews: number;
  reviews?: IReview[];
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  colors: string[];
  warranty: string;
  condition: 'new' | 'used' | 'refurbished';
  relatedAccessories: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

/** Generate SKU if not provided */
export function generateSku(): string {
  const ts = Date.now().toString(36).toUpperCase();
  const rand = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `AMH-${ts}-${rand}`;
}

export const PRODUCT_TABLE = 'products';
export const REVIEW_TABLE = 'reviews';

