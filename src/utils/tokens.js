const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const env = require('../config/env');

function signAccessToken(payload) {
  // jti gives every token unique content even when issued for the same user
  // within the same second, since JWTs are otherwise deterministic (same
  // payload + same `iat` second => byte-identical token string).
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwt.accessSecret, {
    expiresIn: env.jwt.accessExpiresIn,
  });
}

function verifyAccessToken(token) {
  return jwt.verify(token, env.jwt.accessSecret);
}

function signRefreshToken(payload) {
  // Refresh tokens are hashed and stored with a DB uniqueness constraint, so
  // a same-second collision here would fail the insert outright — jti makes
  // that impossible rather than just unlikely.
  return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

function verifyRefreshToken(token) {
  return jwt.verify(token, env.jwt.refreshSecret);
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function generateRawToken(bytes = 32) {
  return crypto.randomBytes(bytes).toString('hex');
}

function msFromExpiresIn(expiresIn) {
  const match = /^(\d+)([smhd])$/.exec(expiresIn);
  if (!match) return 0;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const multipliers = { s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };
  return value * multipliers[unit];
}

module.exports = {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRawToken,
  msFromExpiresIn,
};
