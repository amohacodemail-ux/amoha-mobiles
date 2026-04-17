export interface ISupplierEntry {
  id: string;
  supplier_id: string;
  item_name: string;
  quantity: number;
  price: number | null;
  note: string;
  status: 'pending' | 'converted' | 'rejected';
  converted_product_id: string | null;
  converted_by: string | null;
  converted_at: string | null;
  rejection_reason: string | null;
  rejected_by: string | null;
  rejected_at: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface IInventory {
  id: string;
  product_id: string;
  supplier_id: string | null;
  supplier_entry_id: string | null;
  total_stock: number;
  available_stock: number;
  reserved_stock: number;
  sold_stock: number;
  damaged_stock: number;
  cost_price: number;
  last_restocked_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface IInventoryAuditLog {
  id: string;
  inventory_id: string;
  product_id: string;
  action: string;
  quantity_changed: number;
  before_state: Record<string, number>;
  after_state: Record<string, number>;
  reference_type: string | null;
  reference_id: string | null;
  notes: string;
  performed_by: string | null;
  created_at: string;
}

export const SUPPLIER_ENTRIES_TABLE = 'supplier_entries';
export const INVENTORY_TABLE = 'inventory';
export const INVENTORY_AUDIT_LOG_TABLE = 'inventory_audit_log';
