import { v2 as cloudinary } from 'cloudinary';

const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;

if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
  // don't throw here — allow app to start; upload endpoints will fail with clear error
  console.warn('Cloudinary not fully configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}

cloudinary.config({
  cloud_name: CLOUDINARY_CLOUD_NAME || '',
  api_key: CLOUDINARY_API_KEY || '',
  api_secret: CLOUDINARY_API_SECRET || '',
  secure: true,
});

export default cloudinary;
