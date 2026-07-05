import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { generateSku } from '../models/product.model';
import { generateProductBarcode, isBarcodeExists, validateBarcode, BarcodeType } from '../utils/barcode.util';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';
import activityLog from './activity-log.service';

/** Normalise a transformed product row so the frontend gets the shape it expects. */
function normalizeProduct(p: any): any {
  if (!p) return p;
  // price: frontend expects "price" to be the selling price
  if (p.sellingPrice != null) {
    p.originalPrice = p.originalPrice ?? p.price ?? p.sellingPrice;
    p.price = p.sellingPrice;
  }
  // ratings / numReviews aliases
  p.ratings = p.averageRating ?? p.ratings ?? 0;
  p.numReviews = p.reviewCount ?? p.numReviews ?? 0;
  // brand / category as strings (from joined objects)
  if (p.brands && typeof p.brands === 'object') {
    p.brand = p.brands.name ?? '';
    p.brandSlug = p.brands.slug ?? '';
  }
  if (p.categories && typeof p.categories === 'object') {
    p.category = p.categories.name ?? '';
    p.categorySlug = p.categories.slug ?? '';
  }
  // inStock boolean
  if (p.inStock === undefined || p.inStock === null) {
    p.inStock = (p.stock ?? 0) > 0;
  }
  // discount
  if ((p.discount === undefined || p.discount === null) && p.originalPrice > p.price) {
    p.discount = Math.round(((p.originalPrice - p.price) / p.originalPrice) * 100);
  }
  p.discount = p.discount ?? 0;
  // purchase price (default to 0 if not set)
  p.purchasePrice = p.purchasePrice ?? p.purchase_price ?? 0;
  // calculate profit margin (selling price - purchase price)
  if (p.price && p.purchasePrice) {
    p.profit = p.price - p.purchasePrice;
    p.profitMargin = p.purchasePrice > 0 ? Math.round(((p.price - p.purchasePrice) / p.purchasePrice) * 100) : 0;
  } else {
    p.profit = 0;
    p.profitMargin = 0;
  }
  return p;
}

class ProductService {
  async getProducts(query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    // Resolve category slug/name → UUID before building query
    let resolvedCategoryId: string | null = null;
    if (query.category) {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(query.category)) {
        resolvedCategoryId = query.category;
      } else {
        const { data: cat } = await supabase
          .from('categories').select('id').eq('slug', query.category).maybeSingle();
        resolvedCategoryId = cat?.id ?? null;
      }
      // If a category was requested but not found, return empty result — do NOT
      // silently drop the filter (which would return all products).
      if (!resolvedCategoryId) {
        return { products: [], totalProducts: 0, totalPages: 0, currentPage: page, hasMore: false, pagination: { total: 0, page, limit, pages: 0 } };
      }
    }

    let qb = supabase.from('products').select(
      '*, reviews:reviews(count), categories(id, name, slug), brands(id, name, slug)',
      { count: 'exact' },
    );

    // Trim and normalise search string
    const searchTerm = typeof query.search === 'string'
      ? query.search.trim().replace(/\s+/g, ' ')
      : '';
    if (searchTerm) {
      qb = qb.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,sku.ilike.%${searchTerm}%`);
    }
    if (resolvedCategoryId) qb = qb.eq('category_id', resolvedCategoryId);

    // Brand filter: frontend sends brand NAMES (comma-separated); resolve to UUIDs
    if (query.brand) {
      const brandNames = String(query.brand).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (brandNames.length > 0) {
        const { data: brandRows } = await supabase
          .from('brands').select('id').in('name', brandNames);
        const brandIds = (brandRows || []).map((b: any) => b.id).filter(Boolean);
        if (brandIds.length > 0) {
          qb = qb.in('brand_id', brandIds);
        } else {
          // No matching brands found — return empty result
          return { products: [], totalProducts: 0, totalPages: 0, currentPage: page, hasMore: false, pagination: { total: 0, page, limit, pages: 0 } };
        }
      }
    }

    // Support both minPrice/maxPrice and priceMin/priceMax from different callers
    const priceMin = query.minPrice || query.priceMin;
    const priceMax = query.maxPrice || query.priceMax;
    if (priceMin) qb = qb.gte('selling_price', parseFloat(priceMin));
    if (priceMax) qb = qb.lte('selling_price', parseFloat(priceMax));

    // Specifications JSONB filters (RAM, storage, battery)
    if (query.ram) {
      const rams = String(query.ram).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (rams.length === 1) {
        qb = qb.filter('specifications->>ram', 'eq', rams[0]);
      } else if (rams.length > 1) {
        qb = qb.filter('specifications->>ram', 'in', `(${rams.map((r: string) => `"${r}"`).join(',')})`);
      }
    }
    if (query.storage) {
      const storages = String(query.storage).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (storages.length === 1) {
        qb = qb.filter('specifications->>storage', 'eq', storages[0]);
      } else if (storages.length > 1) {
        qb = qb.filter('specifications->>storage', 'in', `(${storages.map((s: string) => `"${s}"`).join(',')})`);
      }
    }
    if (query.battery) {
      const batteries = String(query.battery).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (batteries.length === 1) {
        qb = qb.filter('specifications->>battery', 'eq', batteries[0]);
      } else if (batteries.length > 1) {
        qb = qb.filter('specifications->>battery', 'in', `(${batteries.map((b: string) => `"${b}"`).join(',')})`);
      }
    }

    // Condition filter (new / used / refurbished)
    if (query.condition) {
      qb = qb.eq('condition', String(query.condition));
    }

    // Discount filter: minimum discount percentage
    if (query.discount) {
      qb = qb.gte('discount', parseFloat(query.discount));
    }

    if (query.inStock === 'true' || query.inStock === true) qb = qb.gt('stock', 0);
    // Default to active-only for public queries; admin passes isActive=all to see everything
    if (query.isActive === 'all') {
      // no filter — return all products regardless of is_active
    } else {
      const isActiveFilter = query.isActive !== undefined ? query.isActive === 'true' : true;
      qb = qb.eq('is_active', isActiveFilter);
    }
    if (query.isFeatured === 'true') qb = qb.eq('is_featured', true);
    if (query.rating) qb = qb.gte('average_rating', parseFloat(query.rating));

    // Map frontend 'sort' shorthand to sortBy/sortOrder, also support explicit sortBy/sortOrder
    const sortMap: Record<string, { field: string; asc: boolean }> = {
      newest: { field: 'created_at', asc: false },
      oldest: { field: 'created_at', asc: true },
      popular: { field: 'view_count', asc: false },
      price_low: { field: 'selling_price', asc: true },
      price_high: { field: 'selling_price', asc: false },
      rating: { field: 'average_rating', asc: false },
    };
    const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    let sortField: string;
    let sortAsc: boolean;
    if (query.sort && sortMap[query.sort]) {
      sortField = sortMap[query.sort].field;
      sortAsc = sortMap[query.sort].asc;
    } else {
      sortField = camelToSnake(query.sortBy || 'created_at');
      sortAsc = query.sortOrder === 'asc';
    }
    qb = qb.order(sortField, { ascending: sortAsc }).range(offset, offset + limit - 1);

    const { data: products, error, count } = await qb;
    if (error) throw error;

    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / limit);
    return {
      products: (products || []).map((p: any) => {
        const t = transformRow(p);
        t.reviewCount = p.reviews?.[0]?.count || 0;
        delete t.reviews;
        return normalizeProduct(t);
      }),
      totalProducts,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      pagination: { total: totalProducts, page, limit, pages: totalPages },
    };
  }

  async getProductById(productId: string) {
    const { data: product, error } = await supabase
      .from('products').select('*, categories(id, name, slug), brands(id, name, slug)').eq('id', productId).maybeSingle();
    if (error) throw error;
    if (!product) throw new NotFoundError('Product');

    const { data: reviews } = await supabase
      .from('reviews').select('*').eq('product_id', productId).order('created_at', { ascending: false });

    const transformed = normalizeProduct(transformRow(product));
    transformed.reviews = (reviews || []).map(transformRow);
    return transformed;
  }

  async createProduct(data: any) {
    const sku = data.sku || generateSku();

    // Handle barcode generation/validation
    let barcode: string;
    let barcodeType: BarcodeType = 'CODE128';

    if (data.barcode && String(data.barcode).trim()) {
      const trimmed = String(data.barcode).trim();
      // Validate provided barcode — honour the selected type (never silently default to EAN13)
      const type = (data.barcodeType as BarcodeType) || 'CODE128';
      const validation = validateBarcode(trimmed, type);

      if (!validation.valid) {
        throw new BadRequestError(validation.error || 'Invalid barcode format');
      }

      const exists = await isBarcodeExists(trimmed);
      if (exists) {
        throw new BadRequestError('Barcode already exists in database');
      }

      barcode = trimmed;
      barcodeType = type;
    } else {
      const type = (data.barcodeType as BarcodeType) || 'CODE128';
      if (type === 'CODE128') {
        // Default for new products: barcode = SKU (matches existing catalog)
        barcode = sku;
        barcodeType = 'CODE128';
      } else {
        try {
          const result = await generateProductBarcode({
            type,
            prefix: data.barcodePrefix,
          });
          barcode = result.barcode;
          barcodeType = result.type;
        } catch (err: any) {
          logger.error('[ProductService] Error generating barcode:', err);
          throw new BadRequestError(err.message || 'Failed to generate barcode');
        }
      }
    }

    // Map frontend field names to DB column names
    const mapped = { ...data, sku, barcode, barcodeType };
    if (mapped.brand) { mapped.brandId = mapped.brand; delete mapped.brand; }
    if (mapped.category) { mapped.categoryId = mapped.category; delete mapped.category; }
    if (!mapped.slug) {
      mapped.slug = mapped.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!mapped.sellingPrice) mapped.sellingPrice = mapped.price;
    // Handle purchase price (default to 0 if not provided)
    if (mapped.purchasePrice === undefined || mapped.purchasePrice === null) {
      mapped.purchasePrice = 0;
    }

    // Handle isActive field (default to true if not provided)
    if (mapped.isActive === undefined || mapped.isActive === null) {
      mapped.isActive = true;
    }

    // Log purchase price and active status for debugging
    logger.info(`[ProductService] Creating product with purchase price: ${mapped.purchasePrice}, isActive: ${mapped.isActive}`);

    const dbData = toDbRow(mapped);
    if (data.specifications) dbData.specifications = data.specifications;

    const { data: product, error } = await supabase
      .from('products').insert(dbData).select('*').single();
    if (error) {
      // Handle unique constraint violation on barcode
      if ((error as any).code === '23505' && (error as any).message?.includes('barcode')) {
        throw new BadRequestError('Barcode already exists (duplicate)');
      }
      throw error;
    }
    return transformRow(product);
  }

  async updateProduct(productId: string, updates: any) {
    const mapped = { ...updates };

    // Prevent stock updates on products page for existing products
    // Stock updates should only be done through inventory page after first creation
    if (updates.stock !== undefined && updates.stock !== null) {
      // Check if inventory record exists for this product
      const { data: inventoryRecord } = await supabase
        .from('inventory')
        .select('id')
        .eq('product_id', productId)
        .maybeSingle();
      
      if (inventoryRecord) {
        throw new BadRequestError(
          'Stock cannot be updated from products page. Please use the Inventory page to update stock for this product.'
        );
      }
      // If no inventory record exists, allow stock update (first time setup)
    }

    // Handle barcode / barcodeType updates
    const barcodeProvided = updates.barcode !== undefined;
    const typeProvided = updates.barcodeType !== undefined;

    if (barcodeProvided || typeProvided) {
      const { data: current } = await supabase
        .from('products')
        .select('barcode, barcode_type, sku')
        .eq('id', productId)
        .maybeSingle();

      if (barcodeProvided && (updates.barcode === null || updates.barcode === '')) {
        mapped.barcode = null;
        mapped.barcodeType = null;
      } else {
        const nextBarcode = barcodeProvided
          ? String(updates.barcode).trim()
          : (current?.barcode || '');

        if (!nextBarcode) {
          throw new BadRequestError('Barcode value is required');
        }

        const type = ((typeProvided ? updates.barcodeType : current?.barcode_type) || 'CODE128') as BarcodeType;
        const validation = validateBarcode(nextBarcode, type);
        if (!validation.valid) {
          throw new BadRequestError(validation.error || 'Invalid barcode format');
        }

        const exists = await isBarcodeExists(nextBarcode, productId);
        if (exists) {
          throw new BadRequestError('Barcode already exists in database');
        }

        mapped.barcode = nextBarcode;
        mapped.barcodeType = type;
      }
    }

    if (mapped.brand) { mapped.brandId = mapped.brand; delete mapped.brand; }
    if (mapped.category) { mapped.categoryId = mapped.category; delete mapped.category; }
    if (mapped.sellingPrice === undefined && mapped.price !== undefined) mapped.sellingPrice = mapped.price;
    // Handle purchase price (default to 0 if not provided)
    if (mapped.purchasePrice === undefined || mapped.purchasePrice === null) {
      mapped.purchasePrice = 0;
    }

    // Handle isActive field (only update if explicitly provided)
    if (mapped.isActive !== undefined && mapped.isActive !== null) {
      // Keep the provided value (true or false)
      logger.info(`[ProductService] Updating product ${productId} isActive to: ${mapped.isActive}`);
    }

    // Log purchase price and active status for debugging
    logger.info(`[ProductService] Updating product ${productId} with purchase price: ${mapped.purchasePrice}, isActive: ${mapped.isActive}`);

    const dbUpdates = toDbRow(mapped);
    if (updates.specifications) dbUpdates.specifications = updates.specifications;

    const { data: product, error } = await supabase
      .from('products').update(dbUpdates).eq('id', productId).select('*').single();
    if (error) {
      // Handle unique constraint violation on barcode
      if ((error as any).code === '23505' && (error as any).message?.includes('barcode')) {
        throw new BadRequestError('Barcode already exists (duplicate)');
      }
      throw error;
    }
    if (!product) throw new NotFoundError('Product');
    return transformRow(product);
  }

  async deleteProduct(productId: string, adminId?: string, ipAddress?: string) {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, name, sku, stock')
      .eq('id', productId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!product) throw new NotFoundError('Product');

    // ---------- clean up ALL FK references before hard-deleting ----------

    // 1. Transient / non-historical tables → DELETE rows
    for (const table of [
      'cart_items',
      'wishlist_items',
      'product_views',
    ] as const) {
      const { error: e } = await supabase.from(table).delete().eq('product_id', productId);
      if (e) logger.warn(`[delete-product] cleanup ${table}: ${e.message}`);
    }

    // 2. Historical / audit tables → SET NULL to preserve records
    //    (These columns are made nullable by supabase-migration-v4.sql.
    //     If the migration hasn't been applied the update will silently
    //     fail, and the final DELETE will surface the FK error below.)
    for (const { table, column } of [
      { table: 'order_items', column: 'product_id' },
      { table: 'return_request_items', column: 'product_id' },
      { table: 'purchase_order_items', column: 'product_id' },
      { table: 'inventory_movements', column: 'product_id' },
      { table: 'inventory_audit_log', column: 'product_id' },
      { table: 'supplier_entries', column: 'converted_product_id' },
    ] as const) {
      const { error: e } = await supabase.from(table).update({ [column]: null }).eq(column, productId);
      if (e) logger.warn(`[delete-product] nullify ${table}.${column}: ${e.message}`);
    }

    // ---------- hard-delete the product ----------
    const { error } = await supabase.from('products').delete().eq('id', productId);

    if (!error) {
      // Audit log the deletion
      await activityLog.log({
        adminId,
        action: 'DELETE_PRODUCT',
        entity: 'product',
        entityId: productId,
        details: {
          productName: product.name,
          sku: product.sku,
          stock: product.stock,
          reason: 'Hard delete with FK cleanup'
        },
        ipAddress
      });

      logger.info(`[DELETE] Product ${productId} (${product.name}) deleted by admin ${adminId}`);

      return {
        mode: 'deleted' as const,
        message: 'Product deleted successfully',
        productId,
        productName: product.name
      };
    }

    // Foreign key constraint - log it but still allow deletion
    if ((error as any).code === '23503') {
      logger.warn(`[DELETE] Product ${productId} had FK constraint, continuing with deletion`);
      // Continue with deletion despite FK constraint
      const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
      if (deleteError) throw deleteError;
      return {
        mode: 'deleted' as const,
        message: 'Product deleted successfully (with FK cleanup)',
        productId,
      };
    }

    throw error;
  }

  async addReview(productId: string, userId: string, reviewData: any) {
    const { data: existing } = await supabase
      .from('reviews').select('id').eq('product_id', productId).eq('user_id', userId).maybeSingle();
    if (existing) throw new BadRequestError('You have already reviewed this product');

    const { data: review, error } = await supabase
      .from('reviews').insert({ product_id: productId, user_id: userId, rating: reviewData.rating, comment: reviewData.comment })
      .select('*').single();
    if (error) throw error;

    await this.recalculateRatings(productId);
    return transformRow(review);
  }

  async updateReview(productId: string, reviewId: string, userId: string, updates: any) {
    const dbUpdates: any = {};
    if (updates.rating !== undefined) dbUpdates.rating = updates.rating;
    if (updates.comment !== undefined) dbUpdates.comment = updates.comment;

    const { data: review, error } = await supabase
      .from('reviews').update(dbUpdates).eq('id', reviewId).eq('product_id', productId).eq('user_id', userId).select('*').single();
    if (error) throw error;
    if (!review) throw new NotFoundError('Review');

    await this.recalculateRatings(productId);
    return transformRow(review);
  }

  async deleteReview(productId: string, reviewId: string, userId?: string, _isAdmin?: boolean) {
    let qb = supabase.from('reviews').delete().eq('id', reviewId).eq('product_id', productId);
    if (userId) qb = qb.eq('user_id', userId);
    const { error } = await qb;
    if (error) throw error;
    await this.recalculateRatings(productId);
  }

  private async recalculateRatings(productId: string) {
    const { data: reviews } = await supabase.from('reviews').select('rating').eq('product_id', productId);
    const ratings = reviews || [];
    const count = ratings.length;
    const avg = count > 0 ? ratings.reduce((s: number, r: any) => s + r.rating, 0) / count : 0;
    await supabase.from('products').update({ average_rating: Math.round(avg * 10) / 10, review_count: count }).eq('id', productId);
  }

  async getProductsByCategory(categorySlug: string, query: any = {}) {
    // Resolve slug to category ID if it's not a UUID
    let categoryId = categorySlug;
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(categorySlug)) {
      const { data: cat } = await supabase.from('categories').select('id').eq('slug', categorySlug).maybeSingle();
      if (!cat) throw new NotFoundError('Category');
      categoryId = cat.id;
    }

    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    let qb = supabase
      .from('products')
      .select('*, reviews:reviews(count), categories(id, name, slug), brands(id, name, slug)', { count: 'exact' })
      .eq('category_id', categoryId)
      .eq('is_active', true);

    // Support the same filter params as getProducts for consistency
    const sortMap: Record<string, { field: string; asc: boolean }> = {
      newest: { field: 'created_at', asc: false },
      oldest: { field: 'created_at', asc: true },
      popular: { field: 'view_count', asc: false },
      price_low: { field: 'selling_price', asc: true },
      price_high: { field: 'selling_price', asc: false },
      rating: { field: 'average_rating', asc: false },
    };
    const camelToSnake = (s: string) => s.replace(/[A-Z]/g, (l) => `_${l.toLowerCase()}`);
    let sortField: string;
    let sortAsc: boolean;
    if (query.sort && sortMap[query.sort]) {
      sortField = sortMap[query.sort].field;
      sortAsc = sortMap[query.sort].asc;
    } else {
      sortField = camelToSnake(query.sortBy || 'created_at');
      sortAsc = query.sortOrder === 'asc';
    }

    // Brand filter
    if (query.brand) {
      const brandNames = String(query.brand).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (brandNames.length > 0) {
        const { data: brandRows } = await supabase.from('brands').select('id').in('name', brandNames);
        const brandIds = (brandRows || []).map((b: any) => b.id).filter(Boolean);
        if (brandIds.length > 0) {
          qb = qb.in('brand_id', brandIds);
        } else {
          return { products: [], totalProducts: 0, totalPages: 0, currentPage: page, hasMore: false };
        }
      }
    }

    // Price filters
    const priceMin = query.minPrice || query.priceMin;
    const priceMax = query.maxPrice || query.priceMax;
    if (priceMin) qb = qb.gte('selling_price', parseFloat(priceMin));
    if (priceMax) qb = qb.lte('selling_price', parseFloat(priceMax));

    // Spec filters
    if (query.ram) {
      const rams = String(query.ram).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (rams.length === 1) qb = qb.filter('specifications->>ram', 'eq', rams[0]);
      else if (rams.length > 1) qb = qb.filter('specifications->>ram', 'in', `(${rams.map((r: string) => `"${r}"`).join(',')})`);
    }
    if (query.storage) {
      const storages = String(query.storage).split(',').map((s: string) => s.trim()).filter(Boolean);
      if (storages.length === 1) qb = qb.filter('specifications->>storage', 'eq', storages[0]);
      else if (storages.length > 1) qb = qb.filter('specifications->>storage', 'in', `(${storages.map((s: string) => `"${s}"`).join(',')})`);
    }
    if (query.inStock === 'true' || query.inStock === true) qb = qb.gt('stock', 0);
    if (query.rating) qb = qb.gte('average_rating', parseFloat(query.rating));

    qb = qb.order(sortField, { ascending: sortAsc }).range(offset, offset + limit - 1);

    const { data: products, error, count } = await qb;
    if (error) throw error;

    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / limit);
    return {
      products: (products || []).map((p: any) => {
        const t = transformRow(p);
        t.reviewCount = p.reviews?.[0]?.count || 0;
        delete t.reviews;
        return normalizeProduct(t);
      }),
      totalProducts,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      pagination: { total: totalProducts, page, limit, pages: totalPages },
    };
  }

  async getProductsByBrand(brandId: string, query: any = {}) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 20;
    const offset = (page - 1) * limit;

    const { data: products, error, count } = await supabase
      .from('products').select('*', { count: 'exact' })
      .eq('brand_id', brandId).eq('is_active', true)
      .order('created_at', { ascending: false }).range(offset, offset + limit - 1);
    if (error) throw error;

    const totalProducts = count || 0;
    const totalPages = Math.ceil(totalProducts / limit);
    return {
      products: (products || []).map((p: any) => normalizeProduct(transformRow(p))),
      totalProducts,
      totalPages,
      currentPage: page,
      hasMore: page < totalPages,
      pagination: { total: totalProducts, page, limit, pages: totalPages },
    };
  }

  async getFeaturedProducts(limit: number = 10) {
    const { data, error } = await supabase
      .from('products').select('*')
      .eq('is_featured', true).eq('is_active', true)
      .order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map((p: any) => normalizeProduct(transformRow(p)));
  }

  async updateStock(productId: string, quantity: number) {
    // Prevent stock updates on products page for existing products
    const { data: inventoryRecord } = await supabase
      .from('inventory')
      .select('id')
      .eq('product_id', productId)
      .maybeSingle();
    
    if (inventoryRecord) {
      throw new BadRequestError(
        'Stock cannot be updated from products page. Please use the Inventory page to update stock for this product.'
      );
    }

    const { data: product } = await supabase.from('products').select('stock').eq('id', productId).single();
    if (!product) throw new NotFoundError('Product');
    const newStock = product.stock + quantity;
    if (newStock < 0) throw new BadRequestError('Insufficient stock');
    const { data: updated, error } = await supabase
      .from('products').update({ stock: newStock }).eq('id', productId).select('*').single();
    if (error) throw error;
    return transformRow(updated);
  }

  async bulkUpdateStock(items: { productId: string; quantity: number }[]) {
    for (const item of items) {
      await this.updateStock(item.productId, item.quantity);
    }
  }

  // Controller aliases
  async getAll(query?: any) { return this.getProducts(query); }
  async getBySlug(slug: string) {
    const { data, error } = await supabase.from('products').select('*, categories(id, name, slug), brands(id, name, slug)').eq('slug', slug).maybeSingle();
    if (error) throw error;
    if (!data) throw new NotFoundError('Product');

    // Fetch reviews with user info
    const { data: reviews } = await supabase
      .from('reviews').select('*, users:user_id(id, name, avatar)')
      .eq('product_id', data.id).order('created_at', { ascending: false });

    const transformed = normalizeProduct(transformRow(data));
    transformed.reviews = (reviews || []).map((r: any) => {
      const tr = transformRow(r);
      tr.user = r.users ? transformRow(r.users) : { _id: '', name: 'Customer' };
      delete tr.users;
      return tr;
    });
    transformed.numReviews = (reviews || []).length;
    return transformed;
  }
  async getFeatured(limit?: number) { return this.getFeaturedProducts(limit); }
  async getByCategory(categoryId: string, query?: any) { return this.getProductsByCategory(categoryId, query); }
  async create(data: any) { return this.createProduct(data); }
  async update(id: string, data: any) { return this.updateProduct(id, data); }
  async delete(id: string, adminId?: string, ipAddress?: string) { return this.deleteProduct(id, adminId, ipAddress); }
  async getTrending(limit: number = 10) {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('view_count', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map((p: any) => normalizeProduct(transformRow(p)));
  }
  async searchSuggestions(query: string) {
    const term = (query || '').trim().replace(/\s+/g, ' ');
    if (!term) return [];
    const { data, error } = await supabase.from('products').select('id, name, slug, images, thumbnail, selling_price, brands(name)').eq('is_active', true).ilike('name', `%${term}%`).limit(10);
    if (error) throw error;
    return (data || []).map((p: any) => {
      const t = transformRow(p);
      t.thumbnail = p.thumbnail || p.images?.[0] || '';
      t.price = p.selling_price;
      t.brand = p.brands?.name || '';
      delete t.brands;
      return t;
    });
  }
  async getRelated(productId: string, limit: number = 10) {
    const { data: product } = await supabase.from('products').select('category_id, brand_id').eq('id', productId).single();
    if (!product) return [];
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).neq('id', productId).or(`category_id.eq.${product.category_id},brand_id.eq.${product.brand_id}`).limit(limit);
    if (error) throw error;
    return (data || []).map((p: any) => normalizeProduct(transformRow(p)));
  }
  async bulkCreate(products: any[]) {
    let created = 0, failed = 0;
    const results: any[] = [];
    for (const p of products) {
      try { results.push(await this.createProduct(p)); created++; }
      catch { failed++; }
    }
    return { products: results, created, failed };
  }
  async getRecentlyViewed(userId: string, limit: number = 10) {
    const { data, error } = await supabase.from('product_views').select('product_id, products(*)').eq('user_id', userId).order('viewed_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map((v: any) => v.products ? normalizeProduct(transformRow(v.products)) : null).filter(Boolean);
  }
}

export default new ProductService();
