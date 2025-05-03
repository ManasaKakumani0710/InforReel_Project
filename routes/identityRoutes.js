const express = require('express');
const router = express.Router();
const {
  createVerificationSession,
  checkVerificationStatus
} = require('../controllers/identityController');

router.post('/create-session', createVerificationSession); 
router.get('/check-status/:sessionId', checkVerificationStatus);

module.exports = router;
