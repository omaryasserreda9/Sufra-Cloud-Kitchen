const express = require("express");
const contactController = require("../controllers/contact.controller");
const { authMiddleware, optionalAuth } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

/**
 * @route   POST /api/contact
 * @desc    Submit a contact message
 * @access  Public (Guest, Chef, Customer)
 */
router.post(
  "/",
  optionalAuth,
  contactController.submitMessage
);

/**
 * @route   GET /api/contact
 * @desc    Get all contact messages
 * @access  Private (Admin)
 */
router.get(
  "/",
  authMiddleware,
  authorize(ROLES.ADMIN),
  contactController.getAllMessages
);

/**
 * @route   PATCH /api/contact/:id/status
 * @desc    Mark a contact message as finished
 * @access  Private (Admin)
 */
router.patch(
  "/:id/status",
  authMiddleware,
  authorize(ROLES.ADMIN),
  contactController.markAsFinished
);

module.exports = router;
