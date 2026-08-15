function sanitizeUser(user) {
  if (!user) return user;
  const { password: _password, ...safe } = user;
  return safe;
}

module.exports = sanitizeUser;
