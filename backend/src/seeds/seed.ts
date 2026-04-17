import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import env from '../config/env';
import User from '../models/user.model';
import Product from '../models/product.model';
import Category from '../models/category.model';
import Brand from '../models/brand.model';
import Banner from '../models/banner.model';
import Coupon from '../models/coupon.model';
import Order from '../models/order.model';
import { hashPassword } from '../utils/password.util';

const seedDatabase = async () => {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Promise.all([
      User.deleteMany({}),
      Product.deleteMany({}),
      Category.deleteMany({}),
      Brand.deleteMany({}),
      Banner.deleteMany({}),
      Coupon.deleteMany({}),
      Order.deleteMany({}),
    ]);
    console.log('🗑️  Cleared existing data');

    // ====== Users ======
    const adminPassword = await hashPassword('admin123');
    const userPassword = await hashPassword('user123');

    const users = await User.create([
      {
        name: 'Admin',
        email: 'admin@amoha.com',
        phone: '9999999999',
        password: adminPassword,
        role: 'admin',
        isVerified: true,
        addresses: [
          {
            fullName: 'Admin User',
            phone: '9999999999',
            addressLine1: '123 Admin Street',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            isDefault: true,
            type: 'work',
          },
        ],
      },
      {
        name: 'Test User',
        email: 'user@amoha.com',
        phone: '8888888888',
        password: userPassword,
        role: 'user',
        isVerified: true,
        addresses: [
          {
            fullName: 'Test User',
            phone: '8888888888',
            addressLine1: '456 User Lane',
            city: 'Delhi',
            state: 'Delhi',
            pincode: '110001',
            isDefault: true,
            type: 'home',
          },
        ],
      },
    ]);
    console.log(`👤 Created ${users.length} users`);

    // ====== Categories ======
    const categories = await Category.create([
      { name: 'Smartphones', slug: 'smartphones', image: 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/thumbnail.webp', description: 'Latest smartphones', productCount: 0 },
      { name: 'Feature Phones', slug: 'feature-phones', image: 'https://cdn.dummyjson.com/product-images/smartphones/oppo-k1/thumbnail.webp', description: 'Reliable feature phones', productCount: 0 },
      { name: 'Refurbished Phones', slug: 'refurbished-phones', image: 'https://cdn.dummyjson.com/product-images/smartphones/iphone-x/thumbnail.webp', description: 'Quality checked refurbished smartphones', productCount: 0 },
      { name: 'Keypad Phones', slug: 'keypad-phones', image: 'https://cdn.dummyjson.com/product-images/smartphones/iphone-5s/thumbnail.webp', description: 'Classic keypad mobile phones', productCount: 0 },
      { name: 'Chargers', slug: 'chargers', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/thumbnail.webp', description: 'Fast chargers and adapters', productCount: 0 },
      { name: 'Charging Cables', slug: 'charging-cables', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-iphone-charger/1.webp', description: 'USB-C, Lightning & Micro USB cables', productCount: 0 },
      { name: 'Headphones', slug: 'headphones', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods-max-silver/1.webp', description: 'Wired and wireless headphones', productCount: 0 },
      { name: 'Bluetooth Headsets', slug: 'bluetooth-headsets', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-airpods/thumbnail.webp', description: 'Wireless Bluetooth earbuds and headsets', productCount: 0 },
      { name: 'Bluetooth Speakers', slug: 'bluetooth-speakers', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/amazon-echo-plus/thumbnail.webp', description: 'Portable Bluetooth speakers', productCount: 0 },
      { name: 'Batteries', slug: 'batteries', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/apple-magsafe-battery-pack/thumbnail.webp', description: 'Replacement mobile batteries', productCount: 0 },
      { name: 'Tempered Glass', slug: 'tempered-glass', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/thumbnail.webp', description: 'Screen protectors and tempered glass', productCount: 0 },
      { name: 'Mouse', slug: 'mouse', image: 'https://placehold.co/400x400/f8f9fa/4f46e5?text=Mouse&font=raleway', description: 'Wired and wireless mouse', productCount: 0 },
      { name: 'SIM Cards', slug: 'sim-cards', image: 'https://placehold.co/400x400/f8f9fa/4f46e5?text=SIM+Cards&font=raleway', description: 'Prepaid and postpaid SIM cards', productCount: 0 },
      { name: 'Accessories', slug: 'accessories', image: 'https://cdn.dummyjson.com/product-images/mobile-accessories/selfie-stick-monopod/1.webp', description: 'Mobile accessories', productCount: 0 },
      { name: 'Tablets', slug: 'tablets', image: 'https://cdn.dummyjson.com/product-images/tablets/ipad-mini-2021-starlight/thumbnail.webp', description: 'Tablets and iPads', productCount: 0 },
    ]);
    console.log(`📂 Created ${categories.length} categories`);

    // ====== Brands ======
    const brands = await Brand.create([
      { name: 'Samsung', slug: 'samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/24/Samsung_Logo.svg/200px-Samsung_Logo.svg.png', description: 'Samsung Electronics' },
      { name: 'Apple', slug: 'apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/Apple_logo_black.svg/200px-Apple_logo_black.svg.png', description: 'Apple Inc.' },
      { name: 'OnePlus', slug: 'oneplus', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/OnePlus_logo.svg/200px-OnePlus_logo.svg.png', description: 'OnePlus Technology' },
      { name: 'Xiaomi', slug: 'xiaomi', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ae/Xiaomi_logo_%282021-%29.svg/200px-Xiaomi_logo_%282021-%29.svg.png', description: 'Xiaomi Corporation' },
      { name: 'Vivo', slug: 'vivo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/13/Vivo_logo_2019.svg/200px-Vivo_logo_2019.svg.png', description: 'Vivo Communication' },
      { name: 'Realme', slug: 'realme', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/9/91/Realme_logo.svg/200px-Realme_logo.svg.png', description: 'Realme' },
      { name: 'OPPO', slug: 'oppo', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0a/OPPO_LOGO_2019.svg/200px-OPPO_LOGO_2019.svg.png', description: 'OPPO Electronics' },
      { name: 'Nothing', slug: 'nothing', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2b/Nothing_logo.svg/200px-Nothing_logo.svg.png', description: 'Nothing Technology' },
    ]);
    console.log(`🏷️  Created ${brands.length} brands`);

    // ====== Products ======
    const products = await Product.create([
      {
        name: 'Samsung Galaxy S24 Ultra',
        slug: 'samsung-galaxy-s24-ultra',
        brand: 'Samsung',
        category: 'smartphones',
        description: 'The Samsung Galaxy S24 Ultra features a stunning 6.8-inch Dynamic AMOLED 2X display with S Pen integration, Snapdragon 8 Gen 3 processor, and an incredible 200MP camera system. Built with titanium frame for ultimate durability.',
        shortDescription: 'Premium flagship with S Pen, 200MP camera & titanium frame',
        price: 129999,
        originalPrice: 134999,
        discount: 4,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/thumbnail.webp',
        specifications: {
          display: 'Dynamic AMOLED 2X, 120Hz',
          displaySize: '6.8 inches',
          processor: 'Snapdragon 8 Gen 3',
          ram: '12 GB',
          storage: '256 GB',
          expandableStorage: 'No',
          battery: '5000 mAh',
          chargingSpeed: '45W',
          rearCamera: '200MP + 12MP + 50MP + 10MP',
          frontCamera: '12MP',
          os: 'Android 14, One UI 6.1',
          network: '5G',
          sim: 'Dual SIM (Nano + eSIM)',
          weight: '232g',
          dimensions: '162.3 x 79 x 8.6 mm',
          waterResistant: 'IP68',
          fingerprint: 'In-display Ultrasonic',
          nfc: true,
        },
        stock: 25,
        tags: ['flagship', '5g', 's-pen', 'samsung', 'premium'],
        isFeatured: true,
        isTrending: true,
        colors: ['Titanium Black', 'Titanium Gray', 'Titanium Violet', 'Titanium Yellow'],
        ratings: 4.7,
        numReviews: 0,
      },
      {
        name: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        brand: 'Apple',
        category: 'smartphones',
        description: 'iPhone 15 Pro Max features a titanium design, A17 Pro chip, a 48MP camera system with 5x optical zoom, and the Action button. Experience the most advanced iPhone ever.',
        shortDescription: 'Titanium design, A17 Pro chip & 48MP camera with 5x zoom',
        price: 159900,
        originalPrice: 159900,
        discount: 0,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/thumbnail.webp',
        specifications: {
          display: 'Super Retina XDR OLED, 120Hz ProMotion',
          displaySize: '6.7 inches',
          processor: 'A17 Pro',
          ram: '8 GB',
          storage: '256 GB',
          expandableStorage: 'No',
          battery: '4441 mAh',
          chargingSpeed: '27W',
          rearCamera: '48MP + 12MP + 12MP',
          frontCamera: '12MP',
          os: 'iOS 17',
          network: '5G',
          sim: 'Dual eSIM',
          weight: '221g',
          dimensions: '159.9 x 76.7 x 8.25 mm',
          waterResistant: 'IP68',
          fingerprint: 'Face ID',
          nfc: true,
        },
        stock: 15,
        tags: ['flagship', '5g', 'apple', 'iphone', 'premium'],
        isFeatured: true,
        isTrending: true,
        colors: ['Natural Titanium', 'Blue Titanium', 'White Titanium', 'Black Titanium'],
        ratings: 4.8,
        numReviews: 0,
      },
      {
        name: 'OnePlus 12',
        slug: 'oneplus-12',
        brand: 'OnePlus',
        category: 'smartphones',
        description: 'OnePlus 12 comes with Snapdragon 8 Gen 3, Hasselblad camera system, 100W SUPERVOOC charging, and a beautiful 2K LTPO AMOLED display.',
        shortDescription: 'Snapdragon 8 Gen 3, Hasselblad camera & 100W charging',
        price: 64999,
        originalPrice: 69999,
        discount: 7,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/oppo-f19-pro-plus/thumbnail.webp',
        specifications: {
          display: 'LTPO AMOLED, 120Hz, 2K',
          displaySize: '6.82 inches',
          processor: 'Snapdragon 8 Gen 3',
          ram: '12 GB',
          storage: '256 GB',
          expandableStorage: 'No',
          battery: '5400 mAh',
          chargingSpeed: '100W',
          rearCamera: '50MP + 64MP + 48MP',
          frontCamera: '32MP',
          os: 'Android 14, OxygenOS 14',
          network: '5G',
          sim: 'Dual SIM (Nano)',
          weight: '220g',
          dimensions: '164.3 x 75.8 x 9.15 mm',
          waterResistant: 'IP65',
          fingerprint: 'In-display Optical',
          nfc: true,
        },
        stock: 30,
        tags: ['flagship', '5g', 'oneplus', 'fast-charging'],
        isFeatured: true,
        isTrending: false,
        colors: ['Silky Black', 'Flowy Emerald'],
        ratings: 4.5,
        numReviews: 0,
      },
      {
        name: 'Xiaomi 14',
        slug: 'xiaomi-14',
        brand: 'Xiaomi',
        category: 'smartphones',
        description: 'Xiaomi 14 features Leica optics, Snapdragon 8 Gen 3, compact design, and blazing fast 90W HyperCharge.',
        shortDescription: 'Leica optics, Snapdragon 8 Gen 3 & compact flagship',
        price: 49999,
        originalPrice: 54999,
        discount: 9,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/realme-xt/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/realme-xt/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/realme-xt/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/realme-xt/thumbnail.webp',
        specifications: {
          display: 'LTPO AMOLED, 120Hz',
          displaySize: '6.36 inches',
          processor: 'Snapdragon 8 Gen 3',
          ram: '12 GB',
          storage: '256 GB',
          expandableStorage: 'No',
          battery: '4610 mAh',
          chargingSpeed: '90W',
          rearCamera: '50MP + 50MP + 50MP',
          frontCamera: '32MP',
          os: 'Android 14, HyperOS',
          network: '5G',
          sim: 'Dual SIM (Nano)',
          weight: '193g',
          dimensions: '152.8 x 71.5 x 8.2 mm',
          waterResistant: 'IP68',
          fingerprint: 'In-display Optical',
          nfc: true,
        },
        stock: 20,
        tags: ['flagship', '5g', 'xiaomi', 'leica', 'compact'],
        isFeatured: false,
        isTrending: true,
        colors: ['Black', 'White', 'Jade Green'],
        ratings: 4.4,
        numReviews: 0,
      },
      {
        name: 'Nothing Phone (2a)',
        slug: 'nothing-phone-2a',
        brand: 'Nothing',
        category: 'smartphones',
        description: 'Nothing Phone (2a) with unique Glyph Interface, MediaTek Dimensity 7200 Pro, and clean Nothing OS experience.',
        shortDescription: 'Glyph Interface, Dimensity 7200 Pro & Nothing OS',
        price: 23999,
        originalPrice: 25999,
        discount: 8,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/oppo-a57/thumbnail.webp',
        specifications: {
          display: 'AMOLED, 120Hz',
          displaySize: '6.7 inches',
          processor: 'MediaTek Dimensity 7200 Pro',
          ram: '8 GB',
          storage: '128 GB',
          expandableStorage: 'No',
          battery: '5000 mAh',
          chargingSpeed: '45W',
          rearCamera: '50MP + 50MP',
          frontCamera: '32MP',
          os: 'Android 14, Nothing OS 2.5',
          network: '5G',
          sim: 'Dual SIM (Nano)',
          weight: '190g',
          dimensions: '161.74 x 76.32 x 8.55 mm',
          waterResistant: 'No',
          fingerprint: 'In-display Optical',
          nfc: true,
        },
        stock: 40,
        tags: ['mid-range', '5g', 'nothing', 'glyph'],
        isFeatured: true,
        isTrending: true,
        colors: ['Black', 'White'],
        ratings: 4.3,
        numReviews: 0,
      },
      {
        name: 'Realme GT 6T',
        slug: 'realme-gt-6t',
        brand: 'Realme',
        category: 'smartphones',
        description: 'Realme GT 6T with Snapdragon 7+ Gen 3, 120W fast charging, and a stunning AMOLED display.',
        shortDescription: 'Snapdragon 7+ Gen 3, 120W charging & AMOLED display',
        price: 21999,
        originalPrice: 25999,
        discount: 15,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/realme-c35/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/realme-c35/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/realme-c35/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/realme-c35/thumbnail.webp',
        specifications: {
          display: 'LTPO AMOLED, 120Hz',
          displaySize: '6.78 inches',
          processor: 'Snapdragon 7+ Gen 3',
          ram: '8 GB',
          storage: '128 GB',
          expandableStorage: 'No',
          battery: '5500 mAh',
          chargingSpeed: '120W',
          rearCamera: '50MP + 8MP',
          frontCamera: '32MP',
          os: 'Android 14, Realme UI 5.0',
          network: '5G',
          sim: 'Dual SIM (Nano)',
          weight: '191g',
          dimensions: '162 x 75.1 x 8.65 mm',
          waterResistant: 'IP65',
          fingerprint: 'In-display Optical',
          nfc: true,
        },
        stock: 50,
        tags: ['mid-range', '5g', 'realme', 'fast-charging', 'value'],
        isFeatured: false,
        isTrending: true,
        colors: ['Razor Green', 'Fluid Silver'],
        ratings: 4.2,
        numReviews: 0,
      },
      {
        name: 'Vivo V30 Pro',
        slug: 'vivo-v30-pro',
        brand: 'Vivo',
        category: 'smartphones',
        description: 'Vivo V30 Pro with ZEISS co-engineered cameras, Dimensity 8200, and Aura Light Portrait system.',
        shortDescription: 'ZEISS cameras, Aura Light & premium design',
        price: 33999,
        originalPrice: 39999,
        discount: 15,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/vivo-x21/thumbnail.webp',
        specifications: {
          display: 'AMOLED, 120Hz',
          displaySize: '6.78 inches',
          processor: 'MediaTek Dimensity 8200',
          ram: '8 GB',
          storage: '128 GB',
          expandableStorage: 'No',
          battery: '5000 mAh',
          chargingSpeed: '80W',
          rearCamera: '50MP + 50MP',
          frontCamera: '50MP',
          os: 'Android 14, Funtouch OS 14',
          network: '5G',
          sim: 'Dual SIM (Nano)',
          weight: '187g',
          dimensions: '161.95 x 74.66 x 7.58 mm',
          waterResistant: 'IP54',
          fingerprint: 'In-display Optical',
          nfc: true,
        },
        stock: 35,
        tags: ['mid-range', '5g', 'vivo', 'zeiss', 'camera-phone'],
        isFeatured: true,
        isTrending: false,
        colors: ['Peacock Green', 'Classic Brown'],
        ratings: 4.3,
        numReviews: 0,
      },
      {
        name: 'Samsung Galaxy A55 5G',
        slug: 'samsung-galaxy-a55-5g',
        brand: 'Samsung',
        category: 'smartphones',
        description: 'Samsung Galaxy A55 5G with Super AMOLED display, Exynos 1480, and versatile triple camera.',
        shortDescription: 'Super AMOLED, Exynos 1480 & IP67 water resistance',
        price: 26999,
        originalPrice: 32999,
        discount: 18,
        images: ['https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/1.webp', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/2.webp', 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/3.webp'],
        thumbnail: 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s7/thumbnail.webp',
        specifications: {
          display: 'Super AMOLED, 120Hz',
          displaySize: '6.6 inches',
          processor: 'Samsung Exynos 1480',
          ram: '8 GB',
          storage: '128 GB',
          expandableStorage: 'Up to 1TB',
          battery: '5000 mAh',
          chargingSpeed: '25W',
          rearCamera: '50MP + 12MP + 5MP',
          frontCamera: '13MP',
          os: 'Android 14, One UI 6.1',
          network: '5G',
          sim: 'Dual SIM (Nano)',
          weight: '213g',
          dimensions: '161.7 x 77.4 x 8.2 mm',
          waterResistant: 'IP67',
          fingerprint: 'In-display Optical',
          nfc: true,
        },
        stock: 60,
        tags: ['mid-range', '5g', 'samsung', 'value'],
        isFeatured: false,
        isTrending: false,
        colors: ['Awesome Iceblue', 'Awesome Lilac', 'Awesome Lemon', 'Awesome Navy'],
        ratings: 4.1,
        numReviews: 0,
      },
    ]);
    console.log(`📱 Created ${products.length} products`);

    // ====== Banners ======
    const banners = await Banner.create([
      {
        title: 'Samsung Galaxy S24 Ultra',
        subtitle: 'Unleash epic performance with Galaxy AI',
        image: 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s10/1.webp',
        link: '/product/samsung-galaxy-s24-ultra',
        order: 1,
      },
      {
        title: 'iPhone 15 Pro Max',
        subtitle: 'Titanium. So strong. So light. So Pro.',
        image: 'https://cdn.dummyjson.com/product-images/smartphones/iphone-13-pro/1.webp',
        link: '/product/iphone-15-pro-max',
        order: 2,
      },
      {
        title: 'Mega Sale - Up to 18% Off',
        subtitle: 'Shop the best deals on smartphones',
        image: 'https://cdn.dummyjson.com/product-images/smartphones/samsung-galaxy-s8/1.webp',
        link: '/shop',
        order: 3,
      },
    ]);
    console.log(`🖼️  Created ${banners.length} banners`);

    // ====== Coupons ======
    const coupons = await Coupon.create([
      {
        code: 'WELCOME10',
        discount: 10,
        discountType: 'percentage',
        minOrderAmount: 1000,
        maxDiscount: 2000,
        usageLimit: 1000,
        expiresAt: new Date('2027-12-31'),
      },
      {
        code: 'FLAT500',
        discount: 500,
        discountType: 'fixed',
        minOrderAmount: 5000,
        usageLimit: 500,
        expiresAt: new Date('2027-06-30'),
      },
      {
        code: 'AMOHA20',
        discount: 20,
        discountType: 'percentage',
        minOrderAmount: 10000,
        maxDiscount: 5000,
        usageLimit: 200,
        expiresAt: new Date('2027-03-31'),
      },
    ]);
    console.log(`🎟️  Created ${coupons.length} coupons`);

    // ====== Sample Orders for Demo ======
    const testUser = users[1];
    const adminUser = users[0];

    const sampleOrders = [];
    const statuses = ['delivered', 'shipped', 'processing', 'confirmed', 'placed'] as const;
    const paymentStatuses = ['paid', 'paid', 'paid', 'pending', 'pending'] as const;

    for (let i = 0; i < 15; i++) {
      const daysAgo = Math.floor(Math.random() * 60);
      const orderDate = new Date();
      orderDate.setDate(orderDate.getDate() - daysAgo);

      const productIndex = i % products.length;
      const product = products[productIndex];
      const qty = Math.floor(Math.random() * 2) + 1;
      const statusIndex = i % statuses.length;

      sampleOrders.push({
        orderNumber: `AMH${String(1000 + i).padStart(6, '0')}`,
        user: i % 3 === 0 ? adminUser._id : testUser._id,
        items: [
          {
            product: product._id,
            quantity: qty,
            price: product.price,
            color: product.colors?.[0] || undefined,
          },
        ],
        shippingAddress: {
          fullName: i % 3 === 0 ? 'Admin User' : 'Test User',
          phone: i % 3 === 0 ? '9999999999' : '8888888888',
          addressLine1: i % 3 === 0 ? '123 Admin Street' : '456 User Lane',
          city: i % 3 === 0 ? 'Mumbai' : 'Delhi',
          state: i % 3 === 0 ? 'Maharashtra' : 'Delhi',
          pincode: i % 3 === 0 ? '400001' : '110001',
          type: 'home' as const,
        },
        paymentMethod: i % 2 === 0 ? 'cod' : 'online',
        paymentStatus: paymentStatuses[statusIndex],
        orderStatus: statuses[statusIndex],
        statusHistory: [
          { status: 'placed', date: orderDate, message: 'Order placed successfully' },
          ...(statusIndex <= 3 ? [{ status: 'confirmed', date: new Date(orderDate.getTime() + 3600000), message: 'Order confirmed' }] : []),
          ...(statusIndex <= 2 ? [{ status: 'processing', date: new Date(orderDate.getTime() + 7200000), message: 'Order is being processed' }] : []),
          ...(statusIndex <= 1 ? [{ status: 'shipped', date: new Date(orderDate.getTime() + 86400000), message: 'Order has been shipped' }] : []),
          ...(statusIndex === 0 ? [{ status: 'delivered', date: new Date(orderDate.getTime() + 259200000), message: 'Order delivered successfully' }] : []),
        ],
        subtotal: product.price * qty,
        discount: i % 4 === 0 ? Math.floor(product.price * qty * 0.1) : 0,
        deliveryCharge: product.price * qty >= 500 ? 0 : 49,
        totalAmount: product.price * qty - (i % 4 === 0 ? Math.floor(product.price * qty * 0.1) : 0),
        estimatedDelivery: new Date(orderDate.getTime() + 604800000),
        deliveredAt: statusIndex === 0 ? new Date(orderDate.getTime() + 259200000) : undefined,
        createdAt: orderDate,
        updatedAt: orderDate,
      });
    }

    const orders = await Order.insertMany(sampleOrders);
    console.log(`📦 Created ${orders.length} sample orders`);

    // Update category product counts
    const smartphoneCount = await Product.countDocuments({ category: 'smartphones' });
    await Category.findOneAndUpdate({ slug: 'smartphones' }, { productCount: smartphoneCount });

    console.log('\n✅ Database seeded successfully!');
    console.log('\n📋 Login Credentials:');
    console.log('   Admin: admin@amoha.com / admin123');
    console.log('   User:  user@amoha.com / user123');
    console.log('\n🎟️  Coupon Codes: WELCOME10, FLAT500, AMOHA20\n');

    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
