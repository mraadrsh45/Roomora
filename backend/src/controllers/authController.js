const admin = require('../config/firebase');
const User = require('../models/User');
const jwt = require('jsonwebtoken');

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || '7d' });

// POST /api/auth/firebase
// Verify Firebase ID token → create or return user → return JWT
const firebaseLogin = async (req, res) => {
  try {
    const { idToken } = req.body;
    if (!idToken) return res.status(400).json({ message: 'Firebase ID token required' });

    // Verify with Firebase Admin
    const decoded = await admin.auth().verifyIdToken(idToken);
    const { uid, email, name, picture, firebase } = decoded;

    if (!email) return res.status(400).json({ message: 'Email is required from provider' });

    const provider = firebase?.sign_in_provider?.replace('.com', '') || 'email';

    // Prevent duplicate accounts: find by email OR by uid
    let user = await User.findOne({ $or: [{ email }, { firebaseUid: uid }] });

    if (user) {
      // Update uid if missing (first social login)
      if (!user.firebaseUid) {
        user.firebaseUid = uid;
        await user.save();
      }
    } else {
      // New user — auto-populate from social login
      user = await User.create({
        firebaseUid: uid,
        name: name || email.split('@')[0],
        email,
        avatar: picture || '',
        isVerified: decoded.email_verified || false,
      });
    }

    const token = generateToken(user._id);

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        isVerified: user.isVerified,
        verificationBadge: user.verificationBadge,
        isPremium: user.isPremium,
        profileSetupComplete: user.profileSetupComplete,
        profile: user.profile,
        lifestyle: user.lifestyle,
        budget: user.budget,
        location: user.location,
      },
    });
  } catch (err) {
    console.error('Firebase login error:', err);
    res.status(401).json({ message: 'Invalid Firebase token', error: err.message });
  }
};

// GET /api/auth/me
const getMe = async (req, res) => {
  const user = await User.findById(req.user._id).select('-__v -blockedUsers');
  res.json(user);
};

module.exports = { firebaseLogin, getMe };
