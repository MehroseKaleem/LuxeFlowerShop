const asyncHandler = require('../../utils/asyncHandler');
const ApiResponse = require('../../utils/ApiResponse');
const dashboardService = require('./dashboard.service');

const getOverview = asyncHandler(async (req, res) => {
  const overview = await dashboardService.getOverview();
  new ApiResponse(200, { overview }).send(res);
});

const getSalesOverTime = asyncHandler(async (req, res) => {
  const sales = await dashboardService.getSalesOverTime(Number(req.query.days) || 30);
  new ApiResponse(200, { sales }).send(res);
});

const getTopProducts = asyncHandler(async (req, res) => {
  const products = await dashboardService.getTopProducts(Number(req.query.limit) || 10);
  new ApiResponse(200, { products }).send(res);
});

const getLowStockProducts = asyncHandler(async (req, res) => {
  const products = await dashboardService.getLowStockProducts(Number(req.query.limit) || 50);
  new ApiResponse(200, { products }).send(res);
});

const getOrderStatusBreakdown = asyncHandler(async (req, res) => {
  const breakdown = await dashboardService.getOrderStatusBreakdown();
  new ApiResponse(200, { breakdown }).send(res);
});

module.exports = {
  getOverview,
  getSalesOverTime,
  getTopProducts,
  getLowStockProducts,
  getOrderStatusBreakdown,
};
