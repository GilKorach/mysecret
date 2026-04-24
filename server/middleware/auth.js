const jwt = require('jsonwebtoken');
const { env } = require('../config');

function getToken(req) {
  const header = req.headers.authorization;
  if (header && header.startsWith('Bearer ')) return header.slice(7);
  return req.cookies?.token || null;
}

function optionalAuth(req, _res, next) {
  const token = getToken(req);
  if (!token) return next();
  try {
    req.user = jwt.verify(token, env.jwtSecret);
  } catch (_error) {
    req.user = null;
  }
  return next();
}

function requireAuth(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ message: 'נדרשת התחברות' });
  try {
    req.user = jwt.verify(token, env.jwtSecret);
    return next();
  } catch (_error) {
    return res.status(401).json({ message: 'ההתחברות פגה, יש להתחבר מחדש' });
  }
}

module.exports = { optionalAuth, requireAuth };
