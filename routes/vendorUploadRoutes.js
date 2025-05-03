const express = require('express');
const router = express.Router();
const upload = require('../utils/multerConfig');
const { uploadVendorDocuments, getVendorDocuments } = require('../controllers/vendorDocumentsController');
const authenticate = require('../middleware/authMiddleware'); // Assuming you have JWT middleware

router.post('/upload', authenticate, upload.array('documents', 10), uploadVendorDocuments);
router.get('/:userId/documents', authenticate, getVendorDocuments);

module.exports = router;
