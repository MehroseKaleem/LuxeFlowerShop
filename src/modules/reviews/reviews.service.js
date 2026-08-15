const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const { parsePagination, paginate } = require('../../utils/pagination');

async function recomputeProductRating(productId) {
  const agg = await prisma.review.aggregate({
    where: { productId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  await prisma.product.update({
    where: { id: productId },
    data: {
      avgRating: agg._avg.rating ? Math.round(agg._avg.rating * 100) / 100 : 0,
      reviewCount: agg._count.rating,
    },
  });
}

async function listForProduct(productSlug, query) {
  const product = await prisma.product.findUnique({ where: { slug: productSlug } });
  if (!product) throw ApiError.notFound('Product not found');

  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'rating'] });
  return paginate(prisma.review, {
    where: { productId: product.id, isApproved: true },
    pagination,
    include: { user: { select: { id: true, name: true } } },
  });
}

async function create(userId, data) {
  const product = await prisma.product.findUnique({ where: { id: Number(data.productId) } });
  if (!product) throw ApiError.notFound('Product not found');

  let orderId = null;
  if (data.orderId) {
    const order = await prisma.order.findUnique({ where: { id: Number(data.orderId) }, include: { items: true } });
    if (!order || order.userId !== userId) throw ApiError.notFound('Order not found');
    if (order.status !== 'DELIVERED') {
      throw ApiError.badRequest('You can only review products from delivered orders');
    }
    const purchased = order.items.some((item) => item.productId === product.id);
    if (!purchased) throw ApiError.badRequest('This product was not part of the specified order');
    orderId = order.id;
  }

  const existing = await prisma.review.findFirst({
    where: { userId, productId: product.id, orderId },
  });
  if (existing) throw ApiError.conflict('You have already reviewed this product for this order');

  return prisma.review.create({
    data: {
      productId: product.id,
      userId,
      orderId,
      rating: data.rating,
      title: data.title || null,
      comment: data.comment || null,
      images: data.images || undefined,
    },
  });
}

async function updateOwn(userId, reviewId, data) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== userId) throw ApiError.notFound('Review not found');

  const updated = await prisma.review.update({
    where: { id: reviewId },
    data: {
      rating: data.rating ?? review.rating,
      title: data.title ?? review.title,
      comment: data.comment ?? review.comment,
      isApproved: false,
    },
  });

  if (review.isApproved) await recomputeProductRating(review.productId);
  return updated;
}

async function deleteOwn(userId, reviewId) {
  const review = await prisma.review.findUnique({ where: { id: reviewId } });
  if (!review || review.userId !== userId) throw ApiError.notFound('Review not found');

  await prisma.review.delete({ where: { id: reviewId } });
  if (review.isApproved) await recomputeProductRating(review.productId);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function adminList(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'rating'] });
  const where = {};
  if (query.isApproved !== undefined) where.isApproved = query.isApproved === 'true';
  if (query.productId) where.productId = Number(query.productId);

  return paginate(prisma.review, {
    where,
    pagination,
    include: {
      user: { select: { id: true, name: true, email: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
  });
}

async function adminApprove(id) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound('Review not found');

  const updated = await prisma.review.update({ where: { id }, data: { isApproved: true } });
  await recomputeProductRating(review.productId);
  return updated;
}

async function adminDelete(id) {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) throw ApiError.notFound('Review not found');

  await prisma.review.delete({ where: { id } });
  if (review.isApproved) await recomputeProductRating(review.productId);
}

module.exports = { listForProduct, create, updateOwn, deleteOwn, adminList, adminApprove, adminDelete };
