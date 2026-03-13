const mongoose = require('mongoose');

const scanLogSchema = new mongoose.Schema({
  // Null when the scanned code was not found in the attendees collection
  attendeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attendee',
    default: null,
  },
  code: {
    type: String,
    required: true,
    trim: true,
  },
  // Resolved attendee name (empty string on failure)
  name: {
    type: String,
    default: '',
  },
  // Resolved attendee email (empty string on failure)
  email: {
    type: String,
    default: '',
  },
  scannedByUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FrontdeskUser',
    required: true,
  },
  scannedByName: {
    type: String,
    required: true,
  },
  // 'success' | 'failure'
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
  },
  scannedAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('ScanLog', scanLogSchema);
