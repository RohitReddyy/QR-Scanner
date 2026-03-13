const ScanLog = require('../models/ScanLog');

/**
 * GET /api/logs
 * Returns all scan logs sorted newest-first.
 * Optional query params: ?search=<term> to filter by name or code.
 */
const getLogs = async (req, res) => {
  try {
    const { search } = req.query;
    const filter = {};

    if (search) {
      const regex = new RegExp(search, 'i');
      filter.$or = [{ name: regex }, { code: regex }, { email: regex }];
    }

    const logs = await ScanLog.find(filter).sort({ scannedAt: -1 }).lean();
    return res.json(logs);
  } catch (err) {
    console.error('Logs fetch error:', err);
    return res.status(500).json({ error: 'Server error fetching logs.' });
  }
};

module.exports = { getLogs };
