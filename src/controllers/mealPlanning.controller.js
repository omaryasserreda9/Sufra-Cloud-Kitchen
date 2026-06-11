const mealPlanningService = require("../services/mealPlanning.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class MealPlanningController {
  /**
   * Generates a 7-day meal plan based on user preferences.
   */
  getMealPlan = asyncHandler(async (req, res) => {
    const customerId = req.user._id;
    const { weeklyBudget, mealsPerDay, favoriteCategories, allergies } = req.body;

    const mealPlan = await mealPlanningService.getMealPlan(customerId, {
      weeklyBudget,
      mealsPerDay,
      favoriteCategories,
      allergies
    });

    res.status(200).json(
      new ApiResponse(200, mealPlan, "Meal plan generated successfully")
    );
  });
}

module.exports = new MealPlanningController();
