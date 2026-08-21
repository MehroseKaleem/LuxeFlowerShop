const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');
const { deleteUploadedImage } = require('../../config/multer');

async function listPublic(position) {
  const now = new Date();
  return prisma.banner.findMany({
    where: {
      isActive: true,
      ...(position ? { position } : {}),
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: { sortOrder: 'asc' },
  });
}

async function adminList(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'sortOrder'] });
  const where = {};
  if (query.position) where.position = query.position;
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  return paginate(prisma.banner, { where, pagination });
}

async function adminCreate(data, file) {
  if (!file) throw ApiError.badRequest('Banner image is required');
  return prisma.banner.create({
    data: {
      title: data.title,
      imageUrl: file.url,
      link: data.link || null,
      position: data.position || 'HOME_HERO',
      sortOrder: data.sortOrder ?? 0,
      isActive: data.isActive ?? true,
      startsAt: data.startsAt || null,
      endsAt: data.endsAt || null,
    },
  });
}

async function adminUpdate(id, data, file) {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw ApiError.notFound('Banner not found');

  const updateData = { ...data };
  if (file) {
    updateData.imageUrl = file.url;
    deleteUploadedImage(banner.imageUrl).catch(() => {});
  }

  return prisma.banner.update({ where: { id }, data: updateData });
}

async function adminDelete(id) {
  const banner = await prisma.banner.findUnique({ where: { id } });
  if (!banner) throw ApiError.notFound('Banner not found');

  await prisma.banner.delete({ where: { id } });
  deleteUploadedImage(banner.imageUrl).catch(() => {});
}

module.exports = { listPublic, adminList, adminCreate, adminUpdate, adminDelete };
