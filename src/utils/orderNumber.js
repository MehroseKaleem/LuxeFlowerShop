const crypto = require('crypto');

/**
 * Human-readable, sortable order number, e.g. KF-20260808-4F9A2C.
 * Uniqueness is ultimately enforced by the DB unique constraint on
 * Order.orderNumber; the random suffix makes collisions negligible.
 */
function generateOrderNumber() {
  const date = new Date();
  const datePart = [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('');
  const randomPart = crypto.randomBytes(3).toString('hex').toUpperCase();
  return `KF-${datePart}-${randomPart}`;
}

module.exports = generateOrderNumber;
