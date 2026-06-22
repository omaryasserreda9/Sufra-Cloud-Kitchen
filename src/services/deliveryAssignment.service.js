const Delivery = require("../models/Delivery");
const orderRepository = require("../repositories/order.repository");
const ApiError = require("../utils/ApiError");
const {
  sendDeliveryAssignmentEmails,
} = require("../utils/deliveryNotifications");
const notificationService = require("./notification.service");
const { notificationPresets } = require("../constants/notificationPresets");
const ROLES = require("../constants/roles");

class DeliveryAssignmentService {
  constructor() {
    this.pendingOrders = [];
  }

  /**
   * Assign a delivery person to an order.
   * @param {string} orderId - The ID of the order to assign.
   */
  async assignDelivery(orderId) {
    console.log(`Attempting to assign delivery for order: ${orderId}`);

    const order = await orderRepository.findById(orderId);
    if (!order) {
      console.error(`Order ${orderId} not found for assignment`);
      return;
    }

    // If order already has a delivery person, skip
    if (order.deliveryId) {
      console.log(`Order ${orderId} already has a delivery person assigned.`);
      return;
    }

    // Find a free delivery person
    const freeDelivery = await Delivery.findOne({
      isFree: true,
      status: "active",
    });

    if (freeDelivery) {
      // Assign delivery person to order
      freeDelivery.isFree = false;
      freeDelivery.currentOrderId = orderId;
      await freeDelivery.save();

      // Update order using repository updateStatus method or direct save if repo doesn't have delivery assignment
      order.deliveryId = freeDelivery._id;
      await order.save();

      console.log(`Assigned delivery ${freeDelivery._id} to order ${orderId}`);

      // Send notifications and emails
      await this._notifyAssignment(order, freeDelivery);
    } else {
      // No delivery available, queue the order
      if (!this.pendingOrders.includes(orderId.toString())) {
        this.pendingOrders.push(orderId.toString());
        console.log(
          `No free delivery available. Order ${orderId} added to pending queue.`,
        );
      }
    }
  }

  /**
   * Manually assign a specific delivery person to an order.
   * @param {string} orderId - The ID of the order.
   * @param {string} deliveryId - The ID of the delivery person.
   */
  async manuallyAssignDelivery(orderId, deliveryId) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new ApiError(404, "Delivery person not found");
    }

    if (!delivery.isFree || delivery.status !== "active") {
      throw new ApiError(400, "Delivery person is not available");
    }

    await this._notifyAssignment(order, delivery);

    // Assign delivery person to order
    delivery.isFree = false;
    delivery.currentOrderId = orderId;
    await delivery.save();

    order.deliveryId = deliveryId;
    await order.save();

    console.log(`Manually assigned delivery ${deliveryId} to order ${orderId}`);

    // Remove from pending queue if present
    this.pendingOrders = this.pendingOrders.filter(
      (id) => id !== orderId.toString(),
    );

    // Send notifications and emails
  }

  /**
   * Private helper to handle assignment notifications.
   */
  /**
   * Private helper to handle assignment notifications.
   */
  async _notifyAssignment(order, delivery) {
    if (!order.customerId) {
      throw new ApiError(400, "Order customer not found");
    }

    await sendDeliveryAssignmentEmails(order, delivery, order.customerId);

    await notificationService._safelyCreate(() =>
      notificationService.createForRecipient(
        order.customerId._id,
        ROLES.CUSTOMER,
        {
          ...notificationPresets.customerDeliveryAssigned({
            orderId: order._id,
            deliveryName: `${delivery.firstName} ${delivery.lastName}`,
          }),
          entityType: "Order",
          entityId: order._id,
        },
      ),
    );

    const chefs = new Map();
    const pickupLocations = [];

    order.items.forEach((item) => {
      const chef = item.chefId;

      if (!chef) {
        return;
      }

      if (!chefs.has(chef._id.toString())) {
        chefs.set(chef._id.toString(), chef);

        pickupLocations.push(
          `${chef.kitchenName || chef.firstName} at ${
            chef.kitchenAddress || "N/A"
          }`,
        );
      }
    });

    await notificationService._safelyCreate(() =>
      notificationService.createForRecipient(delivery._id, ROLES.DELIVERY, {
        ...notificationPresets.deliveryOrderAssigned({
          orderId: order._id,
          customerName: `${order.customerId.firstName} ${order.customerId.lastName}`,
          address: order.shippingAddress,
          pickupLocations: pickupLocations.join(", "),
        }),
        entityType: "Order",
        entityId: order._id,
      }),
    );

    await Promise.all(
      Array.from(chefs.values()).map((chef) =>
        notificationService._safelyCreate(() =>
          notificationService.createForRecipient(chef._id, ROLES.CHEF, {
            ...notificationPresets.chefDeliveryAssigned({
              orderId: order._id,
              deliveryName: `${delivery.firstName} ${delivery.lastName}`,
            }),
            entityType: "Order",
            entityId: order._id,
          }),
        ),
      ),
    );
  }
  /**
   * Process pending assignments when a delivery person becomes free.
   */
  async processPendingAssignments() {
    console.log("Checking for pending delivery assignments...");
    if (this.pendingOrders.length === 0) {
      return;
    }

    // Clone the queue and clear it to prevent race conditions during async processing
    const ordersToProcess = [...this.pendingOrders];
    this.pendingOrders = [];

    for (const orderId of ordersToProcess) {
      await this.assignDelivery(orderId);
    }
  }

  /**
   * Mark a delivery person as free and check for pending orders.
   * @param {string} deliveryId - The ID of the delivery person.
   */
  async markAsFree(deliveryId) {
    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
      throw new ApiError(404, "Delivery person not found");
    }

    delivery.isFree = true;
    delivery.currentOrderId = null;
    await delivery.save();

    console.log(`Delivery ${deliveryId} is now free.`);
  }
}

module.exports = new DeliveryAssignmentService();
