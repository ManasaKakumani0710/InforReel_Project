
const AWS = require('aws-sdk');
const VendorDocument = require('../models/vendorDocument');


const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const downloadFile = async (req, res) => {
  try {
    const { id } = req.params;

    const doc = await VendorDocument.findById(id);
    if (!doc) {
      return res.status(404).json({
        code: 404,
        message: "File not found",
        data: null
      });
    }

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: doc.s3Key
    };

    res.attachment(doc.fileName);
    const stream = s3.getObject(params).createReadStream();
    stream.pipe(res);
  } catch (error) {
    console.error("Download Error:", error);
    res.status(500).json({
      code: 500,
      message: "Failed to download file",
      error: error.message,
      data: null
    });
  }
};

module.exports = { downloadFile };
