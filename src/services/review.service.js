const Review = require("../models/Review");
const Meal = require("../models/Meal");
const ApiError = require("../utils/ApiError");
const { analyzeComment } = require("./sentiment.service");

class ReviewService {
  async addReview(customerId, reviewData) {
    const { mealId, rating, comment } = reviewData;

    const meal = await Meal.findById(mealId);

    if (!meal) {
      throw new ApiError(404, "Meal not found");
    }

    // Check comment toxicity
    const result = await analyzeComment(comment);

    const prediction = result[0];

    if (
      prediction.label.toLowerCase() === "toxic" &&
      prediction.score > 0.6
    ) {
      throw new ApiError(
        400,
        "Your review contains offensive or aggressive language."
      );
    }

    const review = await Review.create({
      customerId,
      mealId,
      chefId: meal.chefId,
      rating,
      comment
    });

    return review;
  }
}

module.exports = new ReviewService();