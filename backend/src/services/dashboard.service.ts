import supabase from '../config/supabase';
import { transformRow } from '../utils/transform.util';
import logger from '../utils/logger.util';

class DashboardService {
  async getDashboardData() {
    const [analytics, statusCounts, topProducts, recentOrders, lowStock] = await Promise.all([
      supabase.rpc('get_dashboard_analytics'),
      supabase.rpc('get_order_status_counts'),
      supabase.rpc('get_top_products', { p_limit: 5 }),
      supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(5),
      supabase.from('products').select('id, name, sku, stock, images').lte('stock', 10).eq('is_active', true).order('stock', { ascending: true }).limit(10),
    ]);

    return {
      analytics: analytics.data,
      orderStatusCounts: statusCounts.data,
      topProducts: topProducts.data,
      recentOrders: await (async () => {
        const orders = recentOrders.data || [];
        const ids = orders.map((o: any) => o.id);
        const { data: riData } = ids.length ? await supabase.from('order_items').select('*').in('order_id', ids) : { data: [] };
        const riMap = new Map<string, any[]>();
        for (const ri of riData || []) { if (!riMap.has(ri.order_id)) riMap.set(ri.order_id, []); riMap.get(ri.order_id)!.push(transformRow(ri)); }
        return orders.map((o: any) => { const t = transformRow(o); t.items = riMap.get(o.id) || []; delete t.orderItems; return t; });
      })(),
      lowStockProducts: (lowStock.data || []).map(transformRow),
    };
  }

  async getSalesReport(startDate: string, endDate: string) {
    const { data, error } = await supabase.rpc('get_sales_report', { p_start_date: startDate, p_end_date: endDate });
    if (error) throw error;
    return data;
  }

  async getMonthlyRevenue(year: number) {
    const { data, error } = await supabase.rpc('get_monthly_revenue', { p_year: year });
    if (error) throw error;
    return data;
  }
}

export default new DashboardService();
