// middleware/s3Uploader.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3config');
const { v4: uuidv4 } = require('uuid');

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    key: (req, file, cb) => {
      const filename = `${uuidv4()}_${file.originalname}`;
      cb(null, `vendor-docs/${filename}`);
    }
  }),
  limits: { fileSize: 50 * 1024 * 1024 }
});

module.exports = upload;
