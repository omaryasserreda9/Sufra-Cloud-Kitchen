const orderService = require("../services/order.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class DeliveryController {
  /**
   * Get the current active order for the authenticated delivery person.
   */
  getCurrentOrder = asyncHandler(async (req, res) => {
    const deliveryId = req.user._id;
    const order = await orderService.getDeliveryCurrentOrder(deliveryId);

    res.status(200).json(
      new ApiResponse(
        200,
        order,
        order ? "Current order retrieved successfully" : "No active order assigned"
      )
    );
  });

  /**
   * Get the order history for the authenticated delivery person.
   */
  getHistory = asyncHandler(async (req, res) => {
    const deliveryId = req.user._id;
    const orders = await orderService.getDeliveryHistory(deliveryId);

    res.status(200).json(
      new ApiResponse(200, orders, "Order history retrieved successfully")
    );
  });

  /**
   * Mark an order as completed (Delivery only).
   */
  completeOrder = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const deliveryId = req.user._id;

    const order = await orderService.completeOrder(orderId, deliveryId);

    res.status(200).json(
      new ApiResponse(200, order, "Order marked as completed successfully")
    );
  });
}

module.exports = new DeliveryController();
