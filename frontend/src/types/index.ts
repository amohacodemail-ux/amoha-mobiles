// ==================== Product Types ====================
export interface Product {
  _id: string;
  name: string;
  slug: string;
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
  specifications: ProductSpecifications;
  stock: number;
  inStock: boolean;
  ratings: number;
  numReviews: number;
  reviews: Review[];
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  colors: string[];
  warranty: string;
  condition: 'new' | 'used' | 'refurbished';
  relatedAccessories?: Product[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpecifications {
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

export interface Review {
  _id: string;
  user: ReviewUser;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
}

export interface ReviewUser {
  _id: string;
  name: string;
  avatar?: string;
}

export interface ProductFilters {
  brand?: string[];
  priceMin?: number;
  priceMax?: number;
  ram?: string[];
  storage?: string[];
  battery?: string[];
  rating?: number;
  sort?: string;
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  condition?: string;
  discount?: number;
  inStock?: boolean;
}

export interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
  hasMore: boolean;
}

// ==================== User Types ====================
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  addresses: Address[];
  role: 'user' | 'admin' | 'digital_marketing' | 'sales' | 'marketing' | 'purchase_inventory' | 'logistics' | 'supplier';
  isVerified: boolean;
  kyc?: KycInfo;
  createdAt: string;
  updatedAt: string;
}

export interface KycInfo {
  status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
  documentType?: 'aadhaar' | 'pan' | 'passport' | 'voter_id';
  documentNumber?: string;
  documentImage?: string;
  fullName?: string;
  panNumber?: string;
  panImage?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankName?: string;
  bankAccountHolderName?: string;
  submittedAt?: string;
  verifiedAt?: string;
  rejectionReason?: string;
}

export interface Address {
  _id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken?: string;
  user: User;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

// ==================== Cart Types ====================
export interface CartItem {
  _id: string;
  product: Product;
  quantity: number;
  color?: string;
  price: number;
  totalPrice: number;
}

export interface Cart {
  _id: string;
  items: CartItem[];
  savedForLater: CartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  coupon?: AppliedCoupon;
}

export interface AppliedCoupon {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
}

// ==================== Order Types ====================
export interface Order {
  _id: string;
  orderNumber: string;
  user: string;
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'cod' | 'razorpay';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: OrderStatus;
  statusHistory: StatusHistory[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  coupon?: AppliedCoupon;
  estimatedDelivery: string;
  deliveredAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  logisticsPartner?: string;
  courierAwbNumber?: string;
  isWalkIn?: boolean;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  _id?: string;
  product: Product;
  quantity: number;
  price: number;
  color?: string;
}

export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export interface StatusHistory {
  status: OrderStatus;
  date: string;
  message: string;
}

export interface OrdersResponse {
  orders: Order[];
  totalOrders: number;
  totalPages: number;
  currentPage: number;
}

// ==================== Wishlist Types ====================
export interface WishlistItem {
  _id: string;
  product: Product;
  addedAt: string;
}

// ==================== Banner & Category Types ====================
export interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount: number;
}

// ==================== Coupon Types ====================
export interface Coupon {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrderAmount: number;
  maxDiscount?: number;
  isValid: boolean;
  message: string;
}

// ==================== Payment Types ====================
export interface RazorpayOrderResponse {
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
}

// ==================== Compare Types ====================
export interface CompareItem {
  product: Product;
}

// ==================== API Response Types ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Record<string, string>;
}

// ==================== Pagination ====================

// ==================== Homepage Review ====================
export interface HomepageReview {
  _id: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  productName: string;
  productSlug: string;
  productThumbnail: string;
  user: { name: string; avatar?: string };
}
export interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

// ==================== Search ====================
export interface SearchSuggestion {
  _id: string;
  name: string;
  slug: string;
  thumbnail: string;
  price: number;
  brand: string;
}

// ==================== Product Q&A ====================
export interface ProductQuestion {
  _id: string;
  product: string;
  user: { _id: string; name: string; avatar?: string };
  question: string;
  answers: ProductAnswer[];
  upvotes: number;
  isAnswered: boolean;
  createdAt: string;
}

export interface ProductAnswer {
  _id: string;
  user: { _id: string; name: string; avatar?: string; role?: string };
  answer: string;
  isSellerAnswer: boolean;
  upvotes: number;
  createdAt: string;
}

// ==================== Return/Refund ====================
export type ReturnReason =
  | 'defective'
  | 'wrong_item'
  | 'not_as_described'
  | 'damaged_in_transit'
  | 'size_fit_issue'
  | 'changed_mind'
  | 'better_price_elsewhere'
  | 'other';

export type ReturnType = 'return' | 'replacement' | 'refund';

export type ReturnStatus =
  | 'requested'
  | 'approved'
  | 'rejected'
  | 'pickup_scheduled'
  | 'picked_up'
  | 'received'
  | 'inspected'
  | 'refund_initiated'
  | 'refund_completed'
  | 'replacement_shipped'
  | 'closed';

export interface ReturnRequest {
  _id: string;
  returnNumber: string;
  order: { _id: string; orderNumber: string; totalAmount: number };
  items: {
    product: { _id: string; name: string; thumbnail: string; price: number };
    quantity: number;
    price: number;
    reason: ReturnReason;
  }[];
  returnType: ReturnType;
  status: ReturnStatus;
  statusHistory: { status: ReturnStatus; date: string; message: string }[];
  reason: ReturnReason;
  description: string;
  images: string[];
  refundAmount: number;
  refundMethod: string;
  refundStatus: string;
  createdAt: string;
}

// ==================== Wallet ====================
export interface WalletBalance {
  balance: number;
}

export interface WalletTransaction {
  _id: string;
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceType?: string;
  balanceAfter: number;
  createdAt: string;
}
