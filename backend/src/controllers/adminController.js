const User = require('../models/User');
const Room = require('../models/Room');
const { Report, Notification } = require('../models/Report');

// POST /api/reports
const createReport = async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    const existing = await Report.findOne({ reporter: req.user._id, reported: reportedUserId, status: 'pending' });
    if (existing) return res.status(400).json({ message: 'You already have a pending report for this user' });

    const report = await Report.create({ reporter: req.user._id, reported: reportedUserId, reason, description });
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/users/:id/block
const blockUser = async (req, res) => {
  try {
    const me = await User.findById(req.user._id);
    if (!me.blockedUsers.includes(req.params.id)) {
      me.blockedUsers.push(req.params.id);
      await me.save();
    }
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/notifications
const getNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ user: req.user._id }).sort({ createdAt: -1 }).limit(50);
    res.json(notifs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/read-all
const markAllRead = async (req, res) => {
  await Notification.updateMany({ user: req.user._id, isRead: false }, { isRead: true });
  res.json({ message: 'All read' });
};

// ── Admin Controllers ──────────────────────────────────────────────────────────
const adminGetUsers = async (req, res) => {
  try {
    const { page = 1, limit = 30, search } = req.query;
    const filter = {};
    if (search) filter.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    const users = await User.find(filter).select('-firebaseUid -__v').skip((parseInt(page) - 1) * parseInt(limit)).limit(parseInt(limit));
    const total = await User.countDocuments(filter);
    res.json({ users, total });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminGetReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate('reporter', 'name email avatar')
      .populate('reported', 'name email avatar')
      .sort({ createdAt: -1 });
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminResolveReport = async (req, res) => {
  try {
    const { status, adminNote } = req.body;
    const report = await Report.findByIdAndUpdate(
      req.params.id,
      { status, adminNote, reviewedBy: req.user._id, reviewedAt: new Date() },
      { new: true }
    );
    if (status === 'resolved') {
      await User.findByIdAndUpdate(report.reported, { isBlocked: true });
    }
    res.json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminDeleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await Room.deleteMany({ owner: req.params.id });
    res.json({ message: 'User and their listings removed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const adminGetAnalytics = async (req, res) => {
  try {
    const [totalUsers, totalRooms, pendingReports, activeUsers] = await Promise.all([
      User.countDocuments(),
      Room.countDocuments(),
      Report.countDocuments({ status: 'pending' }),
      User.countDocuments({ isOnline: true }),
    ]);
    const newUsersToday = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().setHours(0, 0, 0, 0)) },
    });
    res.json({ totalUsers, totalRooms, pendingReports, activeUsers, newUsersToday });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  createReport, blockUser,
  getNotifications, markAllRead,
  adminGetUsers, adminGetReports, adminResolveReport, adminDeleteUser, adminGetAnalytics,
};
