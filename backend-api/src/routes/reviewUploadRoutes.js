import express from 'express';
import multer from 'multer';
import supabase from '../config/supabase.js';

const router = express.Router();
const IMAGE_CACHE_BUST_VERSION = '2';

const appendImageVersion = (publicUrl) => {
  if (!publicUrl) return publicUrl;

  const url = new URL(publicUrl);
  url.searchParams.set('v', IMAGE_CACHE_BUST_VERSION);
  return url.toString();
};

// Multer config for temporary memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1 * 1024 * 1024, // 1MB per file
    files: 5 // Max 5 files
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'image/jpeg' || file.mimetype === 'image/png' || file.mimetype === 'image/webp') {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only JPEG, PNG and WebP are allowed.'), false);
    }
  }
});

router.post('/upload', upload.array('images', 5), async (req, res) => {
  try {
    const files = req.files;
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No images uploaded' });
    }

    const uploadPromises = files.map(async (file) => {
      const fileName = `review-${Date.now()}-${Math.floor(Math.random() * 1000)}.${file.originalname.split('.').pop()}`;
      
      const { data, error } = await supabase.storage
        .from('reviews')
        .upload(fileName, file.buffer, {
          contentType: file.mimetype,
          cacheControl: '31536000, immutable',
          upsert: false
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('reviews')
        .getPublicUrl(fileName);

      return appendImageVersion(publicUrl);
    });

    const imageUrls = await Promise.all(uploadPromises);
    res.json({ urls: imageUrls });

  } catch (error) {
    console.error('Review image upload error:', error);
    res.status(500).json({ error: 'Failed to upload images', details: error.message });
  }
});

export default router;
