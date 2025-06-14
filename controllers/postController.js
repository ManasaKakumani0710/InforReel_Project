const Post = require('../models/Post');
const User = require('../models/users');
const ReportedCompany = require('../models/ReportedCompany');

const createPost = async (req, res) => {
  try {
    const video = req.file ? req.file.location : null; 
    const { title, description, tags } = req.body;

    if (!title || !video) {
      return res.status(400).json({
        code: 400,
        message: "Failed",
        error: "Title and video are required.",
        data: null
      });
    }

    const user = await User.findById(req.user._id).select("name email");

    if (!user) {
      return res.status(404).json({
        code: 404,
        message: "Failed",
        error: "User not found.",
        data: null
      });
    }

    let taggedUsers = [];
    let taggedUserDetails = [];

    if (tags) {
      const companyNames = JSON.parse(tags);

      const users = await User.find({
        "profile.businessName": { $in: companyNames }
      }).select("_id name email profile.businessName");

      taggedUsers = users.map(u => u._id);
      taggedUserDetails = users.map(u => ({
        userId: u._id,
        username: u.name,
        email: u.email,
        companyName: u.profile.businessName
      }));
    }

    const post = await Post.create({
      user: req.user._id,
      title,
      description,
      tags: taggedUsers,
      video 
    });

    res.status(200).json({
      code: 200,
      message: "Post created successfully",
      error: null,
      data: {
        _id: post._id,
        user: {
          userId: req.user._id,
          username: user.name,
          email: user.email
        },
        title: post.title,
        description: post.description,
        tags: taggedUserDetails,
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
    if (!req.user || !req.user._id) {
      return res.status(401).json({
        code: 401,
        message: 'Unauthorized',
        error: 'User authentication failed. Token may be missing or invalid.',
        data: null
      });
    }

    const userId = req.user._id;

    const reportedCompanies = await ReportedCompany.find().distinct('companyName');

    const posts = await Post.find({
      hiddenFrom: { $ne: userId }
    })
      .populate('user', 'name email')
      .populate('tags', 'name email profile.businessName')
      .populate('likes', 'email')
      .populate('savedBy', 'email')
      .populate({
        path: 'comments',
        populate: { path: 'user', select: 'name email' }
      })
      .sort({ createdAt: -1 });

    const filteredPosts = posts.filter(post => {
      if (!post.user) return false; 
      if (!post.tags || !Array.isArray(post.tags)) return true;

    
      const isTaggedCompanyReported = post.tags.some(tag =>
        reportedCompanies.includes(tag.profile?.businessName)
      );

      return !isTaggedCompanyReported;
    });

    
    const formattedPosts = filteredPosts.map(post => ({
      _id: post._id,
      user: {
        _id: post.user?._id,
        name: post.user?.name,
        email: post.user?.email
      },
      content: post.content,
      media: post.media,
      taggedUsers: post.tags?.map(u => ({
        userId: u._id,
        username: u.name,
        email: u.email,
        businessName: u.profile?.businessName || ''
      })) || [],
      likes: post.likes?.map(u => u.email) || [],
      likesCount: post.likes?.length || 0,
      savedBy: post.savedBy?.map(u => u.email) || [],
      comments: post.comments || [],
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
      message: 'Failed to fetch posts',
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


const getVendorCompanies = async (req, res) => {
  try {
    const vendors = await User.find({ userType: "vendor", isProfileSetup:true }).select("_id username profile.businessName");

    const formatted = vendors.map(vendor => ({
      userId: vendor._id,
      username: vendor.username,
      companyName: vendor.profile?.businessName || null
    }));

    res.status(200).json({
      code: 200,
      message: "Success",
      error: null,
      data: formatted
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


const reportPost = async (req, res) => {
  try {
    const userId = req.user._id;
    const username = req.user.username;
    const userEmail = req.user.email;
    const postId = req.params.postId;
    const { reason } = req.body;

    if (!reason || typeof reason !== 'string') {
      return res.status(400).json({
        code: 400,
        message: 'Bad Request',
        error: 'Reason for reporting is required.',
        data: null
      });
    }

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        code: 404,
        message: "Post not found",
        error: null,
        data: null
      });
    }

   
    if (!post.hiddenFrom.includes(userId)) {
      post.hiddenFrom.push(userId);
    }

    
    post.reports = post.reports || [];
    post.reports.push({
      user: userId,
      username,
      email: userEmail,
      reason,
      reportedAt: new Date()
    });

    await post.save();

    res.status(200).json({
      code: 200,
      message: "Post reported and hidden from user",
      error: null,
      data: {
        postId: post._id,
        hiddenFrom: post.hiddenFrom,
        lastReport: {
          userId,
          username,
          email: userEmail,
          reason
        }
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





const reportCompany = async (req, res) => {
  try {
    const userId = req.user?._id;
    const email = req.user?.email;
    const username = req.user?.name;

    const { companyName, companyUserId } = req.body;

    if (!userId || !email || !username || !companyName || !companyUserId) {
      return res.status(400).json({
        code: 400,
        message: 'Missing required fields',
        error: 'companyName, companyUserId, and authenticated user info are required',
        data: null
      });
    }

    const report = await ReportedCompany.create({
      companyName,
      companyUserId,
      reportedBy: {
        userId,
        email,
        username
      }
    });

    return res.status(200).json({
      code: 200,
      message: 'Company reported successfully',
      error: null,
      data: report
    });
  } catch (err) {
    return res.status(500).json({
      code: 500,
      message: 'Failed to report company',
      error: err.message,
      data: null
    });
  }
};




module.exports = {
  createPost,
  getAllPosts,
  toggleLike,
  toggleSave,
  getVendorCompanies,
  reportPost,
  reportCompany
};
