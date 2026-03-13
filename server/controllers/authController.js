const { validationResult } = require('express-validator');
const FrontdeskUser = require('../models/FrontdeskUser');

/**
 * POST /api/auth/login
 * Authenticates a front-desk user and creates a session.
 */
const login = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const user = await FrontdeskUser.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Store minimal user info in session
    req.session.userId = user._id.toString();
    req.session.userName = user.name;
    req.session.userEmail = user.email;

    return res.json({
      message: 'Login successful.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    console.error('Login error:', err);
    return res.status(500).json({ error: 'Server error during login.' });
  }
};

/**
 * POST /api/auth/logout
 * Destroys the current session.
 */
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'Could not log out.' });
    }
    res.clearCookie('connect.sid');
    return res.json({ message: 'Logged out successfully.' });
  });
};

/**
 * GET /api/auth/me
 * Returns current session user info (used by frontend to check auth state).
 */
const me = (req, res) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  return res.json({
    id: req.session.userId,
    name: req.session.userName,
    email: req.session.userEmail,
  });
};

module.exports = { login, logout, me };
