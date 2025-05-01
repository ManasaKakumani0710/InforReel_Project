const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  userType: String,
  password: String,
  country: String,
  state: String,
  gender: String,
  dob: Date,
  brand: String,
  followers: Number,
  otp: String,
  otpExpires: Date,
  isVerified: { type: Boolean, default: false },
  resetOtp: String,
 resetOtpExpires: Date,
});

module.exports = mongoose.model('users', userSchema);
