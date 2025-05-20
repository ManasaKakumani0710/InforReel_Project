const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const upload = require('../utils/uploadProducts');
const { addProduct,getUserProducts } = require('../controllers/productController');

router.post('/add', auth, upload.array('media', 4), addProduct); 
router.get('/my-products', auth, getUserProducts);

module.exports = router;
