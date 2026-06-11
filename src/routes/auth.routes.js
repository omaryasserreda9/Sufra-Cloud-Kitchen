const express = require("express");
const authController = require("../controllers/auth.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const validateRequest = require("../middlewares/validate.middleware");

const router = express.Router();

router.get("/me", authMiddleware, authController.me);
router.post(
  "/register",
  validateRequest(["email", "password", "role", "firstName", "lastName"]),
  authController.register
);
router.post(
  "/login",
  validateRequest(["email", "password", "role"]),
  authController.login
);

module.exports = router;
