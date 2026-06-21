const Order = require("../models/Order");

class OrderRepository {
  async create(orderData) {
    return await Order.create(orderData);
  }

  async findById(id) {
    return await Order.findById(id)
      .populate("customerId", "firstName lastName email phone")
      .populate("items.mealId")
      .populate("items.chefId", "firstName lastName kitchenName email");
  }

  async findByCustomerId(customerId) {
    return await Order.find({ customerId })
      .sort({ createdAt: -1 })
      .populate("items.chefId", "firstName lastName kitchenName");
  }

  async findByChefId(chefId) {
    // This finds orders that contain at least one item from this chef
    return await Order.find({ "items.chefId": chefId })
      .sort({ createdAt: -1 })
      .populate("customerId", "firstName lastName email phone");
  }

  async updateStatus(orderId, status) {
    const order = await Order.findById(orderId);
    if (!order) return null;
    order.status = status;
    return await order.save();
  }

  async updateItemStatus(orderId, mealId, status) {
    const order = await Order.findById(orderId);
    if (!order) return null;

    const item = order.items.find((item) => item.mealId.toString() === mealId.toString());
    if (item) {
      item.status = status;
      // Mark items as modified to trigger pre-save hook
      order.markModified("items");
      return await order.save();
    }
    return null;
  }
}

module.exports = new OrderRepository();
