const express = require("express");
const cartController = require("../controllers/cart.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");
const validate = require("../middlewares/validate.middleware");
// Assuming there might be a validation schema for cart, but for now I'll just implement the routes

const router = express.Router();

router.use(authMiddleware);
router.use(authorize(ROLES.CUSTOMER));

router.get("/", cartController.getCart);
router.post("/items", cartController.addItem);
router.patch("/items/:mealId", cartController.updateItemQuantity);
router.delete("/items/:mealId", cartController.removeItem);
router.delete("/", cartController.clearCart);

module.exports = router;
