const express = require("express");
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authMiddleware);

// Customer endpoints
router.post("/checkout", orderController.checkout);

router.get(
  "/my-orders",
  authorize(ROLES.CUSTOMER),
  orderController.getCustomerOrders,
);

// General (Customer, Chef, Admin can view their relevant orders)
router.get(
  "/:id",
  authorize(ROLES.CUSTOMER, ROLES.CHEF, ROLES.ADMIN),
  orderController.getOrderById,
);

// Chef/Admin endpoints
router.patch(
  "/:id/status",
  authorize(ROLES.CHEF, ROLES.ADMIN),
  orderController.updateStatus,
);

module.exports = router;
