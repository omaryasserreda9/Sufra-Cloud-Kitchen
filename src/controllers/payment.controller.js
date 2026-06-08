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

    const success = obj?.success;
    const paymentId = obj?.order?.merchant_order_id;

    if (type === "TRANSACTION" && success && paymentId) {
      const transactionData = {
        providerTransactionId: obj.id?.toString(),
        providerReference: obj.order.id?.toString(),
        paidAt: obj.created_at,
      };

      await paymentService.confirmPayment(paymentId, transactionData);
    }

    // Paymob always expects 200
    return res.status(200).send("OK");
  });
}

module.exports = new PaymentController();
