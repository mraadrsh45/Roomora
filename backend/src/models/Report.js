const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  reporter:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reported:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: {
    type: String,
    enum: ['fake-profile', 'harassment', 'spam', 'inappropriate-content', 'scam', 'other'],
    required: true,
  },
  description: { type: String },
  status: { type: String, enum: ['pending', 'resolved', 'dismissed'], default: 'pending' },
}, { timestamps: true });

const notificationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String },
  title: { type: String },
  body:  { type: String },
  data:  { type: mongoose.Schema.Types.Mixed },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const Report = mongoose.model('Report', reportSchema);
const Notification = mongoose.model('Notification', notificationSchema);

module.exports = { Report, Notification };
