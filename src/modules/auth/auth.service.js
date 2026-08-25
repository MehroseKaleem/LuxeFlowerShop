const bcrypt = require('bcryptjs');
const prisma = require('../../config/prisma');
const env = require('../../config/env');
const ApiError = require('../../utils/ApiError');
const {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  hashToken,
  generateRawToken,
  msFromExpiresIn,
} = require('../../utils/tokens');
const { sendMail, templates } = require('../../config/mailer');

async function issueTokens(user, meta = {}) {
  const accessToken = signAccessToken({ sub: user.id, role: user.role });
  const refreshToken = signRefreshToken({ sub: user.id });
  const expiresAt = new Date(Date.now() + msFromExpiresIn(env.jwt.refreshExpiresIn));

  await prisma.refreshToken.create({
    data: {
      tokenHash: hashToken(refreshToken),
      userId: user.id,
      expiresAt,
      userAgent: meta.userAgent || null,
      ipAddress: meta.ip || null,
    },
  });

  return { accessToken, refreshToken };
}

async function register({ name, email, phone, password }, meta) {
  const existing = await prisma.user.findFirst({
    where: { OR: [{ email: email.toLowerCase() }, { phone }] },
  });
  if (existing) {
    throw ApiError.conflict('An account with this email or phone number already exists.');
  }

  const hashedPassword = await bcrypt.hash(password, env.bcryptSaltRounds);

  const user = await prisma.user.create({
    data: { name, email: email.toLowerCase(), phone, password: hashedPassword },
  });

  const rawToken = generateRawToken();
  await prisma.emailVerification.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  sendMail({ to: user.email, subject: 'Welcome to Luxeflower', html: templates.welcome(user.name) });
  sendMail({
    to: user.email,
    subject: 'Verify your email',
    html: templates.verifyEmail(user.name, `${env.clientUrl}/verify-email/${rawToken}`),
  });

  const tokens = await issueTokens(user, meta);
  return { user, ...tokens };
}

async function login({ identifier, password }, meta) {
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] },
  });

  if (!user) throw ApiError.unauthorized('Invalid credentials');
  if (!user.isActive) throw ApiError.forbidden('Your account has been deactivated. Contact support.');

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw ApiError.unauthorized('Invalid credentials');

  const tokens = await issueTokens(user, meta);
  return { user, ...tokens };
}

async function refresh(oldRefreshToken, meta) {
  if (!oldRefreshToken) throw ApiError.unauthorized('No refresh token provided');

  let decoded;
  try {
    decoded = verifyRefreshToken(oldRefreshToken);
  } catch (err) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const tokenHash = hashToken(oldRefreshToken);
  const stored = await prisma.refreshToken.findUnique({ where: { tokenHash } });

  if (!stored || stored.revoked || stored.expiresAt < new Date() || stored.userId !== decoded.sub) {
    throw ApiError.unauthorized('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({ where: { id: decoded.sub } });
  if (!user || !user.isActive) throw ApiError.unauthorized('Account no longer available');

  await prisma.refreshToken.update({ where: { id: stored.id }, data: { revoked: true } });
  const tokens = await issueTokens(user, meta);

  return { user, ...tokens };
}

async function logout(rawRefreshToken) {
  if (!rawRefreshToken) return;
  const tokenHash = hashToken(rawRefreshToken);
  await prisma.refreshToken.updateMany({ where: { tokenHash }, data: { revoked: true } });
}

async function logoutAll(userId) {
  await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
}

async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
  if (!user) return; // don't reveal whether the email exists

  const rawToken = generateRawToken();
  await prisma.passwordReset.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    },
  });

  await sendMail({
    to: user.email,
    subject: 'Reset your password',
    html: templates.passwordReset(user.name, `${env.clientUrl}/account/reset-password/${rawToken}`),
  });
}

async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordReset.findUnique({ where: { tokenHash } });

  if (!record || record.used || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired reset link');
  }

  const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { password: hashedPassword } }),
    prisma.passwordReset.update({ where: { id: record.id }, data: { used: true } }),
    prisma.refreshToken.updateMany({
      where: { userId: record.userId, revoked: false },
      data: { revoked: true },
    }),
  ]);
}

async function verifyEmail(rawToken) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.emailVerification.findUnique({ where: { tokenHash } });

  if (!record || record.used || record.expiresAt < new Date()) {
    throw ApiError.badRequest('Invalid or expired verification link');
  }

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { isEmailVerified: true } }),
    prisma.emailVerification.update({ where: { id: record.id }, data: { used: true } }),
  ]);
}

async function resendVerification(userId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound('User not found');
  if (user.isEmailVerified) throw ApiError.badRequest('Email is already verified');

  const rawToken = generateRawToken();
  await prisma.emailVerification.create({
    data: {
      tokenHash: hashToken(rawToken),
      userId: user.id,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  await sendMail({
    to: user.email,
    subject: 'Verify your email',
    html: templates.verifyEmail(user.name, `${env.clientUrl}/verify-email/${rawToken}`),
  });
}

async function changePassword(userId, currentPassword, newPassword) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

  const hashedPassword = await bcrypt.hash(newPassword, env.bcryptSaltRounds);
  await prisma.user.update({ where: { id: userId }, data: { password: hashedPassword } });
}

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
};
