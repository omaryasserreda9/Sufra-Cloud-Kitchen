const Delivery = require("../models/Delivery");
const Order = require("../models/Order");
const orderService = require("../services/order.service");
const deliveryAssignmentService = require("../services/deliveryAssignment.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/ApiError");
const ORDER_STATUS = require("../constants/orderStatus");

class AdminController {
  /**
   * Get unassigned orders and free delivery personnel.
   */
  getDeliveryManagementData = asyncHandler(async (req, res) => {
    // 1. Get free delivery personnel
    const freeDeliveryPersonnel = await Delivery.find({
      isFree: true,
      status: "active",
    }).select("-passwordHash");

    // 2. Get unassigned orders
    // An order is unassigned if it has no deliveryId and is in a state that requires delivery
    // (e.g., status is PREPARING or OUT_FOR_DELIVERY but deliveryId is null)
    // Actually, usually READY items trigger assignment.
    const unassignedOrders = await Order.find({
      deliveryId: null,
      status: { $in: [ORDER_STATUS.PREPARING, ORDER_STATUS.OUT_FOR_DELIVERY] },
    }).populate("customerId", "firstName lastName phone");

    res.status(200).json(
      new ApiResponse(200, {
        freeDeliveryPersonnel,
        unassignedOrders,
      }, "Delivery management data retrieved successfully")
    );
  });

  /**
   * Manually assign a delivery person to an order.
   */
  assignOrderToDelivery = asyncHandler(async (req, res) => {
    const { orderId, deliveryId } = req.body;

    if (!orderId || !deliveryId) {
      throw new ApiError(400, "Order ID and Delivery ID are required");
    }

    const order = await Order.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (order.deliveryId) {
      throw new ApiError(400, "Order already has an assigned delivery person");
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new ApiError(404, "Delivery person not found");
    }

    if (!delivery.isFree || delivery.status !== "active") {
      throw new ApiError(400, "Delivery person is not available");
    }

    // Use DeliveryAssignmentService to handle the assignment logic (save, notifications, etc.)
    // We might need to slightly modify DeliveryAssignmentService to allow passing a specific deliveryId
    await deliveryAssignmentService.manuallyAssignDelivery(orderId, deliveryId);

    res.status(200).json(
      new ApiResponse(200, null, "Order assigned to delivery person successfully")
    );
  });
}

module.exports = new AdminController();
