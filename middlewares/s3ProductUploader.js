const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3config');
const { v4: uuidv4 } = require('uuid');

console.log("Bucket name:", process.env.AWS_BUCKET_NAME);
const uploadProductMedia = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const ext = file.originalname.split('.').pop();
      const filename = `products/ ${uuidv4()}_${file.originalname}`;
      cb(null, filename);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

module.exports = uploadProductMedia;
