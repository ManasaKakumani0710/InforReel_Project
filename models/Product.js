const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Basic Info
  productName: { type: String, required: true },
  productDescription: { type: String },
  category: { type: String },
  productTags: [{ type: String }],

  // Media
  media: [{ type: mongoose.Schema.Types.ObjectId, ref: 'VendorDocument' }],

  // Inventory
  sku: { type: String },
  barcode: { type: String },
  quantity: { type: Number },
  productStatus: { type: String },

  // Pricing
  basePrice: { type: Number },
  discountType: { type: String },
  discountPercentage: { type: Number },
  taxIncludedPrice: { type: Number },
  taxRule: { type: String },
  unitPrice: { type: Number },
  minOrderQty: { type: Number },

  // Shipping
  shipping: {
    width: { type: String },
    height: { type: String },
    depth: { type: String },
    weight: { type: String }
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
