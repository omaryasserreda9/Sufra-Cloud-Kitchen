const orderService = require("../services/order.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class OrderController {
  checkout = asyncHandler(async (req, res) => {
    let customer = req.user;
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

  getChefOrders = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const orders = await orderService.getChefOrders(chefId);

    res
      .status(200)
      .json(new ApiResponse(200, orders, "Chef orders retrieved successfully"));
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

    const order = await orderService.updateOrderStatus(orderId, status);

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order status updated successfully"));
  });

  updateItemStatus = asyncHandler(async (req, res) => {
    const orderId = req.params.id;
    const { mealId, status } = req.body;
    const chefId = req.user._id;

    const order = await orderService.updateOrderItemStatus(orderId, mealId, status, chefId);

    res
      .status(200)
      .json(new ApiResponse(200, order, "Order item status updated successfully"));
  });
}

module.exports = new OrderController();
