const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  username:String,
  userType: {
    type: String,
    enum: ['general', 'influencer', 'vendor'],
    required: true
  },

  // Common Fields
  country: String,
  state: String,
  gender: String,
  dob: Date,
  isVerified: { type: Boolean, default: false },
  isProfileSetup: {
    type: Boolean,
    default: false
  },

  // OTP + Reset
  otp: String,
  otpExpires: Date,
  resetToken: String,
  resetTokenExpires: Date,
  stripeAccountId:String,

  // Optional per userType
  brand: String,
  followers: Number,

  // Flexible Profile
  profile: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },

  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('User', userSchema);