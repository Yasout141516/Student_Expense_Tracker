const express = require('express');
const router = express.Router();
const { register, login, getMe } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

// Public routes (no authentication required)
router.post('/register', register);  // Register new user
router.post('/login', login);        // Login user

// Protected routes (authentication required)
router.get('/me', protect, getMe);   // Get current user profile

module.exports = router;