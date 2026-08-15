const fs = require('fs');
const path = require('path');
const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');
const { uploadsRoot } = require('../../config/multer');
const sanitizeUser = require('../../utils/sanitizeUser');

async function updateProfile(userId, { name, phone }) {
  if (phone) {
    const existing = await prisma.user.findFirst({ where: { phone, NOT: { id: userId } } });
    if (existing) throw ApiError.conflict('This phone number is already in use');
  }

  return prisma.user.update({
    where: { id: userId },
    data: { ...(name && { name }), ...(phone && { phone }) },
  });
}

async function updateAvatar(userId, filename) {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (user.avatar) {
    const oldPath = path.join(uploadsRoot, 'avatars', path.basename(user.avatar));
    fs.promises.unlink(oldPath).catch(() => {});
  }

  const avatarUrl = `/uploads/avatars/${filename}`;
  return prisma.user.update({ where: { id: userId }, data: { avatar: avatarUrl } });
}

async function listAddresses(userId) {
  return prisma.address.findMany({ where: { userId }, orderBy: [{ isDefault: 'desc' }, { id: 'desc' }] });
}

async function createAddress(userId, data) {
  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    const count = await tx.address.count({ where: { userId } });
    return tx.address.create({
      data: { ...data, userId, isDefault: data.isDefault || count === 0 },
    });
  });
}

async function getOwnedAddress(userId, addressId) {
  const address = await prisma.address.findUnique({ where: { id: addressId } });
  if (!address || address.userId !== userId) throw ApiError.notFound('Address not found');
  return address;
}

async function updateAddress(userId, addressId, data) {
  await getOwnedAddress(userId, addressId);

  return prisma.$transaction(async (tx) => {
    if (data.isDefault) {
      await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    }
    return tx.address.update({ where: { id: addressId }, data });
  });
}

async function deleteAddress(userId, addressId) {
  await getOwnedAddress(userId, addressId);
  await prisma.address.delete({ where: { id: addressId } });
}

async function setDefaultAddress(userId, addressId) {
  await getOwnedAddress(userId, addressId);
  return prisma.$transaction(async (tx) => {
    await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
    return tx.address.update({ where: { id: addressId }, data: { isDefault: true } });
  });
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function adminListUsers(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'name', 'email'] });
  const where = {};

  if (query.role) where.role = query.role;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.search) {
    where.OR = [
      { name: { contains: query.search } },
      { email: { contains: query.search } },
      { phone: { contains: query.search } },
    ];
  }

  const { items, meta } = await paginate(prisma.user, { where, pagination });
  return { items: items.map(sanitizeUser), meta };
}

async function adminGetUser(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { addresses: true, _count: { select: { orders: true, reviews: true } } },
  });
  if (!user) throw ApiError.notFound('User not found');
  return sanitizeUser(user);
}

async function adminSetActive(userId, isActive) {
  const user = await prisma.user.update({ where: { id: userId }, data: { isActive } });
  if (!isActive) {
    await prisma.refreshToken.updateMany({ where: { userId, revoked: false }, data: { revoked: true } });
  }
  return sanitizeUser(user);
}

async function adminSetRole(userId, role) {
  const user = await prisma.user.update({ where: { id: userId }, data: { role } });
  return sanitizeUser(user);
}

module.exports = {
  updateProfile,
  updateAvatar,
  listAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  adminListUsers,
  adminGetUser,
  adminSetActive,
  adminSetRole,
};
