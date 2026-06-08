const express = require("express");
const paymentController = require("../controllers/payment.controller");

const router = express.Router();

// Webhook endpoint for Paymob
router.post("/paymob/webhook", paymentController.handlePaymobWebhook);

module.exports = router;
