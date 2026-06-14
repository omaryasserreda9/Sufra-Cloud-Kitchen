const Delivery = require("../models/Delivery");
const orderRepository = require("../repositories/order.repository");
const ApiError = require("../utils/ApiError");
const { sendDeliveryAssignmentEmails } = require("../utils/deliveryNotifications");

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
    const freeDelivery = await Delivery.findOne({ isFree: true, status: "active" });

    if (freeDelivery) {
      // Assign delivery person to order
      freeDelivery.isFree = false;
      freeDelivery.currentOrderId = orderId;
      await freeDelivery.save();

      // Update order using repository updateStatus method or direct save if repo doesn't have delivery assignment
      order.deliveryId = freeDelivery._id;
      await order.save();

      console.log(`Assigned delivery ${freeDelivery._id} to order ${orderId}`);

      // Send notification emails
      // Note: orderRepository.findById(orderId) already populates customerId
      if (order.customerId) {
        await sendDeliveryAssignmentEmails(order, freeDelivery, order.customerId);
      }
    } else {
      // No delivery available, queue the order
      if (!this.pendingOrders.includes(orderId.toString())) {
        this.pendingOrders.push(orderId.toString());
        console.log(`No free delivery available. Order ${orderId} added to pending queue.`);
      }
    }
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
    
    // Trigger processing of pending assignments
    await this.processPendingAssignments();
  }
}

module.exports = new DeliveryAssignmentService();
