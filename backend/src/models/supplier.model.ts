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

// ==================== GRN ====================
export interface IGoodsReceiptNote {
  id?: string;
  grnNumber: string;
  poId: string;
  supplierId: string;
  status: 'draft' | 'received';
  receivedDate?: Date;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  purchaseOrder?: IPurchaseOrder;
  supplier?: ISupplier;
  items?: IGoodsReceiptNoteItem[];
}

export interface IGoodsReceiptNoteItem {
  id?: string;
  grnId: string;
  productId: string;
  orderedQty: number;
  receivedQty: number;
  damagedQty: number;
  pendingQty: number;
  createdAt?: Date;
  product?: any;
}

// ==================== Purchase Return ====================
export interface IPurchaseReturn {
  id?: string;
  returnNumber: string;
  poId?: string;
  grnId?: string;
  supplierId: string;
  status: 'draft' | 'pending' | 'approved' | 'returned' | 'cancelled';
  returnDate?: Date;
  totalAmount: number;
  notes?: string;
  createdAt?: Date;
  updatedAt?: Date;
  supplier?: ISupplier;
  items?: IPurchaseReturnItem[];
}

export interface IPurchaseReturnItem {
  id?: string;
  returnId: string;
  productId: string;
  returnQty: number;
  unitPrice: number;
  reason?: string;
  createdAt?: Date;
  product?: any;
}

// ==================== Purchase Payment ====================
export interface IPurchasePayment {
  id?: string;
  poId: string;
  supplierId: string;
  amount: number;
  paymentMethod: string;
  paymentDate?: Date;
  referenceNumber?: string;
  notes?: string;
  createdAt?: Date;
  purchaseOrder?: IPurchaseOrder;
  supplier?: ISupplier;
}

export const SUPPLIER_TABLE = 'suppliers';
export const SUPPLIER_PRODUCT_TABLE = 'supplier_products';
export const PURCHASE_ORDER_TABLE = 'purchase_orders';
export const PURCHASE_ORDER_ITEM_TABLE = 'purchase_order_items';
export const GRN_TABLE = 'goods_receipt_notes';
export const GRN_ITEM_TABLE = 'goods_receipt_note_items';
export const PURCHASE_RETURN_TABLE = 'purchase_returns';
export const PURCHASE_RETURN_ITEM_TABLE = 'purchase_return_items';
export const PURCHASE_PAYMENT_TABLE = 'purchase_payments';
