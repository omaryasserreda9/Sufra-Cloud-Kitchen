const express = require("express");
const categoryController = require("../controllers/category.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const upload = require("../middlewares/upload.middleware");
const validateRequest = require("../middlewares/validate.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

// Publicly accessible route to get active categories
router.get("/active", categoryController.getActiveCategories);
router.get("/active-with-meals", categoryController.getActiveCategoriesWithMeals);

// Protected routes for Admin only
router.use(authMiddleware);
router.use(authorize(ROLES.ADMIN));

router.get("/", categoryController.getAllCategories);
router.post(
  "/",
  upload.single("image"),
  validateRequest(["name"]),
  categoryController.createCategory
);

router.get("/:id", categoryController.getCategoryById);

router.put(
  "/:id",
  upload.single("image"),
  categoryController.updateCategory
);

router.delete("/:id", categoryController.deleteCategory);

router.patch(
  "/:id/status",
  validateRequest(["status"]),
  categoryController.updateStatus
);

module.exports = router;
