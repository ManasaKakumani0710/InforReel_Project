const bcrypt = require("bcryptjs");
const User = require("../models/users");
const vendorDocument = require("../models/vendorDocument");
const crypto = require("crypto");
const nodemailer = require("nodemailer");
const jwt = require("jsonwebtoken");
const Stripe = require("stripe");
const stripe = Stripe(process.env.STRIPE_SECRET_KEY);

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10),
  secure: process.env.SMTP_PORT === "465",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const registerUser = async (req, res) => {
  try {
    const {
      name,
      username,
      email,
      password,
      userType,
      country,
      state,
      gender,
      dob,
      brand,
      followers,
      profile,
    } = req.body;

    const existing = await User.findOne({ email } || { username });
    if (existing) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Email or UserName already exists",
        data: null,
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
      isProfileSetUp: false,
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
        subject: "Your OTP for Email Verification",
        text: `Your OTP is ${otp}. It will expire in 60 seconds.`,
      });
    } catch (emailError) {
      return res.status(500).json({
        code: 500,
        message: "Failed to send OTP",
        error: "Email service error",
        data: null,
      });
    }

    await user.save();

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.otp;
    delete userObject.otpExpires;

    return res.status(200).json({
      code: 200,
      message: "OTP sent to your email for verification",
      error: null,
      data: userObject,
    });
  } catch (err) {
    console.error("Registration Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Failed to register user",
      error: err.message,
      data: null,
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
        message: "Failed",
        error: "Email or username is required",
        data: null,
      });
    }

    const user = await User.findOne(email ? { email } : { username });

    if (!user) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Invalid email/username or password",
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Invalid email/username or password",
        data: null,
      });
    }

    const token = jwt.sign(
      { id: user._id, userType: user.userType },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    let userDocs = [];
    if (user.userType === "vendor") {
      userDocs = await vendorDocument.find({ userId: user._id });
    }

    const userObject = user.toObject();
    delete userObject.password;
    userObject.token = token;
    userObject.documents = userDocs;

    return res.status(200).json({
      code: 200,
      message: "Login successful",
      error: null,
      data: userObject,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({
      code: 500,
      message: "Login failed",
      error: err.message,
      data: null,
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
        message: "Failed",
        error: "User not found",
        data: null,
      });
    }

    if (!user.otp || !user.otpExpires || user.otpExpires < Date.now()) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "OTP expired or not valid",
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(otp, user.otp);
    if (!isMatch) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Invalid OTP",
        data: null,
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
      { expiresIn: "1h" }
    );

    // Prepare user response object
    const userObject = user.toObject();
    delete userObject.password;
    userObject.token = token;

    return res.status(200).json({
      code: 200,
      message: "Email verified successfully",
      error: null,
      data: userObject,
    });
  } catch (err) {
    console.error("OTP Verification Error:", err);
    return res.status(500).json({
      code: 500,
      message: "OTP verification failed",
      error: err.message,
      data: null,
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
        message: "Failed",
        error: "User not found",
        data: null,
      });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedOtp = await bcrypt.hash(otp, 10);

    user.otp = hashedOtp;
    user.otpExpires = Date.now() + 60 * 1000;
    await user.save();

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your OTP for Password Reset",
      text: `Your OTP code is: ${otp}. It will expire in 60 Seconds.`,
    });

    return res.status(200).json({
      code: 200,
      message: "OTP sent to your email",
      error: null,
      data: null,
    });
  } catch (err) {
    console.error("OTP Sending Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Failed to send OTP",
      error: err.message,
      data: null,
    });
  }
};

const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Failed",
        error: "User not found",
        data: null,
      });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token fields
    user.password = hashedPassword;
    user.resetToken = undefined;
    user.resetTokenExpires = undefined;
    await user.save();

    return res.status(200).json({
      code: 200,
      message: "Password reset successfully",
      error: null,
      data: null,
    });
  } catch (err) {
    console.error("Reset Password Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Failed to reset password",
      error: err.message,
      data: null,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Failed",
        error: "User not found",
        data: null,
      });
    }

    if (!req.body || !req.body.profile) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Missing profile data",
        data: null,
      });
    }

    let profileData;
    try {
      profileData = JSON.parse(req.body.profile);
    } catch (error) {
      console.error("Invalid profile JSON:", error);
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Invalid JSON in profile field",
        data: null,
      });
    }

    switch (user.userType) {
      case "general":
        user.profile = {
          country: profileData.country || "",
          state: profileData.state || "",
          gender: profileData.gender || "",
          dob: profileData.dob || "",
          interests: profileData.interests || [],
        };
        break;

      case "influencer":
        user.profile = {
          country: profileData.country || "",
          state: profileData.state || "",
          gender: profileData.gender || "",
          dob: profileData.dob || "",
          niche: profileData.niche || [],
          about: profileData.about || "",
          brandStatement: profileData.brandStatement || "",
          workedWithBrands: profileData.workedWithBrands || [],
          socialLinks: profileData.socialLinks || {
            Instagram: "",
            Facebook: "",
            TikTok: "",
            YouTube: "",
            Other: "",
          },
        };
        break;

      case "vendor":
        user.profile = {
          fullName: profileData.fullName || "",
          dob: profileData.dob || "",
          gender: profileData.gender || "",
          ssn: profileData.ssn || "",

          address: {
            addressLine1: profileData.address?.addressLine1 || "",
            addressLine2: profileData.address?.addressLine2 || "",
            city: profileData.address?.city || "",
            state: profileData.address?.state || "",
            country: profileData.address?.country || "",
            zipCode: profileData.address?.zipCode || "",
          },

          // Identity Verification
          identification: {
            status: profileData.identification?.status || "Pending",
            stripeSessionId: profileData.identification?.stripeSessionId || "",
          },

          // Business Info
          categories: profileData.categories || [],
          businessName: profileData.businessName || "",
          hasDba: profileData.hasDba || false,
          dbaTradeName: profileData.dbaTradeName || "",

          businessContact: profileData.businessContact || {
            email: "",
            phone: "",
          },

          businessAddress: {
            sameAsResidential: false,
            addressLine1: profileData.businessAddress?.addressLine1 || "",
            addressLine2: profileData.businessAddress?.addressLine2 || "",
            city: profileData.businessAddress?.city || "",
            state: profileData.businessAddress?.state || "",
            country: profileData.businessAddress?.country || "",
            zipCode: profileData.businessAddress?.zipCode || "",
          },

          businessWebsite: profileData.businessWebsite || "",
          businessType: profileData.businessType || "",
          isRegisteredBusiness: profileData.isRegisteredBusiness || false,
          einNumber: profileData.einNumber || "",
          isManufacturer: profileData.isManufacturer || false,
          brandCountry: profileData.brandCountry || "",
          brandLaunchYear: profileData.brandLaunchYear || "",

          // Social Media
          socialLinks: profileData.socialLinks || {
            Instagram: "",
            Facebook: "",
            TikTok: "",
            YouTube: "",
            Other: "",
          },

          // Product Info
          isAllowedEveryWhere: profileData.isAllowedEveryWhere || false,
          productCountries: profileData.productCountries || [],
          brandPromotionalPlan: profileData.brandPromotionalPlan || "",
          productDescription: profileData.productDescription || "",
          productUSP: profileData.productUSP || "",

          // Internal Tracking
          documentStatus: profileData.documentStatus || "Pending",
          createdAt: new Date().toISOString(),
        };

        if (req.files && req.files.length > 0) {
          let fileMeta = [];
          try {
            fileMeta = req.body.fileMeta ? JSON.parse(req.body.fileMeta) : [];
          } catch (error) {
            return res.status(400).json({
              code: 400,
              message: "Failed",
              error: "Invalid JSON in fileMeta field",
              data: null,
            });
          }

          const docs = req.files.map((file) => {
            const meta =
              fileMeta.find((m) => m.fileName === file.originalname) || {};
            return {
              userId,
              fileName: file.originalname,
              filePath: file.path,
              mimeType: file.mimetype,
              fileType: meta.fileType || "Other",
              fileCategory: meta.category || "Other",
            };
          });

          await vendorDocument.insertMany(docs);

          const attachments = req.files.map((file) => ({
            filename: file.originalname,
            path: file.path,
          }));

          await transporter.sendMail({
            from: process.env.EMAIL_USER,
            to: process.env.COMPANY_VERIFICATION_EMAIL,
            subject: "Vendor Profile Updated - Verification Required",
            text: `Vendor ${user.name} (${user.email}) has updated their profile. Please review their documents.`,
            attachments,
          });
        }
        break;

      default:
        return res.status(400).json({
          code: 400,
          message: "Failed",
          error: "Unsupported user type",
          data: null,
        });
    }

    user.isProfileSetup = true;
    await user.save();

    const userDocs = await vendorDocument.find({ userId });

    const userObject = user.toObject();
    delete userObject.password;
    delete userObject.otp;
    delete userObject.otpExpires;

    return res.status(200).json({
      code: 200,
      message: "Profile updated successfully",
      error: null,
      data: {
        user: userObject,
        documents: userDocs,
      },
    });
  } catch (err) {
    console.error("Update Profile Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Failed to update profile",
      error: err.message,
      data: null,
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
        message: "Failed",
        error: "User not found",
        data: null,
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
      subject: "Your New OTP for Verification",
      text: `Your new OTP is ${otp}. It will expire in 60 seconds.`,
    });

    return res.status(200).json({
      code: 200,
      message: "OTP resent successfully",
      error: null,
      data: null,
    });
  } catch (err) {
    console.error("Resend OTP Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Failed to resend OTP",
      error: err.message,
      data: null,
    });
  }
};

const deleteUserByEmail = async (req, res) => {
  try {
    const { email } = req.params;

    const deletedUser = await User.findOneAndDelete({ email });

    if (!deletedUser) {
      return res.status(404).json({
        code: 404,
        message: "Failed",
        error: "User not found",
        data: null,
      });
    }

    return res.status(200).json({
      code: 200,
      message: "User deleted successfully",
      error: null,
      data: deletedUser,
    });
  } catch (err) {
    console.error("Delete User Error:", err);
    return res.status(500).json({
      code: 500,
      message: "Failed to delete user",
      error: err.message,
      data: null,
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
  resendOtp,
  deleteUserByEmail,
};
