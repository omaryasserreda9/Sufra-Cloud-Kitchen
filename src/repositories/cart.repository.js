const Cart = require("../models/Cart");

class CartRepository {
  async findByCustomerId(customerId) {
    return await Cart.findOne({ customerId }).populate({
      path: "items.mealId",
      populate: {
        path: "chefId",
        select: "firstName lastName kitchenName",
      },
    });
  }

  async create(cartData) {
    return await Cart.create(cartData);
  }

  async update(customerId, updateData) {
    return await Cart.findOneAndUpdate({ customerId }, updateData, {
      new: true,
      runValidators: true,
    }).populate({
      path: "items.mealId",
      populate: {
        path: "chefId",
        select: "firstName lastName kitchenName",
      },
    });
  }

  async delete(customerId) {
    return await Cart.findOneAndDelete({ customerId });
  }
}

module.exports = new CartRepository();
