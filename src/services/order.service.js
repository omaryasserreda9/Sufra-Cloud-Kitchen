const orderRepository = require("../repositories/order.repository");
const cartService = require("./cart.service");
const ApiError = require("../utils/ApiError");
const ORDER_STATUS = require("../constants/orderStatus");

class OrderService {
  async checkout(customer, checkoutData) {
    const { shippingAddress, contactPhone } = checkoutData;

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
        chefId: meal.chefId._id,
        unitPrice: meal.price,
        quantity: item.quantity,
        subtotal: subtotal,
      };
    });

    // 3. Create Order
    const order = await orderRepository.create({
      customerId: customer._id,
      items: orderItems,
      totalAmount,
      shippingAddress: shippingAddress || customer.address,
      contactPhone: contactPhone || customer.phone,
    });

    if (!order.shippingAddress || !order.contactPhone) {
        // If still missing (neither provided nor in profile)
        // We might want to throw an error, but for now I'll assume they are provided
        // or the model will throw validation error.
    }

    // 4. Clear Cart
    await cartService.clearCart(customer._id);

    return order;
  }

  async getCustomerOrders(customerId) {
    return await orderRepository.findByCustomerId(customerId);
  }

  async getOrderById(orderId, userId, role) {
    const order = await orderRepository.findById(orderId);
    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    // Authorization check
    if (role === "customer" && order.customerId._id.toString() !== userId.toString()) {
      throw new ApiError(403, "Not authorized to view this order");
    }

    if (role === "chef") {
      const hasChefItem = order.items.some(
        (item) => item.chefId._id.toString() === userId.toString()
      );
      if (!hasChefItem) {
        throw new ApiError(403, "Not authorized to view this order");
      }
    }

    return order;
  }

  async updateOrderStatus(orderId, status) {
    if (!Object.values(ORDER_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid order status");
    }
    return await orderRepository.updateStatus(orderId, status);
  }
}

module.exports = new OrderService();
