const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const ApiError = require('../../utils/ApiError');
const sanitizeUser = require('../../utils/sanitizeUser');
const { msFromExpiresIn } = require('../../utils/tokens');
const env = require('../../config/env');
const authService = require('./auth.service');

const cookieOptions = () => ({
  httpOnly: true,
  secure: env.isProd,
  sameSite: env.isProd ? 'none' : 'lax',
  maxAge: msFromExpiresIn(env.jwt.refreshExpiresIn),
  path: `${env.apiPrefix}/auth`,
});

const requestMeta = (req) => ({ userAgent: req.headers['user-agent'], ip: req.ip });

const setRefreshCookie = (res, token) => {
  res.cookie(env.jwt.refreshCookieName, token, cookieOptions());
};

const clearRefreshCookie = (res) => {
  res.clearCookie(env.jwt.refreshCookieName, { ...cookieOptions(), maxAge: undefined });
};

const register = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken);
  new ApiResponse(201, { user: sanitizeUser(user), accessToken }, 'Registration successful').send(res);
});

const login = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(req.body, requestMeta(req));
  setRefreshCookie(res, refreshToken);
  new ApiResponse(200, { user: sanitizeUser(user), accessToken }, 'Login successful').send(res);
});

const refresh = asyncHandler(async (req, res) => {
  const oldToken = req.cookies[env.jwt.refreshCookieName];
  const { user, accessToken, refreshToken } = await authService.refresh(oldToken, requestMeta(req));
  setRefreshCookie(res, refreshToken);
  new ApiResponse(200, { user: sanitizeUser(user), accessToken }, 'Token refreshed').send(res);
});

const logout = asyncHandler(async (req, res) => {
  const token = req.cookies[env.jwt.refreshCookieName];
  await authService.logout(token);
  clearRefreshCookie(res);
  new ApiResponse(200, null, 'Logged out successfully').send(res);
});

const logoutAll = asyncHandler(async (req, res) => {
  await authService.logoutAll(req.user.id);
  clearRefreshCookie(res);
  new ApiResponse(200, null, 'Logged out from all devices').send(res);
});

const me = asyncHandler(async (req, res) => {
  new ApiResponse(200, { user: sanitizeUser(req.user) }).send(res);
});

const forgotPassword = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);
  new ApiResponse(200, null, 'If that email exists, a reset link has been sent').send(res);
});

const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  new ApiResponse(200, null, 'Password reset successful. Please log in again.').send(res);
});

const verifyEmail = asyncHandler(async (req, res) => {
  await authService.verifyEmail(req.params.token);
  new ApiResponse(200, null, 'Email verified successfully').send(res);
});

const resendVerification = asyncHandler(async (req, res) => {
  await authService.resendVerification(req.user.id);
  new ApiResponse(200, null, 'Verification email sent').send(res);
});

const changePassword = asyncHandler(async (req, res) => {
  if (req.body.currentPassword === req.body.newPassword) {
    throw ApiError.badRequest('New password must be different from the current password');
  }
  await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
  new ApiResponse(200, null, 'Password changed successfully').send(res);
});

module.exports = {
  register,
  login,
  refresh,
  logout,
  logoutAll,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  changePassword,
};
