const reviewService = require("../services/review.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class ReviewController {
  addReview = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const review = await reviewService.addReview(customerId, req.body);

    res.status(201).json(
      new ApiResponse(201, review, "Review added successfully")
    );
  });
}

module.exports = new ReviewController();
