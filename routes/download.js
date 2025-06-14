const express = require('express');
const router = express.Router();
const { downloadFromS3 } = require('../controllers/downloadController');

router.get('/download', downloadFromS3);

module.exports = router;
