const jwt = require('jsonwebtoken');
const User = require('../models/users');
const Session = require('../models/Session');

module.exports = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({
      code: 401,
      message: 'Unauthorized: No token provided',
      error: 'Unauthorized',
      data: null
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const session = await Session.findOne({ token });
    if (!session) {
      return res.status(401).json({
        code: 401,
        message: 'Session invalid or expired',
        error: 'Invalid session',
        data: null
      });
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({
        code: 404,
        message: 'User not found',
        error: 'Not found',
        data: null
      });
    }

    req.user = user;
    req.session = session;
    next();
  } catch (err) {
    return res.status(401).json({
      code: 401,
      message: 'Invalid or expired token',
      error: err.message,
      data: null
    });
  }
};
