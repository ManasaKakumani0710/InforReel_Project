const express = require('express');
const router = express.Router();
const { 
    registerUser,
    loginUser,
    verifyOtp,
    resetPassword,
    requestPasswordReset } = require('../controllers/userController');
const authMiddleware = require('../middlewares/authMiddleware');




router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/verify-otp', verifyOtp);
router.post('/request-password-reset', requestPasswordReset);
router.post('/reset-password', resetPassword);

router.get('/profile', authMiddleware, (req, res) => {
    res.json({ message: 'This is a protected profile route', user: req.user });
  });


module.exports = router;
