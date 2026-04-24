const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { schemas } = require('../validation');

const router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = schemas.report.parse(req.body);
    await query(
      `INSERT INTO reports (reporter_id, target_type, target_id, reason, details)
       VALUES (:reporterId, :targetType, :targetId, :reason, :details)
       ON DUPLICATE KEY UPDATE reason = VALUES(reason), details = VALUES(details), status = 'open', updated_at = CURRENT_TIMESTAMP`,
      { ...data, reporterId: req.user.id, details: data.details || null }
    );
    res.status(201).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
