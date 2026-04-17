// ==================== Warehouse ====================
export interface IWarehouse {
  _id?: string;
  id?: string;
  name: string;
  code: string;
  addressLine1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  managerName?: string;
  managerPhone?: string;
  isActive: boolean;
  isDefault: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

// ==================== Warehouse Stock ====================
export interface IWarehouseStock {
  _id?: string;
  id?: string;
  warehouseId: string;
  productId: string;
  quantity: number;
  minStockLevel: number;
  maxStockLevel?: number;
  reorderPoint?: number;
  warehouse?: any;
  product?: any;
  updatedAt?: Date;
}

// ==================== Inventory Movement ====================
export interface IInventoryMovement {
  _id?: string;
  id?: string;
  productId: string;
  warehouseId?: string;
  type: 'in' | 'out' | 'adjustment' | 'transfer' | 'return' | 'damage';
  quantity: number;
  referenceType?: 'purchase_order' | 'order' | 'return' | 'manual' | 'transfer' | 'damage';
  referenceId?: string;
  beforeQty: number;
  afterQty: number;
  notes?: string;
  createdBy?: string;
  product?: any;
  warehouse?: any;
  createdAt?: Date;
}

// ==================== Stock Alert ====================
export interface IStockAlert {
  _id?: string;
  id?: string;
  productId: string;
  warehouseId?: string;
  alertType: 'low_stock' | 'out_of_stock' | 'overstock' | 'expiring';
  currentStock: number;
  threshold: number;
  isAcknowledged: boolean;
  acknowledgedBy?: string;
  acknowledgedAt?: Date;
  product?: any;
  createdAt?: Date;
}

// ==================== Inventory Forecast ====================
export interface IInventoryForecast {
  _id?: string;
  id?: string;
  productId: string;
  forecastDate: string;
  predictedDemand: number;
  avgDailySales: number;
  daysOfStockRemaining: number;
  reorderRecommended: boolean;
  recommendedQty: number;
  product?: any;
  createdAt?: Date;
}

export const WAREHOUSE_TABLE = 'warehouses';
export const WAREHOUSE_STOCK_TABLE = 'warehouse_stock';
export const INVENTORY_MOVEMENT_TABLE = 'inventory_movements';
export const STOCK_ALERT_TABLE = 'stock_alerts';
export const INVENTORY_FORECAST_TABLE = 'inventory_forecasts';
