import express, { Request, Response, Router } from 'express';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router: Router = express.Router();

// Tạo thư mục uploads nếu chưa có
const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, destination: string) => void) {
    cb(null, uploadDir);
  },
  filename: function (req: Request, file: Express.Multer.File, cb: (error: Error | null, filename: string) => void) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

const upload = multer({ storage });

// API upload nhiều ảnh

// Middleware nhận cả images và videos
const multiUpload = upload.fields([
  { name: 'images', maxCount: 10 },
  { name: 'videos', maxCount: 5 }
]);

router.post('/', multiUpload, (req: Request, res: Response) => {
  const files = req.files as {
    [fieldname: string]: Express.Multer.File[];
  };
  const imageFiles = files?.images || [];
  const videoFiles = files?.videos || [];
  const imageUrls = imageFiles.map(f => '/uploads/' + f.filename);
  const videoUrls = videoFiles.map(f => '/uploads/' + f.filename);
  if (imageUrls.length === 0 && videoUrls.length === 0) {
    return res.status(400).json({ success: false, message: 'No files uploaded' });
  }
  return res.json({ success: true, imageUrls, videoUrls });
});

export default router;
