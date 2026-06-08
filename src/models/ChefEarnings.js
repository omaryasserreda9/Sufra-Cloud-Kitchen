const mongoose = require("mongoose");

const chefEarningsSchema = new mongoose.Schema(
  {
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },
    grossAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    commission: {
      type: Number,
      required: true,
      min: 0,
    },
    netAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to prevent duplicate earnings for the same chef and order
chefEarningsSchema.index({ chefId: 1, orderId: 1 }, { unique: true });

module.exports = mongoose.model("ChefEarnings", chefEarningsSchema);
