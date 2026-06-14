const express = require("express");
const userController = require("../controllers/user.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const validateRequest = require("../middlewares/validate.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

/**
 * @route   PATCH /api/users/customers/:id/toggle-block
 * @desc    Toggle block status of a customer
 * @access  Private (Admin)
 */
router.patch(
  "/customers/:id/toggle-block",
  authMiddleware,
  authorize(ROLES.ADMIN),
  userController.toggleCustomerBlock
);

/**
 * @route   GET /api/users/customers
 * @desc    Get all customers
 * @access  Private (Admin)
 */
router.get(
  "/customers",
  authMiddleware,
  authorize(ROLES.ADMIN),
  userController.getAllCustomers
);

/**
 * @route   GET /api/users/delivery
 * @desc    Get all delivery personnel
 * @access  Private (Admin)
 */
router.get(
  "/delivery",
  authMiddleware,
  authorize(ROLES.ADMIN),
  userController.getAllDeliveries
);

/**
 * @route   DELETE /api/users/delivery/:id
 * @desc    Delete a delivery user
 * @access  Private (Admin)
 */
router.delete(
  "/delivery/:id",
  authMiddleware,
  authorize(ROLES.ADMIN),
  userController.deleteDelivery
);

/**
 * @route   POST /api/users/delivery
 * @desc    Create a new delivery user
 * @access  Private (Admin)
 */
router.post(
  "/delivery",
  authMiddleware,
  authorize(ROLES.ADMIN),
  validateRequest(["email", "password", "phone", "firstName", "lastName"]),
  userController.createDelivery
);

module.exports = router;
