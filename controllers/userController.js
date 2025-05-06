const bcrypt = require('bcryptjs');
const User = require('../models/users');
const vendorDocument = require("../models/vendorDocument")
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const Stripe = require('stripe');
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);



const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === '465', 
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});


const registerUser = async (req, res) => {
  try {
    const {
      name, username, email, password, userType,
      country, state, gender, dob,
      brand, followers, profile
    } = req.body;

    const existing = await User.findOne({ email  }|| {username});
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Email or UserName already exists',
        data: null
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      username,
      email,
      password: hashedPassword,
      userType,
      country,
      state,
      gender,
      dob,
      brand,
      followers,
      profile,
      isVerified: false,
      isProfileSetUp:false,
    });

    // Generate OTP for email verification
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 60 * 1000;

    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Email Verification',
        text: `Your OTP is ${otp}. It will expire in 60 seconds.`
      });
    } catch (emailError) {
      return res.status(500).json({
        code: 500,
        message: 'Failed to send OTP',
        error: 'Email service error',
        data: null
      });
    }

    await user.save();

    
  const userObject = user.toObject();
  delete userObject.password;
  delete userObject.otp;
  delete userObject.otpExpires;

    return res.status(201).json({
      code: 201,
      message: 'OTP sent to your email for verification',
      error: null,
      data: userObject
    });

  } catch (err) {
    console.error('Registration Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to register user',
      error: err.message,
      data: null
    });
  }
};




const loginUser = async (req, res) => {
  try {
    const { email, username, password } = req.body;

    // Must provide either email or username
    if (!email && !username) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Email or username is required',
        data: null
      });
    }

    const user = await User.findOne(email ? { email } : { username });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Invalid email/username or password',
        data: null
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Invalid email/username or password',
        data: null
      });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    // Clean up user object
    const userObject = user.toObject();
    delete userObject.password;
    userObject.token = token;

    return res.status(200).json({
      code: 200,
      message: 'Login successful',
      error: null,
      data: userObject
    });

  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Login failed',
      error: err.message,
      data: null
    });
  }
};



const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'User not found',
        data: null
      });
    }

    if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'OTP expired or not valid',
        data: null
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Invalid OTP',
        data: null
      });
    }

    // Mark as verified & clear OTP fields
    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    // Generate JWT Token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET, // store in .env as JWT_SECRET
      { expiresIn: '1h' }
    );

    // Prepare user response object
    const userObject = user.toObject();
    delete userObject.password;
    userObject.token = token;

    return res.status(200).json({
      code: 200,
      message: 'Email verified successfully',
      error: null,
      data: userObject
    });
  } catch (err) {
    console.error('OTP Verification Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'OTP verification failed',
      error: err.message,
      data: null
    });
  }
};


const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'Failed',
        error: 'User not found',
        result: null
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpiry;
    await user.save();

    const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click on the following link to reset your password: ${resetPasswordUrl}. This link will expire in 1 hour.`
    });

    return res.status(200).json({
      code: 200,
      message: 'Password reset link sent to your email',
      error: null,
      result: null
    });

  } catch (err) {
    console.error('Password Reset Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to send reset link',
      error: err.message,
      result: null
    });
  }
};


const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Invalid or expired token',
        result: null
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      code: 200,
      message: 'Password reset successfully',
      error: null,
      result: null
    });

  } catch (err) {
    console.error('Reset Password Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to reset password',
      error: err.message,
      result: null
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'Failed',
        error: 'User not found',
        result: null
      });
    }

    if (!req.body || !req.body.profile) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Missing profile data',
        result: null
      });
    }

    let profileData;
    try {
      profileData = JSON.parse(req.body.profile);
    } catch (error) {
      console.error("Invalid profile JSON:", error);
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'Invalid JSON in profile field',
        result: null
      });
    }

    // Update profile based on user type
    switch (user.userType) {
      case 'general':
        user.profile = {
          bio: profileData.bio || '',
          preferences: profileData.preferences || []
        };
        break;

      case 'influencer':
        user.profile = {
          bio: profileData.bio || '',
          niche: profileData.niche || [],
          about: profileData.about || '',
          brandStatement: profileData.brandStatement || ''
        };
        break;

      case 'vendor':
        user.profile = {
          brandName: profileData.brandName || '',
          website: profileData.website || '',
          description: profileData.description || '',
          industry: profileData.industry || '',
          categories: profileData.categories || [],
          businessType: profileData.businessType || '',
          gstNumber: profileData.gstNumber || '',
          ssn:profileData.ssn ||'',
          address: profileData.address || {},
          socialLinks: profileData.socialLinks || {},
          documentStatus: 'Pending'
        };

        // Save uploaded documents
        if (req.files && req.files.length > 0) {
          const docs = req.files.map(file => ({
            userId,
            fileName: file.originalname,
            filePath: file.path,
            mimeType: file.mimetype,
            fileType: req.body.fileType || 'Other'
          }));
          await vendorDocument.insertMany(docs);
        }

        // Notify admin via email
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: process.env.COMPANY_VERIFICATION_EMAIL,
          subject: 'Vendor Profile Updated - Verification Required',
          text: `Vendor ${user.name} (${user.email}) has updated their profile. Please review their documents.`
        });

        break;

        default:
        return res.status(400).json({
          code: 400,
          message: 'Failed',
          error: 'Unsupported user type',
          result: null
        });
        
    }
    user.isProfileSetup = true;

    await user.save();

    // Fetch documents for user
    const userDocs = await vendorDocument.find({ userId });

    // Clean user object
    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.otp;
    delete userObject.otpExpires;

    return res.status(200).json({
      code: 200,
      message: 'Profile updated successfully',
      error: null,
      result: {
        user: userObject,
        documents: userDocs
      }
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to update profile',
      error: err.message,
      result: null
    });
  }
};



const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'Failed',
        error: 'User not found',
        result: null
      });
    }

    if (user.isVerified) {
      return res.status(400).json({
        code: 400,
        message: 'Failed',
        error: 'User already verified',
        result: null
      });
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 60 * 1000; // 1 minute
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New OTP for Verification',
      text: `Your new OTP is ${otp}. It will expire in 60 seconds.`
    });

    return res.status(200).json({
      code: 200,
      message: 'OTP resent successfully',
      error: null,
      result: null
    });

  } catch (err) {
    console.error('Resend OTP Error:', err);
    return res.status(500).json({
      code: 500,
      message: 'Failed to resend OTP',
      error: err.message,
      result: null
    });
  }
};





module.exports = {
  registerUser,
  loginUser,
  verifyOtp,
  resetPassword,
  requestPasswordReset,
  updateProfile,
  resendOtp
};
