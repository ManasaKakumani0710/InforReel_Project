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

const storage = multerS3({
  s3,
  bucket: process.env.AWS_BUCKET_NAME,
  contentType: multerS3.AUTO_CONTENT_TYPE,
  key: (req, file, cb) => {
    const sanitizedFileName = file.originalname.replace(/\s+/g, '_');
    const folder = file.fieldname === 'image' ? 'product-images' : 'product-videos';
    const fileName = `${folder}/${uuidv4()}_${sanitizedFileName}`;
    cb(null, fileName);
  }
});

const upload = multer({ storage }).fields([
  { name: 'image', maxCount: 5 },
  { name: 'video', maxCount: 5 },
]);


module.exports = upload;
