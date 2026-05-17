import supabase from '../config/supabase';
import { transformRow, transformUser } from '../utils/transform.util';
import logger from '../utils/logger.util';

class AdminService {
  async getDashboardAnalytics() {
    const { data, error } = await supabase.rpc('get_dashboard_analytics');
    if (error) throw error;

    // Compute growth percentages so the admin frontend receives them
    const d = data || {};
    const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);
    d.revenueGrowth = pct(d.thisMonthRevenue || 0, d.lastMonthRevenue || 0);
    d.ordersGrowth = pct(d.thisMonthOrders || 0, d.lastMonthOrders || 0);
    d.usersGrowth = pct(d.thisMonthUsers || 0, d.lastMonthUsers || 0);
    d.productsGrowth = pct(d.thisMonthProducts || 0, d.lastMonthProducts || 0);

    // Add profit metrics from orders table
    const { data: profitData } = await supabase
      .from('orders')
      .select('total_revenue, total_cost, total_profit, profit_margin')
      .in('status', ['delivered', 'completed']);

    if (profitData && profitData.length > 0) {
      d.totalRevenue = profitData.reduce((sum: number, o: any) => sum + (o.total_revenue || 0), 0);
      d.totalCost = profitData.reduce((sum: number, o: any) => sum + (o.total_cost || 0), 0);
      d.totalProfit = profitData.reduce((sum: number, o: any) => sum + (o.total_profit || 0), 0);
      d.averageProfitMargin = profitData.reduce((sum: number, o: any) => sum + (o.profit_margin || 0), 0) / profitData.length;
    } else {
      d.totalRevenue = 0;
      d.totalCost = 0;
      d.totalProfit = 0;
      d.averageProfitMargin = 0;
    }

    // This month profit
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: thisMonthProfit } = await supabase
      .from('orders')
      .select('total_revenue, total_cost, total_profit')
      .gte('created_at', thisMonthStart)
      .in('status', ['delivered', 'completed']);

    if (thisMonthProfit && thisMonthProfit.length > 0) {
      d.thisMonthProfit = thisMonthProfit.reduce((sum: number, o: any) => sum + (o.total_profit || 0), 0);
      d.thisMonthRevenue = thisMonthProfit.reduce((sum: number, o: any) => sum + (o.total_revenue || 0), 0);
      d.thisMonthCost = thisMonthProfit.reduce((sum: number, o: any) => sum + (o.total_cost || 0), 0);
    }

    return d;
  }

  async getOrderStatusCounts() {
    const { data, error } = await supabase.rpc('get_order_status_counts');
    if (error) throw error;
    return data;
  }

  async getTopProducts(limit: number = 10) {
    const { data, error } = await supabase.rpc('get_top_products', { p_limit: limit });
    if (error) throw error;
    return data;
  }

  async getSalesReport(startDate?: string, endDate?: string) {
    const { data, error } = await supabase.rpc('get_sales_report', { p_start_date: startDate, p_end_date: endDate });
    if (error) throw error;
    return data;
  }

  async getMonthlyRevenue(year?: number) {
    const { data, error } = await supabase.rpc('get_monthly_revenue', { p_year: year });
    if (error) throw error;
    return data;
  }

  async getRecentOrders(limit: number = 10) {
    const { data, error } = await supabase
      .from('orders').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;

    // Fetch order_items separately (PostgREST join blocked by RLS)
    const orderIds = (data || []).map((o: any) => o.id);
    const { data: itemsData } = orderIds.length
      ? await supabase.from('order_items').select('*').in('order_id', orderIds)
      : { data: [] };
    const itemsByOrder = new Map<string, any[]>();
    for (const item of itemsData || []) {
      if (!itemsByOrder.has(item.order_id)) itemsByOrder.set(item.order_id, []);
      itemsByOrder.get(item.order_id)!.push(transformRow(item));
    }

    // Batch-fetch user data
    const userIds = [...new Set((data || []).map((o: any) => o.user_id).filter(Boolean))];
    const usersMap: Record<string, any> = {};
    if (userIds.length > 0) {
      const { data: users } = await supabase.from('users').select('id, name, email, phone').in('id', userIds);
      (users || []).forEach((u: any) => { usersMap[u.id] = transformRow(u); });
    }

    return (data || []).map((o: any) => {
      const t = transformRow(o);
      t.items = itemsByOrder.get(o.id) || [];
      t.user = usersMap[o.user_id] || { _id: o.user_id, name: 'Unknown', email: '' };
      t.orderStatus = o.status || 'pending';
      t.totalAmount = o.total ?? 0;
      delete t.orderItems;
      return t;
    });
  }

  async getRecentUsers(limit: number = 10) {
    const { data, error } = await supabase
      .from('users').select('id, name, email, phone, role, created_at')
      .order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map(transformRow);
  }

  async getLowStockProducts(threshold: number = 10) {
    const { data, error } = await supabase
      .from('products').select('id, name, sku, stock, images')
      .lte('stock', threshold).eq('is_active', true).order('stock', { ascending: true });
    if (error) throw error;
    return (data || []).map(transformRow);
  }
}

export default new AdminService();
