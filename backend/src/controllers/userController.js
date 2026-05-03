const User = require('../models/User');

// Compatibility scoring engine
const calculateCompatibility = (userA, userB) => {
  let score = 0;
  const reasons = [];

  // 1. Location match (30 pts)
  const locA = userA.location || {};
  const locB = userB.location || {};
  if (locA.city && locB.city && locA.city.toLowerCase() === locB.city.toLowerCase()) {
    score += 20;
    reasons.push(`Same city (${locA.city})`);
    if (locA.area && locB.area && locA.area.toLowerCase() === locB.area.toLowerCase()) {
      score += 10;
      reasons.push(`Same area (${locA.area})`);
    }
  } else if (locA.state && locB.state && locA.state.toLowerCase() === locB.state.toLowerCase()) {
    score += 5;
    reasons.push(`Same state (${locA.state})`);
  }

  // 2. Budget overlap (25 pts)
  const aMin = userA.budget?.min || 0;
  const aMax = userA.budget?.max || 50000;
  const bMin = userB.budget?.min || 0;
  const bMax = userB.budget?.max || 50000;
  const overlap = Math.min(aMax, bMax) - Math.max(aMin, bMin);
  if (overlap > 0) {
    score += 25;
    reasons.push('Budget ranges overlap');
  }

  // 3. Lifestyle (45 pts total)
  const la = userA.lifestyle || {};
  const lb = userB.lifestyle || {};

  if (la.sleepTime && lb.sleepTime && la.sleepTime === lb.sleepTime) {
    score += 15;
    reasons.push(`Same sleep schedule (${la.sleepTime.replace('-', ' ')})`);
  }
  if (la.noiseLevel && lb.noiseLevel && la.noiseLevel === lb.noiseLevel) {
    score += 10;
    reasons.push(`Similar noise preference (${la.noiseLevel})`);
  }
  if (la.smokingAllowed !== undefined && lb.smokingAllowed !== undefined && la.smokingAllowed === lb.smokingAllowed) {
    score += 8;
    reasons.push(la.smokingAllowed ? 'Both okay with smoking' : 'Both prefer no smoking');
  }
  if (la.petsAllowed !== undefined && lb.petsAllowed !== undefined && la.petsAllowed === lb.petsAllowed) {
    score += 7;
    reasons.push(la.petsAllowed ? 'Both love pets' : 'Both prefer no pets');
  }
  if (la.cleanliness && lb.cleanliness) {
    const diff = Math.abs(la.cleanliness - lb.cleanliness);
    if (diff === 0) { score += 5; reasons.push('Same cleanliness standards'); }
    else if (diff === 1) { score += 2; }
  }

  // Shared interests (bonus up to 10 pts)
  const interestsA = userA.profile?.interests || [];
  const interestsB = userB.profile?.interests || [];
  const shared = interestsA.filter((i) => interestsB.includes(i));
  if (shared.length > 0) {
    const pts = Math.min(10, shared.length * 3);
    score += pts;
    reasons.push(`${shared.length} shared interest${shared.length > 1 ? 's' : ''}: ${shared.slice(0, 3).join(', ')}`);
  }

  return {
    score: Math.min(score, 100),
    reasons,
    grade: score >= 80 ? 'Excellent' : score >= 60 ? 'Good' : score >= 40 ? 'Fair' : 'Low',
  };
};

// GET /api/users/nearby — text-based city/state match
const getNearbyUsers = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const { city, state, page = 1, limit = 20 } = req.query;

    const filterCity = city || me.location?.city;
    const filterState = state || me.location?.state;

    const query = {
      _id: { $ne: req.user._id },
      isBlocked: false,
      isSuspended: false,
      isLookingForRoom: true,
    };

    if (filterCity) query['location.city'] = new RegExp(filterCity, 'i');
    else if (filterState) query['location.state'] = new RegExp(filterState, 'i');

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const users = await User.find(query)
      .select('name avatar profile lifestyle budget location isVerified verificationBadge isOnline lastSeen')
      .skip(skip)
      .limit(parseInt(limit));

    const enriched = users.map((u) => {
      const compat = calculateCompatibility(me, u);
      // Derive a "nearby" label from shared city/area
      const locationMatch = (() => {
        const locA = me.location || {};
        const locU = u.location || {};
        if (locA.area && locU.area && locA.area.toLowerCase() === locU.area.toLowerCase())
          return `Same area (${locU.area})`;
        if (locA.city && locU.city && locA.city.toLowerCase() === locU.city.toLowerCase())
          return `Same city (${locU.city})`;
        if (locA.state && locU.state && locA.state.toLowerCase() === locU.state.toLowerCase())
          return `Same state (${locU.state})`;
        return null;
      })();
      return { ...u.toObject(), compatibility: compat, locationMatch };
    });

    res.json({ users: enriched, total: enriched.length });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// GET /api/users/matches — sorted by location > budget > lifestyle
const getMatches = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    const isPremium = me.isPremium;
    const MATCH_LIMIT = isPremium ? 50 : 20;

    const candidates = await User.find({
      _id: { $ne: me._id },
      isBlocked: false,
      isSuspended: false,
      isLookingForRoom: true,
    }).select('name avatar profile lifestyle budget location isVerified verificationBadge isOnline lastSeen');

    const scored = candidates
      .map((u) => {
        const compat = calculateCompatibility(me, u);
        return { ...u.toObject(), compatibility: compat };
      })
      .filter((u) => u.compatibility.score >= 20)
      .sort((a, b) => b.compatibility.score - a.compatibility.score)
      .slice(0, MATCH_LIMIT);

    res.json(scored);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

// PUT /api/users/profile
const updateProfile = async (req, res) => {
  try {
    const allowed = ['name', 'avatar', 'profile', 'lifestyle', 'budget', 'isLookingForRoom', 'location', 'profileSetupComplete'];
    const updates = {};
    allowed.forEach((k) => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    // Auto-mark profile complete if key fields present
    if (updates.profile?.age && updates.profile?.gender && updates.name && !updates.profileSetupComplete) {
      updates.profileSetupComplete = true;
    }

    const user = await User.findByIdAndUpdate(
      req.user._id, { $set: updates }, { new: true, runValidators: true }
    ).select('-__v -password -firebaseUid');
    res.json(user);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// PUT /api/users/location — simple text-based
const updateLocation = async (req, res) => {
  try {
    const { country, state, city, area } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { location: { country, state, city, area } } },
      { new: true }
    );
    res.json({ location: user.location });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/users/:id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-firebaseUid -blockedUsers -chatRequests -__v -password')
      .lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const compat = calculateCompatibility(req.user, user);
    res.json({ ...user, compatibility: compat });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getNearbyUsers, getMatches, updateProfile, updateLocation, getUserById, calculateCompatibility };
