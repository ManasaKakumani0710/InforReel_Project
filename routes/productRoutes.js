const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const upload = require('../utils/uploadProducts');
const { addProduct,getUserProducts,addToCart,deleteFromCart,
    paymentHandler,saveAddressHandler,shippingHandler,completeOrderHandler,getCartItems
 } = require('../controllers/productController');

router.post('/add', auth, upload.array('media', 4), addProduct); 
router.get('/my-products', auth, getUserProducts);
router.post('/addToCart',auth,addToCart);
router.post('/deleteFromCart',auth,deleteFromCart);
router.post('/address', auth,saveAddressHandler);
router.post('/shipping-rate', shippingHandler);
router.post('/payment-intent', paymentHandler);
router.post('/confirm', completeOrderHandler);
router.get('/getCartItems',auth, getCartItems);




module.exports = router;
