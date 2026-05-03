const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Not authorized, no token' });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-__v');

    if (!user) return res.status(401).json({ message: 'User not found' });
    if (user.isBlocked || user.isSuspended) return res.status(403).json({ message: 'Account suspended' });

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: 'Token invalid or expired' });
  }
};

const requirePremium = (req, res, next) => {
  if (!req.user?.isPremium) {
    return res.status(403).json({
      message: 'Premium subscription required',
      code: 'PREMIUM_REQUIRED',
    });
  }
  next();
};

const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

module.exports = { protect, requirePremium, adminOnly };

