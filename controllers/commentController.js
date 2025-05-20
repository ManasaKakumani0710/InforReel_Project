const Comment = require('../models/Comment');
const Post = require('../models/Post');

const addComment = async (req, res) => {
  try {
    const { comment } = req.body;

    const newComment = await Comment.create({
      post: req.params.id,
      user: req.user._id,
      comment
    });

    await Post.findByIdAndUpdate(req.params.id, {
      $push: { comments: newComment._id }
    });

    const populatedComment = await Comment.findById(newComment._id).populate({
      path: 'user',
      select: 'email username'
    });

    res.status(200).json({
      code: 200,
      message: 'Success',
      error: null,
      data: {
        comment: populatedComment,
        postId: req.params.id
      }
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      message: 'Failed',
      error: err.message,
      data: null
    });
  }
};

const getCommentsByPost = async (req, res) => {
  try {
    const postId = req.params.id;

    const comments = await Comment.find({ post: postId })
      .populate('user', 'name email')
      .sort({ createdAt: -1 });

    res.status(200).json({
      code: 200,
      message: 'Success',
      error: null,
      data: comments
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      message: 'Failed',
      error: err.message,
      data: null
    });
  }
};

module.exports = {
  addComment,
  getCommentsByPost
};
