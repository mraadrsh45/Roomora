const Room = require('../models/Room');

// POST /api/rooms
const createRoom = async (req, res) => {
  try {
    const { title, description, rent, deposit, amenities, roomType, furnishing, availableFrom, location, preferredGender, maxOccupants, images } = req.body;
    const room = await Room.create({
      owner: req.user._id,
      title, description, rent, deposit, amenities, roomType, furnishing, availableFrom,
      location: {
        type: 'Point',
        coordinates: [parseFloat(location.lng), parseFloat(location.lat)],
        address: location.address,
        city: location.city,
        pincode: location.pincode,
      },
      preferredGender, maxOccupants, images: images || [],
    });
    await room.populate('owner', 'name avatar isVerified');
    res.status(201).json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// GET /api/rooms — with geo + budget filters
const getRooms = async (req, res) => {
  try {
    const { lat, lng, radius = 10, minRent, maxRent, roomType, furnishing, page = 1, limit = 20 } = req.query;
    const filter = { isAvailable: true };

    if (roomType) filter.roomType = roomType;
    if (furnishing) filter.furnishing = furnishing;
    if (minRent || maxRent) {
      filter.rent = {};
      if (minRent) filter.rent.$gte = parseInt(minRent);
      if (maxRent) filter.rent.$lte = parseInt(maxRent);
    }

    let rooms;
    if (lat && lng) {
      filter.location = {
        $near: {
          $geometry: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
          $maxDistance: parseFloat(radius) * 1000,
        },
      };
    }

    rooms = await Room.find(filter)
      .populate('owner', 'name avatar isVerified verificationBadge')
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit))
      .lean();

    res.json({ rooms, total: rooms.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/rooms/:id
const getRoomById = async (req, res) => {
  try {
    const room = await Room.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('owner', 'name avatar isVerified verificationBadge profile lifestyle');
    if (!room) return res.status(404).json({ message: 'Room not found' });
    res.json(room);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/rooms/:id
const updateRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Not authorized' });

    Object.assign(room, req.body);
    await room.save();
    res.json(room);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// DELETE /api/rooms/:id
const deleteRoom = async (req, res) => {
  try {
    const room = await Room.findById(req.params.id);
    if (!room) return res.status(404).json({ message: 'Room not found' });
    if (room.owner.toString() !== req.user._id.toString() && req.user.role !== 'admin')
      return res.status(403).json({ message: 'Not authorized' });
    await room.deleteOne();
    res.json({ message: 'Room deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { createRoom, getRooms, getRoomById, updateRoom, deleteRoom };
