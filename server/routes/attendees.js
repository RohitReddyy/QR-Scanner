const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { manualEntry, getAttendees } = require('../controllers/attendeesController');

const router = express.Router();

// POST /api/attendees/manual-entry  (protected)
router.post(
  '/manual-entry',
  requireAuth,
  [
    body('firstName').notEmpty().withMessage('First name is required.').trim(),
    body('lastName').notEmpty().withMessage('Last name is required.').trim(),
    body('email').isEmail().withMessage('Valid email is required.').normalizeEmail(),
    body('code').notEmpty().withMessage('Code is required.').trim(),
  ],
  manualEntry
);

// GET /api/attendees  (protected – debug/demo)
router.get('/', requireAuth, getAttendees);

module.exports = router;
