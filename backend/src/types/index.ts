import { Request } from "express";

export interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    role: UserRole;
  };
}

export type OrderStatus =
  | "placed"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type AddressType =
  | "home"
  | "work"
  | "other";

export type DiscountType =
  | "percentage"
  | "fixed";

// RBAC Roles - Standardized for AMOHA Mobiles Admin System
export type UserRole =
  | "user"           // Regular customer
  | "admin"          // Full system access
  | "sales"          // Sales operations: orders, billing, POS, returns, wallets
  | "purchase"       // Purchase operations: products, inventory, suppliers, RFQ
  | "marketing"      // Marketing operations: coupons, banners, reviews, CRM, campaigns
  | "logistics"      // Logistics operations: order tracking, shipping
  | "supplier"       // Supplier portal access
  | "digital_marketing"  // Legacy - mapped to marketing
  | "purchase_inventory"; // Legacy - mapped to purchase

export interface PaginationQuery {
  page?: string;
  limit?: string;
  sort?: string;
  search?: string;
}

export interface ProductFilterQuery extends PaginationQuery {
  brand?: string;
  category?: string;
  priceMin?: string;
  priceMax?: string;
  ram?: string;
  storage?: string;
  battery?: string;
  rating?: string;
}