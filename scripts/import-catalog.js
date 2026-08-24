/**
 * Bulk-imports a product catalog from the client's filled-in spreadsheet
 * (data-import/catalog-handoff-guide.html explains the format to them).
 *
 * Usage:
 *   node scripts/import-catalog.js [csvPath] [imagesDir]
 *
 * Defaults to data-import/products.csv and data-import/images/ if no
 * arguments are given. Images upload to Cloudinary automatically if
 * CLOUDINARY_* env vars are set; otherwise they're copied into the local
 * uploads/products/ folder, exactly like a normal admin panel upload.
 *
 * Tolerant of real-world spreadsheet variation: column headers are matched
 * case/spacing-insensitively against known aliases, categories that don't
 * exist yet are created rather than rejected, and a stock cell that isn't a
 * clean number (e.g. "7 on demand, order 1 day ahead") has its leading
 * number extracted for the stock count with the rest folded into the
 * product description so the detail isn't lost.
 *
 * Safe to re-run: any row whose product name already exists is skipped
 * rather than creating a duplicate.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { parse } = require('csv-parse/sync');
const prisma = require('../src/config/prisma');
const productsService = require('../src/modules/products/products.service');
const slugify = require('../src/utils/slugify');
const { cloudinary, isCloudinaryEnabled } = require('../src/config/cloudinary');
const { uploadsRoot } = require('../src/config/multer');

const DATA_DIR = path.join(__dirname, '..', 'data-import');
const CSV_PATH = path.resolve(process.argv[2] || path.join(DATA_DIR, 'products.csv'));
const IMAGES_DIR = path.resolve(process.argv[3] || path.join(DATA_DIR, 'images'));

// Maps normalized (lowercased, no spaces/punctuation) header text to the
// canonical field name, so "Base price", "basePrice", "Base Price " all work.
const HEADER_ALIASES = {
  name: 'name',
  productname: 'name',
  category: 'categories',
  categories: 'categories',
  baseprice: 'basePrice',
  price: 'basePrice',
  discountprice: 'discountPrice',
  disountprice: 'discountPrice',
  saleprice: 'discountPrice',
  stock: 'stock',
  shortdescription: 'shortDescription',
  description: 'description',
  fulldescription: 'description',
  tags: 'tags',
  images: 'images',
  image: 'images',
  isfeatured: 'isFeatured',
  featured: 'isFeatured',
};

function normalizeHeaderKey(header) {
  return header.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

function normalizeRowKeys(rawRow) {
  const row = {};
  for (const [key, value] of Object.entries(rawRow)) {
    const canonical = HEADER_ALIASES[normalizeHeaderKey(key)];
    if (canonical) row[canonical] = typeof value === 'string' ? value.trim() : value;
  }
  return row;
}

/** Categories the client names are created on the fly if they don't already exist. */
async function resolveCategoryNamesToIds(namesStr) {
  const names = namesStr.split(';').map((s) => s.trim()).filter(Boolean);
  if (!names.length) throw new Error('categories column is empty');

  const ids = [];
  for (const name of names) {
    let category = await prisma.category.findFirst({
      where: { name: { equals: name } },
    });
    if (!category) {
      const existingCi = await prisma.category.findMany({ where: {} });
      category = existingCi.find((c) => c.name.toLowerCase() === name.toLowerCase()) || null;
    }
    if (!category) {
      const slug = await generateUniqueCategorySlug(name);
      category = await prisma.category.create({ data: { name, slug, isActive: true } });
      console.log(`  (created new category "${name}")`);
    }
    ids.push(category.id);
  }
  return ids;
}

async function generateUniqueCategorySlug(name) {
  const base = slugify(name);
  let slug = base;
  let counter = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (!existing) return slug;
    slug = `${base}-${counter++}`;
  }
}

/** "7 on demand, order 1 day ahead" -> { count: 7, note: "on demand, order 1 day ahead" } */
function parseStock(raw) {
  if (!raw) return { count: 0, note: null };
  const match = String(raw).trim().match(/^(\d+)\s*(.*)$/);
  if (!match) return { count: 0, note: String(raw).trim() || null };
  return { count: Number(match[1]), note: match[2].trim() || null };
}

function normalizeImageKey(filename) {
  return filename
    .toLowerCase()
    .trim()
    .replace(/\.[a-z0-9]+$/, '')
    .replace(/\s+/g, ' ');
}

let imagesDirCache = null;
function listImagesDir() {
  if (!imagesDirCache) imagesDirCache = fs.readdirSync(IMAGES_DIR);
  return imagesDirCache;
}

/** Case/extension-insensitive match, with a "&" <-> "and" fallback pass. */
function findImageFile(requestedName) {
  const files = listImagesDir();
  const wanted = normalizeImageKey(requestedName);

  let match = files.find((f) => normalizeImageKey(f) === wanted);
  if (match) return match;

  const swapped = wanted.includes(' & ') ? wanted.replace(/ & /g, ' and ') : wanted.replace(/ and /g, ' & ');
  match = files.find((f) => normalizeImageKey(f) === swapped);
  return match || null;
}

async function prepareImageFile(filename) {
  const srcPath = path.join(IMAGES_DIR, filename);

  if (isCloudinaryEnabled) {
    const result = await cloudinary.uploader.upload(srcPath, {
      folder: 'luxeflower/products',
      resource_type: 'image',
      quality: 'auto',
      fetch_format: 'auto',
    });
    return { url: result.secure_url };
  }

  const ext = path.extname(filename).toLowerCase();
  const uniqueName = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`;
  fs.copyFileSync(srcPath, path.join(uploadsRoot, 'products', uniqueName));
  return { url: `/uploads/products/${uniqueName}` };
}

function generateSku(name) {
  const base = name
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/(^-+|-+$)/g, '')
    .slice(0, 30);
  return `${base}-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
}

async function importRow(rawRow, rowNum) {
  const row = normalizeRowKeys(rawRow);

  if (!row.name || !row.categories || !row.basePrice || !row.images) {
    throw new Error('missing a required column (name, categories, basePrice, or images)');
  }

  const existing = await prisma.product.findFirst({ where: { name: row.name } });
  if (existing) {
    console.log(`Row ${rowNum}: skipped — "${row.name}" already exists (id ${existing.id})`);
    return 'skipped';
  }

  const imageFilenames = row.images.split(';').map((s) => s.trim()).filter(Boolean);
  if (!imageFilenames.length) throw new Error('images column is empty');

  const resolvedFilenames = [];
  const unresolved = [];
  for (const requested of imageFilenames) {
    const found = findImageFile(requested);
    if (found) resolvedFilenames.push(found);
    else unresolved.push(requested);
  }
  if (unresolved.length) {
    throw new Error(`image file not found: ${unresolved.map((n) => `"${n}"`).join(', ')} (looked in ${IMAGES_DIR})`);
  }

  const categoryIds = await resolveCategoryNamesToIds(row.categories);
  const tags = row.tags ? row.tags.split(';').map((s) => s.trim()).filter(Boolean) : [];

  const { count: stock, note: stockNote } = parseStock(row.stock);
  const description = stockNote ? `${row.description || ''}\n\nAvailability: ${stockNote}`.trim() : row.description || undefined;

  const files = [];
  for (const filename of resolvedFilenames) {
    files.push(await prepareImageFile(filename));
  }

  const product = await productsService.adminCreate(
    {
      name: row.name,
      sku: generateSku(row.name),
      categoryIds,
      basePrice: row.basePrice,
      discountPrice: row.discountPrice || undefined,
      stock,
      shortDescription: row.shortDescription || undefined,
      description,
      tags,
      isFeatured: (row.isFeatured || '').toLowerCase() === 'yes',
      isActive: true,
    },
    files,
  );

  console.log(`Row ${rowNum}: created "${product.name}" (id ${product.id}, sku ${product.sku}, stock ${stock}, ${files.length} image${files.length === 1 ? '' : 's'})`);
  return 'created';
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`No spreadsheet found at ${CSV_PATH}`);
    console.error('Pass a path explicitly: node scripts/import-catalog.js path/to/products.csv path/to/images');
    process.exit(1);
  }
  if (!fs.existsSync(IMAGES_DIR)) {
    console.error(`No images folder found at ${IMAGES_DIR}`);
    process.exit(1);
  }

  const rows = parse(fs.readFileSync(CSV_PATH, 'utf8'), {
    columns: true,
    skip_empty_lines: true,
    trim: true,
    delimiter: [',', '\t', ';'],
    relax_column_count: true,
  });
  console.log(`Loaded ${rows.length} row(s) from ${CSV_PATH}`);
  console.log(`Images from ${IMAGES_DIR}`);
  console.log(`Image storage: ${isCloudinaryEnabled ? 'Cloudinary' : 'local disk (uploads/products/)'}\n`);

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < rows.length; i++) {
    const rowNum = i + 2; // account for header row, 1-indexed
    try {
      const result = await importRow(rows[i], rowNum);
      if (result === 'created') created++;
      else skipped++;
    } catch (err) {
      console.error(`Row ${rowNum}: FAILED — ${err.message}`);
      failed++;
    }
  }

  console.log(`\nDone. ${created} created, ${skipped} skipped (already existed), ${failed} failed.`);
  await prisma.$disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Import aborted:', err);
  process.exit(1);
});
