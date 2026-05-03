const mongoose = require('mongoose');

const roommateRequestSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  preferences: {
    budgetMin: { type: Number, default: 0 },
    budgetMax: { type: Number, default: 30000 },
    gender: { type: String, enum: ['any', 'male', 'female'], default: 'any' },
    smokingOk: { type: Boolean, default: false },
    petsOk: { type: Boolean, default: false },
    guestsOk: { type: Boolean, default: true },
    sleepTime: String,   // 'early-bird' | 'night-owl' | 'flexible'
    noiseLevel: String,  // 'quiet' | 'moderate' | 'lively'
    cleanliness: { type: Number, min: 1, max: 5 },
    occupation: String,
    bio: String,
    interests: [String],
  },

  location: {
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    area: { type: String, trim: true },
  },

  status: { type: String, enum: ['active', 'matched', 'closed'], default: 'active' },
  matchedWith: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

// Removed 2dsphere index
roommateRequestSchema.index({ status: 1 });

module.exports = mongoose.model('RoommateRequest', roommateRequestSchema);
