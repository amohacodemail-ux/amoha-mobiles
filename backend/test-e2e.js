// End-to-end API test script
const BASE = 'http://localhost:5001/api';

async function request(method, path, body, token) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${BASE}${path}`, opts);
  const text = await res.text();
  let data;
  try { data = JSON.parse(text); } catch { data = { raw: text }; }
  return { status: res.status, data, ok: res.ok };
}

function log(label, ok, detail) {
  const icon = ok ? '✅' : '❌';
  console.log(`${icon} ${label}${detail ? ' — ' + detail : ''}`);
}

(async () => {
  const results = { pass: 0, fail: 0, errors: [] };
  function check(label, ok, detail) {
    log(label, ok, detail);
    if (ok) results.pass++; else { results.fail++; results.errors.push(label + ': ' + detail); }
  }

  try {
    // ============ AUTH ============
    console.log('\n====== AUTH ======');

    // Try login first (user may already exist from previous runs)
    let r = await request('POST', '/auth/login', { email: 'e2etest@amoha.com', password: 'Test@1234' });
    if (!r.ok) {
      // Register new user
      r = await request('POST', '/auth/register', {
        name: 'E2E Tester', email: 'e2etest@amoha.com', phone: '9999999999',
        password: 'Test@1234', confirmPassword: 'Test@1234'
      });
    }
    check('Register/Login', r.ok, `status=${r.status}`);
    const userToken = r.data.token;
    const userId = r.data.user?.id;
    console.log(`  User ID: ${userId}`);
    console.log(`  Role: ${r.data.user?.role}`);

    // Profile
    r = await request('GET', '/auth/profile', null, userToken);
    check('Get Profile', r.ok, `name=${r.data.data?.name || r.data.user?.name}`);

    // Promote to admin via direct supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { error: promErr } = await supabase.from('users').update({ role: 'admin' }).eq('id', userId);
    check('Promote to Admin', !promErr, promErr ? promErr.message : 'role=admin');

    // Re-login to get admin token
    r = await request('POST', '/auth/login', { email: 'e2etest@amoha.com', password: 'Test@1234' });
    check('Admin Re-login', r.ok && r.data.user?.role === 'admin', `role=${r.data.user?.role}`);
    const adminToken = r.data.token;

    // ============ BRANDS ============
    console.log('\n====== BRANDS ======');
    r = await request('POST', '/admin/brands', {
      name: 'Samsung', slug: 'samsung', logo: 'https://example.com/samsung.png', description: 'Samsung Electronics', isActive: true
    }, adminToken);
    check('Create Brand (Samsung)', r.ok || r.status === 409, `status=${r.status}`);
    let samsungId = r.data.data?.id || r.data.data?._id;

    r = await request('POST', '/admin/brands', {
      name: 'Apple', slug: 'apple', logo: 'https://example.com/apple.png', description: 'Apple Inc', isActive: true
    }, adminToken);
    check('Create Brand (Apple)', r.ok || r.status === 409, `status=${r.status}`);
    let appleId = r.data.data?.id || r.data.data?._id;

    r = await request('GET', '/brands', null);
    check('List Brands (public)', r.ok, `count=${r.data.data?.brands?.length || r.data.data?.length}`);
    // Resolve IDs from list if creates returned 409
    const brandList = r.data.data?.brands || r.data.data || [];
    if (!samsungId) samsungId = brandList.find(b => b.slug === 'samsung')?.id;
    if (!appleId) appleId = brandList.find(b => b.slug === 'apple')?.id;
    console.log(`  Brand IDs: Samsung=${samsungId}, Apple=${appleId}`);

    // ============ CATEGORIES ============
    console.log('\n====== CATEGORIES ======');
    r = await request('POST', '/admin/categories', {
      name: 'Smartphones', slug: 'smartphones', image: 'https://example.com/phones.png', description: 'Mobile Phones', isActive: true
    }, adminToken);
    check('Create Category (Smartphones)', r.ok || r.status === 409, `status=${r.status}`);
    let catId = r.data.data?.id || r.data.data?._id;
    console.log(`  Category ID: ${catId}`);

    r = await request('POST', '/admin/categories', {
      name: 'Accessories', slug: 'accessories', image: 'https://example.com/acc.png', description: 'Phone Accessories', isActive: true
    }, adminToken);
    check('Create Category (Accessories)', r.ok || r.status === 409, `status=${r.status}`);

    r = await request('GET', '/categories', null);
    check('List Categories (public)', r.ok, `count=${r.data.data?.categories?.length}`);
    // Resolve IDs from list if creates returned 409
    const catList = r.data.data?.categories || r.data.data || [];
    if (!catId) catId = catList.find(c => c.slug === 'smartphones')?.id;
    console.log(`  Resolved Category ID: ${catId}`);

    // ============ PRODUCTS ============
    console.log('\n====== PRODUCTS ======');
    r = await request('POST', '/admin/products', {
      name: 'Samsung Galaxy S24 Ultra',
      brand: samsungId,
      category: catId,
      description: 'The ultimate Samsung flagship with S Pen and AI features for an amazing experience',
      shortDescription: 'Samsung flagship phone',
      price: 129999,
      originalPrice: 139999,
      discount: 7,
      images: ['https://example.com/s24-1.jpg', 'https://example.com/s24-2.jpg'],
      thumbnail: 'https://example.com/s24-thumb.jpg',
      stock: 50,
      tags: ['samsung', 'flagship', '5g'],
      isFeatured: true,
      isTrending: true,
      colors: ['Titanium Black', 'Titanium Gray'],
      specifications: {
        display: 'Dynamic AMOLED 2X',
        displaySize: '6.8 inches',
        processor: 'Snapdragon 8 Gen 3',
        ram: '12GB',
        storage: '256GB',
        battery: '5000mAh',
        rearCamera: '200MP + 12MP + 50MP + 10MP',
        frontCamera: '12MP',
        os: 'Android 14',
        network: '5G',
      }
    }, adminToken);
    check('Create Product (Galaxy S24)', r.ok || r.status === 409, `status=${r.status}, msg=${r.data.message}`);
    let productId = r.data.data?.id || r.data.data?._id;
    let productSlug = r.data.data?.slug;
    console.log(`  Product ID: ${productId}, Slug: ${productSlug}`);
    if (!r.ok && r.status !== 409) console.log('  Error:', JSON.stringify(r.data).substring(0, 300));

    // Create second product
    r = await request('POST', '/admin/products', {
      name: 'iPhone 15 Pro Max',
      brand: appleId,
      category: catId,
      description: 'Apple iPhone 15 Pro Max with titanium design and A17 Pro chip for incredible performance',
      shortDescription: 'Apple flagship phone',
      price: 159999,
      originalPrice: 169999,
      discount: 6,
      images: ['https://example.com/ip15-1.jpg'],
      thumbnail: 'https://example.com/ip15-thumb.jpg',
      stock: 30,
      tags: ['apple', 'iphone', '5g'],
      isFeatured: true,
      colors: ['Natural Titanium', 'Blue Titanium'],
      specifications: {
        display: 'Super Retina XDR',
        displaySize: '6.7 inches',
        processor: 'A17 Pro',
        ram: '8GB',
        storage: '256GB',
        battery: '4441mAh',
        rearCamera: '48MP + 12MP + 12MP',
        frontCamera: '12MP',
        os: 'iOS 17',
        network: '5G',
      }
    }, adminToken);
    check('Create Product (iPhone 15)', r.ok || r.status === 409, `status=${r.status}`);
    let product2Id = r.data.data?.id || r.data.data?._id;

    // ============ PUBLIC PRODUCT BROWSING ============
    console.log('\n====== PUBLIC BROWSING ======');
    r = await request('GET', '/products');
    check('List Products', r.ok, `count=${r.data.data?.products?.length}`);
    // Resolve product IDs/slugs from list if creates returned 409
    const prodList = r.data.data?.products || r.data.data || [];
    if (!productId) {
      const galaxy = prodList.find(p => p.name?.includes('Galaxy S24'));
      if (galaxy) { productId = galaxy.id; productSlug = galaxy.slug; }
    }
    if (!product2Id) {
      const iphone = prodList.find(p => p.name?.includes('iPhone 15'));
      if (iphone) { product2Id = iphone.id; }
    }
    console.log(`  Resolved: productId=${productId}, slug=${productSlug}, product2Id=${product2Id}`);

    r = await request('GET', '/products/featured');
    check('Featured Products', r.ok, `count=${r.data.data?.products?.length || r.data.data?.length}`);

    r = await request('GET', '/products/trending');
    check('Trending Products', r.ok, `count=${r.data.data?.products?.length || r.data.data?.length}`);

    if (productSlug) {
      r = await request('GET', `/products/${productSlug}`);
      check('Get Product by Slug', r.ok, `name=${r.data.data?.name}`);
    }

    r = await request('GET', '/products?search=samsung');
    check('Search Products', r.ok, `count=${r.data.data?.products?.length}`);

    r = await request('GET', `/products?brand=${samsungId}`);
    check('Filter by Brand', r.ok, `count=${r.data.data?.products?.length}`);

    r = await request('GET', `/products?category=${catId}`);
    check('Filter by Category', r.ok, `count=${r.data.data?.products?.length}`);

    r = await request('GET', '/categories');
    check('Public Categories', r.ok, `count=${r.data.data?.categories?.length}`);

    r = await request('GET', '/brands');
    check('Public Brands', r.ok, `count=${r.data.data?.brands?.length || r.data.data?.length}`);

    r = await request('GET', '/banners');
    check('Public Banners', r.ok, `status=${r.status}`);

    r = await request('GET', '/settings');
    check('Public Settings', r.ok, `siteName=${r.data.data?.siteName}`);

    // ============ WISHLIST ============
    console.log('\n====== WISHLIST ======');
    if (productId) {
      r = await request('POST', '/wishlist', { productId }, userToken);
      check('Add to Wishlist', r.ok, `status=${r.status}`);
      if (!r.ok) console.log('  Wishlist Error:', JSON.stringify(r.data).substring(0, 300));

      r = await request('GET', '/wishlist', null, userToken);
      check('Get Wishlist', r.ok, `items=${r.data.data?.items?.length}`);

      r = await request('GET', `/wishlist/check/${productId}`, null, userToken);
      check('Check Wishlist', r.ok, `inWishlist=${r.data.data}`);

      r = await request('DELETE', `/wishlist/${productId}`, null, userToken);
      check('Remove from Wishlist', r.ok, `status=${r.status}`);
    }

    // ============ CART ============
    console.log('\n====== CART ======');
    if (productId) {
      r = await request('POST', '/cart/add', { productId, quantity: 2 }, userToken);
      check('Add to Cart', r.ok, `status=${r.status}, msg=${r.data.message}`);
      if (!r.ok) console.log('  Cart Error:', JSON.stringify(r.data).substring(0, 300));

      r = await request('GET', '/cart', null, userToken);
      check('Get Cart', r.ok, `items=${r.data.data?.items?.length}, total=${r.data.data?.total}`);
      const cartItems = r.data.data?.items || [];
      const cartItemId = cartItems[0]?.id || cartItems[0]?._id;

      if (cartItemId) {
        r = await request('PUT', `/cart/item/${cartItemId}`, { quantity: 1 }, userToken);
        check('Update Cart Qty', r.ok, `status=${r.status}`);
      }

      // Add second product
      if (product2Id) {
        r = await request('POST', '/cart/add', { productId: product2Id, quantity: 1 }, userToken);
        check('Add 2nd Product to Cart', r.ok, `status=${r.status}`);
      }

      r = await request('GET', '/cart', null, userToken);
      check('Cart After Updates', r.ok, `items=${r.data.data?.items?.length}, total=${r.data.data?.total}`);

      // Test cart accessories
      r = await request('GET', '/cart/accessories', null, userToken);
      check('Cart Accessories', r.ok || r.status === 200, `status=${r.status}`);
    }

    // ============ ORDER ============
    console.log('\n====== ORDER ======');
    if (productId) {
      r = await request('POST', '/orders', {
        shippingAddress: {
          fullName: 'E2E Tester',
          phone: '9999999999',
          addressLine1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001',
          country: 'India'
        },
        paymentMethod: 'cod',
        items: [
          { productId, productName: 'Samsung Galaxy S24 Ultra', price: 129999, quantity: 1, image: 'https://example.com/s24-1.jpg' }
        ],
        subtotal: 129999,
        tax: 0,
        shippingFee: 49,
        discount: 0,
        total: 130048
      }, userToken);
      check('Create Order (COD)', r.ok, `status=${r.status}, msg=${r.data.message}`);
      if (!r.ok) console.log('  Order Error:', JSON.stringify(r.data).substring(0, 400));
      const orderId = r.data.data?.id || r.data.data?._id;
      const orderNumber = r.data.data?.orderNumber;
      console.log(`  Order ID: ${orderId}, Number: ${orderNumber}`);

      // User orders
      r = await request('GET', '/orders', null, userToken);
      check('My Orders', r.ok, `count=${r.data.data?.orders?.length}`);

      if (orderId) {
        r = await request('GET', `/orders/${orderId}`, null, userToken);
        check('Get Order Detail', r.ok, `status=${r.data.data?.status}`);
      }
    }

    // ============ REVIEWS ============
    console.log('\n====== REVIEWS ======');
    if (productId) {
      r = await request('POST', `/products/${productId}/reviews`, {
        rating: 5, title: 'Amazing phone', comment: 'Best Samsung phone I have ever used, absolutely love it!'
      }, userToken);
      check('Add Review', r.ok || r.status === 400, `status=${r.status}, msg=${r.data.message}`);
      if (!r.ok) console.log('  Review Error:', JSON.stringify(r.data).substring(0, 300));
    }

    // ============ CONTACT ============
    console.log('\n====== CONTACT ======');
    r = await request('POST', '/contact', {
      name: 'E2E Tester', email: 'e2etest@amoha.com', phone: '9999999999',
      subject: 'Test Inquiry', message: 'This is a test contact message from the E2E test suite.'
    });
    check('Submit Contact Form', r.ok, `status=${r.status}`);
    if (!r.ok) console.log('  Contact Error:', JSON.stringify(r.data).substring(0, 300));

    // ============ ADMIN DASHBOARD ============
    console.log('\n====== ADMIN DASHBOARD ======');
    r = await request('GET', '/admin/dashboard/stats', null, adminToken);
    check('Dashboard Stats', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/dashboard/revenue', null, adminToken);
    check('Monthly Revenue', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/dashboard/top-products', null, adminToken);
    check('Top Products', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/dashboard/recent-orders', null, adminToken);
    check('Recent Orders', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/sales-report', null, adminToken);
    check('Sales Report', r.ok, `status=${r.status}`);

    // ============ ADMIN ORDERS ============
    console.log('\n====== ADMIN ORDERS ======');
    r = await request('GET', '/admin/orders', null, adminToken);
    check('Admin All Orders', r.ok, `count=${r.data.data?.orders?.length}`);

    // ============ ADMIN USERS ============
    console.log('\n====== ADMIN USERS ======');
    r = await request('GET', '/admin/users', null, adminToken);
    check('Admin All Users', r.ok, `count=${r.data.data?.users?.length || r.data.data?.length}`);

    // ============ ADMIN PRODUCTS ============
    console.log('\n====== ADMIN PRODUCTS ======');
    r = await request('GET', '/admin/products', null, adminToken);
    check('Admin All Products', r.ok, `count=${r.data.data?.products?.length}`);

    if (productId) {
      r = await request('PATCH', `/admin/products/${productId}/stock`, { stock: 100 }, adminToken);
      check('Update Stock', r.ok, `status=${r.status}`);
    }

    // ============ ADMIN COUPONS ============
    console.log('\n====== ADMIN COUPONS ======');
    r = await request('POST', '/admin/coupons', {
      code: 'TESTCOUPON50',
      discount: 50,
      discountType: 'fixed',
      minOrderAmount: 1000,
      maxDiscount: 50,
      usageLimit: 100,
      expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
      isActive: true
    }, adminToken);
    check('Create Coupon', r.ok || r.status === 409, `status=${r.status}, msg=${r.data.message}`);
    if (!r.ok) console.log('  Coupon Error:', JSON.stringify(r.data).substring(0, 300));
    const couponId = r.data.data?.id || r.data.data?._id;

    r = await request('GET', '/admin/coupons', null, adminToken);
    check('List Coupons', r.ok, `count=${r.data.data?.coupons?.length || 0}`);

    // ============ ADMIN REVIEWS ============
    console.log('\n====== ADMIN REVIEWS ======');
    r = await request('GET', '/admin/reviews', null, adminToken);
    check('Admin Reviews', r.ok, `count=${r.data.data?.reviews?.length || 0}`);

    // ============ ADMIN SETTINGS ============
    console.log('\n====== ADMIN SETTINGS ======');
    r = await request('GET', '/admin/settings', null, adminToken);
    check('Get Settings', r.ok, `siteName=${r.data.data?.siteName}`);

    r = await request('PUT', '/admin/settings', {
      siteName: 'AMOHA Mobiles',
      tagline: 'Your one-stop mobile shop',
      announcement: 'Big Summer Sale - Up to 50% OFF!',
      isAnnouncementActive: true
    }, adminToken);
    check('Update Settings', r.ok, `status=${r.status}`);

    // ============ ADMIN NOTIFICATIONS ============
    console.log('\n====== ADMIN NOTIFICATIONS ======');
    r = await request('GET', '/admin/notifications', null, adminToken);
    check('Admin Notifications', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/notifications/unread-count', null, adminToken);
    check('Unread Count', r.ok, `count=${r.data.data}`);

    // ============ ADMIN SERVICE REQUESTS ============
    console.log('\n====== ADMIN SERVICE REQUESTS ======');
    r = await request('GET', '/admin/service-requests', null, adminToken);
    check('Service Requests List', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/service-requests/stats', null, adminToken);
    check('Service Request Stats', r.ok, `status=${r.status}`);

    // ============ ADMIN CONTACT MESSAGES ============
    console.log('\n====== ADMIN CONTACT MESSAGES ======');
    r = await request('GET', '/admin/contact-messages', null, adminToken);
    check('Contact Messages', r.ok, `count=${r.data.data?.messages?.length || 0}`);

    r = await request('GET', '/admin/contact-messages/unread-count', null, adminToken);
    check('Unread Msgs Count', r.ok, `status=${r.status}`);

    // ============ ADMIN CRM ============
    console.log('\n====== ADMIN CRM ======');
    r = await request('GET', '/admin/crm/customers', null, adminToken);
    check('CRM Customers', r.ok, `status=${r.status}`);

    r = await request('GET', '/admin/crm/segments', null, adminToken);
    check('CRM Segments', r.ok, `status=${r.status}`);

    // ============ ADMIN PRODUCT VIEWS ============
    console.log('\n====== ADMIN PRODUCT VIEWS ======');
    r = await request('GET', '/admin/product-views', null, adminToken);
    check('Product Views', r.ok, `status=${r.status}`);

    // ============ ADMIN BANNERS ============
    console.log('\n====== ADMIN BANNERS ======');
    r = await request('POST', '/admin/banners', {
      title: 'Summer Sale', subtitle: 'Up to 50% off', image: 'https://example.com/banner.jpg',
      link: '/products', isActive: true, sortOrder: 1
    }, adminToken);
    check('Create Banner', r.ok, `status=${r.status}`);
    if (!r.ok) console.log('  Banner Error:', JSON.stringify(r.data).substring(0, 300));

    r = await request('GET', '/admin/banners', null, adminToken);
    check('Admin Banners', r.ok, `status=${r.status}`);

    // ============ ADMIN REPORTS ============
    console.log('\n====== ADMIN REPORTS ======');
    r = await request('GET', '/admin/reports/sales?month=4&year=2026', null, adminToken);
    check('Sales Report CSV', r.status === 200, `status=${r.status}`);

    r = await request('GET', '/admin/reports/inventory', null, adminToken);
    check('Inventory Report CSV', r.status === 200, `status=${r.status}`);

    // ============ USER ADDRESS ============
    console.log('\n====== USER ADDRESS ======');
    r = await request('POST', '/users/addresses', {
      fullName: 'E2E Tester', phone: '9999999999',
      addressLine1: '123 Test Street', city: 'Mumbai', state: 'Maharashtra',
      pincode: '400001', type: 'home', isDefault: true
    }, userToken);
    check('Add Address', r.ok, `status=${r.status}`);
    if (!r.ok) console.log('  Address Error:', JSON.stringify(r.data).substring(0, 300));

    r = await request('GET', '/users/addresses', null, userToken);
    check('List Addresses', r.ok, `count=${r.data.data?.length}`);

    // ============ WALLET ============
    console.log('\n====== WALLET ======');
    r = await request('GET', '/wallet/balance', null, userToken);
    check('Get Wallet Balance', r.ok, `balance=${r.data.data?.balance}`);

    r = await request('GET', '/wallet/transactions', null, userToken);
    check('Get Wallet Transactions', r.ok, `status=${r.status}`);

    // ============ SUMMARY ============
    console.log('\n' + '='.repeat(50));
    console.log(`RESULTS: ${results.pass} PASSED, ${results.fail} FAILED`);
    console.log('='.repeat(50));
    if (results.errors.length > 0) {
      console.log('\nFailed tests:');
      results.errors.forEach(e => console.log(`  ❌ ${e}`));
    }
  } catch (err) {
    console.error('\n💥 FATAL ERROR:', err.message);
    console.error(err.stack);
  }
})();
