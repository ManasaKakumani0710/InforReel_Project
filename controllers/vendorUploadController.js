const VendorDocument = require('../models/vendorDocument');
const User = require('../models/User');

const uploadVendorDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.userType !== 'vendor') {
      return res.status(403).json({
        code: 403,
        message: 'Unauthorized or invalid user type',
        error: 'Only vendors are allowed to upload documents',
        data: null
      });
    }

    const docs = req.files.map(file => ({
      userId,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileType: req.body.fileType || 'Other'
    }));

    await VendorDocument.insertMany(docs);

    return res.status(200).json({
      code: 200,
      message: 'Documents uploaded successfully',
      error: null,
      data: docs
    });

  } catch (err) {
    console.error('Upload Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to upload documents',
      error: err.message,
      data: null
    });
  }
};

const getVendorDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await VendorDocument.find({ userId });

    return res.status(200).json({
      code: 200,
      message: 'Vendor documents fetched successfully',
      error: null,
      data: documents
    });
  } catch (err) {
    console.error('Fetch Vendor Documents Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to fetch vendor documents',
      error: err.message,
      data: null
    });
  }
};

module.exports = {
  uploadVendorDocuments,
  getVendorDocuments
};