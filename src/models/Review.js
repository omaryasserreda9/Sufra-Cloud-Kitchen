const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema(
  {
    customerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Customer",
      required: true,
    },
    mealId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meal",
      required: true,
    },
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
reviewSchema.index({ mealId: 1, createdAt: -1 });
reviewSchema.index({ chefId: 1 });

module.exports = mongoose.model("Review", reviewSchema);
