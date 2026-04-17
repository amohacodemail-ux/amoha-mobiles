/**
 * One-time script to update all product/category/banner images
 * from picsum.photos to proper phone images (cdn.dummyjson.com)
 *
 * Usage: npx tsx src/seeds/update-images.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import env from '../config/env';
import Product from '../models/product.model';
import Category from '../models/category.model';
import Banner from '../models/banner.model';

const CDN = 'https://cdn.dummyjson.com/product-images';

// ─── Product image mapping (slug → CDN images) ───
const productImages: Record<string, { images: string[]; thumbnail: string }> = {
  'samsung-galaxy-s24-ultra': {
    images: [
      `${CDN}/smartphones/samsung-galaxy-s10/1.webp`,
      `${CDN}/smartphones/samsung-galaxy-s10/2.webp`,
      `${CDN}/smartphones/samsung-galaxy-s10/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/samsung-galaxy-s10/thumbnail.webp`,
  },
  'iphone-15-pro-max': {
    images: [
      `${CDN}/smartphones/iphone-13-pro/1.webp`,
      `${CDN}/smartphones/iphone-13-pro/2.webp`,
      `${CDN}/smartphones/iphone-13-pro/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/iphone-13-pro/thumbnail.webp`,
  },
  'oneplus-12': {
    images: [
      `${CDN}/smartphones/oppo-f19-pro-plus/1.webp`,
      `${CDN}/smartphones/oppo-f19-pro-plus/2.webp`,
      `${CDN}/smartphones/oppo-f19-pro-plus/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/oppo-f19-pro-plus/thumbnail.webp`,
  },
  'xiaomi-14': {
    images: [
      `${CDN}/smartphones/realme-xt/1.webp`,
      `${CDN}/smartphones/realme-xt/2.webp`,
      `${CDN}/smartphones/realme-xt/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/realme-xt/thumbnail.webp`,
  },
  'nothing-phone-2a': {
    images: [
      `${CDN}/smartphones/oppo-a57/1.webp`,
      `${CDN}/smartphones/oppo-a57/2.webp`,
      `${CDN}/smartphones/oppo-a57/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/oppo-a57/thumbnail.webp`,
  },
  'realme-gt-6t': {
    images: [
      `${CDN}/smartphones/realme-c35/1.webp`,
      `${CDN}/smartphones/realme-c35/2.webp`,
      `${CDN}/smartphones/realme-c35/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/realme-c35/thumbnail.webp`,
  },
  'vivo-v30-pro': {
    images: [
      `${CDN}/smartphones/vivo-x21/1.webp`,
      `${CDN}/smartphones/vivo-x21/2.webp`,
      `${CDN}/smartphones/vivo-x21/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/vivo-x21/thumbnail.webp`,
  },
  'samsung-galaxy-a55-5g': {
    images: [
      `${CDN}/smartphones/samsung-galaxy-s7/1.webp`,
      `${CDN}/smartphones/samsung-galaxy-s7/2.webp`,
      `${CDN}/smartphones/samsung-galaxy-s7/3.webp`,
    ],
    thumbnail: `${CDN}/smartphones/samsung-galaxy-s7/thumbnail.webp`,
  },
};

// ─── Category image mapping (slug → CDN image) ───
const categoryImages: Record<string, string> = {
  'smartphones': `${CDN}/smartphones/samsung-galaxy-s8/thumbnail.webp`,
  'feature-phones': `${CDN}/smartphones/oppo-k1/thumbnail.webp`,
  'refurbished-phones': `${CDN}/smartphones/iphone-x/thumbnail.webp`,
  'keypad-phones': `${CDN}/smartphones/iphone-5s/thumbnail.webp`,
  'chargers': `${CDN}/mobile-accessories/apple-iphone-charger/thumbnail.webp`,
  'charging-cables': `${CDN}/mobile-accessories/apple-iphone-charger/1.webp`,
  'headphones': `${CDN}/mobile-accessories/apple-airpods-max-silver/1.webp`,
  'bluetooth-headsets': `${CDN}/mobile-accessories/apple-airpods/thumbnail.webp`,
  'bluetooth-speakers': `${CDN}/mobile-accessories/amazon-echo-plus/thumbnail.webp`,
  'batteries': `${CDN}/mobile-accessories/apple-magsafe-battery-pack/thumbnail.webp`,
  'tempered-glass': `${CDN}/mobile-accessories/iphone-12-silicone-case-with-magsafe-plum/thumbnail.webp`,
  'mouse': `https://placehold.co/400x400/f8f9fa/4f46e5?text=Mouse&font=raleway`,
  'sim-cards': `https://placehold.co/400x400/f8f9fa/4f46e5?text=SIM+Cards&font=raleway`,
  'accessories': `${CDN}/mobile-accessories/selfie-stick-monopod/1.webp`,
  'tablets': `${CDN}/tablets/ipad-mini-2021-starlight/thumbnail.webp`,
};

// ─── Banner image mapping ───
const bannerImages: Record<string, string> = {
  'Samsung Galaxy S24 Ultra': `${CDN}/smartphones/samsung-galaxy-s10/1.webp`,
  'iPhone 15 Pro Max': `${CDN}/smartphones/iphone-13-pro/1.webp`,
  'Mega Sale - Up to 18% Off': `${CDN}/smartphones/samsung-galaxy-s8/1.webp`,
};

async function updateImages() {
  try {
    await mongoose.connect(env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Update Products
    let productCount = 0;
    for (const [slug, imgs] of Object.entries(productImages)) {
      const result = await Product.updateOne(
        { slug },
        { $set: { images: imgs.images, thumbnail: imgs.thumbnail } },
      );
      if (result.modifiedCount > 0) {
        productCount++;
        console.log(`  📱 Updated: ${slug}`);
      }
    }
    console.log(`\n📱 Updated ${productCount} product images`);

    // Update Categories
    let catCount = 0;
    for (const [slug, image] of Object.entries(categoryImages)) {
      const result = await Category.updateOne(
        { slug },
        { $set: { image } },
      );
      if (result.modifiedCount > 0) {
        catCount++;
        console.log(`  📂 Updated: ${slug}`);
      }
    }
    console.log(`📂 Updated ${catCount} category images`);

    // Update Banners
    let bannerCount = 0;
    for (const [title, image] of Object.entries(bannerImages)) {
      const result = await Banner.updateOne(
        { title },
        { $set: { image } },
      );
      if (result.modifiedCount > 0) {
        bannerCount++;
        console.log(`  🖼️  Updated banner: ${title}`);
      }
    }
    console.log(`🖼️  Updated ${bannerCount} banner images`);

    console.log('\n✅ All images updated successfully!');
  } catch (error) {
    console.error('❌ Error updating images:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateImages();
