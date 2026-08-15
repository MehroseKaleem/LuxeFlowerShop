const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');

async function list(userId) {
  return prisma.wishlist.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    include: {
      product: {
        include: { images: { where: { isPrimary: true }, take: 1 } },
      },
    },
  });
}

async function add(userId, productId) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  const existing = await prisma.wishlist.findUnique({ where: { userId_productId: { userId, productId } } });
  if (existing) return existing;

  return prisma.wishlist.create({ data: { userId, productId } });
}

async function remove(userId, productId) {
  const existing = await prisma.wishlist.findUnique({ where: { userId_productId: { userId, productId } } });
  if (!existing) throw ApiError.notFound('Product not in wishlist');
  await prisma.wishlist.delete({ where: { id: existing.id } });
}

module.exports = { list, add, remove };
