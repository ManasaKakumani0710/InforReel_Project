const bcrypt = require('bcryptjs');
const User = require('../models/users');
const vendorDocument = require("../models/vendorDocument")
const crypto = require('crypto');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');



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
      name, email, password, userType,
      country, state, gender, dob,
      brand, followers, profile
    } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ message: 'Email already exists' });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name, email, password: hashedPassword, userType,
      country, state, gender, dob, brand, followers,
      profile, isVerified: false
    });

    if (userType === 'vendor' || userType === 'influencer') {
      const otp = Math.floor(100000 + Math.random() * 900000).toString();
      const hashedOtp = await bcrypt.hash(otp, 10);

      user.otp = hashedOtp;
      user.otpExpires = Date.now() + 60 * 1000;

      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: 'Your OTP for Email Verification',
        text: `Your OTP is ${otp}. It will expire in 30 seconds.`
      });

    } 

    await user.save();

    res.status(201).json({
      message: userType === 'general'
        ? 'Registration received. Our team will review your details.'
        : 'OTP sent to your email for verification'
    });
  } catch (err) {
    console.error('Registration Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid email or password' });

   
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid email or password' });


    const token = jwt.sign(
      { user: { id: user._id, userType: user.userType } }, // The payload (user information to store in the token)
      process.env.JWT_SECRET, // Secret key to sign the token (make sure to keep this secret and secure)
      { expiresIn: '1h' } // The token will expire in 1 hour
    );



    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        userType: user.userType
        
      }
    });

  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};



const verifyOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(400).json({ message: 'User not found' });
    if (!user.otp || !user.otpExpires || user.otpExpires < Date.now())
      return res.status(400).json({ message: 'OTP expired or not valid' });

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) return res.status(400).json({ message: 'Invalid OTP' });

    user.isVerified = true;
    user.otp = undefined;
    user.otpExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Email verified successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ message: 'User not found' });

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 3600000; // 1 hour from now

    user.resetToken = resetToken;
    user.resetTokenExpires = resetTokenExpiry;
    await user.save();

    const resetPasswordUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Password Reset Request',
      text: `Click on the following link to reset your password: ${resetPasswordUrl}. This link will expire in 1 hour.`,
    });

    res.status(200).json({ message: 'Password reset link sent to your email' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};



const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const user = await User.findOne({ resetToken: token, resetTokenExpires: { $gt: Date.now() } });

    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired token' });
    }

   
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    res.status(200).json({ message: 'Password reset successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id; // from JWT
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    console.log("user:::",user);
    console.log("request format ::",req.body);
    if (!req.body || !req.body.profile) {
      return res.status(400).json({ message: 'Missing profile data' });
    }

  
    try {
      profileData = JSON.parse(req.body.profile);
      
    } catch (error) {
      console.error("Invalid profile JSON:", error);
      return res.status(400).json({ message: 'Invalid JSON in profile field' });
    }

    // Handle profile by user type
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
          address: profileData.address || {},
          socialLinks: profileData.socialLinks || {},
          documentStatus: 'Pending'
        };

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
        return res.status(400).json({ message: 'Unsupported user type' });
    }

    await user.save();

    return res.status(200).json({
      message: 'Profile updated successfully',
      profile: user.profile
    });

  } catch (err) {
    console.error('Update Profile Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};



const resendOtp = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    if (user.isVerified) return res.status(400).json({ message: 'User already verified' });

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 60 * 1000; // 1 minute
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Your New OTP for Verification',
      text: `Your new OTP is ${otp}. It will expire in 1 minute.`
    });

    res.status(200).json({ message: 'OTP resent successfully' });

  } catch (err) {
    console.error('Resend OTP Error:', err);
    res.status(500).json({ message: 'Server error' });
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
