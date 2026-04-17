export interface IProductView {
  _id?: string;
  id?: string;
  userId: string;
  user?: any;
  productId: string;
  product?: any;
  viewedAt?: Date;
  duration: number;
}

export const PRODUCT_VIEW_TABLE = 'product_views';
