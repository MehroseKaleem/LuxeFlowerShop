const prisma = require('../../config/prisma');

const DEFAULTS = {
  SHIPPING_FEE: '25',
  FREE_SHIPPING_THRESHOLD: '200',
  TAX_RATE_PERCENT: '5',
  CURRENCY: 'AED',
  STORE_PHONE: '+971500000000',
  STORE_EMAIL: 'support@luxeflower.ae',
};

async function getAllPublic() {
  const rows = await prisma.setting.findMany();
  const map = { ...DEFAULTS };
  for (const row of rows) map[row.key] = row.value;
  return map;
}

async function getValue(key) {
  const row = await prisma.setting.findUnique({ where: { key } });
  return row ? row.value : DEFAULTS[key];
}

async function getNumber(key) {
  const value = await getValue(key);
  return value !== undefined ? Number(value) : undefined;
}

async function computeShippingFee(subtotal) {
  const [fee, threshold] = await Promise.all([
    getNumber('SHIPPING_FEE'),
    getNumber('FREE_SHIPPING_THRESHOLD'),
  ]);
  if (threshold && subtotal >= threshold) return 0;
  return fee || 0;
}

async function computeTax(subtotal) {
  const ratePercent = await getNumber('TAX_RATE_PERCENT');
  if (!ratePercent) return 0;
  return Math.round(((subtotal * ratePercent) / 100) * 100) / 100;
}

async function adminSetMany(entries) {
  const keys = Object.keys(entries);
  await prisma.$transaction(
    keys.map((key) =>
      prisma.setting.upsert({
        where: { key },
        update: { value: String(entries[key]) },
        create: { key, value: String(entries[key]) },
      }),
    ),
  );
  return getAllPublic();
}

module.exports = { getAllPublic, getValue, getNumber, computeShippingFee, computeTax, adminSetMany, DEFAULTS };
