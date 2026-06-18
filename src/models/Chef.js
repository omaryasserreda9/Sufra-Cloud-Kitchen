const mongoose = require("mongoose");

const chefSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      select: false,
    },
    phone: {
      type: String,
      unique: true,
    },
    role: {
      type: String,
      default: "chef",
    },
    status: {
      type: String,
      enum: ["active", "inactive", "blocked"],
      default: "active",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    slogan: {
      type: String,
      trim: true,
    },
    kitchenName: {
      type: String,
      trim: true,
    },
    kitchenAddress: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    isBlocked: {
      type: Number,
      default: 0,
    },
    authProvider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    resetPasswordOTP: {
      type: String,
    },

    resetPasswordExpire: {
      type: Date,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model("Chef", chefSchema);
