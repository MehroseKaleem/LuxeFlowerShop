const prisma = require('../../config/prisma');
const ApiError = require('../../utils/ApiError');
const slugify = require('../../utils/slugify');
const { parsePagination, paginate } = require('../../utils/pagination');
const { deleteUploadedImage } = require('../../config/multer');

async function listPublic() {
  return prisma.category.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
      parentId: true,
      _count: { select: { products: { where: { product: { isActive: true } } } } },
    },
  });
}

async function getBySlug(slug) {
  const category = await prisma.category.findUnique({
    where: { slug },
    include: { children: { where: { isActive: true } } },
  });
  if (!category || !category.isActive) throw ApiError.notFound('Category not found');
  return category;
}

async function generateUniqueSlug(name, excludeId) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing || existing.id === excludeId) return slug;
    slug = `${base}-${counter++}`;
  }
}

async function adminList(query) {
  const pagination = parsePagination(query, { allowedSortFields: ['createdAt', 'name', 'sortOrder'] });
  const where = {};
  if (query.isActive !== undefined) where.isActive = query.isActive === 'true';
  if (query.search) where.name = { contains: query.search };

  return paginate(prisma.category, {
    where,
    pagination,
    include: { _count: { select: { products: true, children: true } } },
  });
}

async function adminGet(id) {
  const category = await prisma.category.findUnique({ where: { id } });
  if (!category) throw ApiError.notFound('Category not found');
  return category;
}

async function adminCreate(data, file) {
  const slug = await generateUniqueSlug(data.name);
  return prisma.category.create({
    data: {
      name: data.name,
      slug,
      description: data.description || null,
      parentId: data.parentId || null,
      isActive: data.isActive ?? true,
      sortOrder: data.sortOrder ?? 0,
      image: file ? file.url : null,
    },
  });
}

async function adminUpdate(id, data, file) {
  const category = await adminGet(id);

  if (data.parentId && Number(data.parentId) === id) {
    throw ApiError.badRequest('A category cannot be its own parent');
  }

  const updateData = { ...data };
  if (data.name && data.name !== category.name) {
    updateData.slug = await generateUniqueSlug(data.name, id);
  }

  if (file) {
    updateData.image = file.url;
    if (category.image) {
      deleteUploadedImage(category.image).catch(() => {});
    }
  }

  return prisma.category.update({ where: { id }, data: updateData });
}

async function adminDelete(id) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true, children: true } } },
  });
  if (!category) throw ApiError.notFound('Category not found');

  if (category._count.products > 0) {
    throw ApiError.badRequest('Cannot delete a category that still has products. Move or delete them first.');
  }
  if (category._count.children > 0) {
    throw ApiError.badRequest('Cannot delete a category that has subcategories. Delete or reassign them first.');
  }

  if (category.image) {
    deleteUploadedImage(category.image).catch(() => {});
  }

  await prisma.category.delete({ where: { id } });
}

module.exports = {
  listPublic,
  getBySlug,
  adminList,
  adminGet,
  adminCreate,
  adminUpdate,
  adminDelete,
};
