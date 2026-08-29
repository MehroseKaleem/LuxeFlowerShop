const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');
const { sendMail, templates } = require('../../config/mailer');

async function subscribe(email) {
  const normalizedEmail = email.toLowerCase();
  const existing = await prisma.newsletter.findUnique({ where: { email: normalizedEmail } });

  let subscriber;
  if (existing) {
    if (existing.isActive) throw ApiError.conflict('This email is already subscribed');
    subscriber = await prisma.newsletter.update({ where: { email: normalizedEmail }, data: { isActive: true } });
  } else {
    subscriber = await prisma.newsletter.create({ data: { email: normalizedEmail } });
  }

  // The frontend tells the customer to "watch your inbox" right after
  // subscribing - actually send something, or that's a broken promise.
  sendMail({ to: normalizedEmail, subject: "You're on the list!", html: templates.newsletterWelcome() });

  return subscriber;
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
