export interface IAddress {
  _id?: string;
  id?: string;
  userId?: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
  type: 'home' | 'work' | 'other';
  createdAt?: Date;
}

export interface IKyc {
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
  submittedAt?: Date;
  verifiedAt?: Date;
  rejectionReason?: string;
}

export interface IUser {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone: string;
  password?: string;
  avatar?: string;
  addresses?: IAddress[];
  role: 'user' | 'admin' | 'digital_marketing' | 'sales' | 'marketing' | 'purchase_inventory' | 'logistics' | 'supplier';
  isVerified: boolean;
  isBlocked: boolean;
  kyc: IKyc;
  refreshToken?: string;
  resetPasswordToken?: string;
  resetPasswordExpiry?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export const USER_TABLE = 'users';
export const ADDRESS_TABLE = 'addresses';
