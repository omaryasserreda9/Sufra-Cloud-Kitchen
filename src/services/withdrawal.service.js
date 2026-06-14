const ChefWithdrawal = require("../models/ChefWithdrawal");
const ChefWallet = require("../models/ChefWallet");
const { WITHDRAWAL_STATUS } = require("../constants/withdrawalStatus");
const ApiError = require("../utils/ApiError");
const mongoose = require("mongoose");
const Chef = require("../models/Chef");
const notificationService = require("./notification.service");
const { notificationPresets } = require("../constants/notificationPresets");

class WithdrawalService {
  /**
   * Chef requests a withdrawal.
   */
  async requestWithdrawal(chefId, amount, notes = "") {
    const wallet = await ChefWallet.findOne({ chefId });
    if (!wallet || wallet.availableBalance < amount) {
      throw new ApiError(400, "Insufficient wallet balance");
    }

    // We might want to "lock" the balance here, but for now we just create a pending request.
    // If we lock it, we'd deduct it now and refund if rejected.
    // For simplicity, we check balance now, and check again during approval.
    
    const withdrawal = await ChefWithdrawal.create({
      chefId,
      amount,
      notes,
    });

    const chef = await Chef.findById(chefId).select("firstName lastName kitchenName").lean();
    const chefName =
      chef?.kitchenName || `${chef?.firstName || ""} ${chef?.lastName || ""}`.trim() || "A chef";

    await notificationService.notifyAdmins({
      ...notificationPresets.adminWithdrawalRequest({
        chefName,
        amount,
        withdrawalId: withdrawal._id,
      }),
      entityType: "ChefWithdrawal",
      entityId: withdrawal._id,
      deduplicationKey: `withdrawal-request:${withdrawal._id}`,
      metadata: { chefId },
    });

    return withdrawal;
  }

  /**
   * Admin approves a withdrawal.
   */
  async approveWithdrawal(withdrawalId, adminId, notes = "") {
    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      const withdrawal = await ChefWithdrawal.findById(withdrawalId).session(session);
      if (!withdrawal) throw new ApiError(404, "Withdrawal request not found");
      if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
        throw new ApiError(400, `Cannot approve withdrawal in ${withdrawal.status} status`);
      }

      const wallet = await ChefWallet.findOne({ chefId: withdrawal.chefId }).session(session);
      if (!wallet || wallet.availableBalance < withdrawal.amount) {
        throw new ApiError(400, "Chef no longer has sufficient balance");
      }

      // Deduct from wallet
      wallet.availableBalance -= withdrawal.amount;
      await wallet.save({ session });

      // Update withdrawal record
      withdrawal.status = WITHDRAWAL_STATUS.APPROVED; // Or COMPLETED
      withdrawal.adminId = adminId;
      withdrawal.processedAt = new Date();
      if (notes) withdrawal.notes = (withdrawal.notes ? withdrawal.notes + " | " : "") + notes;
      await withdrawal.save({ session });

      await session.commitTransaction();

      await notificationService.notifyChef(withdrawal.chefId, {
        ...notificationPresets.chefWithdrawalUpdated({
          status: WITHDRAWAL_STATUS.APPROVED,
          amount: withdrawal.amount,
          withdrawalId: withdrawal._id,
        }),
        entityType: "ChefWithdrawal",
        entityId: withdrawal._id,
        deduplicationKey: `withdrawal-status:${withdrawal._id}:${WITHDRAWAL_STATUS.APPROVED}`,
      });

      return withdrawal;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  /**
   * Admin rejects a withdrawal.
   */
  async rejectWithdrawal(withdrawalId, adminId, notes = "") {
    const withdrawal = await ChefWithdrawal.findById(withdrawalId);
    if (!withdrawal) throw new ApiError(404, "Withdrawal request not found");
    if (withdrawal.status !== WITHDRAWAL_STATUS.PENDING) {
      throw new ApiError(400, `Cannot reject withdrawal in ${withdrawal.status} status`);
    }

    withdrawal.status = WITHDRAWAL_STATUS.REJECTED;
    withdrawal.adminId = adminId;
    withdrawal.processedAt = new Date();
    if (notes) withdrawal.notes = (withdrawal.notes ? withdrawal.notes + " | " : "") + notes;
    
    await withdrawal.save();

    await notificationService.notifyChef(withdrawal.chefId, {
      ...notificationPresets.chefWithdrawalUpdated({
        status: WITHDRAWAL_STATUS.REJECTED,
        amount: withdrawal.amount,
        withdrawalId: withdrawal._id,
      }),
      entityType: "ChefWithdrawal",
      entityId: withdrawal._id,
      deduplicationKey: `withdrawal-status:${withdrawal._id}:${WITHDRAWAL_STATUS.REJECTED}`,
    });

    return withdrawal;
  }

  /**
   * Get history for a chef.
   */
  async getChefWithdrawalHistory(chefId) {
    return await ChefWithdrawal.find({ chefId }).sort({ createdAt: -1 });
  }

  /**
   * Get all requests (for admin).
   */
  async getAllWithdrawalRequests(filter = {}) {
    return await ChefWithdrawal.find(filter)
      .sort({ createdAt: -1 })
      .populate("chefId", "firstName lastName kitchenName");
  }
}

module.exports = new WithdrawalService();
