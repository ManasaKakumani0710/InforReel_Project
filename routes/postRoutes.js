const express = require('express');
const router = express.Router();
const auth = require('../middlewares/authMiddleware');
const upload = require('../utils/uploadPosts');
const postController = require('../controllers/postController');
const commentController = require('../controllers/commentController');

router.post('/create', auth, upload.single('video'), postController.createPost);
router.get('/all', postController.getAllPosts);
router.get('/like/:id', auth, postController.toggleLike);
router.get('/save/:id', auth, postController.toggleSave);
router.post('/comment/:id', auth, commentController.addComment);
router.get('/comments/:id', commentController.getCommentsByPost);

module.exports = router;
