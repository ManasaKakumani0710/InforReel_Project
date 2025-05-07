const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: String,
  filePath: String,
  mimeType: String,
  fileType: String, 
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);