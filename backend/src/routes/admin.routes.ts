import { Router, Request, Response, NextFunction } from 'express';
import adminController from '../controllers/admin.controller';
import productController from '../controllers/product.controller';
import categoryController from '../controllers/category.controller';
import brandController from '../controllers/brand.controller';
import orderController from '../controllers/order.controller';
import userController from '../controllers/user.controller';
import bannerController from '../controllers/banner.controller';
import serviceRequestController from '../controllers/service-request.controller';
import contactController from '../controllers/contact.controller';
import settingsController from '../controllers/settings.controller';
import notificationController from '../controllers/notification.controller';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { validate } from '../middleware/validate.middleware';
import { createProductSchema, updateProductSchema } from '../validators/product.validator';
import { updateOrderStatusSchema } from '../validators/order.validator';
import couponService from '../services/coupon.service';
import productService from '../services/product.service';
import productViewController from '../controllers/product-view.controller';
import barcodeController from '../controllers/barcode.controller';
import posController from '../controllers/pos.controller';
import crmController from '../controllers/crm.controller';
import { sendSuccess, sendCreated, sendMessage } from '../utils/response.util';
import { sendReviewStatusEmail } from '../utils/email.util';
import logger from '../utils/logger.util';

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, isAdmin);

// ====== Dashboard ======
router.get('/dashboard/stats', adminController.getDashboard);
router.get('/dashboard/revenue', adminController.getMonthlyRevenue);
router.get('/dashboard/top-products', adminController.getTopProducts);
router.get('/dashboard/recent-orders', adminController.getRecentOrders);
router.get('/sales-report', adminController.getSalesReport);

// ====== Report Downloads ======
router.get('/reports/sales', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { month, year } = req.query;
    const targetYear = parseInt(year as string) || new Date().getFullYear();
    const targetMonth = parseInt(month as string) || new Date().getMonth() + 1;

    const startDate = new Date(targetYear, targetMonth - 1, 1).toISOString();
    const endDate = new Date(targetYear, targetMonth, 0, 23, 59, 59).toISOString();

    const { data: orders } = await supabase
      .from('orders')
      .select('*, order_items(*), users:user_id(name, email, phone)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const monthName = monthNames[targetMonth - 1];

    let csv = `AMOHA Mobiles - Sales Report\n`;
    csv += `Period: ${monthName} ${targetYear}\n`;
    csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    csv += `Order Number,Date,Customer,Email,Phone,Items,Subtotal,Discount,Delivery,Total,Payment Status,Order Status\n`;

    const sanitizeCsv = (val: string) => {
      if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
      return val;
    };

    let totalRevenue = 0;
    let totalOrders = (orders || []).length;
    let totalDiscount = 0;

    (orders || []).forEach((order: any) => {
      const items = (order.order_items || []).map((i: any) => `${i.product_name || 'N/A'} x${i.quantity}`).join('; ');
      const user = order.users || {};
      const addr = order.shipping_address as any || {};
      csv += `${sanitizeCsv(order.order_number)},${new Date(order.created_at).toLocaleDateString()},${sanitizeCsv(user.name || 'N/A')},${sanitizeCsv(user.email || 'N/A')},${sanitizeCsv(addr.phone || 'N/A')},"${sanitizeCsv(items)}",${order.subtotal},${order.discount},${order.shipping_fee},${order.total},${order.payment_status},${order.status}\n`;
      if (order.payment_status === 'paid') totalRevenue += order.total;
      totalDiscount += order.discount || 0;
    });

    csv += `\nSummary\n`;
    csv += `Total Orders,${totalOrders}\n`;
    csv += `Total Revenue (Paid),${totalRevenue}\n`;
    csv += `Total Discounts,${totalDiscount}\n`;
    csv += `Average Order Value,${totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=sales-report-${monthName}-${targetYear}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/inventory', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;

    const { data: products } = await supabase
      .from('products')
      .select('name, slug, brand_id, category_id, price, original_price, stock, is_active, average_rating, review_count, is_featured, is_trending, brands:brand_id(name), categories:category_id(name)')
      .order('stock', { ascending: true });

    let csv = `AMOHA Mobiles - Inventory Report\n`;
    csv += `Generated: ${new Date().toLocaleDateString()}\n\n`;
    csv += `Name,Brand,Category,Price,Original Price,Stock,In Stock,Ratings,Reviews,Featured,Trending\n`;

    const sanitizeInv = (val: string) => {
      if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
      return val;
    };

    let totalStock = 0;
    let lowStock = 0;
    let outOfStock = 0;
    let totalValue = 0;

    (products || []).forEach((p: any) => {
      const brandName = p.brands?.name || 'N/A';
      const catName = p.categories?.name || 'N/A';
      csv += `"${sanitizeInv(p.name)}",${sanitizeInv(brandName)},${sanitizeInv(catName)},${p.price},${p.original_price},${p.stock},${p.is_active ? 'Yes' : 'No'},${p.average_rating},${p.review_count},${p.is_featured ? 'Yes' : 'No'},${p.is_trending ? 'Yes' : 'No'}\n`;
      totalStock += p.stock;
      if (p.stock === 0) outOfStock++;
      else if (p.stock <= 5) lowStock++;
      totalValue += p.price * p.stock;
    });

    csv += `\nSummary\n`;
    csv += `Total Products,${(products || []).length}\n`;
    csv += `Total Stock Units,${totalStock}\n`;
    csv += `Low Stock (<=5),${lowStock}\n`;
    csv += `Out of Stock,${outOfStock}\n`;
    csv += `Total Inventory Value,${totalValue}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

// ====== Products ======
router.get('/products', productController.getAll);
router.get('/products/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    sendSuccess(res, product, 'Product fetched');
  } catch (error) {
    next(error);
  }
});
router.post('/products', validate(createProductSchema), productController.create);
router.put('/products/:id', validate(updateProductSchema), productController.update);
router.delete('/products/:id', productController.delete);
router.patch('/products/:id/stock', productController.updateStock);

// ====== Categories ======
router.get('/categories', categoryController.getAllAdmin);
router.get('/categories/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { data, error } = await supabase.from('categories').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) { const { NotFoundError } = await import('../errors/app-error'); throw new NotFoundError('Category'); }
    sendSuccess(res, transformRow(data), 'Category fetched');
  } catch (error) {
    next(error);
  }
});
router.post('/categories', categoryController.create);
router.put('/categories/:id', categoryController.update);
router.delete('/categories/:id', categoryController.delete);

// ====== Brands ======
router.get('/brands', brandController.getAllAdmin);
router.get('/brands/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { data, error } = await supabase.from('brands').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) { const { NotFoundError } = await import('../errors/app-error'); throw new NotFoundError('Brand'); }
    sendSuccess(res, transformRow(data), 'Brand fetched');
  } catch (error) {
    next(error);
  }
});
router.post('/brands', brandController.create);
router.put('/brands/:id', brandController.update);
router.delete('/brands/:id', brandController.delete);

// ====== Orders ======
router.get('/orders', orderController.getAllOrders);
router.get('/orders/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await (await import('../services/order.service')).default.getById(req.params.id);
    sendSuccess(res, order, 'Order fetched');
  } catch (error) {
    next(error);
  }
});
router.patch('/orders/:id/status', validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.post('/orders/:id/refund', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { NotFoundError } = await import('../errors/app-error');

    const { data: order, error } = await supabase.from('orders').select('*, order_items(*)').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!order) throw new NotFoundError('Order');

    await supabase.from('orders').update({ status: 'returned', payment_status: 'refunded' }).eq('id', order.id);
    await supabase.from('order_status_history').insert({
      order_id: order.id, status: 'returned',
      comment: `Refund processed: ${req.body.reason || 'No reason provided'}`,
    });

    // Restore stock
    for (const item of (order.order_items || [])) {
      const { data: product } = await supabase.from('products').select('id, stock').eq('id', item.product_id).maybeSingle();
      if (product) {
        await supabase.from('products').update({ stock: product.stock + item.quantity, is_active: true }).eq('id', product.id);
      }
    }

    const updated = await (await import('../services/order.service')).default.getById(order.id);
    sendSuccess(res, updated, 'Refund processed');
  } catch (error) {
    next(error);
  }
});

// ====== Users ======
router.get('/users', userController.getAllUsers);
router.get('/users/:id', userController.getUserById);
router.patch('/users/:id/block', userController.toggleBlock);
router.delete('/users/:id', userController.deleteUser);

// ====== Banners ======
router.get('/banners', bannerController.getAllAdmin);
router.post('/banners', bannerController.create);
router.put('/banners/:id', bannerController.update);
router.patch('/banners/:id/toggle', bannerController.toggleActive);
router.delete('/banners/:id', bannerController.delete);

// ====== Coupons ======
router.get('/coupons', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await couponService.getAll();
    sendSuccess(res, coupons, 'Coupons fetched');
  } catch (error) {
    next(error);
  }
});
router.get('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { data, error } = await supabase.from('coupons').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!data) { const { NotFoundError } = await import('../errors/app-error'); throw new NotFoundError('Coupon'); }
    sendSuccess(res, transformRow(data), 'Coupon fetched');
  } catch (error) {
    next(error);
  }
});
router.post('/coupons', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.create(req.body);
    sendCreated(res, coupon, 'Coupon created');
  } catch (error) {
    next(error);
  }
});
router.put('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.update(req.params.id, req.body);
    sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
});
router.delete('/coupons/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await couponService.delete(req.params.id);
    sendMessage(res, 'Coupon deleted');
  } catch (error) {
    next(error);
  }
});

// ====== Reviews ======
router.get('/reviews', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = (page - 1) * limit;
    const status = (req.query.status as string) || '';
    const search = (req.query.search as string) || '';

    let qb = supabase.from('reviews').select('*, products:product_id(name, slug), users:user_id(name, email)', { count: 'exact' });

    // Filter by status
    if (status === 'approved') qb = qb.eq('is_approved', true);
    else if (status === 'rejected') qb = qb.eq('is_approved', false);
    else if (status === 'pending') qb = qb.is('is_approved', null);

    // Search by comment
    if (search) qb = qb.ilike('comment', `%${search}%`);

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limit - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    const reviews = (data || []).map((r: any) => {
      const transformed = transformRow(r);
      // Add computed status field
      if (r.is_approved === true) transformed.status = 'approved';
      else if (r.is_approved === false) transformed.status = 'rejected';
      else transformed.status = 'pending';
      // Rename joined fields
      if (transformed.products) { transformed.product = transformed.products; delete transformed.products; }
      if (transformed.users) { transformed.user = transformed.users; delete transformed.users; }
      return transformed;
    });

    sendSuccess(res, { reviews, totalReviews: count || 0, totalPages: Math.ceil((count || 0) / limit), currentPage: page }, 'Reviews fetched');
  } catch (error) {
    next(error);
  }
});
router.patch('/reviews/:id/status', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const isApproved = req.body.status === 'approved';
    const { data, error } = await supabase.from('reviews').update({ is_approved: isApproved }).eq('id', req.params.id).select('*, users:user_id(name, email), products:product_id(name)').single();
    if (error) throw error;
    const status = isApproved ? 'approved' : 'rejected';
    if (data?.users?.email) {
      sendReviewStatusEmail(data.users.email, data.users.name, data.products?.name || 'a product', status).catch((err: any) => {
        logger.error('Failed to send review status email: ' + err?.message);
      });
    }
    sendSuccess(res, transformRow(data), 'Review status updated');
  } catch (error) {
    next(error);
  }
});
router.patch('/reviews/:id/approve', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { data, error } = await supabase.from('reviews').update({ is_approved: true }).eq('id', req.params.id).select('*, users:user_id(name, email), products:product_id(name)').single();
    if (error) throw error;
    if (data?.users?.email) {
      sendReviewStatusEmail(data.users.email, data.users.name, data.products?.name || 'a product', 'approved').catch((err: any) => {
        logger.error('Failed to send review approve email: ' + err?.message);
      });
    }
    sendSuccess(res, transformRow(data), 'Review approved');
  } catch (error) {
    next(error);
  }
});
router.delete('/reviews/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    // Get review to update product stats
    const { data: review } = await supabase.from('reviews').select('product_id').eq('id', req.params.id).maybeSingle();
    const { error } = await supabase.from('reviews').delete().eq('id', req.params.id);
    if (error) throw error;
    // Recalculate product review stats
    if (review) {
      const { data: stats } = await supabase.from('reviews').select('rating').eq('product_id', review.product_id);
      const count = (stats || []).length;
      const avg = count > 0 ? Math.round(((stats || []).reduce((s: number, r: any) => s + r.rating, 0) / count) * 10) / 10 : 0;
      await supabase.from('products').update({ review_count: count, average_rating: avg }).eq('id', review.product_id);
    }
    sendMessage(res, 'Review deleted');
  } catch (error) {
    next(error);
  }
});

// ====== Service Requests ======
router.get('/service-requests', serviceRequestController.getAll);
router.get('/service-requests/stats', serviceRequestController.getStats);
router.get('/service-requests/:id', serviceRequestController.getById);
router.patch('/service-requests/:id/status', serviceRequestController.updateStatus);
router.delete('/service-requests/:id', serviceRequestController.delete);

// ====== Contact Messages ======
router.get('/contact-messages', contactController.getAll);
router.get('/contact-messages/unread-count', contactController.getUnreadCount);
router.patch('/contact-messages/:id/read', contactController.markRead);
router.delete('/contact-messages/:id', contactController.delete);

// ====== Order Tracking (logistics) ======
router.patch('/orders/:id/tracking', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { trackingNumber, trackingUrl, logisticsPartner, estimatedDelivery } = req.body;
    const updates: any = {};
    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
    if (trackingUrl !== undefined) updates.tracking_url = trackingUrl;
    if (logisticsPartner !== undefined) updates.logistics_partner = logisticsPartner;
    if (estimatedDelivery !== undefined) updates.estimated_delivery = estimatedDelivery;

    const { data: order, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select('*, order_items(*)').single();
    if (error) throw error;
    if (!order) { const { NotFoundError } = await import('../errors/app-error'); throw new NotFoundError('Order'); }
    sendSuccess(res, transformRow(order), 'Tracking info updated');
  } catch (error) {
    next(error);
  }
});

// ====== Site Settings ======
router.get('/settings', settingsController.get);
router.put('/settings', settingsController.update);

// ====== Notifications ======
router.get('/notifications', notificationController.getAll);
router.get('/notifications/recent', notificationController.getRecent);
router.get('/notifications/unread-count', notificationController.getUnreadCount);
router.patch('/notifications/:id/read', notificationController.markRead);
router.patch('/notifications/read-all', notificationController.markAllRead);
router.delete('/notifications/clear', notificationController.clearAll);
router.delete('/notifications/:id', notificationController.delete);

// ====== Product View Tracking (User Browsing Activity) ======
router.get('/product-views', productViewController.getAll);
router.get('/product-views/user-summary', productViewController.getUserSummary);
router.get('/product-views/user/:userId', productViewController.getUserViews);

// ====== Cart Abandonment ======
router.get('/abandoned-carts', productViewController.getAbandonedCarts);
router.get('/abandoned-carts/download', productViewController.downloadAbandonedCarts);

// ====== Barcode / SKU ======
router.get('/barcode/lookup/:code', barcodeController.lookup);
router.get('/barcode/stock/:code', barcodeController.stockCheck);
router.post('/barcode/bulk-lookup', barcodeController.bulkLookup);
router.post('/barcode/regenerate/:productId', barcodeController.regenerate);

// ====== POS / Counter Billing ======
router.post('/pos/create-order', posController.createOrder);
router.get('/pos/orders', posController.getOrders);
router.get('/pos/today-stats', posController.getTodayStats);
router.get('/pos/billing-info', posController.getBillingInfo);

// ====== CRM ======
router.get('/crm/customers', crmController.getCustomers);
router.get('/crm/customers/:customerId', crmController.getCustomerProfile);
router.post('/crm/customers/:customerId/notes', crmController.addNote);
router.delete('/crm/notes/:noteId', crmController.deleteNote);
router.get('/crm/segments', crmController.getSegmentSummary);

export default router;

