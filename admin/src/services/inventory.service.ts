import apiClient from '@/lib/api-client';

const buildQuery = (filters: Record<string, any>) => {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '' && value !== null) {
      params.append(key, String(value));
    }
  }
  return params.toString();
};

export const inventoryService = {
  // Dashboard
  getDashboardStats: async () => {
    const { data } = await apiClient.get('/inventory/dashboard');
    return data.data;
  },

  // Stock
  getStockOverview: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory/stock?${buildQuery(filters)}`);
    return data.data;
  },

  updateStock: async (payload: any) => {
    const { data } = await apiClient.post('/inventory/stock/update', payload);
    return data.data;
  },

  bulkUpdateStock: async (items: any[]) => {
    const { data } = await apiClient.post('/inventory/stock/bulk-update', { items });
    return data.data;
  },

  // Movements
  getMovements: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory/movements?${buildQuery(filters)}`);
    return data.data;
  },

  // Alerts
  getAlerts: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory/alerts?${buildQuery(filters)}`);
    return data.data;
  },

  acknowledgeAlert: async (alertId: string) => {
    const { data } = await apiClient.put(`/inventory/alerts/${alertId}/acknowledge`);
    return data.data;
  },

  checkAlerts: async () => {
    const { data } = await apiClient.post('/inventory/alerts/check');
    return data.data;
  },

  // Forecasts
  getForecasts: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory/forecasts?${buildQuery(filters)}`);
    return data.data;
  },

  generateForecasts: async () => {
    const { data } = await apiClient.post('/inventory/forecasts/generate');
    return data.data;
  },

  // Warehouses
  getWarehouses: async (filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory/warehouses?${buildQuery(filters)}`);
    return data.data;
  },

  getWarehouseById: async (id: string) => {
    const { data } = await apiClient.get(`/inventory/warehouses/${id}`);
    return data.data;
  },

  createWarehouse: async (payload: any) => {
    const { data } = await apiClient.post('/inventory/warehouses', payload);
    return data.data;
  },

  updateWarehouse: async (id: string, payload: any) => {
    const { data } = await apiClient.put(`/inventory/warehouses/${id}`, payload);
    return data.data;
  },

  deleteWarehouse: async (id: string) => {
    await apiClient.delete(`/inventory/warehouses/${id}`);
  },

  getWarehouseStock: async (id: string, filters: Record<string, any> = {}) => {
    const { data } = await apiClient.get(`/inventory/warehouses/${id}/stock?${buildQuery(filters)}`);
    return data.data;
  },
};
