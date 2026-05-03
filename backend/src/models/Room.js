const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  description: { type: String },
  rent: { type: Number, required: true },
  deposit: { type: Number, default: 0 },
  roomType: { type: String, enum: ['private', 'shared', 'entire-place'], default: 'private' },
  furnishing: { type: String, enum: ['furnished', 'semi-furnished', 'unfurnished'], default: 'furnished' },
  amenities: [{ type: String }],
  images: [{ type: String }],
  preferredGender: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
  maxOccupants: { type: Number, default: 1 },
  isAvailable: { type: Boolean, default: true },

  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  location: {
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    area: { type: String, trim: true },
    address: String,
  },
}, { timestamps: true });

// Removed 2dsphere index
roomSchema.index({ rent: 1 });
roomSchema.index({ isAvailable: 1 });

module.exports = mongoose.model('Room', roomSchema);
