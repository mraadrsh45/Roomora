const express = require('express');
const router = express.Router();
const { protect, adminOnly } = require('../middleware/auth');
const {
  createReport, getNotifications, markAllRead,
  adminGetUsers, adminGetReports, adminResolveReport, adminDeleteUser, adminGetAnalytics,
} = require('../controllers/adminController');

// Reports
router.post('/reports', protect, createReport);

// Notifications
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read-all', protect, markAllRead);

// Admin
router.get('/admin/analytics', protect, adminOnly, adminGetAnalytics);
router.get('/admin/users', protect, adminOnly, adminGetUsers);
router.get('/admin/reports', protect, adminOnly, adminGetReports);
router.put('/admin/reports/:id', protect, adminOnly, adminResolveReport);
router.delete('/admin/users/:id', protect, adminOnly, adminDeleteUser);

module.exports = router;
