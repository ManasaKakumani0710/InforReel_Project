const VendorDocument = require('../models/vendorDocument');
const User = require('../models/User');

const uploadVendorDocuments = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (!user || user.userType !== 'vendor') {
      return res.status(403).json({ message: 'Unauthorized or invalid user type' });
    }

    const docs = req.files.map(file => ({
      userId,
      fileName: file.originalname,
      filePath: file.path,
      mimeType: file.mimetype,
      fileType: req.body.fileType || 'Other'
    }));

    await VendorDocument.insertMany(docs);

    res.status(200).json({ message: 'Documents uploaded', documents: docs });
  } catch (err) {
    console.error('Upload Error:', err);
    res.status(500).json({ message: 'Failed to upload' });
  }
};

const getVendorDocuments = async (req, res) => {
  try {
    const { userId } = req.params;
    const documents = await VendorDocument.find({ userId });

    res.status(200).json(documents);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching documents' });
  }
};

module.exports = {
  uploadVendorDocuments,
  getVendorDocuments
};