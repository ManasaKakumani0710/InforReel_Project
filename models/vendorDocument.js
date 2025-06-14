const mongoose = require('mongoose');

const vendorDocumentSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fileName: String,
  filePath: String,  
  s3Key: String,   
  mimeType: String,
  fileType: String,
  fileCategory: String,
  productId:{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('VendorDocument', vendorDocumentSchema);
