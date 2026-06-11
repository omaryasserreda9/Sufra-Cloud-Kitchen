const express = require("express");
const mealPlanningController = require("../controllers/mealPlanning.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.post(
  "/generate",
  authMiddleware,
  authorize(ROLES.CUSTOMER),
  mealPlanningController.getMealPlan
);

module.exports = router;
