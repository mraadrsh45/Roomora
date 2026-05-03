const express = require('express');
const router = express.Router();
const { firebaseLogin, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/firebase', firebaseLogin);
router.get('/me', protect, getMe);

module.exports = router;
