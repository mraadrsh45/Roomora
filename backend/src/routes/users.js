const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { getNearbyUsers, getMatches, updateProfile, updateLocation, getUserById } = require('../controllers/userController');
const { blockUser } = require('../controllers/adminController');
const User = require('../models/User');

router.get('/nearby', protect, getNearbyUsers);
router.get('/matches', protect, getMatches);
router.put('/profile', protect, updateProfile);
router.put('/location', protect, updateLocation);
router.post('/:id/block', protect, blockUser);

// GET /api/users/search?q=name&city=&state=
router.get('/search', protect, async (req, res) => {
  try {
    const { q, city, state, area } = req.query;
    const query = {
      _id: { $ne: req.user._id },
      isBlocked: false,
      isSuspended: false,
      isLookingForRoom: true,
    };
    if (q) query.name = new RegExp(q, 'i');
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    if (area) query['location.area'] = new RegExp(area, 'i');

    const users = await User.find(query)
      .select('name avatar profile budget location isVerified isOnline lastSeen')
      .limit(30);
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, getUserById);

module.exports = router;
