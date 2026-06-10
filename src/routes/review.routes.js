const express = require("express");
const reviewController = require("../controllers/review.controller");
const authMiddleware = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.post(
  "/",
  authMiddleware,
  authorize(ROLES.CUSTOMER),
  reviewController.addReview
);

module.exports = router;
