import apiClient from '@/lib/api-client';

export const logisticsService = {
  getDeliveries: async () => {
    const response = await apiClient.get('/admin/logistics/deliveries');
    return response.data?.data || [];
  },
  
  assignDelivery: async (id: string, assignedPerson: string, contact: string) => {
    const response = await apiClient.patch(`/admin/logistics/deliveries/${id}/assign`, { assignedPerson, contact });
    return response.data?.data || null;
  },
  
  getPickupRequests: async () => {
    const response = await apiClient.get('/admin/logistics/pickup-requests');
    return response.data?.data || [];
  },
  
  updatePickupStatus: async (id: string, status: string) => {
    const response = await apiClient.patch(`/admin/logistics/pickup-requests/${id}/status`, { status });
    return response.data?.data || null;
  },
  
  updateShipmentStatus: async (id: string, logisticsStatus: string, estimatedDelivery?: string) => {
    const response = await apiClient.patch(`/admin/logistics/shipments/${id}/status`, { logisticsStatus, estimatedDelivery });
    return response.data?.data || null;
  },

  getCodOrders: async () => {
    const response = await apiClient.get('/admin/logistics/cod-collection');
    return response.data?.data || [];
  },

  confirmCodCollection: async (id: string, collectedAmount: number, collectionDate: string) => {
    const response = await apiClient.patch(`/admin/logistics/cod-collection/${id}/confirm`, {
      collectedAmount,
      collectionDate,
    });
    return response.data?.data || null;
  },
};

