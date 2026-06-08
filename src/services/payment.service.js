const Payment = require("../models/Payment");
const { PAYMENT_METHOD, PAYMENT_STATUS } = require("../constants/payment");
const ApiError = require("../utils/ApiError");

class PaymentService {
  async createPayment(paymentData, customer = null) {
    const { orderId, paymentMethod, amount } = paymentData;

    if (!Object.values(PAYMENT_METHOD).includes(paymentMethod)) {
      throw new ApiError(400, "Invalid payment method");
    }

    const payment = await Payment.create({
      orderId,
      paymentMethod,
      amount,
      paymentStatus: PAYMENT_STATUS.PENDING,
    });

    let paymobUrl = null;

    if (paymentMethod === PAYMENT_METHOD.PAYMOB) {
      if (!customer) {
        throw new ApiError(400, "Customer data is required for Paymob initialization");
      }
      const paymobService = require("./paymob.service");
      paymobUrl = await paymobService.initializePayment(
        amount,
        payment._id.toString(),
        customer
      );
      
      // Optionally store some reference in Payment record if needed
      // payment.providerReference = ...;
      // await payment.save();
    }

    return { payment, paymobUrl };
  }

  async confirmPayment(paymentId, transactionData) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    return await this._processConfirmation(payment, transactionData);
  }

  /**
   * Confirms payment for an order. Useful for CASH or when transactionId is unknown but orderId is.
   */
  async confirmPaymentByOrder(orderId, transactionData = {}) {
    const payment = await Payment.findOne({ orderId, paymentStatus: PAYMENT_STATUS.PENDING });
    if (!payment) return null;

    return await this._processConfirmation(payment, transactionData);
  }

  async _processConfirmation(payment, transactionData) {
    if (payment.paymentStatus === PAYMENT_STATUS.PAID) {
      return payment; // Already processed
    }

    payment.paymentStatus = PAYMENT_STATUS.PAID;
    if (transactionData.providerTransactionId) payment.providerTransactionId = transactionData.providerTransactionId;
    if (transactionData.providerReference) payment.providerReference = transactionData.providerReference;
    payment.paidAt = transactionData.paidAt || new Date();

    await payment.save();

    // Trigger order status checks (e.g., notify chefs, update order state)
    const orderService = require("./order.service");
    await orderService.handlePaymentConfirmed(payment.orderId);

    // Trigger automatic settlement if order is already completed
    const settlementService = require("./settlement.service");
    await settlementService.triggerSettlement(payment.orderId);

    return payment;
  }

  async updatePaymentStatus(paymentId, status, details = {}) {
    const payment = await Payment.findById(paymentId);
    if (!payment) {
      throw new ApiError(404, "Payment record not found");
    }

    payment.paymentStatus = status;
    if (details.paidAt) payment.paidAt = details.paidAt;
    if (details.providerReference) payment.providerReference = details.providerReference;
    if (details.providerTransactionId) payment.providerTransactionId = details.providerTransactionId;

    return await payment.save();
  }
}

module.exports = new PaymentService();
