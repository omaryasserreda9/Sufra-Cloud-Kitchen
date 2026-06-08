const express = require("express");
const withdrawalController = require("../controllers/withdrawal.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authMiddleware);

// Chef routes
router.post(
  "/request",
  authorize(ROLES.CHEF),
  withdrawalController.requestWithdrawal
);
router.get(
  "/history",
  authorize(ROLES.CHEF),
  withdrawalController.getChefHistory
);

// Admin routes
router.get(
  "/requests",
  authorize(ROLES.ADMIN),
  withdrawalController.getAllRequests
);
router.patch(
  "/:id/approve",
  authorize(ROLES.ADMIN),
  withdrawalController.approveRequest
);
router.patch(
  "/:id/reject",
  authorize(ROLES.ADMIN),
  withdrawalController.rejectRequest
);

module.exports = router;
