const express = require('express');
const router = express.Router();
const { createCheckoutSession } = require('../controllers/paymentController');

router.post('/stripe/create-session', createCheckoutSession);

module.exports = router;
