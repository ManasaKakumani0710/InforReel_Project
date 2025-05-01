const jwt = require('jsonwebtoken');

const authMiddleware = (req, res, next) => {
  // Extract the token from the Authorization header
  const token = req.header('Authorization')?.replace('Bearer ', ''); // e.g., "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Access denied. No token provided.' });
  }

  try {
    // Verify the token
    const decoded = jwt.verify(token, process.env.JWT_SECRET); // process.env.JWT_SECRET is your secret key

    // Attach the decoded user info to the request object
    req.user = decoded.user;

    // Proceed to the next middleware/route handler
    next();
  } catch (err) {
    return res.status(400).json({ message: 'Invalid or expired token.' });
  }
};

module.exports = authMiddleware;
