const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

/**
 * Parses page/limit/sortBy/sortOrder query params into Prisma-ready
 * skip/take/orderBy, with sane bounds so large tables can't be abused
 * with unbounded page sizes.
 */
function parsePagination(query, { defaultSortBy = 'createdAt', allowedSortFields = [] } = {}) {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  let limit = parseInt(query.limit, 10) || DEFAULT_LIMIT;
  limit = Math.min(Math.max(limit, 1), MAX_LIMIT);

  let sortBy = query.sortBy || defaultSortBy;
  if (allowedSortFields.length && !allowedSortFields.includes(sortBy)) {
    // Fall back to the first allowed field rather than `defaultSortBy`
    // itself — if a caller's allowed list doesn't include the generic
    // 'createdAt' default (e.g. a model that uses a differently-named
    // timestamp), blindly reverting to it would still be invalid and
    // crash the query instead of fixing it.
    sortBy = allowedSortFields.includes(defaultSortBy) ? defaultSortBy : allowedSortFields[0];
  }
  const sortOrder = query.sortOrder === 'asc' ? 'asc' : 'desc';

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
    orderBy: { [sortBy]: sortOrder },
  };
}

function buildMeta({ page, limit, total }) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(Math.ceil(total / limit), 1),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}

async function paginate(model, { where = {}, include, select, pagination }) {
  const { skip, take, orderBy, page, limit } = pagination;

  const [items, total] = await Promise.all([
    model.findMany({ where, include, select, skip, take, orderBy }),
    model.count({ where }),
  ]);

  return { items, meta: buildMeta({ page, limit, total }) };
}

module.exports = { parsePagination, buildMeta, paginate, DEFAULT_LIMIT, MAX_LIMIT };
