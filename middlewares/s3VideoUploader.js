// middleware/s3VideoUploader.js
const multer = require('multer');
const multerS3 = require('multer-s3');
const s3 = require('../config/s3config');
const { v4: uuidv4 } = require('uuid');


const uploadVideo = multer({
  storage: multerS3({
    s3,
    bucket: process.env.AWS_BUCKET_NAME,
    acl: 'public-read',
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const filename = `${uuidv4()}_${file.originalname}`;
      cb(null, `posts/${filename}`);
    }
  }),
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit
});

module.exports = uploadVideo;
