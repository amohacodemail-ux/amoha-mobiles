// ==================== Supplier ====================
export interface ISupplier {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  companyName?: string;
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
  reliabilityScore?: number;
  avgDeliveryDays?: number;
  totalOrders?: number;
  onTimeDeliveries?: number;
  defectRate?: number;
  status: 'active' | 'inactive' | 'blacklisted';
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Supplier Product ====================
export interface ISupplierProduct {
  _id?: string;
  id?: string;
  supplierId: string;
  productId: string;
  unitCost: number;
  leadTimeDays?: number;
  minOrderQty?: number;
  isPreferred?: boolean;
  lastSuppliedAt?: Date;
  createdAt?: Date;
  supplier?: any;
  product?: any;
}

// ==================== Purchase Order ====================
export interface IPurchaseOrder {
  _id?: string;
  id?: string;
  poNumber: string;
  supplierId: string;
  supplier?: any;
  status: 'draft' | 'sent' | 'confirmed' | 'partially_received' | 'received' | 'cancelled';
  orderDate?: Date;
  expectedDelivery?: Date;
  actualDelivery?: Date;
  subtotal: number;
  taxAmount: number;
  shippingCost: number;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  items?: IPurchaseOrderItem[];
  createdBy?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPurchaseOrderItem {
  _id?: string;
  id?: string;
  purchaseOrderId?: string;
  productId: string;
  product?: any;
  quantity: number;
  unitCost: number;
  totalCost: number;
  receivedQty?: number;
  createdAt?: Date;
}

export const SUPPLIER_TABLE = 'suppliers';
export const SUPPLIER_PRODUCT_TABLE = 'supplier_products';
export const PURCHASE_ORDER_TABLE = 'purchase_orders';
export const PURCHASE_ORDER_ITEM_TABLE = 'purchase_order_items';
