import supabase from '../config/supabase';
import { transformRow, toDbRow } from '../utils/transform.util';
import { generateSku, generateBarcode } from '../models/product.model';
import { NotFoundError, BadRequestError } from '../errors/app-error';
import logger from '../utils/logger.util';

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
    }

    let qb = supabase.from('products').select(
      '*, reviews:reviews(count), categories(id, name, slug), brands(id, name, slug)',
      { count: 'exact' },
    );

    if (query.search) {
      qb = qb.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%,sku.ilike.%${query.search}%`);
    }
    if (resolvedCategoryId) qb = qb.eq('category_id', resolvedCategoryId);
    if (query.brand) qb = qb.eq('brand_id', query.brand);
    // Support both minPrice/maxPrice and priceMin/priceMax from different callers
    const priceMin = query.minPrice || query.priceMin;
    const priceMax = query.maxPrice || query.priceMax;
    if (priceMin) qb = qb.gte('selling_price', parseFloat(priceMin));
    if (priceMax) qb = qb.lte('selling_price', parseFloat(priceMax));
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
    const barcode = data.barcode || generateBarcode();

    // Map frontend field names to DB column names
    const mapped = { ...data, sku, barcode };
    if (mapped.brand) { mapped.brandId = mapped.brand; delete mapped.brand; }
    if (mapped.category) { mapped.categoryId = mapped.category; delete mapped.category; }
    if (!mapped.slug) {
      mapped.slug = mapped.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    }
    if (!mapped.sellingPrice) mapped.sellingPrice = mapped.price;

    const dbData = toDbRow(mapped);
    if (data.specifications) dbData.specifications = data.specifications;

    const { data: product, error } = await supabase
      .from('products').insert(dbData).select('*').single();
    if (error) throw error;
    return transformRow(product);
  }

  async updateProduct(productId: string, updates: any) {
    const mapped = { ...updates };
    if (mapped.brand) { mapped.brandId = mapped.brand; delete mapped.brand; }
    if (mapped.category) { mapped.categoryId = mapped.category; delete mapped.category; }
    if (mapped.sellingPrice === undefined && mapped.price !== undefined) mapped.sellingPrice = mapped.price;

    const dbUpdates = toDbRow(mapped);
    if (updates.specifications) dbUpdates.specifications = updates.specifications;

    const { data: product, error } = await supabase
      .from('products').update(dbUpdates).eq('id', productId).select('*').single();
    if (error) throw error;
    if (!product) throw new NotFoundError('Product');
    return transformRow(product);
  }

  async deleteProduct(productId: string) {
    const { data: product, error: fetchError } = await supabase
      .from('products')
      .select('id, name')
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
      return {
        mode: 'deleted' as const,
        message: 'Product deleted successfully',
      };
    }

    if ((error as any).code === '23503') {
      throw new BadRequestError(
        'Cannot delete product: a foreign key constraint is still blocking deletion. ' +
        'Apply supabase-migration-v4.sql in Supabase SQL Editor to enable hard delete.'
      );
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

    const { data: products, error, count } = await supabase
      .from('products').select('*', { count: 'exact' })
      .eq('category_id', categoryId).eq('is_active', true)
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
  async delete(id: string) { return this.deleteProduct(id); }
  async getTrending(limit: number = 10) {
    const { data, error } = await supabase.from('products').select('*').eq('is_active', true).order('view_count', { ascending: false }).limit(limit);
    if (error) throw error;
    return (data || []).map((p: any) => normalizeProduct(transformRow(p)));
  }
  async searchSuggestions(query: string) {
    const { data, error } = await supabase.from('products').select('id, name, slug, images, thumbnail, selling_price, brands(name)').eq('is_active', true).ilike('name', `%${query}%`).limit(10);
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
