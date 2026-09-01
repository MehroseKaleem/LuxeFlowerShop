const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const slugify = require('../../utils/slugify');
const { parsePagination, paginate } = require('../../utils/pagination');
const { deleteUploadedImage } = require('../../config/multer');

const CATEGORY_SELECT = { id: true, name: true, slug: true };

// Full detail payload — product detail page, admin edit form (needs every
// linked category checked in the checkbox list, all images, all variants).
const DETAIL_INCLUDE = {
  images: { orderBy: { sortOrder: 'asc' } },
  variants: { where: { isActive: true }, orderBy: { id: 'asc' } },
  tags: { include: { tag: true } },
  categories: { include: { category: { select: CATEGORY_SELECT } } },
};

// Lean payload for grid/listing views — name, price, short description and
// one image per card, so paginating through a large catalog stays cheap.
const LIST_SELECT = {
  id: true,
  name: true,
  slug: true,
  shortDescription: true,
  basePrice: true,
  discountPrice: true,
  isFeatured: true,
  avgRating: true,
  reviewCount: true,
  images: { where: { isPrimary: true }, take: 1 },
  categories: { include: { category: { select: CATEGORY_SELECT } } },
};

// Uses the MySQL FULLTEXT index on (name, shortDescription) instead of a
// LIKE '%term%' scan, which can't use any index and gets slower as the
// catalog grows. BOOLEAN MODE with a trailing wildcard per word gives
// prefix matching ("ros" matches "roses") and treats multiple words as
// "any of these" rather than requiring the exact phrase, which is closer
// to what shoppers expect from a search box.
async function fullTextSearchProductIds(rawSearch) {
  const words = rawSearch
    .replace(/[+\-<>()~*"@]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 2);

  if (!words.length) return null;

  const booleanQuery = words.map((w) => `${w}*`).join(' ');
  const rows = await prisma.$queryRaw`
    SELECT id FROM products
    WHERE MATCH(name, shortDescription) AGAINST(${booleanQuery} IN BOOLEAN MODE)
  `;
  return rows.map((r) => r.id);
}

function serializeProduct(product) {
  if (!product) return product;
  return {
    ...product,
    tags: product.tags ? product.tags.map((pt) => pt.tag) : undefined,
    categories: product.categories ? product.categories.map((pc) => pc.category) : undefined,
  };
}

function toIdArray(value) {
  const arr = Array.isArray(value) ? value : [value];
  return [...new Set(arr.map((v) => Number(v)).filter((n) => Number.isInteger(n)))];
}

async function resolveCategoryIds(categoryIds) {
  const ids = toIdArray(categoryIds);
  if (!ids.length) throw ApiError.badRequest('At least one category is required');

  const found = await prisma.category.findMany({ where: { id: { in: ids } } });
  if (found.length !== ids.length) throw ApiError.badRequest('One or more selected categories are invalid');

  return ids;
}

async function generateUniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.product.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter++}`;
  }
}

async function resolveTagIds(tagNames = []) {
  const ids = [];
  for (const rawName of tagNames) {
    const name = rawName.trim();
    if (!name) continue;
    const slug = slugify(name);
    const tag = await prisma.tag.upsert({
      where: { slug },
      update: {},
      create: { name, slug },
    });
    ids.push(tag.id);
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Storefront
// ---------------------------------------------------------------------------

async function listPublic(query) {
  const pagination = parsePagination(query, {
    defaultSortBy: 'createdAt',
    allowedSortFields: ['createdAt', 'basePrice', 'avgRating', 'name', 'viewCount'],
  });

  const where = { isActive: true };

  if (query.category) {
    where.categories = { some: { category: { slug: query.category } } };
  }
  if (query.isFeatured !== undefined) where.isFeatured = query.isFeatured === 'true';
  if (query.minPrice || query.maxPrice) {
    where.basePrice = {};
    if (query.minPrice) where.basePrice.gte = parseFloat(query.minPrice);
    if (query.maxPrice) where.basePrice.lte = parseFloat(query.maxPrice);
  }
  if (query.tag) {
    where.tags = { some: { tag: { slug: query.tag } } };
  }
  if (query.search) {
    const matchingIds = await fullTextSearchProductIds(query.search);
    // No matching words (e.g. search was only punctuation/stopwords) -
    // fall back to the plain substring match rather than returning zero
    // results for a query the fulltext index couldn't parse.
    if (matchingIds) {
      where.id = { in: matchingIds };
    } else {
      where.OR = [
        { name: { contains: query.search } },
        { shortDescription: { contains: query.search } },
      ];
    }
  }

  const { items, meta } = await paginate(prisma.product, {
    where,
    pagination,
    select: LIST_SELECT,
  });

  return { items: items.map(serializeProduct), meta };
}

async function getBySlugPublic(slug) {
  const product = await prisma.product.findUnique({ where: { slug }, include: DETAIL_INCLUDE });
  if (!product || !product.isActive) throw ApiError.notFound('Product not found');

  prisma.product.update({ where: { id: product.id }, data: { viewCount: { increment: 1 } } }).catch(() => {});

  return serializeProduct(product);
}

async function getFeatured(limit = 8) {
  const products = await prisma.product.findMany({
    where: { isActive: true, isFeatured: true },
    take: Math.min(limit, 50),
    orderBy: { createdAt: 'desc' },
    select: LIST_SELECT,
  });
  return products.map(serializeProduct);
}

async function getRelated(slug, limit = 8) {
  const product = await prisma.product.findUnique({
    where: { slug },
    include: { categories: { select: { categoryId: true } } },
  });
  if (!product) throw ApiError.notFound('Product not found');

  const categoryIds = product.categories.map((pc) => pc.categoryId);
  if (!categoryIds.length) return [];

  const related = await prisma.product.findMany({
    where: {
      isActive: true,
      NOT: { id: product.id },
      categories: { some: { categoryId: { in: categoryIds } } },
    },
    take: Math.min(limit, 50),
    orderBy: { avgRating: 'desc' },
    select: LIST_SELECT,
  });
  return related.map(serializeProduct);
}

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------

async function adminList(query) {
  const pagination = parsePagination(query, {
    allowedSortFields: ['createdAt', 'basePrice', 'name'],
  });

  const where = {};
  if (query.categoryId) where.categories = { some: { categoryId: Number(query.categoryId) } };
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.search) {
    where.OR = [{ name: { contains: query.search } }, { sku: { contains: query.search } }];
  }

  const { items, meta } = await paginate(prisma.product, {
    where,
    pagination,
    include: {
      images: { where: { isPrimary: true }, take: 1 },
      categories: { include: { category: { select: CATEGORY_SELECT } } },
    },
  });

  return { items: items.map(serializeProduct), meta };
}

async function adminGet(id) {
  const product = await prisma.product.findUnique({ where: { id }, include: DETAIL_INCLUDE });
  if (!product) throw ApiError.notFound('Product not found');
  return serializeProduct(product);
}

async function adminCreate(data, files) {
  const categoryIds = await resolveCategoryIds(data.categoryIds);

  const existingSku = await prisma.product.findUnique({ where: { sku: data.sku } });
  if (existingSku) throw ApiError.conflict('A product with this SKU already exists');

  const slug = await generateUniqueSlug(data.name);
  const tagIds = data.tags ? await resolveTagIds(Array.isArray(data.tags) ? data.tags : [data.tags]) : [];

  const product = await prisma.product.create({
    data: {
      name: data.name,
      slug,
      sku: data.sku,
      description: data.description || null,
      shortDescription: data.shortDescription || null,
      basePrice: data.basePrice,
      discountPrice: data.discountPrice || null,
      costPrice: data.costPrice || null,
      weightGrams: data.weightGrams || null,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      metaTitle: data.metaTitle || null,
      metaDescription: data.metaDescription || null,
      images: files && files.length
        ? {
            create: files.map((file, index) => ({
              url: file.url,
              sortOrder: index,
              isPrimary: index === 0,
            })),
          }
        : undefined,
      tags: tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined,
      categories: { create: categoryIds.map((categoryId) => ({ categoryId })) },
    },
    include: DETAIL_INCLUDE,
  });

  return serializeProduct(product);
}

async function adminUpdate(id, data) {
  const product = await adminGet(id);

  const updateData = {};
  const fields = [
    'description',
    'shortDescription',
    'basePrice',
    'discountPrice',
    'costPrice',
    'weightGrams',
    'isActive',
    'isFeatured',
    'metaTitle',
    'metaDescription',
  ];
  for (const field of fields) {
    if (data[field] !== undefined) updateData[field] = data[field];
  }

  if (data.categoryIds !== undefined) {
    const categoryIds = await resolveCategoryIds(data.categoryIds);
    await prisma.productCategory.deleteMany({ where: { productId: id } });
    updateData.categories = { create: categoryIds.map((categoryId) => ({ categoryId })) };
  }

  if (data.sku !== undefined && data.sku !== product.sku) {
    const existingSku = await prisma.product.findFirst({ where: { sku: data.sku, NOT: { id } } });
    if (existingSku) throw ApiError.conflict('A product with this SKU already exists');
    updateData.sku = data.sku;
  }

  if (data.name !== undefined && data.name !== product.name) {
    updateData.name = data.name;
    updateData.slug = await generateUniqueSlug(data.name, id);
  }

  if (data.tags !== undefined) {
    const tagIds = await resolveTagIds(Array.isArray(data.tags) ? data.tags : [data.tags]);
    await prisma.productTag.deleteMany({ where: { productId: id } });
    updateData.tags = tagIds.length ? { create: tagIds.map((tagId) => ({ tagId })) } : undefined;
  }

  const updated = await prisma.product.update({ where: { id }, data: updateData, include: DETAIL_INCLUDE });
  return serializeProduct(updated);
}

async function adminDelete(id) {
  const product = await prisma.product.findUnique({ where: { id }, include: { images: true } });
  if (!product) throw ApiError.notFound('Product not found');

  await prisma.product.delete({ where: { id } });

  for (const image of product.images) {
    deleteUploadedImage(image.url).catch(() => {});
  }
}

async function addImages(productId, files) {
  const product = await prisma.product.findUnique({ where: { id: productId }, include: { images: true } });
  if (!product) throw ApiError.notFound('Product not found');
  if (!files || !files.length) throw ApiError.badRequest('No images provided');

  const startOrder = product.images.length;
  const hasPrimary = product.images.some((img) => img.isPrimary);

  await prisma.productImage.createMany({
    data: files.map((file, index) => ({
      productId,
      url: file.url,
      sortOrder: startOrder + index,
      isPrimary: !hasPrimary && index === 0,
    })),
  });

  return prisma.productImage.findMany({ where: { productId }, orderBy: { sortOrder: 'asc' } });
}

async function removeImage(productId, imageId) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw ApiError.notFound('Image not found');

  await prisma.productImage.delete({ where: { id: imageId } });
  deleteUploadedImage(image.url).catch(() => {});

  if (image.isPrimary) {
    const next = await prisma.productImage.findFirst({ where: { productId }, orderBy: { sortOrder: 'asc' } });
    if (next) await prisma.productImage.update({ where: { id: next.id }, data: { isPrimary: true } });
  }
}

async function setPrimaryImage(productId, imageId) {
  const image = await prisma.productImage.findUnique({ where: { id: imageId } });
  if (!image || image.productId !== productId) throw ApiError.notFound('Image not found');

  await prisma.$transaction([
    prisma.productImage.updateMany({ where: { productId }, data: { isPrimary: false } }),
    prisma.productImage.update({ where: { id: imageId }, data: { isPrimary: true } }),
  ]);
}

async function addVariant(productId, data) {
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) throw ApiError.notFound('Product not found');

  const existingSku = await prisma.productVariant.findUnique({ where: { sku: data.sku } });
  if (existingSku) throw ApiError.conflict('A variant with this SKU already exists');

  return prisma.productVariant.create({
    data: {
      productId,
      name: data.name,
      sku: data.sku,
      priceAdjustment: data.priceAdjustment ?? 0,
      isDefault: data.isDefault ?? false,
      isActive: data.isActive ?? true,
    },
  });
}

async function getOwnedVariant(productId, variantId) {
  const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
  if (!variant || variant.productId !== productId) throw ApiError.notFound('Variant not found');
  return variant;
}

async function updateVariant(productId, variantId, data) {
  await getOwnedVariant(productId, variantId);

  if (data.sku) {
    const existingSku = await prisma.productVariant.findFirst({ where: { sku: data.sku, NOT: { id: variantId } } });
    if (existingSku) throw ApiError.conflict('A variant with this SKU already exists');
  }

  return prisma.productVariant.update({ where: { id: variantId }, data });
}

async function deleteVariant(productId, variantId) {
  await getOwnedVariant(productId, variantId);
  await prisma.productVariant.delete({ where: { id: variantId } });
}

module.exports = {
  listPublic,
  getBySlugPublic,
  getFeatured,
  getRelated,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete,
  addImages,
  removeImage,
  setPrimaryImage,
  addVariant,
  updateVariant,
  deleteVariant,
};
