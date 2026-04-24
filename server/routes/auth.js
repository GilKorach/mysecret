const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../db');
const { env } = require('../config');
const { requireAuth } = require('../middleware/auth');
const { schemas } = require('../validation');
const { publicUser } = require('../utils');

const router = express.Router();

function sign(user) {
  return jwt.sign({ id: user.id, nickname: user.nickname }, env.jwtSecret, { expiresIn: env.jwtExpiresIn });
}

router.post('/register', async (req, res, next) => {
  try {
    const data = schemas.register.parse(req.body);
    const hash = await bcrypt.hash(data.password, 12);
    const result = await query(
      `INSERT INTO users (nickname, email, password_hash, gender, birth_date)
       VALUES (:nickname, :email, :hash, :gender, :birthDate)`,
      { ...data, hash }
    );
    const user = { id: result.insertId, nickname: data.nickname };
    const token = sign(user);
    res.cookie('token', token, cookieOptions());
    res.status(201).json({ token, user });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'הכינוי או האימייל כבר קיימים' });
    return next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = schemas.login.parse(req.body);
    const rows = await query('SELECT * FROM users WHERE email = :email AND is_active = 1 LIMIT 1', { email: data.email });
    const user = rows[0];
    if (!user || !(await bcrypt.compare(data.password, user.password_hash))) {
      return res.status(401).json({ message: 'אימייל או סיסמה שגויים' });
    }
    const token = sign(user);
    res.cookie('token', token, cookieOptions());
    res.json({ token, user: { id: user.id, nickname: user.nickname } });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (_req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const rows = await query(
      `SELECT u.*, COUNT(f.follower_id) followers_count
       FROM users u
       LEFT JOIN followers f ON f.following_id = u.id
       WHERE u.id = :id
       GROUP BY u.id`,
      { id: req.user.id }
    );
    res.json({ user: publicUser(rows[0]) });
  } catch (error) {
    next(error);
  }
});

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.nodeEnv === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  };
}

module.exports = router;
