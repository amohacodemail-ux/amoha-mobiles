import apiClient from '@/lib/api-client';
import type { ApiResponse, DashboardStats, RevenueData, TopProduct, RecentOrder } from '@/types';

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const dashboardService = {
  getStats: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<ApiResponse<DashboardStats>>('/admin/dashboard/stats');
    return data?.data || {
      totalRevenue: 0,
      totalOrders: 0,
      totalProducts: 0,
      totalUsers: 0,
      revenueGrowth: 0,
      ordersGrowth: 0,
      productsGrowth: 0,
      usersGrowth: 0,
    };
  },
  getRevenueChart: async (): Promise<RevenueData[]> => {
    const { data } = await apiClient.get<ApiResponse<{ year: number; months: { month: number; revenue: number; orders: number }[] }>>(
      '/admin/dashboard/revenue',
    );
    const months = Array.isArray(data?.data?.months) ? data.data.months : [];
    return months.map((m) => ({
      month: monthNames[m.month - 1],
      revenue: Number(m?.revenue || 0),
      orders: Number(m?.orders || 0),
    }));
  },
  getTopProducts: async (): Promise<TopProduct[]> => {
    const { data } = await apiClient.get<ApiResponse<any[]>>('/admin/dashboard/top-products');
    const rows = Array.isArray(data?.data) ? data.data : [];
    return rows.map((item: any) => ({
      _id: item._id,
      name: item.product?.name || item.name || 'Unknown',
      thumbnail: item.product?.thumbnail || item.thumbnail || '',
      totalSold: item.totalSold || 0,
      revenue: item.totalRevenue || item.revenue || 0,
    }));
  },
  getRecentOrders: async (): Promise<RecentOrder[]> => {
    const { data } = await apiClient.get<ApiResponse<RecentOrder[]>>('/admin/dashboard/recent-orders');
    return Array.isArray(data?.data) ? data.data : [];
  },
};
