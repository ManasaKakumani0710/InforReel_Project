const express = require('express');
const upload = require('../middlewares/s3VendorUploader');
const router = express.Router();
const { 
    registerUser,
    loginUser,
    verifyOtp,
    resetPassword,
    requestPasswordReset,
    updateProfile,
    resendOtp ,deleteUserByEmail,
  logoutUser } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');


router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);
router.post(
  '/profile',
  authMiddleware,
  upload.array('files'), 
  updateProfile
);

router.post('/resend-otp', resendOtp);

router.get('/deleteUsers/:email', deleteUserByEmail);

router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'This is a protected profile route', user: req.user });
  });

  router.get('/reset-password', (req, res) => {
    const { token } = req.query;
    res.render('reset-password', { token });
  });
  router.post('/logout', authMiddleware, logoutUser);

  

module.exports = router;
