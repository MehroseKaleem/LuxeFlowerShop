const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');
const { sendMail, templates } = require('../../config/mailer');
const settingsService = require('../settings/settings.service');

async function create(data) {
  const message = await prisma.contactMessage.create({
    data: {
      name: data.name,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      subject: data.subject || null,
      message: data.message,
    },
  });

  const storeEmail = await settingsService.getValue('STORE_EMAIL');
  if (storeEmail) {
    sendMail({
      to: storeEmail,
      subject: message.subject ? `New message: ${message.subject}` : 'New Contact Form Message',
      html: templates.contactNotification(message),
      replyTo: message.email,
    });
  }

  return message;
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

async function adminReply(id, replyMessage) {
  const message = await prisma.contactMessage.findUnique({ where: { id } });
  if (!message) throw ApiError.notFound('Message not found');

  await sendMail({
    to: message.email,
    subject: message.subject ? `Re: ${message.subject}` : 'Re: Your message to us',
    html: templates.contactReply(message.name, message.message, replyMessage),
  });

  return prisma.contactMessage.update({
    where: { id },
    data: { isRead: true, repliedAt: new Date() },
  });
}

module.exports = { create, adminList, adminMarkRead, adminDelete, adminReply };
