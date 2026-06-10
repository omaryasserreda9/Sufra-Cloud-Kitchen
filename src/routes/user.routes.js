const express = require("express");
const userController = require("../controllers/user.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
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

module.exports = router;
