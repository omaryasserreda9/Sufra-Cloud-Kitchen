const mongoose = require("mongoose");

const chefWalletSchema = new mongoose.Schema(
  {
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
      unique: true,
    },
    availableBalance: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ChefWallet", chefWalletSchema);
