const { validationResult } = require('express-validator');
const Attendee = require('../models/Attendee');
const ScanLog = require('../models/ScanLog');

/**
 * POST /api/attendees/manual-entry
 * Creates a new attendee record.
 * Ensures the code is unique before saving.
 */
const manualEntry = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { firstName, lastName, email, code } = req.body;
  const upperCode = code.toUpperCase().trim();

  try {
    // Check code uniqueness
    const existing = await Attendee.findOne({ code: upperCode });
    if (existing) {
      return res.status(409).json({ error: 'Code already exists. Please use a different code.' });
    }

    const attendee = await Attendee.create({ firstName, lastName, email, code: upperCode });

    // Auto check-in: create a success scan log so this attendee is already
    // marked as checked in and won't need to be scanned at the door.
    await ScanLog.create({
      attendeeId:      attendee._id,
      code:            upperCode,
      name:            `${firstName} ${lastName}`,
      email:           email,
      scannedByUserId: req.session.userId,
      scannedByName:   req.session.userName,
      status:          'success',
    });

    return res.status(201).json({
      message: `Attendee "${firstName} ${lastName}" added and checked in successfully.`,
      attendee,
    });
  } catch (err) {
    console.error('Manual entry error:', err);
    // MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(409).json({ error: 'Code already exists. Please use a different code.' });
    }
    return res.status(500).json({ error: 'Server error during manual entry.' });
  }
};

/**
 * GET /api/attendees
 * Returns all attendees (for debug/demo purposes).
 */
const getAttendees = async (req, res) => {
  try {
    const attendees = await Attendee.find().sort({ createdAt: -1 }).lean();
    return res.json(attendees);
  } catch (err) {
    console.error('Attendees fetch error:', err);
    return res.status(500).json({ error: 'Server error fetching attendees.' });
  }
};

module.exports = { manualEntry, getAttendees };
