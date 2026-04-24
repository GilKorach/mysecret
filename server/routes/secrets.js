const express = require('express');
const { query, transaction } = require('../db');
const { requireAuth, optionalAuth } = require('../middleware/auth');
const { schemas } = require('../validation');
const { makeTitle, makeSlug, secretRow } = require('../utils');

const router = express.Router();

const selectSecret = `
  SELECT s.*, u.nickname,
    (SELECT COUNT(*) FROM secret_reactions sr WHERE sr.secret_id = s.id) reactions_count,
    (SELECT COUNT(*) FROM comments c WHERE c.secret_id = s.id AND c.is_deleted = 0) comments_count,
    (SELECT reaction FROM secret_reactions sr WHERE sr.secret_id = s.id AND sr.user_id = :viewerId) user_reaction
  FROM secrets s
  JOIN users u ON u.id = s.user_id
`;

router.get('/feed', optionalAuth, async (req, res, next) => {
  try {
    const viewerId = req.user?.id || 0;
    const limit = Math.min(Number(req.query.limit || 20), 50);
    const offset = Number(req.query.offset || 0);
    const rows = await query(
      `${selectSecret}
       LEFT JOIN followers f ON f.following_id = s.user_id AND f.follower_id = :viewerId
       WHERE s.is_deleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = s.user_id)
             OR (b.blocker_id = s.user_id AND b.blocked_id = :viewerId)
        )
       ORDER BY
        (CASE WHEN f.follower_id IS NOT NULL THEN 8 ELSE 0 END) +
        (SELECT COUNT(*) FROM secret_reactions sr WHERE sr.secret_id = s.id) * 3 +
        (SELECT COUNT(*) FROM comments c WHERE c.secret_id = s.id AND c.is_deleted = 0) * 4 +
        GREATEST(0, 48 - TIMESTAMPDIFF(HOUR, s.created_at, UTC_TIMESTAMP())) DESC,
        s.created_at DESC
       LIMIT ${limit} OFFSET ${offset}`,
      { viewerId }
    );
    res.json({ secrets: rows.map(secretRow), nextOffset: offset + rows.length });
  } catch (error) {
    next(error);
  }
});

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const data = schemas.secret.parse(req.body);
    const recent = await query(
      'SELECT id FROM secrets WHERE user_id = :id AND is_deleted = 0 AND created_at > (UTC_TIMESTAMP() - INTERVAL 24 HOUR) LIMIT 1',
      { id: req.user.id }
    );
    if (recent.length) return res.status(429).json({ message: 'אפשר לפרסם סוד אחד בכל 24 שעות' });
    const title = makeTitle(data.content);
    const slug = makeSlug(title);
    const result = await query(
      `INSERT INTO secrets (user_id, content, title, slug, background_preset, background_color, text_color, text_align)
       VALUES (:userId, :content, :title, :slug, :backgroundPreset, :backgroundColor, :textColor, :textAlign)`,
      { ...data, userId: req.user.id, title, slug }
    );
    const rows = await query(`${selectSecret} WHERE s.id = :id`, { id: result.insertId, viewerId: req.user.id });
    res.status(201).json({ secret: secretRow(rows[0]) });
  } catch (error) {
    next(error);
  }
});

router.get('/:id/:slug?', optionalAuth, async (req, res, next) => {
  try {
    const viewerId = req.user?.id || 0;
    const rows = await query(
      `${selectSecret}
       WHERE s.id = :id AND s.is_deleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = s.user_id)
             OR (b.blocker_id = s.user_id AND b.blocked_id = :viewerId)
        )`,
      { id: req.params.id, viewerId }
    );
    if (!rows[0]) return res.status(404).json({ message: 'הסוד לא נמצא' });
    const comments = await query(
      `SELECT c.*, u.nickname,
        (SELECT COUNT(*) FROM comment_reactions cr WHERE cr.comment_id = c.id) reactions_count,
        (SELECT reaction FROM comment_reactions cr WHERE cr.comment_id = c.id AND cr.user_id = :viewerId) user_reaction
       FROM comments c
       JOIN users u ON u.id = c.user_id
       WHERE c.secret_id = :id AND c.is_deleted = 0
        AND NOT EXISTS (
          SELECT 1 FROM blocked_users b
          WHERE (b.blocker_id = :viewerId AND b.blocked_id = c.user_id)
             OR (b.blocker_id = c.user_id AND b.blocked_id = :viewerId)
        )
       ORDER BY COALESCE(c.parent_id, c.id), c.parent_id IS NOT NULL, c.created_at ASC`,
      { id: req.params.id, viewerId }
    );
    res.json({ secret: secretRow(rows[0]), comments });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE secrets SET is_deleted = 1, deleted_at = UTC_TIMESTAMP() WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.user.id }
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'הסוד לא נמצא' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/reaction', requireAuth, async (req, res, next) => {
  try {
    const reaction = schemas.reaction.parse(req.body.reaction);
    await transaction(async (conn) => {
      await conn.execute(
        `INSERT INTO secret_reactions (secret_id, user_id, reaction)
         VALUES (:secretId, :userId, :reaction)
         ON DUPLICATE KEY UPDATE reaction = VALUES(reaction), updated_at = CURRENT_TIMESTAMP`,
        { secretId: req.params.id, userId: req.user.id, reaction }
      );
      await conn.execute(
        `INSERT INTO notifications (user_id, actor_id, type, secret_id)
         SELECT s.user_id, :actor, 'secret_reaction', s.id
         FROM secrets s
         WHERE s.id = :secretId AND s.user_id <> :actor
          AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE b.blocker_id = s.user_id AND b.blocked_id = :actor)`,
        { secretId: req.params.id, actor: req.user.id }
      );
    });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/reaction', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM secret_reactions WHERE secret_id = :secretId AND user_id = :userId', { secretId: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
