export type ReturnReason = 'defective' | 'wrong_item' | 'not_as_described' | 'damaged_in_transit' | 'size_fit_issue' | 'changed_mind' | 'better_price_elsewhere' | 'other';
export type ReturnType = 'return' | 'replacement' | 'refund';
export type ReturnStatus = 'requested' | 'approved' | 'rejected' | 'pickup_scheduled' | 'picked_up' | 'received' | 'inspected' | 'refund_initiated' | 'refund_completed' | 'replacement_shipped' | 'closed';

export interface IReturnRequest {
  _id?: string;
  id?: string;
  returnNumber: string;
  orderId: string;
  order?: any;
  userId: string;
  user?: any;
  items?: { productId: string; product?: any; quantity: number; price: number; reason: ReturnReason; }[];
  returnType: ReturnType;
  status: ReturnStatus;
  statusHistory?: { status: ReturnStatus; date: Date; message: string; updatedBy?: string; }[];
  reason: ReturnReason;
  description: string;
  images: string[];
  refundAmount: number;
  refundMethod: 'original_payment' | 'wallet' | 'bank_transfer';
  refundStatus: 'pending' | 'processing' | 'completed' | 'failed';
  pickupAddress: { fullName: string; phone: string; addressLine1: string; addressLine2?: string; city: string; state: string; pincode: string; };
  pickupDate?: Date;
  adminNotes?: string;
  replacementOrderId?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const RETURN_REQUEST_TABLE = 'return_requests';
export const RETURN_REQUEST_ITEM_TABLE = 'return_request_items';
export const RETURN_STATUS_HISTORY_TABLE = 'return_status_history';
