const cartService = require("../services/cart.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class CartController {
  getCart = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const cart = await cartService.getCart(customerId);

    res
      .status(200)
      .json(new ApiResponse(200, cart, "Cart retrieved successfully"));
  });

  addItem = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const { mealId, quantity = 1 } = req.body;

    const cart = await cartService.addToCart(customerId, mealId, quantity);

    res
      .status(200)
      .json(new ApiResponse(200, cart, "Meal added to cart successfully"));
  });

  updateItemQuantity = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const { mealId } = req.params;
    const { quantity } = req.body;

    const cart = await cartService.updateQuantity(customerId, mealId, quantity);

    res
      .status(200)
      .json(new ApiResponse(200, cart, "Cart item quantity updated successfully"));
  });

  removeItem = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const { mealId } = req.params;

    const cart = await cartService.removeFromCart(customerId, mealId);

    res
      .status(200)
      .json(new ApiResponse(200, cart, "Meal removed from cart successfully"));
  });

  clearCart = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const cart = await cartService.clearCart(customerId);

    res
      .status(200)
      .json(new ApiResponse(200, cart, "Cart cleared successfully"));
  });
}

module.exports = new CartController();
