import express, { Router } from 'express';

import multer from 'multer';
import cloudinary from '../config/cloudinary';
import path from 'path';
import fs from 'fs';
import os from 'os';

const router: Router = express.Router();

// Use disk temporary storage to avoid buffering large videos in memory
const tmpDir = os.tmpdir();
const diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tmpDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, uniqueSuffix + '-' + safe);
  }
});

// basic file type check
function fileFilter(req: express.Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime'];
  if (!allowed.includes(file.mimetype)) return cb(new Error('Invalid file type'));
  cb(null, true);
}

const upload = multer({ storage: diskStorage, fileFilter, limits: { fileSize: 400 * 1024 * 1024 } }); // 400MB per file

// API upload nhiều ảnh

// Middleware nhận cả images và videos
const multiUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]);

// Simple in-memory rate limiter per IP (window 1 minute, max 12 uploads)
const rateMap = new Map<string, { count: number; reset: number }>();
function rateLimitMiddleware(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const ip = (req.ip || (req.headers['x-forwarded-for'] as string) || (req.socket && req.socket.remoteAddress) || 'unknown').toString();
    const now = Date.now();
    const entry = rateMap.get(ip) || { count: 0, reset: now + 60_000 };
    if (now > entry.reset) {
      entry.count = 0;
      entry.reset = now + 60_000;
    }
    entry.count += 1;
    rateMap.set(ip, entry);
    if (entry.count > 12) {
      res.status(429).json({ success: false, message: 'Too many upload requests, try later' });
      return;
    }
  } catch (e) {
    // swallow
  }
  next();
}

router.post('/', rateLimitMiddleware, (req: express.Request, res: express.Response) => {
  // Call multer manually so we can capture multer errors and return JSON
  multiUpload(req as any, res as any, async (err: any) => {
    if (err) {
      // Multer error or other middleware error
      console.error('Upload middleware error', err);
      const msg = err && (err.message || err.toString()) || 'Upload middleware error';
      return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ success: false, message: msg });
    }

    try {
      if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
        return res.status(500).json({ success: false, message: 'Cloudinary not configured on server' });
      }

      const files = (req as any).files as { [fieldname: string]: Express.Multer.File[] } || {};
      const imageFiles = files.images || [];
      const videoFiles = files.videos || [];

      console.log(`Received upload request: images=${imageFiles.length}, videos=${videoFiles.length}`);
      [...imageFiles, ...videoFiles].forEach(f => console.log(' -', f.originalname, f.mimetype, f.size));

      if (imageFiles.length === 0 && videoFiles.length === 0) {
        return res.status(400).json({ success: false, message: 'No files provided' });
      }

      const uploadOne = async (f: Express.Multer.File) => {
        const localPath = (f as any).path as string;
        try {
          const resp = await cloudinary.uploader.upload(localPath, {
            folder: 'uploads',
            resource_type: f.mimetype.startsWith('video') ? 'video' : 'image',
            use_filename: true,
            unique_filename: true,
            overwrite: false,
          });
          console.log('Cloudinary upload success:', resp.public_id);
          return resp;
        } catch (e) {
          // Log fuller diagnostics (but avoid printing secrets). This helps track cases like
          // Cloudinary returning "cloud_name is disabled" (401) while still preserving safety.
          console.error('Cloudinary upload failed for', f.originalname, { cloud_name: process.env.CLOUDINARY_CLOUD_NAME || null, error: e });
          // Fallback: if Cloudinary account is disabled or returns auth errors, save file locally and return a local metadata object
          try {
            // Save into the BE/uploads directory (same directory served by express static when ALLOW_LOCAL_UPLOADS=true)
            const uploadsDir = path.join(__dirname, '../../uploads');
            await fs.promises.mkdir(uploadsDir, { recursive: true });
            const destName = Date.now() + '-' + (f.originalname.replace(/\s+/g, '_'));
            const destPath = path.join(uploadsDir, destName);
            // Move the tmp file to uploads dir
            await fs.promises.rename(localPath, destPath);
            const localUrl = `${req.protocol}://${req.get('host')}/uploads/${destName}`;
            console.warn('Saved file locally as fallback (BE/uploads):', destPath);
            return { secure_url: localUrl, public_id: null, resource_type: f.mimetype.startsWith('video') ? 'video' : 'image' };
          } catch (localErr) {
            // If local fallback also fails, ensure tmp file is removed and rethrow original error
            try { await fs.promises.unlink(localPath); } catch (ignore) {}
            throw e;
          }
        } finally {
          // Note: If we moved the file to uploads via rename above, localPath no longer exists and unlink will fail; ignore errors
          try { await fs.promises.unlink(localPath); } catch (ignored) {}
        }
      };

      const imageResults = await Promise.all(imageFiles.map(uploadOne));
      const videoResults = await Promise.all(videoFiles.map(uploadOne));

      const imageMeta = imageResults.map((r: any) => ({ url: r.secure_url, public_id: r.public_id, resource_type: r.resource_type }));
      const videoMeta = videoResults.map((r: any) => ({ url: r.secure_url, public_id: r.public_id, resource_type: r.resource_type }));

      const imageUrls = imageMeta.map((m: any) => m.url);
      const videoUrls = videoMeta.map((m: any) => m.url);

      return res.json({ success: true, imageUrls, videoUrls, imageMeta, videoMeta });
    } catch (err2: any) {
      console.error('Upload handler error', err2);
      const msg = err2 && (err2.message || err2.toString()) ? (err2.message || err2.toString()) : 'Upload failed';
      return res.status(500).json({ success: false, message: msg });
    }
  });
});

export default router;
