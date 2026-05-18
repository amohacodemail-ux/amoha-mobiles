import { Router, Request, Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../types';
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
import {
  canAccessAdminOnly,
  canAccessSales,
  canAccessPurchase,
  canAccessMarketing,
  canAccessLogistics,
  canAccessDashboard,
  canAccessReports,
  canAccessNotifications,
  isAdmin
} from '../middleware/role.middleware';
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
import activityLogService from '../services/activity-log.service';

const router = Router();

// Apply authentication to all admin routes
router.use(authenticate);

// ====== Dashboard - Accessible by all internal roles ======
router.get('/dashboard/stats', canAccessDashboard, adminController.getDashboard);
router.get('/dashboard/revenue', canAccessDashboard, adminController.getMonthlyRevenue);
router.get('/dashboard/top-products', canAccessDashboard, adminController.getTopProducts);
router.get('/dashboard/recent-orders', canAccessDashboard, adminController.getRecentOrders);
router.get('/sales-report', canAccessReports, adminController.getSalesReport);

// ====== Report Downloads - Admin, Sales, Purchase only ======
router.get('/reports/sales', canAccessReports, async (req: Request, res: Response, next: NextFunction) => {
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
      .select('*, users:user_id(name, email, phone)')
      .gte('created_at', startDate)
      .lte('created_at', endDate)
      .order('created_at', { ascending: false });

    // Fetch order_items separately (PostgREST join blocked by RLS)
    const salesOrderIds = (orders || []).map((o: any) => o.id);
    const { data: salesItems } = salesOrderIds.length
      ? await supabase.from('order_items').select('order_id, product_name, quantity').in('order_id', salesOrderIds)
      : { data: [] };
    const salesItemsByOrder = new Map<string, any[]>();
    for (const si of salesItems || []) {
      if (!salesItemsByOrder.has(si.order_id)) salesItemsByOrder.set(si.order_id, []);
      salesItemsByOrder.get(si.order_id)!.push(si);
    }

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
      const items = (salesItemsByOrder.get(order.id) || []).map((i: any) => `${i.product_name || 'N/A'} x${i.quantity}`).join('; ');
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

router.get('/reports/inventory', canAccessReports, async (_req: Request, res: Response, next: NextFunction) => {
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

// ====== Products - Purchase & Admin only ======
// Purchase & Admin can see all products regardless of is_active; inject isActive=all to bypass the default filter
router.get('/products', canAccessPurchase, (req: Request, res: Response, next: NextFunction) => {
  if (req.query.isActive === undefined) (req.query as any).isActive = 'all';
  productController.getAll(req, res, next);
});
router.get('/products/:id', canAccessPurchase, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const product = await productService.getProductById(req.params.id);
    sendSuccess(res, product, 'Product fetched');
  } catch (error) {
    next(error);
  }
});
router.post('/products', canAccessPurchase, validate(createProductSchema), productController.create);
router.put('/products/:id', canAccessPurchase, validate(updateProductSchema), productController.update);
router.delete('/products/:id', canAccessPurchase, productController.delete);
router.patch('/products/:id/stock', canAccessPurchase, productController.updateStock);

// ====== Categories - Purchase & Admin only ======
router.get('/categories', canAccessPurchase, categoryController.getAllAdmin);
router.get('/categories/:id', canAccessPurchase, async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/categories', canAccessPurchase, categoryController.create);
router.put('/categories/:id', canAccessPurchase, categoryController.update);
router.delete('/categories/:id', canAccessPurchase, categoryController.delete);

// ====== Brands - Purchase & Admin only ======
router.get('/brands', canAccessPurchase, brandController.getAllAdmin);
router.get('/brands/:id', canAccessPurchase, async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/brands', canAccessPurchase, brandController.create);
router.put('/brands/:id', canAccessPurchase, brandController.update);
router.delete('/brands/:id', canAccessPurchase, brandController.delete);

// ====== Orders - Sales & Admin only ======
router.get('/orders', canAccessSales, orderController.getAllOrders);
router.get('/orders/:id', canAccessSales, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await (await import('../services/order.service')).default.getById(req.params.id);
    sendSuccess(res, order, 'Order fetched');
  } catch (error) {
    next(error);
  }
});
router.get('/orders/:id/invoice', canAccessSales, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { generateInvoicePDF } = await import('../utils/invoice.util');
    const order: any = await (await import('../services/order.service')).default.getById(req.params.id);

    // Fetch billing settings from site_settings (JSONB — cast to any for safe field access)
    const { data: settings } = await supabase.from('site_settings').select('*').limit(1).maybeSingle();
    const billing: any = (settings as any)?.billing || {};

    // Get customer info
    let customerName = 'Customer';
    let customerEmail = '';
    let customerPhone = '';
    if (order.isWalkIn) {
      customerName = order.walkInCustomerName || 'Walk-in Customer';
      customerEmail = order.walkInCustomerEmail || '';
      customerPhone = order.walkInCustomerPhone || '';
    } else if (order.userId) {
      const { data: user } = await supabase.from('users').select('name, email, phone').eq('id', order.userId).maybeSingle();
      customerName = user?.name || order.user?.name || 'Customer';
      customerEmail = user?.email || order.user?.email || '';
      customerPhone = user?.phone || order.user?.phone || '';
    } else if (order.user) {
      customerName = order.user.name || 'Customer';
      customerEmail = order.user.email || '';
      customerPhone = order.user.phone || '';
    }

    const shippingAddress = order.shippingAddress || {
      fullName: customerName,
      addressLine1: order.walkInCustomerAddress || 'In-store purchase',
      city: '', state: '', pincode: '',
      phone: customerPhone,
    };

    // Build business address string
    const bizAddrParts = [billing.billingAddress, billing.billingCity, billing.billingState, billing.billingPincode].filter(Boolean);
    const businessAddress = bizAddrParts.join(', ') || settings?.address || '';

    generateInvoicePDF(res, {
      orderNumber: order.orderNumber || req.params.id.slice(0, 8).toUpperCase(),
      invoiceNumber: order.invoiceNumber || undefined,
      orderDate: order.createdAt,
      customerName,
      customerEmail,
      customerPhone,
      shippingAddress,
      items: (order.items || []).map((i: any) => ({
        name: i.product?.name || i.productName || 'Product',
        quantity: i.quantity,
        price: i.price,
      })),
      subtotal: order.subtotal,
      discount: order.discount || 0,
      deliveryCharge: order.deliveryCharge ?? order.shippingFee ?? 0,
      codFee: (!order.isWalkIn && order.paymentMethod === 'cod') ? 49 : 0,
      gstAmount: order.gstAmount || 0,
      gstRate: order.gstRate || 0,
      totalAmount: order.totalAmount ?? order.total ?? 0,
      paymentMethod: order.isWalkIn ? (order.posPaymentMethod || 'cash') : (order.paymentMethod || 'cod'),
      paymentStatus: order.paymentStatus || 'paid',
      couponCode: order.couponCode,
      // Business fields from settings
      businessName: billing.businessName || settings?.site_name || 'AMOHA MOBILES',
      gstin: billing.gstin || '',
      panNumber: billing.panNumber || '',
      businessAddress,
      businessPhone: billing.billingPhone || settings?.contact_phone || '',
      businessEmail: billing.billingEmail || settings?.contact_email || '',
      termsOnInvoice: billing.termsOnInvoice || '',
      footerNote: billing.footerNote || 'Thank you for shopping with us!',
      hsnCode: billing.hsnCode || '',
    });
  } catch (error) {
    next(error);
  }
});
router.patch('/orders/:id/status', canAccessSales, validate(updateOrderStatusSchema), orderController.updateOrderStatus);
router.delete('/orders/:id', canAccessSales, orderController.deleteOrder);
router.post('/orders/:id/refund', canAccessSales, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { NotFoundError } = await import('../errors/app-error');

    const { data: order, error } = await supabase.from('orders').select('*').eq('id', req.params.id).maybeSingle();
    if (error) throw error;
    if (!order) throw new NotFoundError('Order');

    // Fetch items separately for stock restore (PostgREST join blocked by RLS)
    const { data: refundItems } = await supabase.from('order_items').select('product_id, quantity').eq('order_id', order.id);

    await supabase.from('orders').update({ status: 'returned', payment_status: 'refunded' }).eq('id', order.id);
    await supabase.from('order_status_history').insert({
      order_id: order.id, status: 'returned',
      comment: `Refund processed: ${req.body.reason || 'No reason provided'}`,
    });

    // Restore stock
    for (const item of (refundItems || [])) {
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

// ====== Users - Admin only ======
router.get('/users', canAccessAdminOnly, userController.getAllUsers);
router.post('/users', canAccessAdminOnly, userController.createUser);
router.get('/users/:id', canAccessAdminOnly, userController.getUserById);
router.patch('/users/:id/block', canAccessAdminOnly, userController.toggleBlock);
router.delete('/users/:id', canAccessAdminOnly, userController.deleteUser);

// ====== RBAC - Admin User Management (Admin only) ======
import { createAdminUserSchema, updateUserRoleSchema } from '../validators/auth.validator';
import authService from '../services/auth.service';

// Create admin panel user with specific role
router.post('/admin-users', canAccessAdminOnly, validate(createAdminUserSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.createAdminUser(req.body);
    sendCreated(res, result.user, result.message);
  } catch (error) {
    next(error);
  }
});

// Update user role
router.patch('/users/:id/role', canAccessAdminOnly, validate(updateUserRoleSchema), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await authService.updateUserRole(req.params.id, req.body.role);
    sendSuccess(res, result.user, result.message);
  } catch (error) {
    next(error);
  }
});

// Get all admin users (filtered by role)
router.get('/admin-users', canAccessAdminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { role, search, page = '1', limit = '20' } = req.query;
    const pageNum = parseInt(page as string) || 1;
    const limitNum = parseInt(limit as string) || 20;
    const offset = (pageNum - 1) * limitNum;

    // Get admin panel roles only
    const adminRoles = ['admin', 'sales', 'purchase', 'marketing', 'logistics', 'supplier', 'service_engineer'];

    let query = supabase
      .from('users')
      .select('id, name, email, phone, role, is_verified, is_blocked, created_at', { count: 'exact' })
      .in('role', adminRoles)
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('role', role);
    }

    if (search) {
      query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`);
    }

    const { data: users, error, count } = await query.range(offset, offset + limitNum - 1);
    if (error) throw error;

    sendSuccess(res, {
      users: users || [],
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum),
      currentPage: pageNum,
    }, 'Admin users fetched');
  } catch (error) {
    next(error);
  }
});

// ====== Banners - Marketing & Admin only ======
router.get('/banners', canAccessMarketing, bannerController.getAllAdmin);
router.post('/banners', canAccessMarketing, bannerController.create);
router.put('/banners/:id', canAccessMarketing, bannerController.update);
router.patch('/banners/:id/toggle', canAccessMarketing, bannerController.toggleActive);
router.delete('/banners/:id', canAccessMarketing, bannerController.delete);

// ====== Coupons - Marketing & Admin only ======
router.get('/coupons', canAccessMarketing, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const coupons = await couponService.getAll();
    sendSuccess(res, coupons, 'Coupons fetched');
  } catch (error) {
    next(error);
  }
});
router.get('/coupons/:id', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
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
router.post('/coupons', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.create(req.body);
    sendCreated(res, coupon, 'Coupon created');
  } catch (error) {
    next(error);
  }
});
router.put('/coupons/:id', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const coupon = await couponService.update(req.params.id, req.body);
    sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
});
router.delete('/coupons/:id', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const adminId = (req as AuthenticatedRequest).user?.userId;
    const result = await couponService.delete(req.params.id, adminId, req.ip);
    sendMessage(res, result?.message || 'Coupon deleted');
  } catch (error) {
    next(error);
  }
});

// ====== Reviews - Marketing & Admin only ======
router.get('/reviews', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
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
router.patch('/reviews/:id/status', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
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
router.patch('/reviews/:id/approve', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
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
router.delete('/reviews/:id', canAccessMarketing, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const adminId = (req as AuthenticatedRequest).user?.userId;
    // Get review details for audit log
    const { data: review } = await supabase.from('reviews').select('product_id, rating, users:user_id(name)').eq('id', req.params.id).maybeSingle();
    const { error } = await supabase.from('reviews').delete().eq('id', req.params.id);
    if (error) throw error;
    // Recalculate product review stats
    if (review) {
      const { data: stats } = await supabase.from('reviews').select('rating').eq('product_id', review.product_id);
      const count = (stats || []).length;
      const avg = count > 0 ? Math.round(((stats || []).reduce((s: number, r: any) => s + r.rating, 0) / count) * 10) / 10 : 0;
      await supabase.from('products').update({ review_count: count, average_rating: avg }).eq('id', review.product_id);
    }
    // Audit log
    activityLogService.log({
      adminId,
      action: 'DELETE_REVIEW',
      entity: 'review',
      entityId: req.params.id,
      details: { productId: review?.product_id, rating: review?.rating },
      ipAddress: req.ip
    }).catch(() => {});
    sendMessage(res, 'Review deleted');
  } catch (error) {
    next(error);
  }
});

// ====== Service Requests - Admin only ======
router.get('/service-requests', canAccessAdminOnly, serviceRequestController.getAll);
router.get('/service-requests/stats', canAccessAdminOnly, serviceRequestController.getStats);
router.get('/service-requests/:id', canAccessAdminOnly, serviceRequestController.getById);
router.patch('/service-requests/:id/status', canAccessAdminOnly, serviceRequestController.updateStatus);
router.delete('/service-requests/:id', canAccessAdminOnly, serviceRequestController.delete);

// ====== Contact Messages - Marketing & Admin only ======
router.get('/contact-messages', canAccessMarketing, contactController.getAll);
router.get('/contact-messages/unread-count', canAccessMarketing, contactController.getUnreadCount);
router.patch('/contact-messages/:id/read', canAccessMarketing, contactController.markRead);
router.delete('/contact-messages/:id', canAccessMarketing, contactController.delete);

// ====== Order Tracking - Logistics, Sales & Admin only ======
router.patch('/orders/:id/tracking', canAccessLogistics, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { trackingNumber, trackingUrl, logisticsPartner, estimatedDelivery } = req.body;
    const updates: any = {};
    if (trackingNumber !== undefined) updates.tracking_number = trackingNumber;
    if (trackingUrl !== undefined) updates.tracking_url = trackingUrl;
    if (logisticsPartner !== undefined) updates.logistics_partner = logisticsPartner;
    if (estimatedDelivery !== undefined) updates.estimated_delivery = estimatedDelivery;

    const { data: order, error } = await supabase.from('orders').update(updates).eq('id', req.params.id).select('*').single();
    if (error) throw error;
    if (!order) { const { NotFoundError } = await import('../errors/app-error'); throw new NotFoundError('Order'); }
    sendSuccess(res, transformRow(order), 'Tracking info updated');
  } catch (error) {
    next(error);
  }
});

// ====== Site Settings - Admin only ======
router.get('/settings', canAccessAdminOnly, settingsController.get);
router.put('/settings', canAccessAdminOnly, settingsController.update);

// ====== Notifications - All internal roles ======
router.get('/notifications', canAccessNotifications, notificationController.getAll);
router.get('/notifications/recent', canAccessNotifications, notificationController.getRecent);
router.get('/notifications/unread-count', canAccessNotifications, notificationController.getUnreadCount);
router.patch('/notifications/:id/read', canAccessNotifications, notificationController.markRead);
router.patch('/notifications/read-all', canAccessNotifications, notificationController.markAllRead);
router.delete('/notifications/clear', canAccessAdminOnly, notificationController.clearAll);
router.delete('/notifications/:id', canAccessNotifications, notificationController.delete);

// ====== Product View Tracking - Marketing & Admin only ======
router.get('/product-views', canAccessMarketing, productViewController.getAll);
router.get('/product-views/user-summary', canAccessMarketing, productViewController.getUserSummary);
router.get('/product-views/user/:userId', canAccessMarketing, productViewController.getUserViews);

// ====== Cart Abandonment - Marketing & Admin only ======
router.get('/abandoned-carts', canAccessMarketing, productViewController.getAbandonedCarts);
router.get('/abandoned-carts/download', canAccessMarketing, productViewController.downloadAbandonedCarts);

// ====== Barcode / SKU - Sales, Purchase & Admin only ======
router.get('/barcode/lookup/:code', canAccessSales, barcodeController.lookup);
router.get('/barcode/stock/:code', canAccessPurchase, barcodeController.stockCheck);
router.post('/barcode/bulk-lookup', canAccessSales, barcodeController.bulkLookup);
router.post('/barcode/regenerate/:productId', canAccessPurchase, barcodeController.regenerate);
router.post('/barcode/validate', canAccessSales, barcodeController.validate);
router.get('/barcode/types', canAccessPurchase, barcodeController.getTypes);
router.post('/barcode/bulk-generate', canAccessPurchase, barcodeController.bulkGenerate);
router.post('/barcode/migrate-to-code128', canAccessAdminOnly, barcodeController.migrateToCode128);

// ====== POS / Counter Billing - Sales & Admin only ======
router.post('/pos/create-order', canAccessSales, posController.createOrder);
router.get('/pos/orders', canAccessSales, posController.getOrders);
router.get('/pos/today-stats', canAccessSales, posController.getTodayStats);
router.get('/pos/billing-info', canAccessSales, posController.getBillingInfo);

// ====== CRM - Marketing & Admin only ======
router.get('/crm/customers', canAccessMarketing, crmController.getCustomers);
router.post('/crm/customers', canAccessMarketing, crmController.createCustomer);
router.get('/crm/customers/:customerId', canAccessMarketing, crmController.getCustomerProfile);
router.post('/crm/customers/:customerId/notes', canAccessMarketing, crmController.addNote);
router.delete('/crm/notes/:noteId', canAccessAdminOnly, crmController.deleteNote);
router.get('/crm/segments', canAccessMarketing, crmController.getSegmentSummary);

// ====== Sales & Order Reports ======
router.get('/reports/orders', canAccessSales, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { transformRow } = await import('../utils/transform.util');
    const { startDate, endDate, source, status, search, page, limit: limitQ } = req.query as Record<string, string>;
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limitQ) || 20;
    const offset = (pageNum - 1) * limitNum;

    let qb = supabase
      .from('orders')
      .select(
        'id, order_number, invoice_number, created_at, status, payment_status, payment_method, pos_payment_method, total, subtotal, discount, shipping_fee, gst_amount, gst_rate, is_walk_in, walk_in_customer_name, walk_in_customer_phone, walk_in_customer_email, user_id, shipping_address, users:user_id(name, email, phone)',
        { count: 'exact' },
      );

    if (startDate) qb = qb.gte('created_at', new Date(startDate).toISOString());
    if (endDate) qb = qb.lte('created_at', new Date(endDate + 'T23:59:59').toISOString());
    if (source === 'online') qb = qb.eq('is_walk_in', false);
    if (source === 'pos') qb = qb.eq('is_walk_in', true);
    if (status) qb = qb.eq('status', status);
    if (search) {
      qb = qb.or(`order_number.ilike.%${search}%,invoice_number.ilike.%${search}%,walk_in_customer_name.ilike.%${search}%`);
    }

    qb = qb.order('created_at', { ascending: false }).range(offset, offset + limitNum - 1);

    const { data, error, count } = await qb;
    if (error) throw error;

    const orders = (data || []).map((o: any) => {
      const t = transformRow(o);
      // Fix customer mapping
      if (o.is_walk_in) {
        t.customer = {
          name: o.walk_in_customer_name || 'Walk-in Customer',
          email: o.walk_in_customer_email || '',
          phone: o.walk_in_customer_phone || '',
        };
      } else {
        const u = o.users || {};
        const addr = (o.shipping_address as any) || {};
        t.customer = {
          name: u.name || addr.fullName || addr.name || 'Customer',
          email: u.email || addr.email || '',
          phone: u.phone || addr.phone || '',
        };
      }
      t.source = o.is_walk_in ? 'POS' : 'Online';
      delete t.users;
      return t;
    });

    sendSuccess(res, {
      orders,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / limitNum),
      currentPage: pageNum,
    }, 'Orders report fetched');
  } catch (error) {
    next(error);
  }
});

// ====== GST Report CSV ======
router.get('/reports/gst-summary', canAccessReports, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { startDate, endDate, period } = req.query as Record<string, string>;

    let start: Date;
    let end: Date = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate); end.setHours(23, 59, 59, 999);
    } else if (period === 'day') {
      start = new Date(); start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    } else {
      start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    }

    const { data: orders } = await supabase
      .from('orders')
      .select('order_number, invoice_number, created_at, total, subtotal, discount, gst_amount, gst_rate, payment_status, status, is_walk_in, walk_in_customer_name, shipping_address, users:user_id(name, email, phone)')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .not('status', 'eq', 'cancelled')
      .order('created_at', { ascending: false });

    const sanitize = (val: string) => {
      if (!val) return '';
      if (/^[=+\-@\t\r]/.test(val)) return `'${val}`;
      return val;
    };

    let csv = `AMOHA Mobiles - GST Report\n`;
    csv += `Period: ${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}\n`;
    csv += `Generated: ${new Date().toLocaleDateString('en-IN')}\n\n`;
    csv += `Invoice No,Order No,Date,Customer,Source,Taxable Value,GST Rate,GST Amount,CGST,SGST,Grand Total,Status\n`;

    let totalTaxable = 0, totalGst = 0;

    (orders || []).forEach((o: any) => {
      const user = o.users || {};
      const addr = o.shipping_address as any || {};
      const custName = o.is_walk_in ? (o.walk_in_customer_name || 'Walk-in') : (user.name || addr.fullName || 'N/A');
      const taxableVal = (o.subtotal || 0) - (o.discount || 0);
      const gstAmt = o.gst_amount || 0;
      const cgst = Math.round(gstAmt / 2);
      const sgst = gstAmt - cgst;
      const gstRate = o.gst_rate || 0;
      csv += `${sanitize(o.invoice_number || '')},${sanitize(o.order_number)},${new Date(o.created_at).toLocaleDateString('en-IN')},${sanitize(custName)},${o.is_walk_in ? 'POS' : 'Online'},${taxableVal},${gstRate}%,${gstAmt},${cgst},${sgst},${o.total},${o.status}\n`;
      totalTaxable += taxableVal;
      totalGst += gstAmt;
    });

    csv += `\nTotals\n`;
    csv += `,,,,Total Taxable Value,${totalTaxable}\n`;
    csv += `,,,,Total GST,${totalGst}\n`;
    csv += `,,,,Total CGST,${Math.round(totalGst / 2)}\n`;
    csv += `,,,,Total SGST,${totalGst - Math.round(totalGst / 2)}\n`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=GST-Report-${start.toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    next(error);
  }
});

router.get('/reports/sales-summary', canAccessReports, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const supabase = (await import('../config/supabase')).default;
    const { period, startDate, endDate } = req.query as Record<string, string>;

    let start: Date;
    let end: Date = new Date();
    end.setHours(23, 59, 59, 999);

    if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
    } else if (period === 'day') {
      start = new Date(); start.setHours(0, 0, 0, 0);
    } else if (period === 'week') {
      start = new Date(); start.setDate(start.getDate() - 6); start.setHours(0, 0, 0, 0);
    } else {
      // Default: current month
      start = new Date(); start.setDate(1); start.setHours(0, 0, 0, 0);
    }

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, created_at, total, subtotal, discount, gst_amount, payment_status, status, is_walk_in, pos_payment_method')
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .not('status', 'eq', 'cancelled');

    if (error) throw error;

    const all = orders || [];
    const paid = all.filter((o: any) => o.payment_status === 'paid' || o.is_walk_in);
    const totalRevenue = paid.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const totalOrders = all.length;
    const avgOrderValue = paid.length > 0 ? Math.round(totalRevenue / paid.length) : 0;
    const totalDiscount = all.reduce((s: number, o: any) => s + (o.discount || 0), 0);
    const totalGst = all.reduce((s: number, o: any) => s + (o.gst_amount || 0), 0);

    const paidOnline = paid.filter((o: any) => !o.is_walk_in);
    const paidPos = paid.filter((o: any) => o.is_walk_in);
    const onlineRevenue = paidOnline.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const posRevenue = paidPos.reduce((s: number, o: any) => s + (o.total || 0), 0);
    const onlineOrders = all.filter((o: any) => !o.is_walk_in).length;
    const posOrders = all.filter((o: any) => o.is_walk_in).length;

    // Build day-by-day breakdown
    const dayMap: Record<string, { date: string; orders: number; revenue: number }> = {};
    all.forEach((o: any) => {
      const d = new Date(o.created_at).toISOString().split('T')[0];
      if (!dayMap[d]) dayMap[d] = { date: d, orders: 0, revenue: 0 };
      dayMap[d].orders++;
      if (o.payment_status === 'paid' || o.is_walk_in) dayMap[d].revenue += o.total || 0;
    });
    const dailyBreakdown = Object.values(dayMap).sort((a, b) => a.date.localeCompare(b.date));

    sendSuccess(res, {
      totalRevenue,
      totalOrders,
      avgOrderValue,
      totalDiscount,
      totalGst,
      onlineRevenue,
      posRevenue,
      onlineOrders,
      posOrders,
      dailyBreakdown,
      period: period || 'month',
      startDate: start.toISOString(),
      endDate: end.toISOString(),
    }, 'Sales summary fetched');
  } catch (error) {
    next(error);
  }
});

export default router;

