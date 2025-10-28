import fs from 'fs';
import path from 'path';
import cloudinary from '../config/cloudinary';

const uploadsDir = path.join(__dirname, '../../uploads');

export async function deleteFiles(urls: (string | undefined | null)[]) {
  if (!Array.isArray(urls)) return;
  const uniq = Array.from(new Set(urls.filter(Boolean).map(u => {
    try {
      // handle '/uploads/filename' or full URLs
      const p = new URL(u as string, 'http://localhost');
      return path.basename(p.pathname);
    } catch (e) {
      return path.basename(u as string);
    }
  })));

  await Promise.all(uniq.map(async (file) => {
    // Cloudinary stores public_id based on folder + filename (without extension)
    // Try to parse public_id from a typical secure_url
    let attemptedCloudinary = false;
    try {
      // attempt to find public_id by stripping the base URL and extension
      // e.g. https://res.cloudinary.com/<cloud>/image/upload/v123456/uploads/abcdef.jpg
      // we search for '/uploads/<public_id>...'
      // Look through the original urls (we only have basename), so try common patterns
      // Here we attempt deletion by listing resources with the filename as prefix
      const nameWithoutExt = file.replace(/\.[^.]+$/, '');
      // Delete by public_id: 'uploads/<nameWithoutExt>'
      const publicId = `uploads/${nameWithoutExt}`;
      attemptedCloudinary = true;
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' }).catch(() => { /* ignore */ });
      await cloudinary.uploader.destroy(publicId, { resource_type: 'video' }).catch(() => { /* ignore */ });
      // Note: cloudinary destroy is idempotent; if not found will not throw
      return;
    } catch (err) {
      if (attemptedCloudinary) console.warn('Cloudinary deletion failed for', file, err);
    }

    // Fallback to local filesystem delete only if explicitly allowed by env
    if (process.env.ALLOW_LOCAL_UPLOADS === 'true') {
      const full = path.join(uploadsDir, file);
      try {
        if (fs.existsSync(full)) {
          await fs.promises.unlink(full);
        }
      } catch (err) {
        // log and continue
        console.warn('Failed to delete file', full, err);
      }
    } else {
      // Not allowed to touch local uploads in this environment
      console.log('Skipping local delete for', file, '(ALLOW_LOCAL_UPLOADS not true)');
    }
  }));
}

export default { deleteFiles };
