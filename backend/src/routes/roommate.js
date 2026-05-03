const express = require('express');
const router = express.Router();
const RoommateRequest = require('../models/RoommateRequest');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST /api/roommate/create — create/update roommate preference profile
router.post('/create', protect, async (req, res) => {
  try {
    const { preferences, location } = req.body;
    const existing = await RoommateRequest.findOne({ user: req.user._id, status: 'active' });

    if (existing) {
      existing.preferences = preferences;
      if (location) {
        existing.location = {
          country: location.country, state: location.state,
          city: location.city, area: location.area,
        };
      }
      await existing.save();
      return res.json({ request: existing, message: 'Profile updated!' });
    }

    const request = await RoommateRequest.create({
      user: req.user._id,
      preferences,
      location: location ? {
        country: location.country, state: location.state,
        city: location.city, area: location.area,
      } : req.user.location,
    });

    res.status(201).json({ request, message: 'Roommate profile created!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/roommate/match — get matches with advanced scoring & filters
router.get('/match', protect, async (req, res) => {
  try {
    const myRequest = await RoommateRequest.findOne({ user: req.user._id, status: 'active' });
    if (!myRequest) return res.status(404).json({ message: 'Create a roommate profile first.' });

    const { state, city, area, budgetMax, gender } = req.query;
    const { country } = myRequest.location || {};

    // Build query with optional filters (override from query params or use myRequest defaults)
    const query = { user: { $ne: req.user._id }, status: 'active' };
    const filterCity = city || myRequest.location?.city;
    const filterState = state || myRequest.location?.state;

    if (filterCity) query['location.city'] = new RegExp(filterCity, 'i');
    else if (filterState) query['location.state'] = new RegExp(filterState, 'i');
    else if (country) query['location.country'] = new RegExp(country, 'i');

    if (area) query['location.area'] = new RegExp(area, 'i');
    if (budgetMax) query['preferences.budgetMin'] = { $lte: Number(budgetMax) };
    if (gender && gender !== 'any') query['preferences.gender'] = { $in: [gender, 'any'] };

    const isPremium = req.user.isPremium;
    const LIMIT = isPremium ? 100 : 15; // free = 15 matches

    const matches = await RoommateRequest.find(query)
      .populate('user', 'name avatar isVerified verificationBadge profile lifestyle budget location isOnline lastSeen')
      .limit(LIMIT + 10);

    // Score each match
    const scored = matches.map((m) => {
      let score = 50;
      const p1 = myRequest.preferences;
      const p2 = m.preferences;

      // Budget overlap (25 pts)
      const budgetOverlap = Math.min(p1.budgetMax, p2.budgetMax) >= Math.max(p1.budgetMin, p2.budgetMin);
      if (budgetOverlap) score += 25;

      // Location bonus
      const l1 = myRequest.location || {};
      const l2 = m.location || {};
      if (l1.city && l2.city && l1.city.toLowerCase() === l2.city.toLowerCase()) score += 10;
      if (l1.area && l2.area && l1.area.toLowerCase() === l2.area.toLowerCase()) score += 5;

      // Lifestyle matching (30 pts)
      if (p1.smokingOk === p2.smokingOk) score += 7;
      if (p1.petsOk === p2.petsOk) score += 5;
      if (p1.guestsOk === p2.guestsOk) score += 5;
      if (p1.sleepTime && p2.sleepTime && p1.sleepTime === p2.sleepTime) score += 8;
      if (p1.noiseLevel && p2.noiseLevel && p1.noiseLevel === p2.noiseLevel) score += 5;

      // Gender preference
      if (p1.gender === 'any' || p2.gender === 'any' ||
          (p1.gender && p2.gender && p1.gender === p2.gender)) score += 5;

      // Shared interests
      const i1 = p1.interests || [];
      const i2 = p2.interests || [];
      const shared = i1.filter((x) => i2.includes(x));
      if (shared.length > 0) score += Math.min(5, shared.length * 2);

      const compatGrade =
        score >= 80 ? 'Excellent' : score >= 65 ? 'Good' : score >= 50 ? 'Fair' : 'Low';

      return {
        ...m.toObject(),
        compatibilityScore: Math.min(score, 100),
        compatibilityGrade: compatGrade,
      };
    })
      .filter((m) => m.compatibilityScore >= 40)
      .sort((a, b) => b.compatibilityScore - a.compatibilityScore)
      .slice(0, LIMIT);

    res.json({
      matches: scored,
      total: scored.length,
      isPremium,
      limit: LIMIT,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/roommate/my-profile — get current user's request
router.get('/my-profile', protect, async (req, res) => {
  try {
    const request = await RoommateRequest.findOne({ user: req.user._id, status: 'active' });
    res.json(request || null);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/roommate/nearby — users in same city/state (text-based)
router.get('/nearby', protect, async (req, res) => {
  try {
    const { city, state } = req.query;
    const me = req.user;

    const filterCity = city || me.location?.city;
    const filterState = state || me.location?.state;

    const query = {
      _id: { $ne: me._id },
      isBlocked: false,
      isSuspended: false,
      isLookingForRoom: true,
    };
    if (filterCity) query['location.city'] = new RegExp(filterCity, 'i');
    else if (filterState) query['location.state'] = new RegExp(filterState, 'i');

    const users = await User.find(query)
      .select('name avatar profile lifestyle budget location isVerified verificationBadge isOnline lastSeen')
      .limit(30);

    res.json({ users, total: users.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/roommate/close — close own request
router.delete('/close', protect, async (req, res) => {
  try {
    await RoommateRequest.findOneAndUpdate(
      { user: req.user._id },
      { status: 'closed' }
    );
    res.json({ message: 'Roommate profile closed.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
