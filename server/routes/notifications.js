const express = require('express');
const { query } = require('../db');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT n.*, a.nickname actor_nickname, s.slug secret_slug
       FROM notifications n
       LEFT JOIN users a ON a.id = n.actor_id
       LEFT JOIN secrets s ON s.id = n.secret_id
       WHERE n.user_id = :id
         AND (n.secret_id IS NULL OR s.is_deleted = 0)
         AND NOT EXISTS (
           SELECT 1 FROM blocked_users b
           WHERE n.actor_id IS NOT NULL
             AND (
               (b.blocker_id = :id AND b.blocked_id = n.actor_id)
               OR (b.blocker_id = n.actor_id AND b.blocked_id = :id)
             )
         )
       ORDER BY n.created_at DESC
       LIMIT 80`,
      { id: req.user.id }
    );
    res.json({ notifications: rows });
  } catch (error) {
    next(error);
  }
});

router.post('/read-all', requireAuth, async (req, res, next) => {
  try {
    await query('UPDATE notifications SET is_read = 1 WHERE user_id = :id', { id: req.user.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
