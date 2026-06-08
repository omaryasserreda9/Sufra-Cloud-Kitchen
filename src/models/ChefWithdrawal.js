const mongoose = require("mongoose");
const { WITHDRAWAL_STATUS } = require("../constants/withdrawalStatus");

const chefWithdrawalSchema = new mongoose.Schema(
  {
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 1, // Minimum withdrawal amount
    },
    status: {
      type: String,
      enum: Object.values(WITHDRAWAL_STATUS),
      default: WITHDRAWAL_STATUS.PENDING,
    },
    requestedAt: {
      type: Date,
      default: Date.now,
    },
    processedAt: {
      type: Date,
    },
    notes: {
      type: String,
      trim: true,
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Admin",
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChefWithdrawal", chefWithdrawalSchema);
