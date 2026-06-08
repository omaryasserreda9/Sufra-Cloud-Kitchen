const paymentService = require("../services/payment.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class PaymentController {
  /**
   * Paymob Webhook Handler
   * Acts as a bridge between Paymob and internal payment system.
   */
  handlePaymobWebhook = asyncHandler(async (req, res) => {
    const { type, obj } = req.body;

    if (type === "TRANSACTION" && obj.success === true) {
      const paymentId = obj.order.merchant_order_id;
      
      const transactionData = {
        providerTransactionId: obj.id.toString(),
        providerReference: obj.order.id.toString(),
        paidAt: obj.created_at,
      };

      await paymentService.confirmPayment(paymentId, transactionData);
    }

    // Paymob expects 200 OK
    res.status(200).send("OK");
  });
}

module.exports = new PaymentController();
