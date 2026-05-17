import apiClient from '@/lib/api-client';
import { downloadExcelFromBlob } from '@/lib/excel-export';

const buildQuery = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
};

export const inventoryLedgerService = {
  getDashboardStats: async () => {
    const { data } = await apiClient.get('/inventory-ledger/dashboard');
    return data.data;
  },
  getAll: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory-ledger?${buildQuery(filters)}`);
    return data.data;
  },
  getByProductId: async (productId: string) => {
    const { data } = await apiClient.get(`/inventory-ledger/product/${productId}`);
    return data.data;
  },
  getAuditLog: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory-ledger/audit-log?${buildQuery(filters)}`);
    return data.data;
  },
  addStock: async (productId: string, quantity: number, notes?: string) => {
    const { data } = await apiClient.post(`/inventory-ledger/product/${productId}/add`, { quantity, notes });
    return data.data;
  },
  removeStock: async (productId: string, quantity: number, notes?: string) => {
    const { data } = await apiClient.post(`/inventory-ledger/product/${productId}/remove`, { quantity, notes });
    return data.data;
  },
  adjustStock: async (productId: string, newStock: number, notes?: string) => {
    const { data } = await apiClient.post(`/inventory-ledger/product/${productId}/adjust`, { newStock, notes });
    return data.data;
  },
  markDamaged: async (productId: string, quantity: number, notes?: string) => {
    const { data } = await apiClient.post(`/inventory-ledger/product/${productId}/damaged`, { quantity, notes });
    return data.data;
  },
  exportCsv: async () => {
    const res = await apiClient.get('/inventory-ledger/export/csv', { responseType: 'blob' });
    await downloadExcelFromBlob(new Blob([res.data]), `stock-report-${new Date().toISOString().split('T')[0]}`);
  },
};
