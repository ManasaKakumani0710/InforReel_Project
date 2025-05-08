const express = require('express');
const router = express.Router();
const {
  createVerificationSession,
  checkVerificationStatus
} = require('../controllers/identityController');

router.post('/create-session', createVerificationSession); 
router.get('/check-status/:sessionId', checkVerificationStatus);

router.get('/api/identity-complete', (req, res) => {
  res.send('✅ Stripe identity verification completed. You can now close this window.');
});


module.exports = router;
