const express = require('express');
const router = express.Router();
const { register, login, logout, getMe, forgotPassword, resetPassword } = require('../controller/authController');
const { protect } = require('../middleware/auth');

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/logout', logout);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password/:resetToken', resetPassword);

// Protected routes
router.get('/me', protect, getMe);

module.exports = router;
