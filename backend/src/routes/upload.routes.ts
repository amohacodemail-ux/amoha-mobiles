import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { authenticate } from '../middleware/auth.middleware';
import { isAdmin } from '../middleware/role.middleware';
import { sendSuccess } from '../utils/response.util';
import logger from '../utils/logger.util';
import supabase from '../config/supabase';
import crypto from 'crypto';

const router = Router();

const STORAGE_BUCKET = 'images';

// Ensure the public storage bucket exists (called once on first upload)
let bucketReady = false;
async function ensureBucket(): Promise<void> {
  if (bucketReady) return;
  const { data: buckets } = await supabase.storage.listBuckets();
  const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
  if (!exists) {
    const { error } = await supabase.storage.createBucket(STORAGE_BUCKET, {
      public: true,
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
      fileSizeLimit: 5 * 1024 * 1024,
    });
    if (error && !error.message.includes('already exists')) throw error;
  }
  bucketReady = true;
}

// Configure multer for memory storage (no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only image files (JPEG, PNG, WebP, GIF, SVG) are allowed'));
    }
  },
});

// Helper: upload buffer to Cloudinary
function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder: `amoha/${folder}`, resource_type: 'image', quality: 'auto', format: 'auto' },
      (error, result) => {
        if (error) reject(error);
        else resolve(result!.secure_url);
      },
    );
    stream.end(buffer);
  });
}

// Configure Cloudinary from env
const configureCloudinary = () => {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret });
    return true;
  }
  return false;
};

/** Save image to Supabase Storage and return its public URL */
async function saveToStorage(buffer: Buffer, mimeType: string, folder: string): Promise<string> {
  await ensureBucket();
  const ext = mimeType.split('/')[1]?.replace('svg+xml', 'svg') || 'jpg';
  const filename = `${folder}/${Date.now()}-${crypto.randomBytes(8).toString('hex')}.${ext}`;
  const { error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filename, buffer, { contentType: mimeType, upsert: false });
  if (error) throw error;
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filename);
  return data.publicUrl;
}

// GET /api/upload/test-storage — diagnostic endpoint (admin only)
router.get('/test-storage', authenticate, isAdmin, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    if (listError) {
      res.status(500).json({ success: false, message: `List buckets failed: ${listError.message}`, hint: listError });
      return;
    }
    const exists = buckets?.some((b) => b.name === STORAGE_BUCKET);
    if (!exists) {
      const { error: createError } = await supabase.storage.createBucket(STORAGE_BUCKET, {
        public: true,
        fileSizeLimit: 5 * 1024 * 1024,
      });
      if (createError && !createError.message.includes('already exists')) {
        res.status(500).json({ success: false, message: `Create bucket failed: ${createError.message}`, hint: createError });
        return;
      }
    }
    bucketReady = true;
    res.json({ success: true, message: 'Supabase Storage OK', buckets: buckets?.map((b) => b.name), bucketExists: exists });
  } catch (error: any) {
    next(error);
  }
});

// GET /api/upload/:id — legacy route
router.get('/:id', async (_req: Request, res: Response) => {
  res.status(404).json({ success: false, message: 'Image not found' });
});

// POST /api/upload — single image upload
router.post('/', authenticate, isAdmin, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    const folder = (req.body.folder as string) || 'general';

    if (configureCloudinary()) {
      const url = await uploadToCloudinary(req.file.buffer, folder);
      sendSuccess(res, { url }, 'Image uploaded');
      return;
    }

    logger.warn('Cloudinary not configured — storing image in Supabase Storage');
    const url = await saveToStorage(req.file.buffer, req.file.mimetype, folder);
    sendSuccess(res, { url }, 'Image uploaded');
  } catch (error: any) {
    logger.error('Upload error:', error?.message || error);
    res.status(500).json({ success: false, message: error?.message || 'Upload failed', code: error?.code });
  }
});

// POST /api/upload/multiple — multiple image upload
router.post('/multiple', authenticate, isAdmin, upload.array('images', 10), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ success: false, message: 'No image files provided' });
      return;
    }

    const folder = (req.body.folder as string) || 'general';
    const urls: string[] = [];

    if (configureCloudinary()) {
      for (const file of files) {
        const url = await uploadToCloudinary(file.buffer, folder);
        urls.push(url);
      }
    } else {
      logger.warn('Cloudinary not configured — storing images in Supabase Storage');
      for (const file of files) {
        const url = await saveToStorage(file.buffer, file.mimetype, folder);
        urls.push(url);
      }
    }

    sendSuccess(res, { urls }, `${urls.length} images uploaded`);
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/avatar — Profile photo upload (authenticated users)
router.post('/avatar', authenticate, upload.single('image'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No image file provided' });
      return;
    }

    if (configureCloudinary()) {
      const url = await uploadToCloudinary(req.file.buffer, 'avatars');
      sendSuccess(res, { url }, 'Avatar uploaded');
      return;
    }

    const url = await saveToStorage(req.file.buffer, req.file.mimetype, 'avatars');
    sendSuccess(res, { url }, 'Avatar uploaded');
  } catch (error) {
    next(error);
  }
});

// POST /api/upload/kyc — KYC document upload (authenticated users)
router.post('/kyc', authenticate, upload.single('document'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No document file provided' });
      return;
    }

    if (configureCloudinary()) {
      const url = await uploadToCloudinary(req.file.buffer, 'kyc');
      sendSuccess(res, { url }, 'Document uploaded');
      return;
    }

    const url = await saveToStorage(req.file.buffer, req.file.mimetype, 'kyc');
    sendSuccess(res, { url }, 'Document uploaded');
  } catch (error) {
    next(error);
  }
});

export default router;
