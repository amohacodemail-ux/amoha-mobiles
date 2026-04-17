export interface IStatusHistory {
  _id?: string;
  id?: string;
  status: string;
  date: Date;
  message: string;
}

export interface IOrderItem {
  _id?: string;
  id?: string;
  orderId?: string;
  product?: any;
  productId?: string;
  quantity: number;
  price: number;
  color?: string;
}

export interface IOrder {
  _id?: string;
  id?: string;
  orderNumber: string;
  userId: string;
  user?: any;
  items?: IOrderItem[];
  shippingAddress: {
    fullName: string;
    phone: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    pincode: string;
    type: 'home' | 'work' | 'other';
  };
  paymentMethod: string;
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'placed' | 'confirmed' | 'processing' | 'shipped' | 'out_for_delivery' | 'delivered' | 'cancelled' | 'returned';
  statusHistory?: IStatusHistory[];
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  coupon?: {
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
  };
  estimatedDelivery?: Date;
  deliveredAt?: Date;
  cancelReason?: string;
  trackingNumber?: string;
  trackingUrl?: string;
  logisticsPartner?: 'dhl' | 'professional_courier' | 'bluedart' | 'delhivery' | 'ecom_express' | 'other';
  courierAwbNumber?: string;
  shipmentWeight?: string;
  isWalkIn: boolean;
  walkInCustomerName?: string;
  walkInCustomerPhone?: string;
  walkInCustomerEmail?: string;
  posPaymentMethod?: 'cash' | 'card' | 'upi' | 'other';
  posDiscount?: number;
  posDiscountType?: 'percentage' | 'fixed';
  gstAmount?: number;
  gstRate?: number;
  invoiceNumber?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const ORDER_TABLE = 'orders';
export const ORDER_ITEM_TABLE = 'order_items';
export const ORDER_STATUS_HISTORY_TABLE = 'order_status_history';
