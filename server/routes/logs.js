const express = require('express');
const { requireAuth } = require('../middleware/auth');
const { getLogs } = require('../controllers/logsController');

const router = express.Router();

// GET /api/logs  (protected)
router.get('/', requireAuth, getLogs);

module.exports = router;
