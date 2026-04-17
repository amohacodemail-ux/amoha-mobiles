export interface IBanner {
  _id?: string;
  id?: string;
  title: string;
  subtitle: string;
  image: string;
  link: string;
  position: 'hero' | 'sidebar' | 'popup' | 'footer';
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export const BANNER_TABLE = 'banners';
