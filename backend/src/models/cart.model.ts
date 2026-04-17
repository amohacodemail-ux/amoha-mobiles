export interface ICartItem {
  _id?: string;
  id?: string;
  cartId?: string;
  product?: any;
  productId?: string;
  quantity: number;
  color?: string;
  price: number;
  totalPrice: number;
  savedForLater?: boolean;
}

export interface ICart {
  _id?: string;
  id?: string;
  userId: string;
  user?: any;
  items: ICartItem[];
  savedForLater?: ICartItem[];
  totalItems: number;
  subtotal: number;
  discount: number;
  deliveryCharge: number;
  totalAmount: number;
  coupon?: {
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed';
    maxDiscount?: number;
  };
  createdAt?: Date;
  updatedAt?: Date;
}

export const CART_TABLE = 'carts';
export const CART_ITEM_TABLE = 'cart_items';
