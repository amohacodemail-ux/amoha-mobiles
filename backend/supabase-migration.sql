-- ============================================================
-- AMOHA Mobiles — Full Supabase PostgreSQL Migration
-- Run this SQL in the Supabase SQL Editor to create all tables
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================== CORE TABLES =====================

-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar TEXT,
  role VARCHAR(30) NOT NULL DEFAULT 'user'
    CHECK (role IN ('user','admin','digital_marketing','sales','marketing','purchase_inventory','logistics')),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_blocked BOOLEAN NOT NULL DEFAULT false,
  -- KYC (flattened from embedded document)
  kyc_status VARCHAR(20) NOT NULL DEFAULT 'not_submitted'
    CHECK (kyc_status IN ('not_submitted','pending','verified','rejected')),
  kyc_document_type VARCHAR(20) CHECK (kyc_document_type IN ('aadhaar','pan','passport','voter_id')),
  kyc_document_number VARCHAR(50),
  kyc_document_image TEXT,
  kyc_full_name VARCHAR(200),
  kyc_pan_number VARCHAR(50),
  kyc_pan_image TEXT,
  kyc_bank_account_number VARCHAR(50),
  kyc_bank_ifsc_code VARCHAR(20),
  kyc_bank_name VARCHAR(100),
  kyc_bank_account_holder_name VARCHAR(200),
  kyc_submitted_at TIMESTAMPTZ,
  kyc_verified_at TIMESTAMPTZ,
  kyc_rejection_reason TEXT,
  -- Auth tokens
  refresh_token TEXT,
  reset_password_token TEXT,
  reset_password_expiry TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Addresses (was embedded array in User)
CREATE TABLE addresses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name VARCHAR(200) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  address_line1 VARCHAR(500) NOT NULL,
  address_line2 VARCHAR(500),
  city VARCHAR(100) NOT NULL,
  state VARCHAR(100) NOT NULL,
  pincode VARCHAR(10) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT false,
  type VARCHAR(10) NOT NULL DEFAULT 'home' CHECK (type IN ('home','work','other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_addresses_user ON addresses(user_id);

-- ===================== CATALOG (must be before Products) =====================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(200) NOT NULL UNIQUE,
  image TEXT NOT NULL,
  description TEXT DEFAULT '',
  product_count INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_active ON categories(is_active);

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL UNIQUE,
  slug VARCHAR(200) NOT NULL UNIQUE,
  logo TEXT DEFAULT '',
  description TEXT DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_brands_slug ON brands(slug);

-- Products
CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(500) NOT NULL,
  slug VARCHAR(500) NOT NULL UNIQUE,
  sku VARCHAR(50) UNIQUE,
  barcode VARCHAR(20) UNIQUE,
  brand_id UUID REFERENCES brands(id),
  category_id UUID REFERENCES categories(id),
  description TEXT NOT NULL,
  short_description TEXT DEFAULT '',
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
  original_price DECIMAL(10,2) NOT NULL CHECK (original_price >= 0),
  discount DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (discount >= 0 AND discount <= 100),
  images TEXT[] DEFAULT '{}',
  thumbnail TEXT NOT NULL,
  videos TEXT[] DEFAULT '{}',
  specifications JSONB DEFAULT '{}',
  stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  average_rating DECIMAL(3,1) NOT NULL DEFAULT 0 CHECK (average_rating >= 0 AND average_rating <= 5),
  review_count INTEGER NOT NULL DEFAULT 0,
  view_count INTEGER NOT NULL DEFAULT 0,
  tags TEXT[] DEFAULT '{}',
  is_featured BOOLEAN NOT NULL DEFAULT false,
  is_trending BOOLEAN NOT NULL DEFAULT false,
  colors TEXT[] DEFAULT '{}',
  warranty TEXT DEFAULT '',
  condition VARCHAR(20) NOT NULL DEFAULT 'new' CHECK (condition IN ('new','used','refurbished')),
  related_accessories UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_sku ON products(sku);
CREATE INDEX idx_products_barcode ON products(barcode);
CREATE INDEX idx_products_brand ON products(brand_id);
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_price ON products(selling_price);
CREATE INDEX idx_products_brand_category ON products(brand_id, category_id);
CREATE INDEX idx_products_price_ratings ON products(selling_price, average_rating DESC);
CREATE INDEX idx_products_created_at ON products(created_at DESC);
CREATE INDEX idx_products_featured_trending ON products(is_featured, is_trending);
CREATE INDEX idx_products_is_active ON products(is_active);
CREATE INDEX idx_products_condition ON products(condition);
CREATE INDEX idx_products_search ON products USING GIN (
  to_tsvector('english', name || ' ' || COALESCE(description, ''))
);

-- Reviews (was embedded in Product)
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT DEFAULT '',
  comment TEXT NOT NULL,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);
CREATE INDEX idx_reviews_product ON reviews(product_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);

-- ===================== ORDERS =====================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES users(id),
  shipping_address JSONB NOT NULL,
  billing_address JSONB,
  payment_method VARCHAR(20) NOT NULL DEFAULT 'cod',
  payment_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (payment_status IN ('pending','paid','failed','refunded')),
  status VARCHAR(30) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled','returned')),
  subtotal DECIMAL(10,2) NOT NULL CHECK (subtotal >= 0),
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL CHECK (total >= 0),
  coupon_code VARCHAR(50),
  notes TEXT,
  estimated_delivery TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancel_reason TEXT,
  tracking_number VARCHAR(100),
  tracking_url TEXT,
  logistics_partner VARCHAR(30)
    CHECK (logistics_partner IN ('dhl','professional_courier','bluedart','delhivery','ecom_express','other')),
  courier_awb_number VARCHAR(100),
  shipment_weight VARCHAR(50),
  is_walk_in BOOLEAN NOT NULL DEFAULT false,
  walk_in_customer_name VARCHAR(200),
  walk_in_customer_phone VARCHAR(20),
  walk_in_customer_email VARCHAR(255),
  pos_payment_method VARCHAR(10) CHECK (pos_payment_method IN ('cash','card','upi','other')),
  pos_discount DECIMAL(10,2) DEFAULT 0,
  pos_discount_type VARCHAR(10) CHECK (pos_discount_type IN ('percentage','fixed')),
  gst_amount DECIMAL(10,2) DEFAULT 0,
  gst_rate DECIMAL(5,2) DEFAULT 0,
  invoice_number VARCHAR(50),
  razorpay_order_id VARCHAR(100),
  razorpay_payment_id VARCHAR(100),
  razorpay_signature TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_orders_order_number ON orders(order_number);
CREATE INDEX idx_orders_user ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);
CREATE INDEX idx_orders_user_created ON orders(user_id, created_at DESC);
CREATE INDEX idx_orders_created ON orders(created_at DESC);
CREATE INDEX idx_orders_invoice ON orders(invoice_number) WHERE invoice_number IS NOT NULL;
CREATE UNIQUE INDEX idx_orders_razorpay ON orders(razorpay_order_id) WHERE razorpay_order_id IS NOT NULL;

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  product_name VARCHAR(500),
  product_image TEXT,
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  color VARCHAR(50)
);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_product ON order_items(product_id);

CREATE TABLE order_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  comment TEXT DEFAULT ''
);
CREATE INDEX idx_order_status_history_order ON order_status_history(order_id);

-- ===================== CART =====================

CREATE TABLE carts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_items INTEGER NOT NULL DEFAULT 0,
  subtotal DECIMAL(10,2) NOT NULL DEFAULT 0,
  tax DECIMAL(10,2) NOT NULL DEFAULT 0,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  discount DECIMAL(10,2) NOT NULL DEFAULT 0,
  total DECIMAL(10,2) NOT NULL DEFAULT 0,
  coupon_code VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_carts_user ON carts(user_id);

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cart_id UUID NOT NULL REFERENCES carts(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 1),
  color VARCHAR(50),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  total_price DECIMAL(10,2) NOT NULL CHECK (total_price >= 0),
  saved_for_later BOOLEAN NOT NULL DEFAULT false
);
CREATE INDEX idx_cart_items_cart ON cart_items(cart_id);
CREATE INDEX idx_cart_items_product ON cart_items(product_id);

-- ===================== WISHLIST =====================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wishlists_user ON wishlists(user_id);

CREATE TABLE wishlist_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wishlist_id UUID NOT NULL REFERENCES wishlists(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(wishlist_id, product_id)
);
CREATE INDEX idx_wishlist_items_wishlist ON wishlist_items(wishlist_id);

CREATE TABLE banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title VARCHAR(300) NOT NULL,
  subtitle TEXT DEFAULT '',
  image TEXT NOT NULL,
  link TEXT DEFAULT '',
  position VARCHAR(10) NOT NULL DEFAULT 'hero'
    CHECK (position IN ('hero','sidebar','popup','footer')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_banners_active_order ON banners(is_active, sort_order);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR(50) NOT NULL UNIQUE,
  discount DECIMAL(10,2) NOT NULL CHECK (discount >= 0),
  discount_type VARCHAR(10) NOT NULL CHECK (discount_type IN ('percentage','fixed')),
  min_order_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  max_discount DECIMAL(10,2),
  usage_limit INTEGER NOT NULL DEFAULT 100,
  used_count INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_coupons_code_active ON coupons(code, is_active);
CREATE INDEX idx_coupons_expires ON coupons(expires_at);

-- ===================== NOTIFICATIONS & CONTACT =====================

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type VARCHAR(20) NOT NULL
    CHECK (type IN ('order','contact','service_request','kyc','review','system','low_stock')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT DEFAULT '',
  is_read BOOLEAN NOT NULL DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_notifications_read_created ON notifications(is_read, created_at DESC);
CREATE INDEX idx_notifications_type_created ON notifications(type, created_at DESC);

CREATE TABLE contact_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(200) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  subject VARCHAR(500) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_contact_messages_read_created ON contact_messages(is_read, created_at DESC);

-- ===================== CRM =====================

CREATE TABLE crm_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id),
  type VARCHAR(20) NOT NULL DEFAULT 'note'
    CHECK (type IN ('note','call','email','meeting','follow_up')),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_crm_notes_customer_created ON crm_notes(customer_id, created_at DESC);

-- ===================== SETTINGS =====================

CREATE TABLE site_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  site_name VARCHAR(200) DEFAULT 'AMOHA Mobiles',
  tagline VARCHAR(500) DEFAULT 'Explore Plus',
  logo TEXT DEFAULT '',
  favicon TEXT DEFAULT '',
  contact_email VARCHAR(255) DEFAULT 'support@amoha.com',
  contact_phone VARCHAR(20) DEFAULT '+91 98765 43210',
  address TEXT DEFAULT 'Mumbai, India',
  delivery_charge DECIMAL(10,2) DEFAULT 49,
  free_delivery_above DECIMAL(10,2) DEFAULT 999,
  social_links JSONB DEFAULT '{"facebook":"","instagram":"","twitter":"","youtube":""}',
  announcement TEXT DEFAULT '',
  is_announcement_active BOOLEAN DEFAULT false,
  popup JSONB DEFAULT '{"isActive":false,"title":"","subtitle":"","description":"","image":"","buttonText":"Shop Now","buttonLink":"/products","bgColor":"#1a1a2e"}',
  discover_banners JSONB DEFAULT '[]',
  promo_banner JSONB DEFAULT '{"image":"","link":"","isActive":false}',
  billing JSONB DEFAULT '{}',
  smtp_host VARCHAR(255) DEFAULT '',
  smtp_port INTEGER DEFAULT 587,
  smtp_user VARCHAR(255) DEFAULT '',
  smtp_pass VARCHAR(255) DEFAULT '',
  smtp_from VARCHAR(255) DEFAULT '',
  policies JSONB DEFAULT '{"termsAndConditions":"","privacyPolicy":"","returnPolicy":"","shippingPolicy":"","refundPolicy":""}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== SERVICE REQUESTS =====================

CREATE TABLE service_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number VARCHAR(50) NOT NULL UNIQUE,
  user_id UUID REFERENCES users(id),
  customer_name VARCHAR(200) NOT NULL,
  customer_phone VARCHAR(20) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  device_brand VARCHAR(100) NOT NULL,
  device_model VARCHAR(200) NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT DEFAULT '',
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','in_progress','completed','cancelled')),
  admin_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_service_requests_status ON service_requests(status);
CREATE INDEX idx_service_requests_email ON service_requests(customer_email);
CREATE INDEX idx_service_requests_created ON service_requests(created_at DESC);

-- ===================== ANALYTICS =====================

CREATE TABLE product_views (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  product_id UUID NOT NULL REFERENCES products(id),
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration INTEGER NOT NULL DEFAULT 0
);
CREATE INDEX idx_product_views_user ON product_views(user_id);
CREATE INDEX idx_product_views_product ON product_views(product_id);
CREATE INDEX idx_product_views_user_viewed ON product_views(user_id, viewed_at DESC);
CREATE INDEX idx_product_views_product_viewed ON product_views(product_id, viewed_at DESC);
CREATE INDEX idx_product_views_viewed ON product_views(viewed_at DESC);

CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource VARCHAR(100) NOT NULL,
  resource_id UUID,
  details TEXT NOT NULL,
  ip_address VARCHAR(50),
  user_agent TEXT,
  changes JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_action ON activity_logs(action);
CREATE INDEX idx_activity_logs_resource ON activity_logs(resource);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_action_resource ON activity_logs(action, resource, created_at DESC);

-- ===================== WALLET =====================

CREATE TABLE wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallets_user ON wallets(user_id);

CREATE TABLE wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID NOT NULL REFERENCES wallets(id) ON DELETE CASCADE,
  type VARCHAR(10) NOT NULL CHECK (type IN ('credit','debit')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
  description TEXT NOT NULL,
  reference VARCHAR(100),
  reference_type VARCHAR(20) CHECK (reference_type IN ('order','refund','return','cashback','admin','other')),
  reference_id UUID,
  balance_after DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_wallet_transactions_wallet ON wallet_transactions(wallet_id);

-- ===================== RETURNS =====================

CREATE TABLE return_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_number VARCHAR(50) NOT NULL UNIQUE,
  order_id UUID NOT NULL REFERENCES orders(id),
  user_id UUID NOT NULL REFERENCES users(id),
  return_type VARCHAR(20) NOT NULL CHECK (return_type IN ('return','replacement','refund')),
  status VARCHAR(30) NOT NULL DEFAULT 'requested'
    CHECK (status IN ('requested','approved','rejected','pickup_scheduled','picked_up','received','inspected','refund_initiated','refund_completed','replacement_shipped','closed')),
  reason VARCHAR(30) NOT NULL
    CHECK (reason IN ('defective','wrong_item','not_as_described','damaged_in_transit','size_fit_issue','changed_mind','better_price_elsewhere','other')),
  description TEXT NOT NULL,
  images TEXT[] DEFAULT '{}',
  refund_amount DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (refund_amount >= 0),
  refund_method VARCHAR(20) NOT NULL DEFAULT 'original_payment'
    CHECK (refund_method IN ('original_payment','wallet','bank_transfer')),
  refund_status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (refund_status IN ('pending','processing','completed','failed')),
  pickup_address JSONB NOT NULL,
  pickup_date TIMESTAMPTZ,
  admin_notes TEXT,
  replacement_order_id UUID REFERENCES orders(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_return_requests_number ON return_requests(return_number);
CREATE INDEX idx_return_requests_order ON return_requests(order_id);
CREATE INDEX idx_return_requests_user ON return_requests(user_id);
CREATE INDEX idx_return_requests_status ON return_requests(status);
CREATE INDEX idx_return_requests_user_created ON return_requests(user_id, created_at DESC);
CREATE INDEX idx_return_requests_status_created ON return_requests(status, created_at DESC);

CREATE TABLE return_request_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id),
  quantity INTEGER NOT NULL CHECK (quantity >= 1),
  price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
  reason VARCHAR(30) NOT NULL
    CHECK (reason IN ('defective','wrong_item','not_as_described','damaged_in_transit','size_fit_issue','changed_mind','better_price_elsewhere','other'))
);
CREATE INDEX idx_return_request_items_return ON return_request_items(return_request_id);

CREATE TABLE return_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  return_request_id UUID NOT NULL REFERENCES return_requests(id) ON DELETE CASCADE,
  status VARCHAR(30) NOT NULL,
  date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  message TEXT DEFAULT '',
  updated_by UUID REFERENCES users(id)
);
CREATE INDEX idx_return_status_history_return ON return_status_history(return_request_id);

-- ===================== IMAGES =====================

CREATE TABLE images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  data BYTEA NOT NULL,
  content_type VARCHAR(50) NOT NULL,
  folder VARCHAR(100) DEFAULT 'general',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ===================== PRODUCT Q&A =====================

CREATE TABLE product_qa (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  upvotes INTEGER NOT NULL DEFAULT 0,
  upvoted_by UUID[] DEFAULT '{}',
  is_answered BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_product_qa_product_created ON product_qa(product_id, created_at DESC);
CREATE INDEX idx_product_qa_product_answered ON product_qa(product_id, is_answered);

CREATE TABLE qa_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID NOT NULL REFERENCES product_qa(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  answer TEXT NOT NULL,
  is_seller_answer BOOLEAN NOT NULL DEFAULT false,
  upvotes INTEGER NOT NULL DEFAULT 0,
  upvoted_by UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX idx_qa_answers_question ON qa_answers(question_id);

-- ===================== AUTO updated_at TRIGGER =====================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_products_updated_at BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_carts_updated_at BEFORE UPDATE ON carts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_wishlists_updated_at BEFORE UPDATE ON wishlists FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_brands_updated_at BEFORE UPDATE ON brands FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_banners_updated_at BEFORE UPDATE ON banners FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON coupons FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_notifications_updated_at BEFORE UPDATE ON notifications FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contact_messages_updated_at BEFORE UPDATE ON contact_messages FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_crm_notes_updated_at BEFORE UPDATE ON crm_notes FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_site_settings_updated_at BEFORE UPDATE ON site_settings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_service_requests_updated_at BEFORE UPDATE ON service_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_wallets_updated_at BEFORE UPDATE ON wallets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_return_requests_updated_at BEFORE UPDATE ON return_requests FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_product_qa_updated_at BEFORE UPDATE ON product_qa FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ===================== RPC FUNCTIONS (for complex aggregations) =====================

-- Dashboard analytics
CREATE OR REPLACE FUNCTION get_dashboard_analytics()
RETURNS JSONB AS $$
DECLARE
  v_now TIMESTAMPTZ := NOW();
  v_this_month TIMESTAMPTZ := date_trunc('month', v_now);
  v_last_month_start TIMESTAMPTZ := date_trunc('month', v_now - interval '1 month');
  v_last_month_end TIMESTAMPTZ := v_this_month - interval '1 second';
  v_result JSONB;
BEGIN
  SELECT jsonb_build_object(
    'totalUsers', (SELECT COUNT(*) FROM users WHERE role = 'user'),
    'totalProducts', (SELECT COUNT(*) FROM products),
    'totalOrders', (SELECT COUNT(*) FROM orders),
    'totalRevenue', COALESCE((SELECT SUM(total) FROM orders WHERE payment_status = 'paid'), 0),
    'thisMonthUsers', (SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= v_this_month),
    'lastMonthUsers', (SELECT COUNT(*) FROM users WHERE role = 'user' AND created_at >= v_last_month_start AND created_at <= v_last_month_end),
    'thisMonthOrders', (SELECT COUNT(*) FROM orders WHERE created_at >= v_this_month),
    'lastMonthOrders', (SELECT COUNT(*) FROM orders WHERE created_at >= v_last_month_start AND created_at <= v_last_month_end),
    'thisMonthRevenue', COALESCE((SELECT SUM(total) FROM orders WHERE payment_status = 'paid' AND created_at >= v_this_month), 0),
    'lastMonthRevenue', COALESCE((SELECT SUM(total) FROM orders WHERE payment_status = 'paid' AND created_at >= v_last_month_start AND created_at <= v_last_month_end), 0),
    'thisMonthProducts', (SELECT COUNT(*) FROM products WHERE created_at >= v_this_month),
    'lastMonthProducts', (SELECT COUNT(*) FROM products WHERE created_at >= v_last_month_start AND created_at <= v_last_month_end)
  ) INTO v_result;
  RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- Order status counts
CREATE OR REPLACE FUNCTION get_order_status_counts()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT jsonb_object_agg(status, cnt)
    FROM (SELECT status, COUNT(*) AS cnt FROM orders GROUP BY status) t
  );
END;
$$ LANGUAGE plpgsql;

-- Top products by sales
CREATE OR REPLACE FUNCTION get_top_products(p_limit INTEGER DEFAULT 10)
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        p.id, p.name, p.thumbnail, p.price, p.slug,
        SUM(oi.quantity) as total_sold,
        SUM(oi.price * oi.quantity) as total_revenue
      FROM order_items oi
      JOIN orders o ON o.id = oi.order_id AND o.status != 'cancelled'
      JOIN products p ON p.id = oi.product_id
      GROUP BY p.id, p.name, p.thumbnail, p.price, p.slug
      ORDER BY total_sold DESC
      LIMIT p_limit
    ) t
  );
END;
$$ LANGUAGE plpgsql;

-- Sales report
CREATE OR REPLACE FUNCTION get_sales_report(p_start_date TIMESTAMPTZ DEFAULT NULL, p_end_date TIMESTAMPTZ DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_daily JSONB;
  v_summary JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_daily
  FROM (
    SELECT
      DATE(created_at) as date,
      SUM(total) as total_sales,
      COUNT(*) as total_orders,
      AVG(total) as avg_order_value
    FROM orders
    WHERE payment_status = 'paid'
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
    GROUP BY DATE(created_at)
    ORDER BY DATE(created_at) DESC
  ) t;

  SELECT row_to_json(t) INTO v_summary
  FROM (
    SELECT
      COALESCE(SUM(total), 0) as total_revenue,
      COUNT(*) as total_orders,
      COALESCE(AVG(total), 0) as avg_order_value,
      COALESCE(SUM(discount), 0) as total_discount
    FROM orders
    WHERE payment_status = 'paid'
      AND (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date)
  ) t;

  RETURN jsonb_build_object('dailyReport', v_daily, 'summary', v_summary);
END;
$$ LANGUAGE plpgsql;

-- Monthly revenue
CREATE OR REPLACE FUNCTION get_monthly_revenue(p_year INTEGER DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  v_year INTEGER := COALESCE(p_year, EXTRACT(YEAR FROM NOW())::INTEGER);
BEGIN
  RETURN (
    SELECT jsonb_build_object('year', v_year, 'months',
      COALESCE(jsonb_agg(row_to_json(t) ORDER BY t.month), '[]'::jsonb))
    FROM (
      SELECT
        m.month,
        COALESCE(SUM(o.total), 0) as revenue,
        COUNT(o.id) as orders
      FROM generate_series(1, 12) AS m(month)
      LEFT JOIN orders o ON
        EXTRACT(MONTH FROM o.created_at) = m.month
        AND EXTRACT(YEAR FROM o.created_at) = v_year
        AND o.payment_status = 'paid'
      GROUP BY m.month
      ORDER BY m.month
    ) t
  );
END;
$$ LANGUAGE plpgsql;

-- CRM: Get customers with aggregated stats
CREATE OR REPLACE FUNCTION get_crm_customers(
  p_page INTEGER DEFAULT 1,
  p_limit INTEGER DEFAULT 20,
  p_search TEXT DEFAULT NULL,
  p_segment TEXT DEFAULT NULL,
  p_sort_by TEXT DEFAULT 'last_order_date',
  p_sort_order TEXT DEFAULT 'desc'
)
RETURNS JSONB AS $$
DECLARE
  v_offset INTEGER := (p_page - 1) * p_limit;
  v_total INTEGER;
  v_customers JSONB;
BEGIN
  CREATE TEMP TABLE tmp_customers ON COMMIT DROP AS
  SELECT
    u.id, u.name, u.email, u.phone, u.avatar, u.is_blocked, u.is_verified, u.created_at,
    COUNT(o.id) FILTER (WHERE o.id IS NOT NULL) as total_orders,
    COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) as total_spent,
    COUNT(o.id) FILTER (WHERE o.payment_status = 'paid') as paid_orders,
    MAX(o.created_at) as last_order_date,
    CASE
      WHEN COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) >= 50000 THEN 'vip'
      WHEN COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) >= 20000 THEN 'loyal'
      WHEN COUNT(o.id) > 0 THEN 'regular'
      ELSE 'new'
    END as segment,
    (SELECT COUNT(*) FROM crm_notes cn WHERE cn.customer_id = u.id) as notes_count
  FROM users u
  LEFT JOIN orders o ON o.user_id = u.id
  WHERE u.role = 'user'
    AND (p_search IS NULL OR u.name ILIKE '%' || p_search || '%' OR u.email ILIKE '%' || p_search || '%' OR u.phone ILIKE '%' || p_search || '%')
  GROUP BY u.id;

  -- Segment filter
  IF p_segment IS NOT NULL AND p_segment != 'all' THEN
    DELETE FROM tmp_customers WHERE segment != p_segment;
  END IF;

  SELECT COUNT(*) INTO v_total FROM tmp_customers;

  SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb) INTO v_customers
  FROM (
    SELECT * FROM tmp_customers
    ORDER BY
      CASE WHEN p_sort_order = 'asc' AND p_sort_by = 'last_order_date' THEN last_order_date END ASC,
      CASE WHEN p_sort_order = 'desc' AND p_sort_by = 'last_order_date' THEN last_order_date END DESC,
      CASE WHEN p_sort_order = 'asc' AND p_sort_by = 'total_spent' THEN total_spent END ASC,
      CASE WHEN p_sort_order = 'desc' AND p_sort_by = 'total_spent' THEN total_spent END DESC,
      CASE WHEN p_sort_order = 'asc' AND p_sort_by = 'created_at' THEN created_at END ASC,
      CASE WHEN p_sort_order = 'desc' AND p_sort_by = 'created_at' THEN created_at END DESC
    LIMIT p_limit OFFSET v_offset
  ) t;

  RETURN jsonb_build_object(
    'customers', v_customers,
    'total', v_total,
    'totalPages', CEIL(v_total::DECIMAL / p_limit),
    'page', p_page
  );
END;
$$ LANGUAGE plpgsql;

-- CRM: Segment summary
CREATE OR REPLACE FUNCTION get_segment_summary()
RETURNS JSONB AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_to_json(t)), '[]'::jsonb)
    FROM (
      SELECT
        segment,
        COUNT(*) as count,
        ROUND(SUM(total_spent)) as total_revenue,
        ROUND(AVG(total_spent)) as avg_spent
      FROM (
        SELECT
          u.id,
          COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) as total_spent,
          COUNT(o.id) as total_orders,
          CASE
            WHEN COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) >= 50000 THEN 'vip'
            WHEN COALESCE(SUM(o.total) FILTER (WHERE o.status != 'cancelled'), 0) >= 20000 THEN 'loyal'
            WHEN COUNT(o.id) > 0 THEN 'regular'
            ELSE 'new'
          END as segment
        FROM users u
        LEFT JOIN orders o ON o.user_id = u.id
        WHERE u.role = 'user'
        GROUP BY u.id
      ) sub
      GROUP BY segment
      ORDER BY total_revenue DESC
    ) t
  );
END;
$$ LANGUAGE plpgsql;

-- Recalculate cart totals
CREATE OR REPLACE FUNCTION recalculate_cart(p_cart_id UUID)
RETURNS void AS $$
DECLARE
  v_total_items INTEGER;
  v_subtotal DECIMAL;
  v_discount DECIMAL := 0;
  v_shipping_fee DECIMAL;
  v_total DECIMAL;
  v_coupon_code VARCHAR;
BEGIN
  SELECT
    COALESCE(SUM(quantity), 0),
    COALESCE(SUM(total_price), 0)
  INTO v_total_items, v_subtotal
  FROM cart_items WHERE cart_id = p_cart_id AND saved_for_later = false;

  SELECT coupon_code INTO v_coupon_code FROM carts WHERE id = p_cart_id;

  IF v_coupon_code IS NOT NULL THEN
    -- Look up coupon and calculate discount
    DECLARE
      v_coupon RECORD;
    BEGIN
      SELECT * INTO v_coupon FROM coupons WHERE code = v_coupon_code AND is_active = true;
      IF v_coupon IS NOT NULL THEN
        IF v_coupon.discount_type = 'percentage' THEN
          v_discount := ROUND(v_subtotal * v_coupon.discount / 100);
          IF v_coupon.max_discount IS NOT NULL AND v_discount > v_coupon.max_discount THEN
            v_discount := v_coupon.max_discount;
          END IF;
        ELSE
          v_discount := v_coupon.discount;
        END IF;
      END IF;
    END;
  END IF;

  v_shipping_fee := CASE WHEN v_subtotal > 500 THEN 0 ELSE 49 END;
  v_total := GREATEST(v_subtotal - v_discount + v_shipping_fee, 0);

  UPDATE carts SET
    total_items = v_total_items,
    subtotal = v_subtotal,
    discount = v_discount,
    shipping_fee = v_shipping_fee,
    total = v_total
  WHERE id = p_cart_id;
END;
$$ LANGUAGE plpgsql;

-- Increment coupon usage count
CREATE OR REPLACE FUNCTION increment_coupon_usage(p_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE coupons SET used_count = used_count + 1 WHERE code = UPPER(p_code);
END;
$$ LANGUAGE plpgsql;
