const Post = require('../models/Post');
const User = require('../models/users');

const createPost = async (req, res) => {
  try {
    const video = req.file ? req.file.path : null;
    const { title, description, tags } = req.body;

    if (!title || !video) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Title and video are required.",
        data: null
      });
    }


    const post = await Post.create({
      user: req.user._id,
      title,
      description,
      tags: tags ? JSON.parse(tags) : [],
      video
    });

    res.status(200).json({
      code: 200,
      message: "Post created successfully",
      error: null,
      data: {
        _id: post._id,
        user: req.user._id,
        title: post.title,
        description: post.description,
        tags: post.tags,
        video: post.video,
        createdAt: post.createdAt,
        updatedAt: post.updatedAt
      }
    });
  } catch (err) {
    res.status(500).json({
      code: 500,
      message: "Failed",
      error: err.message,
      data: null
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate('user', 'name email')
      .populate('taggedUsers', 'email')
      .populate('likes', 'email')
      .populate('savedBy', 'email')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    const formattedPosts = posts.map(post => ({
      _id: post._id,
      user: post.user,
      content: post.content,
      media: post.media,
      taggedUsers: post.taggedUsers.map(u => u.email),
      likes: post.likes.map(u => u.email),
      likesCount: post.likes.length,                
      savedBy: post.savedBy.map(u => u.email),
      comments: post.comments,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt
    }));

    res.status(200).json({
      code: 200,
      message: 'Success',
      error: null,
      data: formattedPosts
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

const toggleLike = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    const index = post.likes.indexOf(userId);

    if (index === -1) {
      post.likes.push(userId);
    } else {
      post.likes.splice(index, 1);
    }

    await post.save();

    // Populate likes with email and username
    const updatedPost = await Post.findById(post._id).populate({
      path: 'likes',
      select: 'email username'
    });

    res.status(200).json({
      code: 200,
      message: 'Success',
      error: null,
      data: {
        likeCount: updatedPost.likes.length,
        likes: updatedPost.likes,
        postId: updatedPost._id
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

const toggleSave = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    const userId = req.user._id;

    const index = post.savedBy.indexOf(userId);

    if (index === -1) {
      post.savedBy.push(userId);
    } else {
      post.savedBy.splice(index, 1);
    }

    await post.save();

    // Populate savedBy with email and username
    const updatedPost = await Post.findById(post._id).populate({
      path: 'savedBy',
      select: 'email username'
    });

    res.status(200).json({
      code: 200,
      message: 'Success',
      error: null,
      data: {
        savedByCount: updatedPost.savedBy.length,
        savedBy: updatedPost.savedBy,
        postId: updatedPost._id
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

module.exports = {
  createPost,
  getAllPosts,
  toggleLike,
  toggleSave
};
