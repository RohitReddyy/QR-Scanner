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
 * Returns all attendees. Supports ?search=<term> to filter by name or email.
 * Also annotates each attendee with checkedIn: true/false.
 */
const getAttendees = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [
        { firstName: regex },
        { lastName: regex },
        { email: regex },
        { code: regex },
      ];
    }

    const attendees = await Attendee.find(filter).sort({ createdAt: -1 }).lean();

    // Look up which attendees already have a success scan log
    const checkedInIds = await ScanLog.distinct('attendeeId', { status: 'success' });
    const checkedInSet = new Set(checkedInIds.map(String));

    const result = attendees.map((a) => ({
      ...a,
      checkedIn: checkedInSet.has(String(a._id)),
    }));

    return res.json(result);
  } catch (err) {
    console.error('Attendees fetch error:', err);
    return res.status(500).json({ error: 'Server error fetching attendees.' });
  }
};

/**
 * POST /api/attendees/:id/checkin
 * Manually checks in an attendee by ID (used from the Registered Users page).
 */
const checkInById = async (req, res) => {
  try {
    const attendee = await Attendee.findById(req.params.id);
    if (!attendee) {
      return res.status(404).json({ error: 'Attendee not found.' });
    }

    const fullName = `${attendee.firstName} ${attendee.lastName}`;

    // Prevent duplicate check-in
    const existing = await ScanLog.findOne({ attendeeId: attendee._id, status: 'success' });
    if (existing) {
      return res.status(409).json({ error: `${fullName} is already checked in.` });
    }

    await ScanLog.create({
      attendeeId:      attendee._id,
      code:            attendee.code,
      name:            fullName,
      email:           attendee.email,
      scannedByUserId: req.session.userId,
      scannedByName:   req.session.userName,
      status:          'success',
    });

    return res.json({ message: `${fullName} checked in successfully.` });
  } catch (err) {
    console.error('Check-in error:', err);
    return res.status(500).json({ error: 'Server error during check-in.' });
  }
};

module.exports = { manualEntry, getAttendees, checkInById };
