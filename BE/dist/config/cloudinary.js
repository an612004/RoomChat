"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const cloudinary_1 = require("cloudinary");
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env;
if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_API_KEY || !CLOUDINARY_API_SECRET) {
    // don't throw here — allow app to start; upload endpoints will fail with clear error
    console.warn('Cloudinary not fully configured. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET');
}
cloudinary_1.v2.config({
    cloud_name: CLOUDINARY_CLOUD_NAME || '',
    api_key: CLOUDINARY_API_KEY || '',
    api_secret: CLOUDINARY_API_SECRET || '',
    secure: true,
});
exports.default = cloudinary_1.v2;
