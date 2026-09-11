export interface IServiceRequest {
  _id?: string;
  id?: string;
  requestNumber: string;
  userId?: string;
  user?: any;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  deviceBrand: string;
  deviceModel: string;
  serviceType: string;
  description: string;
  estimatedPrice?: number;
  finalPrice?: number;
  status: 'new_request' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  isWalkIn?: boolean;
  assignedTo?: string;
  assignedUser?: any;
  imeiOrSerialNumber?: string;
  customerPhotoUrl?: string;
  devicePhotoUrl?: string;
  serviceCharges?: number;
  partsCharges?: number;
  totalAmount?: number;
  paymentMethod?: string;
  paymentStatus?: 'pending' | 'paid';
  invoiceNumber?: string;
  invoiceDate?: Date;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const SERVICE_REQUEST_TABLE = 'service_requests';
