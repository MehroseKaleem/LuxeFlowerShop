const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');

async function list(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'expiresAt', 'usedCount', 'code'] });
  const where = {};
  const now = new Date();

  if (query.search) where.code = { contains: query.search.toUpperCase() };
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.status === 'expired') where.expiresAt = { lt: now };
  if (query.status === 'upcoming') where.startsAt = { gt: now };
  if (query.status === 'live') {
    where.isActive = true;
    where.expiresAt = { gte: now };
  }

  return paginate(prisma.coupon, { where, pagination });
}

async function get(id) {
  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: { usages: { orderBy: { usedAt: 'desc' }, take: 20, include: { user: { select: { id: true, name: true, email: true } } } } },
  });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return coupon;
}

async function create(data) {
  const code = data.code.trim().toUpperCase();
  const existing = await prisma.coupon.findUnique({ where: { code } });
  if (existing) throw ApiError.conflict('A coupon with this code already exists');

  if (data.discountType === 'PERCENTAGE' && Number(data.discountValue) > 100) {
    throw ApiError.badRequest('Percentage discount cannot exceed 100');
  }

  return prisma.coupon.create({
    data: {
      code,
      description: data.description || null,
      discountType: data.discountType,
      discountValue: data.discountValue,
      minOrderAmount: data.minOrderAmount || null,
      maxDiscountAmount: data.maxDiscountAmount || null,
      usageLimit: data.usageLimit || null,
      usageLimitPerUser: data.usageLimitPerUser ?? 1,
      startsAt: data.startsAt || null,
      expiresAt: data.expiresAt,
      isActive: data.isActive ?? true,
    },
  });
}

async function update(id, data) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  const updateData = {};
  const fields = [
    'description',
    'discountType',
    'discountValue',
    'minOrderAmount',
    'maxDiscountAmount',
    'usageLimit',
    'usageLimitPerUser',
    'startsAt',
    'expiresAt',
    'isActive',
  ];
  for (const field of fields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  if (data.code && data.code.trim().toUpperCase() !== coupon.code) {
    const newCode = data.code.trim().toUpperCase();
    const existing = await prisma.coupon.findFirst({ where: { code: newCode, NOT: { id } } });
    if (existing) throw ApiError.conflict('A coupon with this code already exists');
    updateData.code = newCode;
  }

  const effectiveType = updateData.discountType || coupon.discountType;
  const effectiveValue = updateData.discountValue !== undefined ? updateData.discountValue : coupon.discountValue;
  if (effectiveType === 'PERCENTAGE' && Number(effectiveValue) > 100) {
    throw ApiError.badRequest('Percentage discount cannot exceed 100');
  }

  return prisma.coupon.update({ where: { id }, data: updateData });
}

async function toggleActive(id) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw ApiError.notFound('Coupon not found');
  return prisma.coupon.update({ where: { id }, data: { isActive: !coupon.isActive } });
}

async function remove(id) {
  const coupon = await prisma.coupon.findUnique({ where: { id } });
  if (!coupon) throw ApiError.notFound('Coupon not found');

  if (coupon.usedCount > 0) {
    throw ApiError.badRequest(
      'This coupon has already been used by customers and cannot be deleted. Deactivate it instead.',
    );
  }

  await prisma.coupon.delete({ where: { id } });
}

module.exports = { list, get, create, update, toggleActive, remove };
