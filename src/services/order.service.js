const orderRepository = require("../repositories/order.repository");
const Order = require("../models/Order");
const cartService = require("./cart.service");
const ApiError = require("../utils/ApiError");
const ORDER_STATUS = require("../constants/orderStatus");
const notificationService = require("./notification.service");
const { notificationPresets } = require("../constants/notificationPresets");

class OrderService {
  async checkout(customer, checkoutData) {
    const { shippingAddress, contactPhone, paymentMethod } = checkoutData;

    if (!paymentMethod) {
      throw new ApiError(400, "Payment method is required");
    }

    // 1. Get current cart
    const cart = await cartService.getCart(customer._id);
    if (!cart || cart.items.length === 0) {
      throw new ApiError(400, "Cannot checkout with an empty cart");
    }

    // 2. Prepare order items (snapshotting)
    let totalAmount = 0;
    const orderItems = cart.items.map((item) => {
      const meal = item.mealId;

      // Basic validation: ensure meal still exists (populated)
      if (!meal) {
        throw new ApiError(404, `Meal in cart no longer exists`);
      }

      const subtotal = meal.price * item.quantity;
      totalAmount += subtotal;

      return {
        mealId: meal._id,
        name: meal.name,
        description: meal.description,
        image: meal.images && meal.images.length > 0 ? meal.images[0] : null,
        chefId: meal.chefId._id,
        unitPrice: meal.price,
        quantity: item.quantity,
        subtotal: subtotal,
      };
    });

    // 3. Create Order
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const order = await orderRepository.create({
      customerId: customer._id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || customer.address,
      contactPhone: contactPhone || customer.phone,
      otp,
      status:
        paymentMethod === "cash"
          ? ORDER_STATUS.PREPARING
          : ORDER_STATUS.AWAITING_PAYMENT,
    });

    customer.address = shippingAddress || customer.address;
    customer.phone = contactPhone || customer.phone;

    // 4. Create Payment
    const paymentService = require("./payment.service");
    const { payment, paymobUrl } = await paymentService.createPayment(
      {
        orderId: order._id,
        paymentMethod,
        amount: totalAmount,
      },
      customer,
    );

    // 5. Clear Cart
    await cartService.clearCart(customer._id);

    if (paymentMethod === "cash") {
      await this._notifyChefsAboutOrder(order);
    }

    return { order, payment, paymobUrl };
  }

  async handlePaymentConfirmed(orderId) {
    const order = await orderRepository.findById(orderId);
    if (!order) return;

    if (order.status === ORDER_STATUS.AWAITING_PAYMENT) {
      const updatedOrder = await orderRepository.updateStatus(
        orderId,
        ORDER_STATUS.PREPARING,
      );
      await this._notifyChefsAboutOrder(updatedOrder);
    }
  }

  async getCustomerOrders(customerId) {
    return await orderRepository.findByCustomerId(customerId);
  }

  async _notifyChefsAboutOrder(order) {
    const itemsByChef = new Map();

    order.items.forEach((item) => {
      const chefId = (item.chefId._id || item.chefId).toString();
      const current = itemsByChef.get(chefId) || {
        itemCount: 0,
        totalAmount: 0,
      };
      current.itemCount += item.quantity;
      current.totalAmount += item.subtotal;
      itemsByChef.set(chefId, current);
    });

    await Promise.all(
      [...itemsByChef.entries()].map(([chefId, summary]) =>
        notificationService.notifyChef(chefId, {
          ...notificationPresets.chefOrderRequest({
            orderId: order._id,
            itemCount: summary.itemCount,
            totalAmount: summary.totalAmount,
          }),
          entityType: "Order",
          entityId: order._id,
          deduplicationKey: `chef-order:${order._id}:${chefId}`,
        }),
      ),
    );
  }

  async getChefOrders(chefId) {
    const orders = await orderRepository.findByChefId(chefId);

    // Filter items to only show what belongs to this chef
    return orders.map((order) => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.chefId._id.toString() === chefId.toString(),
      );
      return orderObj;
    });
  }

  async getOrderById(orderId, userId, role) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Authorization check
    if (
      role === "customer" &&
      order.customerId._id.toString() !== userId.toString()
    ) {
      throw new ApiError(403, "Not authorized to view this order");
    }

    if (role === "chef") {
      const hasChefItem = order.items.some(
        (item) => item.chefId._id.toString() === userId.toString(),
      );
      if (!hasChefItem) {
        throw new ApiError(403, "Not authorized to view this order");
      }

      // Filter items for chef visibility
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.chefId._id.toString() === userId.toString(),
      );
      return orderObj;
    }

    return order;
  }

  async updateOrderStatus(orderId, status) {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid order status");
    }
    const order = await orderRepository.updateStatus(orderId, status);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return order;
  }

  async updateOrderItemStatus(orderId, mealId, status, chefId) {
    const ORDER_ITEM_STATUS = require("../constants/orderItemStatus");
    if (!Object.values(ORDER_ITEM_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid item status");
    }

    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const item = order.items.find(
      (item) => item.mealId._id.toString() === mealId.toString(),
    );
    if (!item) {
      throw new ApiError(404, "Item not found in this order");
    }

    if (item.chefId._id.toString() !== chefId.toString()) {
      throw new ApiError(403, "Not authorized to update this item's status");
    }

    // Validate status transitions: Preparing -> Ready -> Delivered
    const statusOrder = [
      ORDER_ITEM_STATUS.PREPARING,
      ORDER_ITEM_STATUS.READY,
      ORDER_ITEM_STATUS.DELIVERED,
    ];
    const currentIndex = statusOrder.indexOf(item.status);
    const nextIndex = statusOrder.indexOf(status);

    if (nextIndex <= currentIndex) {
      throw new ApiError(
        400,
        `Cannot move status from ${item.status} to ${status}`,
      );
    }

    if (nextIndex !== currentIndex + 1) {
      // Optional: enforce one step at a time?
      // The prompt says "from Preparing to Ready to Delivered", implying sequence.
      // I'll allow skipping if it makes sense (e.g. Preparing -> Delivered if somehow possible),
      // but strictly "to Ready to Delivered" suggests sequence.
      // Let's enforce sequential for now.
      throw new ApiError(
        400,
        `Invalid status transition: ${item.status} -> ${status}`,
      );
    }

    const updatedOrder = await orderRepository.updateItemStatus(
      orderId,
      mealId,
      status,
    );

    // Trigger delivery assignment if item is READY
    if (status === ORDER_ITEM_STATUS.READY) {
      const deliveryAssignmentService = require("./deliveryAssignment.service");
      // This is non-blocking to the user response if needed,
      // but here we await for simplicity and to ensure queuing works.
      await deliveryAssignmentService.assignDelivery(orderId);
    }

    return updatedOrder;
  }

  /**
   * Complete an order by a delivery person.
   * @param {string} orderId - ID of the order.
   * @param {string} deliveryId - ID of the delivery person.
   * @param {string} otp - The OTP provided by the customer.
   */
  async completeOrder(orderId, deliveryId, otp) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    if (
      !order.deliveryId ||
      order.deliveryId._id.toString() !== deliveryId.toString()
    ) {
      throw new ApiError(403, "This order is not assigned to you");
    }

    if (order.status === ORDER_STATUS.COMPLETED) {
      throw new ApiError(400, "Order is already completed");
    }

    // Validate OTP
    if (order.otp !== otp) {
      throw new ApiError(400, "Invalid OTP");
    }

    console.log(ORDER_STATUS);
    // 1. Mark order as COMPLETED
    order.status = ORDER_STATUS.COMPLETED;
    await order.save();
    console.log("Order updated");

    console.log("Saved status:", order.status);

    const check = await orderRepository.findById(orderId);
    console.log("Status from DB:", check.status);

    // 2. Release delivery (isFree = true)
    const deliveryAssignmentService = require("./deliveryAssignment.service");
    await deliveryAssignmentService.markAsFree(deliveryId);
    console.log("Delivery released");

    // 3. Handle Payment (especially for Cash on Delivery)
    const Payment = require("../models/Payment");
    const { PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/payment");

    let payment = await Payment.findOne({ orderId });
    console.log("Payment found:", payment);

    if (payment && payment.paymentMethod === PAYMENT_METHOD.CASH) {
      payment.paymentStatus = PAYMENT_STATUS.PAID;
      payment.paidAt = new Date();
      await payment.save();
      console.log(`Cash payment for order ${orderId} marked as PAID.`);
    }

    // 4. Calculate chef earnings and update wallets via SettlementService
    // commission rules (FINANCIAL_CONFIG.PLATFORM_COMMISSION_RATE) are applied inside performSettlement
    const settlementService = require("./settlement.service");
    await settlementService.triggerSettlement(orderId, payment);
    console.log("Settlement completed");

    return order;
  }

  /**
   * Get the current active order assigned to a delivery person.
   * @param {string} deliveryId - ID of the delivery person.
   * @returns {Promise<Object>} - The active order or null.
   */
  async getDeliveryCurrentOrder(deliveryId) {
    // Current order is one where deliveryId is assigned and status is NOT COMPLETED
    const order = await Order.findOne({
      deliveryId,
      status: { $ne: ORDER_STATUS.COMPLETED },
    })
      .populate("customerId", "firstName lastName email phone")
      .populate("items.mealId");

    return order;
  }

  /**
   * Get the history of completed orders for a delivery person.
   * @param {string} deliveryId - ID of the delivery person.
   * @returns {Promise<Array>} - List of completed orders.
   */
  async getDeliveryHistory(deliveryId) {
    return await Order.find({
      deliveryId,
      status: ORDER_STATUS.COMPLETED,
    })
      .sort({ updatedAt: -1 })
      .populate("customerId", "firstName lastName email phone")
      .populate("items.mealId");
  }
}

module.exports = new OrderService();
