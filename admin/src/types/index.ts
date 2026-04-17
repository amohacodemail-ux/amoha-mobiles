// ==================== API ====================
export interface ApiResponse<T = unknown> {
  success: boolean;
  message: string;
  data: T;
}

export interface PaginationMeta {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

// ==================== Auth ====================
export interface AdminUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'admin' | 'user' | 'supplier';
  isVerified: boolean;
  createdAt: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  token: string;
  refreshToken?: string;
  user: AdminUser;
}

// ==================== Dashboard ====================
export interface DashboardStats {
  totalRevenue: number;
  totalOrders: number;
  totalProducts: number;
  totalUsers: number;
  revenueGrowth: number;
  ordersGrowth: number;
  productsGrowth: number;
  usersGrowth: number;
}

export interface RevenueData {
  month: string;
  revenue: number;
  orders: number;
}

export interface TopProduct {
  _id: string;
  name: string;
  thumbnail: string;
  totalSold: number;
  revenue: number;
}

export interface RecentOrder {
  _id: string;
  orderNumber: string;
  user: { name: string; email: string };
  totalAmount: number;
  orderStatus: OrderStatus;
  createdAt: string;
}

// ==================== Product ====================
export interface Product {
  _id: string;
  name: string;
  slug: string;
  sku: string;
  barcode: string;
  brandId: string;
  categoryId: string;
  brand: string | Brand;
  category: string | Category;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  discount: number;
  images: string[];
  thumbnail: string;
  specifications: Record<string, string | boolean>;
  stock: number;
  inStock: boolean;
  ratings: number;
  numReviews: number;
  tags: string[];
  isFeatured: boolean;
  isTrending: boolean;
  colors: string[];
  warranty: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFormData {
  name: string;
  brand: string;
  category: string;
  description: string;
  shortDescription: string;
  price: number;
  originalPrice: number;
  stock: number;
  tags: string;
  isFeatured: boolean;
  isTrending: boolean;
  colors: string;
  warranty: string;
  specifications: Record<string, string>;
}

export interface ProductsResponse {
  products: Product[];
  totalProducts: number;
  totalPages: number;
  currentPage: number;
}

// ==================== Category ====================
export interface Category {
  _id: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount: number;
  isActive: boolean;
  createdAt: string;
}

export interface CategoryFormData {
  name: string;
  description: string;
  image: string;
  isActive: boolean;
}

// ==================== Brand ====================
export interface Brand {
  _id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  isActive: boolean;
  productCount: number;
  createdAt: string;
}

export interface BrandFormData {
  name: string;
  logo: string;
  description: string;
  isActive: boolean;
}

// ==================== Order ====================
export type OrderStatus =
  | 'placed'
  | 'confirmed'
  | 'processing'
  | 'shipped'
  | 'out_for_delivery'
  | 'delivered'
  | 'cancelled'
  | 'returned';

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';

export interface Order {
  _id: string;
  orderNumber: string;
  user: { _id: string; name: string; email: string; phone: string };
  items: OrderItem[];
  shippingAddress: Address;
  paymentMethod: 'cod' | 'razorpay';
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  statusHistory: StatusHistory[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  estimatedDelivery: string;
  deliveredAt?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  logisticsPartner?: 'dhl' | 'professional_courier' | 'other';
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  product: { _id: string; name: string; thumbnail: string };
  quantity: number;
  price: number;
  color?: string;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

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

// ==================== User ====================
export interface User {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  role: 'user' | 'admin' | 'supplier';
  isVerified: boolean;
  isBlocked: boolean;
  totalOrders: number;
  totalSpent: number;
  kyc?: {
    status: 'not_submitted' | 'pending' | 'verified' | 'rejected';
    documentType?: string;
    documentNumber?: string;
    fullName?: string;
    rejectionReason?: string;
  };
  createdAt: string;
}

export interface UsersResponse {
  users: User[];
  totalUsers: number;
  totalPages: number;
  currentPage: number;
}

// ==================== Coupon ====================
export interface Coupon {
  _id: string;
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
  expiresAt: string;
  createdAt: string;
}

export interface CouponFormData {
  code: string;
  discount: number;
  discountType: 'percentage' | 'fixed';
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit: number;
  isActive: boolean;
  expiresAt: string;
}

// ==================== Banner ====================
export interface Banner {
  _id: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: 'hero' | 'sidebar' | 'popup' | 'footer';
  isActive: boolean;
  order: number;
  createdAt: string;
}

export interface BannerFormData {
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: 'hero' | 'sidebar' | 'popup' | 'footer';
  isActive: boolean;
  order: number;
}

// ==================== Review ====================
export interface Review {
  _id: string;
  product: { _id: string; name: string; thumbnail: string };
  user: { _id: string; name: string; avatar?: string };
  rating: number;
  title: string;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  isApproved: boolean;
  createdAt: string;
}

export interface ReviewsResponse {
  reviews: Review[];
  totalReviews: number;
  totalPages: number;
  currentPage: number;
}

// ==================== Settings ====================
export interface SiteSettings {
  siteName: string;
  tagline: string;
  logo: string;
  favicon: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  deliveryCharge: number;
  freeDeliveryAbove: number;
  announcement: string;
  isAnnouncementActive: boolean;
  socialLinks: {
    facebook: string;
    instagram: string;
    twitter: string;
    youtube: string;
  };
}

// ==================== Filters ====================
export interface TableFilters {
  page: number;
  limit: number;
  search: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  [key: string]: string | number | undefined;
}

// ==================== Returns ====================
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

export type ReturnType = 'return' | 'replacement' | 'refund';

export interface ReturnRequestItem {
  product: { _id: string; name: string; thumbnail: string };
  quantity: number;
  price: number;
  reason: string;
}

export interface ReturnRequest {
  _id: string;
  returnNumber: string;
  order: { _id: string; orderNumber: string };
  user: { _id: string; name: string; email: string };
  items: ReturnRequestItem[];
  returnType: ReturnType;
  status: ReturnStatus;
  reason: string;
  description?: string;
  refundAmount: number;
  refundMethod: 'original_payment' | 'wallet' | 'bank_transfer';
  statusHistory: { status: ReturnStatus; message: string; updatedBy?: string; date: string }[];
  createdAt: string;
  updatedAt: string;
}

export interface ReturnsResponse {
  items: ReturnRequest[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

export interface ReturnStats {
  total: number;
  pending: number;
  approved: number;
  inProgress: number;
  completed: number;
}

// ==================== Wallet ====================
export interface AdminWallet {
  _id: string;
  user: { _id: string; name: string; email: string };
  balance: number;
  transactions: WalletTransaction[];
  createdAt: string;
}

export interface WalletTransaction {
  type: 'credit' | 'debit';
  amount: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  balanceAfter: number;
  createdAt: string;
}

export interface WalletsResponse {
  items: AdminWallet[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// ==================== Activity Log ====================
export interface ActivityLog {
  _id: string;
  user: { _id: string; name: string; email: string };
  action: string;
  resource: string;
  resourceId?: string;
  details?: string;
  ipAddress?: string;
  changes?: { field: string; oldValue: string; newValue: string }[];
  createdAt: string;
}

export interface ActivityLogsResponse {
  items: ActivityLog[];
  totalItems: number;
  totalPages: number;
  currentPage: number;
}

// ==================== Supplier ====================
export interface Supplier {
  _id: string;
  name: string;
  code: string;
  email?: string;
  phone?: string;
  contactPerson?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  pincode?: string;
  country?: string;
  gstNumber?: string;
  panNumber?: string;
  bankName?: string;
  bankAccountNumber?: string;
  bankIfsc?: string;
  paymentTerms?: string;
  reliabilityScore: number;
  avgDeliveryDays: number;
  totalOrders: number;
  onTimeDeliveries: number;
  defectRate: number;
  status: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
  products?: SupplierProduct[];
  createdAt: string;
  updatedAt: string;
}

export interface SupplierProduct {
  _id: string;
  supplierId: string;
  productId: string;
  unitCost: number;
  leadTimeDays: number;
  minOrderQty: number;
  isPreferred: boolean;
  products?: { _id: string; name: string; sku: string; thumbnail: string; sellingPrice: number; stock: number };
  createdAt: string;
}

export interface SupplierFormData {
  name: string;
  code?: string;
  email?: string;
  password?: string;
  phone?: string;
  contactPerson?: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  gstNumber?: string;
  panNumber?: string;
  paymentTerms?: string;
  status?: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
}

export interface SuppliersResponse {
  suppliers: Supplier[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface PurchaseOrder {
  _id: string;
  poNumber: string;
  supplierId: string;
  suppliers?: { _id: string; name: string; code: string; email?: string; phone?: string };
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  orderDate: string;
  expectedDelivery?: string;
  actualDelivery?: string;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  items?: PurchaseOrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseOrderItem {
  _id: string;
  productId: string;
  products?: { _id: string; name: string; sku: string; thumbnail: string };
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty: number;
}

export interface PurchaseOrdersResponse {
  purchaseOrders: PurchaseOrder[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface SupplierDashboardStats {
  totalSuppliers: number;
  totalPOs: number;
  pendingPOs: number;
  totalPurchaseValue: number;
  topSuppliers: Supplier[];
}

// ==================== Customer Management ====================
export interface CustomerProfile {
  _id: string;
  name: string;
  email: string;
  phone: string;
  avatar?: string;
  isVerified: boolean;
  isBlocked: boolean;
  segment: 'vip' | 'frequent' | 'regular' | 'inactive' | 'new';
  totalOrders: number;
  totalSpent: number;
  avgOrderValue: number;
  cancelledOrders: number;
  returnedOrders: number;
  lastOrderAt?: string;
  fraudFlagCount: number;
  tags?: CustomerTag[];
  notes?: CustomerNote[];
  fraudFlags?: FraudFlag[];
  orders?: any[];
  addresses?: any[];
  createdAt: string;
}

export interface CustomerTag {
  _id: string;
  tag: string;
  createdAt: string;
}

export interface CustomerNote {
  _id: string;
  userId: string;
  adminId: string;
  admin?: { _id: string; name: string };
  note: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'follow_up' | 'complaint';
  isPinned: boolean;
  createdAt: string;
}

export interface FraudFlag {
  _id: string;
  userId: string;
  user?: { _id: string; name: string; email: string };
  flagType: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  isResolved: boolean;
  resolvedAt?: string;
  resolutionNote?: string;
  autoDetected: boolean;
  createdAt: string;
}

export interface CustomersResponse {
  customers: CustomerProfile[];
  total: number;
  totalPages: number;
  currentPage: number;
}

export interface CustomerDashboardStats {
  totalCustomers: number;
  newThisMonth: number;
  segmentCounts: Record<string, number>;
  activeFraudFlags: number;
  blockedUsers: number;
}

// ==================== Inventory ====================
export interface Warehouse {
  _id: string;
  name: string;
  code: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  managerName?: string;
  managerPhone?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt: string;
}

export interface WarehouseFormData {
  name: string;
  code: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  managerName?: string;
  managerPhone?: string;
  isActive?: boolean;
  isDefault?: boolean;
}

export interface StockProduct {
  _id: string;
  name: string;
  sku: string;
  barcode?: string;
  thumbnail: string;
  stock: number;
  sellingPrice: number;
  brandName: string;
  categoryName: string;
  stockStatus: 'out_of_stock' | 'critical' | 'low' | 'normal';
}

export interface InventoryMovement {
  _id: string;
  productId: string;
  products?: { _id: string; name: string; sku: string; thumbnail: string };
  warehouses?: { _id: string; name: string; code: string };
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage';
  quantity: number;
  referenceType?: string;
  beforeQty: number;
  afterQty: number;
  notes?: string;
  createdAt: string;
}

export interface StockAlert {
  _id: string;
  productId: string;
  products?: { _id: string; name: string; sku: string; thumbnail: string; stock: number };
  alertType: 'low_stock' | 'out_of_stock' | 'overstock';
  currentStock: number;
  threshold: number;
  isAcknowledged: boolean;
  createdAt: string;
}

export interface InventoryForecast {
  _id: string;
  productId: string;
  products?: { _id: string; name: string; sku: string; stock: number; thumbnail: string };
  forecastDate: string;
  predictedDemand: number;
  avgDailySales: number;
  daysOfStockRemaining: number;
  reorderRecommended: boolean;
  recommendedQty: number;
  createdAt: string;
}

export interface InventoryDashboardStats {
  totalProducts: number;
  totalStock: number;
  outOfStock: number;
  lowStock: number;
  totalWarehouses: number;
  pendingAlerts: number;
  recentMovements: number;
  totalStockValue: number;
}
