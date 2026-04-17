/**
 * One-time script to replace ALL broken Unsplash image URLs in the database
 * (Categories, Products, Banners) with reliable picsum.photos URLs.
 *
 * Uses slug-based replacement — works regardless of the exact Unsplash URL/params stored.
 *
 * Run from the backend directory:
 *   npx --yes ts-node src/seeds/fix-images.ts
 */
import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import env from '../config/env';
import Category from '../models/category.model';
import Product from '../models/product.model';
import Banner from '../models/banner.model';

const UNSPLASH_RE = /https?:\/\/images\.unsplash\.com\//;

/** Derive a deterministic picsum URL from a slug/seed and WxH. */
function picsum(seed: string, w: number, h: number): string {
  return `https://picsum.photos/seed/${seed}/${w}/${h}`;
}

async function fixImages() {
  await mongoose.connect(env.MONGODB_URI);
  console.log('✅ Connected to MongoDB');
  let total = 0;

  // ── 1. Categories ──────────────────────────────────────────────────────────
  console.log('\n── Categories ──');
  const cats = await Category.find({ image: { $regex: 'images\\.unsplash\\.com' } });
  console.log(`  found ${cats.length} with Unsplash URLs`);
  for (const cat of cats) {
    cat.image = picsum(cat.slug, 400, 400);
    await cat.save();
    console.log(`  ✓ ${cat.slug} → ${cat.image}`);
    total++;
  }

  // ── 2. Products – thumbnail ────────────────────────────────────────────────
  console.log('\n── Product thumbnails ──');
  const thumbProds = await Product.find({ thumbnail: { $regex: 'images\\.unsplash\\.com' } });
  console.log(`  found ${thumbProds.length} with Unsplash thumbnails`);
  for (const prod of thumbProds) {
    prod.thumbnail = picsum(prod.slug, 300, 300);
    await prod.save();
    console.log(`  ✓ ${prod.slug} thumbnail → ${prod.thumbnail}`);
    total++;
  }

  // ── 3. Products – images array ─────────────────────────────────────────────
  console.log('\n── Product image arrays ──');
  const imgProds = await Product.find({ images: { $regex: 'images\\.unsplash\\.com' } });
  console.log(`  found ${imgProds.length} with Unsplash image arrays`);
  for (const prod of imgProds) {
    const imgs = prod.images as string[];
    prod.images = imgs.map((url, i) =>
      UNSPLASH_RE.test(url) ? picsum(`${prod.slug}-${i}`, 600, 600) : url
    );
    await prod.save();
    console.log(`  ✓ ${prod.slug} images[${imgs.length}] updated`);
    total++;
  }

  // ── 4. Banners ─────────────────────────────────────────────────────────────
  console.log('\n── Banners ──');
  const banners = await Banner.find({ image: { $regex: 'images\\.unsplash\\.com' } });
  console.log(`  found ${banners.length} with Unsplash URLs`);
  for (const banner of banners) {
    const seed = (banner as any).link
      ? `banner-${(banner as any).link.split('/').pop()}`
      : `banner-${(banner as any).order ?? 'default'}`;
    banner.image = picsum(seed, 1200, 400);
    await banner.save();
    console.log(`  ✓ banner[${(banner as any).order}] → ${banner.image}`);
    total++;
  }

  console.log(total
    ? `\n✅ Done — ${total} document(s) updated.`
    : '\nℹ️  Nothing to update (already fixed or DB not seeded).'
  );

  await mongoose.disconnect();
}

fixImages().catch((err) => {
  console.error('❌ Error:', err);
  process.exit(1);
});
