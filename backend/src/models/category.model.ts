export interface ICategory {
  _id?: string;
  id?: string;
  name: string;
  slug: string;
  image: string;
  description: string;
  productCount: number;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export const CATEGORY_TABLE = 'categories';
