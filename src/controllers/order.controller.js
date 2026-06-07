const orderService = require("../services/order.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class OrderController {
  checkout = asyncHandler(async (req, res) => {
    const customer = req.user;
    const checkoutData = req.body;

    const order = await orderService.checkout(customer, checkoutData);

    res
      .status(201)
      .json(new ApiResponse(201, order, "Order placed successfully"));
  });

  getCustomerOrders = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const orders = await orderService.getCustomerOrders(customerId);

    res
      .status(200)
      .json(new ApiResponse(200, orders, "Orders retrieved successfully"));
  });

  getOrderById = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const userId = req.user._id;
    const role = req.user.role;

    const order = await orderService.getOrderById(orderId, userId, role);

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order details retrieved successfully"));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const { status } = req.body;

    // Additional check: maybe only chef or admin can update status
    // For now, I'll allow based on route authorization
    const order = await orderService.updateOrderStatus(orderId, status);

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order status updated successfully"));
  });
}

module.exports = new OrderController();
