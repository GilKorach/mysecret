const express = require('express');
const { query } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { schemas } = require('../validation');
const { publicUser, secretRow } = require('../utils');

const router = express.Router();

router.patch('/me/profile', requireAuth, async (req, res, next) => {
  try {
    const data = schemas.profile.parse(req.body);
    await query('UPDATE users SET bio = :bio, external_link = :externalLink WHERE id = :id', {
      id: req.user.id,
      bio: data.bio || null,
      externalLink: data.externalLink || null
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.get('/:id', optionalAuth, async (req, res, next) => {
  try {
    const viewerId = req.user?.id || 0;
    const userRows = await query(
      `SELECT u.*, COUNT(f.follower_id) followers_count
       FROM users u
       LEFT JOIN followers f ON f.following_id = u.id
       WHERE u.id = :id AND u.is_active = 1
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = u.id)
             OR (b.blocker_id = u.id AND b.blocked_id = :viewerId)
        )
       GROUP BY u.id`,
      { id: req.params.id, viewerId }
    );
    if (!userRows[0]) return res.status(404).json({ message: 'המשתמש לא נמצא' });
    const secrets = await query(
      `SELECT s.*, u.nickname,
        (SELECT COUNT(*) FROM secret_reactions sr WHERE sr.secret_id = s.id) reactions_count,
        (SELECT COUNT(*) FROM comments c WHERE c.secret_id = s.id AND c.is_deleted = 0) comments_count,
        (SELECT reaction FROM secret_reactions sr WHERE sr.secret_id = s.id AND sr.user_id = :viewerId) user_reaction
       FROM secrets s
       JOIN users u ON u.id = s.user_id
       WHERE s.user_id = :id AND s.is_deleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = s.user_id)
             OR (b.blocker_id = s.user_id AND b.blocked_id = :viewerId)
        )
       ORDER BY s.created_at DESC
       LIMIT 40`,
      { id: req.params.id, viewerId }
    );
    res.json({ user: publicUser(userRows[0]), secrets: secrets.map(secretRow) });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    const followingId = Number(req.params.id);
    if (followingId === req.user.id) return res.status(400).json({ message: 'אי אפשר לעקוב אחרי עצמך' });
    await query('INSERT IGNORE INTO followers (follower_id, following_id) VALUES (:me, :them)', { me: req.user.id, them: followingId });
    await query(
      `INSERT INTO notifications (user_id, actor_id, type)
       SELECT :them, :me, 'follow'
       WHERE NOT EXISTS (
         SELECT 1 FROM blocked_users b
         WHERE (b.blocker_id = :them AND b.blocked_id = :me)
            OR (b.blocker_id = :me AND b.blocked_id = :them)
       )`,
      { me: req.user.id, them: followingId }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/follow', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM followers WHERE follower_id = :me AND following_id = :them', { me: req.user.id, them: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/block', requireAuth, async (req, res, next) => {
  try {
    const blockedId = Number(req.params.id);
    if (blockedId === req.user.id) return res.status(400).json({ message: 'אי אפשר לחסום את עצמך' });
    await query('INSERT IGNORE INTO blocked_users (blocker_id, blocked_id) VALUES (:me, :them)', { me: req.user.id, them: blockedId });
    await query(
      `DELETE FROM followers
       WHERE (follower_id = :me AND following_id = :them)
          OR (follower_id = :them AND following_id = :me)`,
      { me: req.user.id, them: blockedId }
    );
    await query(
      `DELETE FROM notifications
       WHERE (user_id = :me AND actor_id = :them)
          OR (user_id = :them AND actor_id = :me)`,
      { me: req.user.id, them: blockedId }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/block', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM blocked_users WHERE blocker_id = :me AND blocked_id = :them', { me: req.user.id, them: req.params.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
