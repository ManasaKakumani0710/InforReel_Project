const AWS = require('aws-sdk');
const path = require('path');

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION,
});

const downloadFromS3 = async (req, res) => {
  const { key } = req.query;

  if (!key) {
    return res.status(400).json({
      code: 400,
      message: 'File key is required',
      data: null,
    });
  }

  const params = {
    Bucket: process.env.BUCKET_NAME,
    Key: key,
  };

  try {
    const s3Stream = s3.getObject(params).createReadStream();

    const fileName = path.basename(key);
    res.status(200); 
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');

    s3Stream.on('error', (err) => {
      console.error('S3 stream error:', err);
      return res.status(500).json({
        code: 500,
        message: 'Failed to download file',
        data: null,
      });
    });

    s3Stream.pipe(res);

  } catch (error) {
    console.error('Download error:', error);
    return res.status(500).json({
      code: 500,
      message: 'Error downloading file',
      data: null,
    });
  }
};

module.exports = { downloadFromS3 };
