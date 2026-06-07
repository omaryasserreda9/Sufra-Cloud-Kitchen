const express = require("express");
const orderController = require("../controllers/order.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authMiddleware);

// Customer endpoints
router.post("/checkout", authorize(ROLES.CUSTOMER), orderController.checkout);

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
router.get(
  "/chef/orders",
  authorize(ROLES.CHEF),
  orderController.getChefOrders,
);
router.patch(
  "/:id/status",
  authorize(ROLES.CHEF, ROLES.ADMIN),
  orderController.updateStatus,
);
router.patch(
  "/:id/items/status",
  authorize(ROLES.CHEF),
  orderController.updateItemStatus,
);

module.exports = router;
