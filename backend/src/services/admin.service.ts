import supabase from '../config/supabase';
import { transformRow, transformUser } from '../utils/transform.util';
import logger from '../utils/logger.util';

class AdminService {
  async getSalesDashboardStats(userId: string, timeFilter: string = '7d') {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString();

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString();

    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1).toISOString();
    const thisMonthEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999).toISOString();

    // Fetch all relevant orders for this salesperson
    const { data: allOrders, error } = await supabase
      .from('orders')
      .select('id, total, created_at')
      .eq('created_by', userId)
      .not('status', 'eq', 'cancelled')
      .not('status', 'eq', 'returned');

    if (error) throw error;

    const orders = allOrders || [];

    // Calculate Today's Stats
    const todayOrders = orders.filter((o: any) => o.created_at >= todayStr && o.created_at < tomorrowStr);
    const todayRevenue = todayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const todaySales = todayOrders.length;

    // Calculate Yesterday's Stats (for comparison)
    const yesterdayOrders = orders.filter((o: any) => o.created_at >= yesterdayStr && o.created_at < todayStr);
    const yesterdayRevenue = yesterdayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);

    // Calculate Monthly Stats
    const monthlyOrders = orders.filter((o: any) => o.created_at >= thisMonthStart && o.created_at <= thisMonthEnd);
    const monthlyRevenue = monthlyOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const monthlySales = monthlyOrders.length;

    // Calculate Average Sale Value
    const totalRevenue = orders.reduce((sum: number, o: any) => sum + (o.total || 0), 0);
    const averageSaleValue = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;

    // Chart Data Generation based on timeFilter
    const chartData = [];
    const daysToLookBack = timeFilter === '3m' ? 90 : timeFilter === '30d' ? 30 : 7;
    
    for (let i = daysToLookBack - 1; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const start = new Date(d).setHours(0,0,0,0);
      const end = new Date(d).setHours(23,59,59,999);
      
      const dayOrders = orders.filter((o: any) => {
        const orderTime = new Date(o.created_at).getTime();
        return orderTime >= start && orderTime <= end;
      });
      
      chartData.push({
        date: d.toISOString().split('T')[0],
        revenue: dayOrders.reduce((sum: number, o: any) => sum + (o.total || 0), 0),
        sales: dayOrders.length,
      });
    }

    return {
      todayRevenue,
      todaySales,
      yesterdayRevenue,
      monthlyRevenue,
      monthlySales,
      averageSaleValue,
      chartData
    };
  }

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

  async getPurchaseDashboardStats(userId: string) {
    // 1 & 4. Fetch all non-cancelled purchase orders for this user
    const { data: allPos, error: posError } = await supabase
      .from('purchase_orders')
      .select('id, total_amount, status, payment_status')
      .eq('created_by', userId)
      .not('status', 'eq', 'cancelled');
      
    if (posError) throw posError;
    const pos = allPos || [];

    // Calculations
    const totalPurchaseAmount = pos.reduce((sum, po: any) => sum + (po.total_amount || 0), 0);
    const completedPurchases = pos.filter((po: any) => po.status === 'received').length;
    
    // Pending are anything not received or cancelled
    const pendingStatuses = ['draft', 'sent', 'confirmed', 'partially_received'];
    const pendingPurchaseOrders = pos.filter((po: any) => pendingStatuses.includes(po.status)).length;
    
    // Pending payments
    const pendingPayments = pos
      .filter((po: any) => po.payment_status === 'unpaid' || po.payment_status === 'partial')
      .reduce((sum, po: any) => sum + (po.total_amount || 0), 0);

    // 5. Products Purchased (Quantity sum from items)
    const poIds = pos.map((po: any) => po.id);
    let productsPurchased = 0;
    if (poIds.length > 0) {
      const { data: items, error: itemsError } = await supabase
        .from('purchase_order_items')
        .select('quantity')
        .in('purchase_order_id', poIds);
      if (itemsError) throw itemsError;
      productsPurchased = (items || []).reduce((sum, item: any) => sum + (item.quantity || 0), 0);
    }

    // 6. Low Stock Alert
    const lowStockAlert = await this.getLowStockProducts(10);

    // 7. Recent Purchase Orders
    const { data: recentPOsData, error: recentError } = await supabase
      .from('purchase_orders')
      .select('id, po_number, total_amount, status, created_at, supplier_id')
      .eq('created_by', userId)
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (recentError) throw recentError;
    
    // Fetch suppliers for recent POs
    let recentPurchaseOrders = [];
    let recentSuppliers = [];
    
    if (recentPOsData && recentPOsData.length > 0) {
      const supplierIds = [...new Set(recentPOsData.map((po: any) => po.supplier_id))];
      const { data: suppliersData } = await supabase
        .from('suppliers')
        .select('id, name, status, created_at')
        .in('id', supplierIds);
        
      const suppliersMap: any = {};
      (suppliersData || []).forEach((s: any) => {
        suppliersMap[s.id] = transformRow(s);
      });
      
      recentPurchaseOrders = recentPOsData.map((po: any) => {
        const t = transformRow(po);
        t.supplier = suppliersMap[po.supplier_id] || { name: 'Unknown' };
        return t;
      });
      
      // 8. Recent Suppliers
      recentSuppliers = (suppliersData || []).map(transformRow).slice(0, 10);
    }

    return {
      totalPurchaseAmount,
      pendingPurchaseOrders,
      completedPurchases,
      pendingPayments,
      productsPurchased,
      lowStockAlert,
      recentPurchaseOrders,
      recentSuppliers
    };
  }
}

export default new AdminService();
