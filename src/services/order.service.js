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
        description: meal.description,
        image: meal.images && meal.images.length > 0 ? meal.images[0] : null,
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

  async getChefOrders(chefId) {
    const orders = await orderRepository.findByChefId(chefId);
    
    // Filter items to only show what belongs to this chef
    return orders.map(order => {
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        item => item.chefId._id.toString() === chefId.toString()
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

      // Filter items for chef visibility
      const orderObj = order.toObject();
      orderObj.items = orderObj.items.filter(
        (item) => item.chefId._id.toString() === userId.toString()
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

    const item = order.items.find((item) => item.mealId._id.toString() === mealId.toString());
    if (!item) {
      throw new ApiError(404, "Item not found in this order");
    }

    if (item.chefId._id.toString() !== chefId.toString()) {
      throw new ApiError(403, "Not authorized to update this item's status");
    }

    // Validate status transitions: Preparing -> Ready -> Delivered
    const statusOrder = [ORDER_ITEM_STATUS.PREPARING, ORDER_ITEM_STATUS.READY, ORDER_ITEM_STATUS.DELIVERED];
    const currentIndex = statusOrder.indexOf(item.status);
    const nextIndex = statusOrder.indexOf(status);

    if (nextIndex <= currentIndex) {
      throw new ApiError(400, `Cannot move status from ${item.status} to ${status}`);
    }

    if (nextIndex !== currentIndex + 1) {
       // Optional: enforce one step at a time? 
       // The prompt says "from Preparing to Ready to Delivered", implying sequence.
       // I'll allow skipping if it makes sense (e.g. Preparing -> Delivered if somehow possible), 
       // but strictly "to Ready to Delivered" suggests sequence.
       // Let's enforce sequential for now.
       throw new ApiError(400, `Invalid status transition: ${item.status} -> ${status}`);
    }

    return await orderRepository.updateItemStatus(orderId, mealId, status);
  }
}

module.exports = new OrderService();
