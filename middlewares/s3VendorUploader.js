const multer = require('multer');
const multerS3 = require('multer-s3');
const { S3Client } = require('@aws-sdk/client-s3');
const { v4: uuidv4 } = require('uuid');

// Setup AWS SDK v3 S3 client
const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

// Validate bucket
if (!process.env.AWS_BUCKET_NAME) {
  throw new Error('AWS_BUCKET_NAME is not set in environment variables');
}

// File name formatter
const sanitizeFileName = (name) => name.replace(/\s+/g, '_').replace(/[^a-zA-Z0-9_.-]/g, '');

// Multer uploader
const uploadVendorMedia = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const folder = file.fieldname === 'image' ? 'vendor-images' : 'vendor-docs';
      const safeName = sanitizeFileName(file.originalname);
      const filename = `${uuidv4()}_${safeName}`;
      cb(null, `${folder}/${filename}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
});

// Export fields handler for multiple fields
module.exports = uploadVendorMedia.fields([
  { name: 'doc', maxCount: 5 },
  { name: 'image', maxCount: 5 }
]);
