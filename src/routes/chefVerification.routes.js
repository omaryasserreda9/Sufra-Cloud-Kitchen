const express = require("express");
const chefVerificationController = require("../controllers/chefVerification.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorize(ROLES.CHEF),
  upload.fields([
    { name: "nationalIdImage", maxCount: 1 },
    { name: "nationalIdBackImage", maxCount: 1 },
    { name: "healthCertificateImage", maxCount: 1 },
    { name: "kitchenImages", maxCount: 5 },
  ]),
  chefVerificationController.submitRequest
);

router.get(
  "/status",
  authMiddleware,
  authorize(ROLES.CHEF),
  chefVerificationController.getStatus
);

router.patch(
  "/:id/status",
  authMiddleware,
  authorize(ROLES.ADMIN),
  chefVerificationController.updateStatus
);

router.get(
  "/pending",
  authMiddleware,
  authorize(ROLES.ADMIN),
  chefVerificationController.getPendingRequests
);

module.exports = router;
