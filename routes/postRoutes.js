const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const upload = require('../middlewares/s3VideoUploader');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

router.post('/create', auth, upload, postController.createPost);
router.get('/allPosts',auth, postController.getAllPosts);
router.get('/like/:id', auth, postController.toggleLike);
router.get('/save/:id', auth, postController.toggleSave);
router.post('/comment/:id', auth, commentController.addComment);
router.get('/comments/:id', commentController.getCommentsByPost);
router.get('/vendorDetails',postController.getVendorCompanies);
router.get('/report/:postId',auth,postController.reportPost);
router.post('/report-channel',auth, postController.reportCompany);

module.exports = router;
