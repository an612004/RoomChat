import { Router } from 'express';
import cloudinary from '../config/cloudinary';

const router = Router();

// Simple health check for Cloudinary admin API (reads a small resource list)
router.get('/cloudinary', async (req, res) => {
  try {
    const cloud_name = process.env.CLOUDINARY_CLOUD_NAME || null;
    if (!cloud_name) return res.status(500).json({ ok: false, message: 'CLOUDINARY_CLOUD_NAME not configured' });
    // safe read: fetch up to 1 resource
    const account = await cloudinary.api.resources({ max_results: 1 }).catch((e: any) => { throw e; });
    return res.json({ ok: true, cloud_name, sampleCount: account.resources ? account.resources.length : 0 });
  } catch (err: any) {
    return res.status(502).json({ ok: false, message: err && err.message ? err.message : 'Cloudinary check failed', error: err });
  }
});

export default router;
