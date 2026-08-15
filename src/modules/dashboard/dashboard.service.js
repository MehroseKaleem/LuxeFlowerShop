const prisma = require('../../config/prisma');

async function getOverview() {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalOrders,
    todayOrders,
    monthOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    revenueAgg,
    monthRevenueAgg,
  ] = await Promise.all([
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
    prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.user.count({ where: { role: 'CUSTOMER' } }),
    prisma.product.count({ where: { isActive: true } }),
    prisma.order.count({ where: { status: 'PENDING' } }),
    prisma.order.aggregate({ where: { paymentStatus: 'PAID' }, _sum: { total: true } }),
    prisma.order.aggregate({
      where: { paymentStatus: 'PAID', createdAt: { gte: startOfMonth } },
      _sum: { total: true },
    }),
  ]);

  return {
    totalOrders,
    todayOrders,
    monthOrders,
    totalCustomers,
    totalProducts,
    pendingOrders,
    totalRevenue: revenueAgg._sum.total || 0,
    monthRevenue: monthRevenueAgg._sum.total || 0,
  };
}

async function getSalesOverTime(days = 30) {
  const rows = await prisma.$queryRaw`
    SELECT DATE(createdAt) as date, COUNT(*) as orderCount, SUM(total) as revenue
    FROM orders
    WHERE createdAt >= DATE_SUB(CURDATE(), INTERVAL ${days} DAY)
      AND paymentStatus = 'PAID'
    GROUP BY DATE(createdAt)
    ORDER BY date ASC
  `;
  return rows.map((row) => ({
    date: row.date,
    orderCount: Number(row.orderCount),
    revenue: Number(row.revenue || 0),
  }));
}

async function getTopProducts(limit = 10) {
  const rows = await prisma.orderItem.groupBy({
    by: ['productId', 'productName'],
    _sum: { quantity: true, subtotal: true },
    orderBy: { _sum: { quantity: 'desc' } },
    take: limit,
  });

  return rows.map((row) => ({
    productId: row.productId,
    productName: row.productName,
    unitsSold: row._sum.quantity || 0,
    revenue: row._sum.subtotal || 0,
  }));
}

async function getLowStockProducts(limit = 50) {
  return prisma.$queryRaw`
    SELECT id, name, sku, stock, lowStockThreshold
    FROM products
    WHERE isActive = true AND stock <= lowStockThreshold
    ORDER BY stock ASC
    LIMIT ${limit}
  `;
}

async function getOrderStatusBreakdown() {
  const rows = await prisma.order.groupBy({ by: ['status'], _count: { status: true } });
  return rows.map((row) => ({ status: row.status, count: row._count.status }));
}

module.exports = { getOverview, getSalesOverTime, getTopProducts, getLowStockProducts, getOrderStatusBreakdown };
