const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');

async function subscribe(email) {
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } });

  if (existing) {
    if (existing.isActive) throw ApiError.conflict('This email is already subscribed');
    return prisma.newsletter.update({ where: { email: normalizedEmail }, data: { isActive: true } });
  }

  return prisma.newsletter.create({ data: { email: normalizedEmail } });
}

async function unsubscribe(email) {
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } });
  if (!existing) throw ApiError.notFound('Subscription not found');

  await prisma.newsletter.update({ where: { email: normalizedEmail }, data: { isActive: false } });
}

async function adminList(query) {
  const pagination = parsePagination(query, {
    defaultSortBy: 'subscribedAt',
    allowedSortFields: ['subscribedAt', 'email'],
  });
  const where = {};
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  return paginate(prisma.newsletter, { where, pagination });
}

module.exports = { subscribe, unsubscribe, adminList };
