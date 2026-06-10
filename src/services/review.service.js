const Review = require("../models/Review");
const Meal = require("../models/Meal");
const ApiError = require("../utils/ApiError");

class ReviewService {
  async addReview(customerId, reviewData) {
    const { mealId, rating, comment } = reviewData;
    
    const meal = await Meal.findById(mealId);
    if (!meal) {
      throw new ApiError(404, "Meal not found");
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
