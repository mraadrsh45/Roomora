const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  firebaseUid: { type: String, unique: true, sparse: true },
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  phone: { type: String, unique: true, sparse: true },
  password: { type: String },
  avatar: { type: String, default: '' },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },

  // Access control
  isPremium: { type: Boolean, default: false },
  premiumExpiresAt: { type: Date },

  // Verification
  isVerified: { type: Boolean, default: false },
  verificationBadge: { type: Boolean, default: false },

  // Safety
  isSuspended: { type: Boolean, default: false },
  reportCount:  { type: Number, default: 0 },
  isBlocked: { type: Boolean, default: false },
  blockedUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  // Chat requests (inline embedded)
  chatRequests: [{
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    status: { type: String, enum: ['pending', 'accepted', 'rejected'], default: 'pending' },
    createdAt: { type: Date, default: Date.now },
  }],

  // Profile
  profileSetupComplete: { type: Boolean, default: false },
  profile: {
    age: Number,
    gender: String,
    occupation: String,
    bio: String,
    interests: [String],
  },
  lifestyle: {
    sleepTime: String,
    cleanliness: { type: Number, min: 1, max: 5 },
    smokingAllowed: Boolean,
    petsAllowed: Boolean,
    guestsAllowed: Boolean,
    noiseLevel: String,
    workSchedule: String,
  },
  budget: { min: Number, max: Number },
  isLookingForRoom: { type: Boolean, default: true },
  isOnline: { type: Boolean, default: false },
  lastSeen: { type: Date },

  // Location (text-based)
  location: {
    country: { type: String, trim: true },
    state: { type: String, trim: true },
    city: { type: String, trim: true },
    area: { type: String, trim: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
