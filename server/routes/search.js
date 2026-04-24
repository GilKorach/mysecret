const express = require('express');
const { query } = require('../db');
const { optionalAuth } = require('../middleware/auth');
const { publicUser, secretRow } = require('../utils');

const router = express.Router();

router.get('/', optionalAuth, async (req, res, next) => {
  try {
    const q = String(req.query.q || '').trim();
    if (q.length < 2) return res.json({ users: [], secrets: [] });
    const viewerId = req.user?.id || 0;
    const users = await query(
      `SELECT u.*, COUNT(f.follower_id) followers_count
       FROM users u
       LEFT JOIN followers f ON f.following_id = u.id
       WHERE u.nickname LIKE :like AND u.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = :viewerId)
        )
       GROUP BY u.id
       LIMIT 20`,
      { like: `%${q}%`, viewerId }
    );
    const secrets = await query(
      `SELECT s.*, u.nickname,
        (SELECT COUNT(*) FROM secret_reactions sr WHERE sr.secret_id = s.id) reactions_count,
        (SELECT COUNT(*) FROM comments c WHERE c.secret_id = s.id AND c.is_deleted = 0) comments_count,
        (SELECT reaction FROM secret_reactions sr WHERE sr.secret_id = s.id AND sr.user_id = :viewerId) user_reaction
       FROM secrets s
       JOIN users u ON u.id = s.user_id
       WHERE s.is_deleted = 0 AND (s.content LIKE :like OR s.title LIKE :like)
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = s.user_id)
             OR (b.blocker_id = s.user_id AND b.blocked_id = :viewerId)
        )
       ORDER BY s.created_at DESC
       LIMIT 30`,
      { like: `%${q}%`, viewerId }
    );
    res.json({ users: users.map(publicUser), secrets: secrets.map(secretRow) });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
