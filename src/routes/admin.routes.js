const express = require("express");
const adminController = require("../controllers/admin.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const validateRequest = require("../middlewares/validate.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

// Apply authMiddleware and admin role check to all routes
router.use(authMiddleware);
router.use(authorize(ROLES.ADMIN));

/**
 * @route   GET /api/admin/delivery-management
 * @desc    Get free delivery personnel and unassigned orders
 * @access  Private (Admin)
 */
router.get("/delivery-management", adminController.getDeliveryManagementData);

/**
 * @route   POST /api/admin/assign-delivery
 * @desc    Manually assign a delivery person to an order
 * @access  Private (Admin)
 */
router.post(
  "/assign-delivery",
  validateRequest(["orderId", "deliveryId"]),
  adminController.assignOrderToDelivery
);

module.exports = router;
