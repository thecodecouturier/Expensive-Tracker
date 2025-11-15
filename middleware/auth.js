const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Middleware to protect routes - verify JWT token
const protect = async (req, res, next) => {
  let token;

  // Check if token exists in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header (format: "Bearer TOKEN")
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET || 'your-secret-key-change-this-in-production'
      );

      // Get user from token (exclude password)
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ message: 'User not found' });
      }

      next(); // Continue to next middleware/route handler
    } catch (error) {
      console.error('Auth middleware error:', error);
      
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ message: 'Token expired, please login again' });
      }
      
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  // If no token found
  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

module.exports = { protect };
