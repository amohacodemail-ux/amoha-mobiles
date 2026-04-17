// ==================== Customer Segment ====================
export interface ICustomerSegment {
  _id?: string;
  id?: string;
  userId: string;
  segment: 'vip' | 'frequent' | 'regular' | 'inactive' | 'new';
  assignedAt?: Date;
  assignedBy?: string;
}

// ==================== Customer Tag ====================
export interface ICustomerTag {
  _id?: string;
  id?: string;
  userId: string;
  tag: string;
  createdBy?: string;
  createdAt?: Date;
}

// ==================== Customer Note ====================
export interface ICustomerNote {
  _id?: string;
  id?: string;
  userId: string;
  adminId: string;
  note: string;
  type: 'note' | 'call' | 'email' | 'meeting' | 'follow_up' | 'complaint';
  isPinned?: boolean;
  admin?: any;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Fraud Flag ====================
export interface IFraudFlag {
  _id?: string;
  id?: string;
  userId: string;
  flagType: 'multiple_failed_payments' | 'excessive_returns' | 'suspicious_activity' | 'chargebacks' | 'address_mismatch' | 'velocity_abuse';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  isResolved: boolean;
  resolvedBy?: string;
  resolvedAt?: Date;
  resolutionNote?: string;
  autoDetected?: boolean;
  createdAt?: Date;
}

export const CUSTOMER_SEGMENT_TABLE = 'customer_segments';
export const CUSTOMER_TAG_TABLE = 'customer_tags';
export const CUSTOMER_NOTE_TABLE = 'customer_notes';
export const FRAUD_FLAG_TABLE = 'fraud_flags';
