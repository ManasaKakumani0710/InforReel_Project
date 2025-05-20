const jwt = require('jsonwebtoken');
const User = require('../models/users');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Failed',
      error: 'Unauthorized',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'Failed',
        error: 'User not found',
        data: null
      });
    }

    req.user = user; 
    next();
  } catch (err) {
    return res.status(401).json({
      code: 401,
      message: 'Failed',
      error: 'Invalid Token',
      data: null
    });
  }
};
