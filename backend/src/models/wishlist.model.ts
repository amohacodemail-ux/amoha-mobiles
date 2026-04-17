export interface IWishlistItem {
  _id?: string;
  id?: string;
  wishlistId?: string;
  product?: any;
  productId?: string;
  addedAt?: Date;
}

export interface IWishlist {
  _id?: string;
  id?: string;
  userId: string;
  items: IWishlistItem[];
  createdAt?: Date;
  updatedAt?: Date;
}

export const WISHLIST_TABLE = 'wishlists';
export const WISHLIST_ITEM_TABLE = 'wishlist_items';
