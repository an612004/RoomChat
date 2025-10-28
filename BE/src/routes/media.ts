import { Router } from 'express';
import cloudinary from '../config/cloudinary';

const router = Router();

// Xóa ảnh/video trên Cloudinary
router.delete('/delete', async (req, res) => {
  const { public_id, resource_type } = req.body;
  if (!public_id) return res.status(400).json({ success: false, message: 'Thiếu public_id' });
  try {
    await cloudinary.uploader.destroy(public_id, { resource_type: resource_type || 'image' });
    return res.json({ success: true });
  } catch (err:any) {
    return res.status(500).json({ success: false, message: err?.message || 'Xóa thất bại', error: err });
  }
});

export default router;