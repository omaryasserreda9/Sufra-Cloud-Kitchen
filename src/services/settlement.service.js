const Order = require("../models/Order");
const ChefEarnings = require("../models/ChefEarnings");
const ChefWallet = require("../models/ChefWallet");
const Payment = require("../models/Payment");
const FINANCIAL_CONFIG = require("../constants/financial");
const ORDER_STATUS = require("../constants/orderStatus");
const { PAYMENT_STATUS } = require("../constants/payment");
const ApiError = require("../utils/ApiError");

class SettlementService {
  /**
   * Automatically trigger settlement if conditions are met:
   * 1. Order status is COMPLETED
   * 2. Payment status is PAID
   * 3. settlementProcessed is false
   * @param {string} orderId 
   */
  async triggerSettlement(orderId) {
    const order = await Order.findById(orderId);
    if (!order) return;

    // Check if order is completed
    if (order.status !== ORDER_STATUS.COMPLETED) return;

    // Check if payment is paid
    const payment = await Payment.findOne({ orderId, paymentStatus: PAYMENT_STATUS.PAID });
    if (!payment) return;

    // Check if already processed
    if (order.settlementProcessed) return;

    await this.performSettlement(order);
  }

  /**
   * Internal method to execute the settlement logic.
   * @param {Object} order - The order document.
   */
  async performSettlement(order) {
    // Group items by chefId
    const chefEarningsMap = new Map();

    order.items.forEach((item) => {
      const chefId = item.chefId.toString();
      const current = chefEarningsMap.get(chefId) || 0;
      chefEarningsMap.set(chefId, current + item.subtotal);
    });

    for (const [chefId, totalEarnings] of chefEarningsMap.entries()) {
      try {
        const platformCommission = totalEarnings * FINANCIAL_CONFIG.PLATFORM_COMMISSION_RATE;
        const netAmount = totalEarnings - platformCommission;

        // Check if earnings already recorded to prevent duplicates (safety check)
        const existingEarning = await ChefEarnings.findOne({ chefId, orderId: order._id });
        if (existingEarning) continue;

        // Create Earnings Record
        await ChefEarnings.create({
          chefId,
          orderId: order._id,
          grossAmount: totalEarnings,
          commission: platformCommission,
          netAmount,
          status: "pending",
        });

        // Update Chef Wallet (Atomic increment)
        await ChefWallet.findOneAndUpdate(
          { chefId },
          { $inc: { availableBalance: netAmount } },
          { upsert: true, new: true }
        );
      } catch (error) {
        console.error(`Failed to distribute earnings for chef ${chefId} in order ${order._id}:`, error);
      }
    }

    // Mark order as processed
    order.settlementProcessed = true;
    await order.save();
  }

  /**
   * Legacy method kept for compatibility or manual triggers
   */
  async calculateAndDistributeEarnings(orderId) {
    return await this.triggerSettlement(orderId);
  }

  /**
   * Get wallet for a chef.
   */
  async getChefWallet(chefId) {
    let wallet = await ChefWallet.findOne({ chefId });
    if (!wallet) {
      wallet = await ChefWallet.create({ chefId, availableBalance: 0 });
    }
    return wallet;
  }

  /**
   * Get earnings history for a chef.
   */
  async getChefEarnings(chefId) {
    return await ChefEarnings.find({ chefId }).sort({ createdAt: -1 }).populate("orderId");
  }
}

module.exports = new SettlementService();
