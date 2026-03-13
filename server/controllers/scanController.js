const { validationResult } = require('express-validator');
const Attendee = require('../models/Attendee');
const ScanLog = require('../models/ScanLog');

/**
 * POST /api/scan
 * Validates the scanned QR code against the attendees collection,
 * then records a success or failure log entry.
 */
const processScan = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { code } = req.body;
  const scannedByUserId = req.session.userId;
  const scannedByName = req.session.userName;

  try {
    // Look up the attendee by their unique code (case-insensitive)
    const attendee = await Attendee.findOne({ code: code.toUpperCase() });

    if (attendee) {
      const fullName = `${attendee.firstName} ${attendee.lastName}`;

      // ── Duplicate check: already successfully scanned? ────────────────────
      const existing = await ScanLog.findOne({ attendeeId: attendee._id, status: 'success' });
      if (existing) {
        return res.status(409).json({
          status: 'duplicate',
          message: `${fullName} is already checked in.`,
        });
      }

      // ── Success path ──────────────────────────────────────────────────────
      await ScanLog.create({
        attendeeId: attendee._id,
        code: attendee.code,
        name: fullName,
        email: attendee.email,
        scannedByUserId,
        scannedByName,
        status: 'success',
      });

      return res.json({
        status: 'success',
        message: `${fullName} scanned successfully.`,
        attendee: {
          name: fullName,
          email: attendee.email,
          code: attendee.code,
        },
      });
    } else {
      // ── Failure path ──────────────────────────────────────────────────────
      await ScanLog.create({
        attendeeId: null,
        code: code.toUpperCase(),
        name: '',
        email: '',
        scannedByUserId,
        scannedByName,
        status: 'failure',
      });

      return res.status(404).json({
        status: 'failure',
        message: 'Scan failed. Code not found.',
      });
    }
  } catch (err) {
    console.error('Scan error:', err);
    return res.status(500).json({ error: 'Server error during scan.' });
  }
};

module.exports = { processScan };
