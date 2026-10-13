const { body, param } = require('express-validator');

const idParamRule = [param('id').isInt().withMessage('Invalid id')];
const orderNumberParamRule = [param('orderNumber').notEmpty()];

const createOrderRules = [
  body('paymentMethod').isIn(['COD', 'STRIPE']).withMessage('paymentMethod must be COD or STRIPE'),
  body('shippingAddressId').optional().isInt(),
  body('shippingAddress').optional().isObject(),
  body('billingAddress').optional().isObject(),
  body('guestEmail').optional().isEmail().withMessage('A valid guest email is required'),
  body('guestPhone')
    .optional()
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid guest phone number is required'),
  body('couponCode').optional().trim(),
  body('deliveryDate').optional().isISO8601().withMessage('deliveryDate must be a valid date'),
  body('deliveryTimeSlot').optional().trim().isLength({ max: 50 }),
  body('notes').optional().trim().isLength({ max: 500 }),
];

const updateStatusRules = [
  ...idParamRule,
  body('status')
    .isIn(['CONFIRMED', 'PROCESSING', 'SHIPPED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED'])
    .withMessage('Invalid order status'),
  body('note').optional().trim().isLength({ max: 255 }),
];

const updatePaymentStatusRules = [
  ...idParamRule,
  body('paymentStatus').isIn(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).withMessage('Invalid payment status'),
];

const createManualOrderRules = [
  body('customerEmail').isEmail().withMessage('A valid customer email is required'),
  body('customerPhone')
    .matches(/^\+?[0-9]{7,15}$/)
    .withMessage('A valid customer phone number is required'),
  body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  body('items.*.name').trim().notEmpty().withMessage('Each item needs a name'),
  body('items.*.price').isFloat({ min: 0.01 }).withMessage('Each item needs a valid price'),
  body('items.*.quantity').isInt({ min: 1 }).withMessage('Each item needs a valid quantity'),
  body('shippingAddress').isObject().withMessage('shippingAddress is required'),
  body('shippingAddress.fullName').notEmpty().withMessage('shippingAddress.fullName is required'),
  body('shippingAddress.phone').notEmpty().withMessage('shippingAddress.phone is required'),
  body('shippingAddress.addressLine1').notEmpty().withMessage('shippingAddress.addressLine1 is required'),
  body('shippingAddress.city').notEmpty().withMessage('shippingAddress.city is required'),
  body('shippingAddress.emirate').notEmpty().withMessage('shippingAddress.emirate is required'),
  body('deliveryDate').optional().isISO8601().withMessage('deliveryDate must be a valid date'),
  body('deliveryTimeSlot').optional().trim().isLength({ max: 50 }),
  body('notes').optional().trim().isLength({ max: 500 }),
];

module.exports = {
  idParamRule,
  orderNumberParamRule,
  createOrderRules,
  updateStatusRules,
  updatePaymentStatusRules,
  createManualOrderRules,
};
