const mongoose = require("mongoose");
const MEAL_STATUS = require("../constants/mealStatus");

const mealSchema = new mongoose.Schema(
  {
    chefId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Chef",
      required: true,
    },
    images: {
      type: [String],
      validate: {
        validator: function (val) {
          return val.length >= 1 && val.length <= 3;
        },
        message: "A meal must have between 1 and 3 images.",
      },
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    categories: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    ingredients: {
      type: [String],
      default: [],
    },
    nutrition: {
      calories: { type: Number, default: 0 },
      otherData: { type: mongoose.Schema.Types.Mixed },
    },
    status: {
      type: String,
      enum: Object.values(MEAL_STATUS),
      default: MEAL_STATUS.ACTIVE,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Meal", mealSchema);
