const express = require("express");
const chefController = require("../controllers/chef.controller");
const brandingController = require("../controllers/branding.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const validateRequest = require("../middlewares/validate.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.patch(
  "/:id/toggle-verification",
  authMiddleware,
  authorize(ROLES.ADMIN),
  chefController.toggleVerification,
);

router.put(
  "/profile",
  authMiddleware,
  authorize(ROLES.CHEF),
  chefController.updateProfile,
);

router.get(
  "/",
  chefController.getAllChefs,
);

router.get(
  "/:id",
  authMiddleware,
  chefController.getChefDetails,
);

router.post(
  "/kitchen-branding",
  authMiddleware,
  authorize(ROLES.CHEF),
  brandingController.generateKitchenBrandingController,
);

module.exports = router;
