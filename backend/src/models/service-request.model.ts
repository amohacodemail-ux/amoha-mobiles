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
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled';
  adminNotes?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export const SERVICE_REQUEST_TABLE = 'service_requests';
