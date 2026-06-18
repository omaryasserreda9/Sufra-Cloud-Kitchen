const mongoose = require("mongoose");
const VERIFICATION_STATUS = require("../constants/verificationStatus");

const chefVerificationRequestSchema = new mongoose.Schema(
  {
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
      unique: true,
    },
    nationalIdImage: {
      type: String,
      required: true,
    },
    nationalIdBackImage: {
      type: String,
      required: true,
    },
    healthCertificateImage: {
      type: String,
      required: true,
    },
    kitchenImages: {
      type: [String],
      required: true,
    },
    kitchenAddress: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(VERIFICATION_STATUS),
      default: VERIFICATION_STATUS.PENDING,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model(
  "ChefVerificationRequest",
  chefVerificationRequestSchema
);
