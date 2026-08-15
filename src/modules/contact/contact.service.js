const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');

async function create(data) {
  return prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    },
  });
}

async function adminList(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt'] });
  const where = {};
  if (query.isRead !== undefined) where.isRead = query.isRead === 'true';
  return paginate(prisma.contactMessage, { where, pagination });
}

async function adminMarkRead(id) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw ApiError.notFound('Message not found');
  return prisma.contactMessage.update({ where: { id }, data: { isRead: true } });
}

async function adminDelete(id) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw ApiError.notFound('Message not found');
  await prisma.contactMessage.delete({ where: { id } });
}

module.exports = { create, adminList, adminMarkRead, adminDelete };
