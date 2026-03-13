const express = require('express');
const { body } = require('express-validator');
const { requireAuth } = require('../middleware/auth');
const { processScan } = require('../controllers/scanController');

const router = express.Router();

// POST /api/scan  (protected)
router.post(
  '/',
  requireAuth,
  [body('code').notEmpty().withMessage('Code is required.').trim()],
  processScan
);

module.exports = router;
