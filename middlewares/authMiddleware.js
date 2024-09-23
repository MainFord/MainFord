import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Check if the token is present in the Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from the Authorization header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Find the user by decoded id and attach to request object
      req.user = await User.findById(decoded.id).select('-password').populate('referredBy', 'name email _id');
      next();
    } catch (error) {
      return res.status(401).json({ message: 'Unauthorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'No token, authorization denied' });
  }
};


export const adminAuth = (req, res, next) => {
    const { username, password } = req.headers;
  
    if (username === process.env.ADMIN_USER && password === process.env.ADMIN_PASSWORD) {
      next();
    } else {
      res.status(403).json({ message: 'Unauthorized' });
    }
  };
  