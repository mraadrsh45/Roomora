const express = require('express');
const router = express.Router();
const { Report } = require('../models/Report');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// POST /api/report — report a user
router.post('/', protect, async (req, res) => {
  try {
    const { reportedUserId, reason, description } = req.body;
    if (!reportedUserId || !reason) {
      return res.status(400).json({ message: 'reportedUserId and reason are required' });
    }

    // Prevent duplicate reports from same user
    const existing = await Report.findOne({ reporter: req.user._id, reported: reportedUserId });
    if (existing) return res.status(400).json({ message: 'You have already reported this user.' });

    await Report.create({ reporter: req.user._id, reported: reportedUserId, reason, description });

    // Increment report count
    const reportedUser = await User.findByIdAndUpdate(
      reportedUserId, { $inc: { reportCount: 1 } }, { new: true }
    );

    // Auto-suspend if >= 5 reports
    if (reportedUser && reportedUser.reportCount >= 5 && !reportedUser.isSuspended) {
      await User.findByIdAndUpdate(reportedUserId, { isSuspended: true });
      console.log(`⚠️ User ${reportedUserId} auto-suspended after ${reportedUser.reportCount} reports`);
    }

    res.json({ message: 'Report submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
