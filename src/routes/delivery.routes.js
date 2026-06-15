const express = require("express");
const deliveryController = require("../controllers/delivery.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const validateRequest = require("../middlewares/validate.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

// Apply authMiddleware and delivery role check to all routes
router.use(authMiddleware);
router.use(authorize(ROLES.DELIVERY));

/**
 * @route   GET /api/delivery/current-order
 * @desc    Get active assigned order
 * @access  Private (Delivery)
 */
router.get("/current-order", deliveryController.getCurrentOrder);

/**
 * @route   GET /api/delivery/history
 * @desc    Get completed orders history
 * @access  Private (Delivery)
 */
router.get("/history", deliveryController.getHistory);

/**
 * @route   POST /api/delivery/orders/:orderId/complete
 * @desc    Mark order as completed
 * @access  Private (Delivery)
 */
router.post(
  "/orders/:orderId/complete",
  validateRequest(["otp"]),
  deliveryController.completeOrder,
);

module.exports = router;
