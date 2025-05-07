// middleware/auth.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      code: 401,
      message: 'Unauthorized',
      error: 'No token provided',
      data: null
    });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // Now you can access req.user.id
    next();
  } catch (err) {
    return res.status(403).json({
      code: 403,
      message: 'Forbidden',
      error: 'Invalid or expired token',
      data: null
    });
  }
};

module.exports = authenticate;
