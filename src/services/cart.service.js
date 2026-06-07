const cartRepository = require("../repositories/cart.repository");
const mealRepository = require("../repositories/meal.repository");
const ApiError = require("../utils/ApiError");
const MEAL_STATUS = require("../constants/mealStatus");

class CartService {
  async getCart(customerId) {
    let cart = await cartRepository.findByCustomerId(customerId);
    if (!cart) {
      cart = await cartRepository.create({ customerId, items: [] });
    }
    return cart;
  }

  async addToCart(customerId, mealId, quantity) {
    const meal = await mealRepository.findById(mealId);
    if (!meal) {
      throw new ApiError(404, "Meal not found");
    }

    if (meal.status !== MEAL_STATUS.ACTIVE) {
      throw new ApiError(400, "Meal is not active and cannot be added to cart");
    }

    let cart = await cartRepository.findByCustomerId(customerId);
    if (!cart) {
      cart = await cartRepository.create({
        customerId,
        items: [{ mealId, quantity }],
      });
      return cart;
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.mealId._id.toString() === mealId.toString()
    );

    if (itemIndex > -1) {
      // If meal already in cart, update its quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      // Add new meal to cart
      cart.items.push({ mealId, quantity });
    }

    return await cartRepository.update(customerId, { items: cart.items });
  }

  async updateQuantity(customerId, mealId, quantity) {
    const cart = await cartRepository.findByCustomerId(customerId);
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.mealId._id.toString() === mealId.toString()
    );

    if (itemIndex === -1) {
      throw new ApiError(404, "Meal not found in cart");
    }

    cart.items[itemIndex].quantity = quantity;

    return await cartRepository.update(customerId, { items: cart.items });
  }

  async removeFromCart(customerId, mealId) {
    const cart = await cartRepository.findByCustomerId(customerId);
    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const initialLength = cart.items.length;
    cart.items = cart.items.filter(
      (item) => item.mealId._id.toString() !== mealId.toString()
    );

    if (cart.items.length === initialLength) {
      throw new ApiError(404, "Meal not found in cart");
    }

    return await cartRepository.update(customerId, { items: cart.items });
  }

  async clearCart(customerId) {
    return await cartRepository.update(customerId, { items: [] });
  }
}

module.exports = new CartService();
