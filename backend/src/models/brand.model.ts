export interface IBrand {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const BRAND_TABLE = 'brands';
