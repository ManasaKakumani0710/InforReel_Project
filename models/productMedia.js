const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  fileUrl: { type: String, required: true },
  type: { type: String, enum: ['image', 'video'], required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  uploadedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);
