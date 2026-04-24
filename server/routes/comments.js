const express = require('express');
const { query, transaction } = require('../db');
const { requireAuth } = require('../middleware/auth');
const { schemas } = require('../validation');

const router = express.Router();

router.post('/secret/:secretId', requireAuth, async (req, res, next) => {
  try {
    const data = schemas.comment.parse(req.body);
    if (data.parentId) {
      const parent = await query(
        'SELECT id, parent_id FROM comments WHERE id = :id AND secret_id = :secretId AND is_deleted = 0',
        { id: data.parentId, secretId: req.params.secretId }
      );
      if (!parent[0]) return res.status(404).json({ message: 'התגובה שאליה הגבת לא נמצאה' });
      if (parent[0].parent_id) return res.status(400).json({ message: 'אפשר להגיב רק ברמה אחת' });
    }
    const result = await transaction(async (conn) => {
      const [insert] = await conn.execute(
        'INSERT INTO comments (secret_id, user_id, parent_id, content) VALUES (:secretId, :userId, :parentId, :content)',
        { secretId: req.params.secretId, userId: req.user.id, parentId: data.parentId || null, content: data.content }
      );
      if (data.parentId) {
        await conn.execute(
          `INSERT INTO notifications (user_id, actor_id, type, secret_id, comment_id)
           SELECT c.user_id, :actor, 'comment_reply', :secretId, :commentId
           FROM comments c
           WHERE c.id = :parentId AND c.user_id <> :actor
            AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE b.blocker_id = c.user_id AND b.blocked_id = :actor)`,
          { actor: req.user.id, secretId: req.params.secretId, commentId: insert.insertId, parentId: data.parentId }
        );
      } else {
        await conn.execute(
          `INSERT INTO notifications (user_id, actor_id, type, secret_id, comment_id)
           SELECT s.user_id, :actor, 'secret_comment', s.id, :commentId
           FROM secrets s
           WHERE s.id = :secretId AND s.user_id <> :actor
            AND NOT EXISTS (SELECT 1 FROM blocked_users b WHERE b.blocker_id = s.user_id AND b.blocked_id = :actor)`,
          { actor: req.user.id, secretId: req.params.secretId, commentId: insert.insertId }
        );
      }
      return insert;
    });
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', requireAuth, async (req, res, next) => {
  try {
    const result = await query(
      'UPDATE comments SET is_deleted = 1, deleted_at = UTC_TIMESTAMP() WHERE id = :id AND user_id = :userId',
      { id: req.params.id, userId: req.user.id }
    );
    if (!result.affectedRows) return res.status(404).json({ message: 'התגובה לא נמצאה' });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.put('/:id/reaction', requireAuth, async (req, res, next) => {
  try {
    const reaction = schemas.reaction.parse(req.body.reaction);
    await query(
      `INSERT INTO comment_reactions (comment_id, user_id, reaction)
       VALUES (:commentId, :userId, :reaction)
       ON DUPLICATE KEY UPDATE reaction = VALUES(reaction), updated_at = CURRENT_TIMESTAMP`,
      { commentId: req.params.id, userId: req.user.id, reaction }
    );
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id/reaction', requireAuth, async (req, res, next) => {
  try {
    await query('DELETE FROM comment_reactions WHERE comment_id = :commentId AND user_id = :userId', { commentId: req.params.id, userId: req.user.id });
    res.json({ ok: true });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
