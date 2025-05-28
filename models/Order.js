const mongoose = require("mongoose");

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "User"
  },
  items: [
    {
      productId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: "Product"
  },
      quantity: Number,
      details: Object
    }
  ],
  shippingAddress: {
    fullName: String,
    email: String,
    address1: String,
    address2:String,
    city: String,
    state: String,
    zip: String,
    country: String
  },
  shippingRate: {
    object_id: String,
    provider: String,
    servicelevel: Object,
    amount: String,
    currency: String
  },
  paymentInfo: {
    paymentIntentId: String,
    status: String,
    method: String
  },
  trackingId: String,
  orderId: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model("Order", orderSchema);
