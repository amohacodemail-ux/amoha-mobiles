export interface ISupplierCatalogue {
  id?: string;
  supplier_id: string;
  product_name: string;
  category?: string;
  description?: string;
  unit?: string;
  supplier_price: number;
  moq: number;
  available_stock: number;
  delivery_time_days?: number;
  image_url?: string;
  status: 'active' | 'inactive';
  mapped_product_id?: string | null;
  created_at?: Date;
  updated_at?: Date;
}

export const SUPPLIER_CATALOGUE_TABLE = 'supplier_catalogues';
