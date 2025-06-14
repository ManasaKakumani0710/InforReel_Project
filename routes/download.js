// routes/fileRoutes.js
const express = require('express');
const router = express.Router();
const { downloadFile } = require('../controllers/downloadController');

router.get('/download/:id', downloadFile);

module.exports = router;
