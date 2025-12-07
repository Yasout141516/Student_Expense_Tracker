const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Generate JWT Token
// This creates a secure token containing user ID
const generateToken = (id) => {
  return jwt.sign(
    { id },                          // Payload: user ID
    process.env.JWT_SECRET,          // Secret key from .env
    { expiresIn: process.env.JWT_EXPIRE || '30d' }  // Token expires in 30 days
  );
};

// @desc    Register new user
// @route   POST /api/auth/register
// @access  Public (anyone can register)
const register = async (req, res) => {
  try {
    const { name, email, password, currency } = req.body;

    // Validation: Check if all required fields are provided
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide name, email and password'
      });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    // Password will be automatically hashed by the pre-save hook in User model
    const user = await User.create({
      name,
      email,
      password,
      currency: currency || 'HKD'  // Default to HKD if not provided
    });

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response with user data and token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        token  // Frontend will store this token
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during registration',
      error: error.message
    });
  }
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation: Check if email and password are provided
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }

    // Find user by email and include password field
    // (password is excluded by default due to select: false in model)
    const user = await User.findOne({ email }).select('+password');

    // Check if user exists
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password using method defined in User model
    const isPasswordMatch = await user.comparePassword(password);

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate JWT token
    const token = generateToken(user._id);

    // Send response with user data and token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error during login',
      error: error.message
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private (requires authentication)
const getMe = async (req, res) => {
  try {
    // req.user is set by protect middleware
    const user = await User.findById(req.user._id);

    res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        currency: user.currency,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error',
      error: error.message
    });
  }
};

// Export all controller functions
module.exports = {
  register,
  login,
  getMe
};