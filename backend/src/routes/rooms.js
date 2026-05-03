const express = require('express');
const router = express.Router();
const Room = require('../models/Room');
const { protect } = require('../middleware/auth');

// GET /api/rooms — nearby rooms (free, no auth required)
router.get('/', async (req, res) => {
  try {
    const { country, state, city, area, maxRent, roomType, page = 1, limit = 20 } = req.query;
    const query = { isAvailable: true };

    // Textual location filters
    if (country) query['location.country'] = new RegExp(country, 'i');
    if (state) query['location.state'] = new RegExp(state, 'i');
    if (city) query['location.city'] = new RegExp(city, 'i');
    if (area) query['location.area'] = new RegExp(area, 'i');

    if (maxRent) query.rent = { $lte: parseFloat(maxRent) };
    if (roomType) query.roomType = roomType;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const rooms = await Room.find(query)
      .populate('owner', 'name avatar isVerified')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Room.countDocuments(query);
    res.json({ rooms, total, page: parseInt(page) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/rooms — add room (requires auth)
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, rent, deposit, roomType, furnishing,
      amenities, location, preferredGender, maxOccupants, images } = req.body;

    const room = await Room.create({
      title, description, rent, deposit, roomType, furnishing,
      amenities, preferredGender, maxOccupants, images,
      owner: req.user._id,
      location: {
        country: location.country,
        state: location.state,
        city: location.city,
        area: location.area,
        address: location.address,
      },
    });

    res.status(201).json({ room, message: 'Room listed successfully!' });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// GET /api/rooms/:id — single room
router.get('/:id', async (req, res) => {
  try {
    const room = await Room.findById(req.params.id).populate('owner', 'name avatar isVerified phone');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/rooms/:id — owner only
router.delete('/:id', protect, async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized' });
    }
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
