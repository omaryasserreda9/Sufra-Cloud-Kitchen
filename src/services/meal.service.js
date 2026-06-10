const mealRepository = require("../repositories/meal.repository");
const ApiError = require("../utils/ApiError");
const MEAL_STATUS = require("../constants/mealStatus");
const { calculateMealCalories } = require("./caloriesCalculator.service");

class MealService {
  async createMeal(chefId, mealData) {
    const meal = await mealRepository.create({ ...mealData, chefId });

    // Trigger background calorie calculation
    this._calculateNutritionInBackground(meal._id, mealData.ingredients);

    return meal;
  }

  _calculateNutritionInBackground(mealId, ingredients) {
    const ingredientsString = Array.isArray(ingredients)
      ? ingredients.join(", ")
      : ingredients;


    // Background process - no await here
    calculateMealCalories(ingredientsString)
      .then(async (nutritionData) => {
        console.log("nutrotion data", nutritionData);
        const updateData = {
          nutrition: {
            calories: nutritionData.total_calories || nutritionData.calories || 0,
            otherData: nutritionData,
          },
        };
        await mealRepository.update(mealId, updateData);
      })
      .catch((error) => {
        console.error(`Failed to calculate calories for meal ${mealId}:`, error);
      });
  }

  async getAllMeals(filter = {}) {
    return await mealRepository.findAll(filter);
  }

  async getActiveMeals(categoryIds = [], search = "") {
    return await mealRepository.findActiveWithRanking(categoryIds, search);
  }

  async getMealById(id) {
    const meal = await mealRepository.findById(id);
    if (!meal) {
      throw new ApiError(404, "Meal not found");
    }
    return meal;
  }

  async updateMeal(mealId, chefId, updateData) {
    const meal = await this.getMealById(mealId);

    // Ownership check
    if (meal.chefId._id.toString() !== chefId.toString()) {
      throw new ApiError(403, "You are not authorized to update this meal");
    }

    return await mealRepository.update(mealId, updateData);
  }

  async deleteMeal(mealId, chefId) {
    const meal = await this.getMealById(mealId);

    // Ownership check
    if (meal.chefId._id.toString() !== chefId.toString()) {
      throw new ApiError(403, "You are not authorized to delete this meal");
    }

    return await mealRepository.delete(mealId);
  }

  async updateMealStatus(mealId, chefId, status) {
    if (!Object.values(MEAL_STATUS).includes(status)) {
      throw new ApiError(400, "Invalid meal status");
    }

    const meal = await this.getMealById(mealId);

    // Ownership check
    if (meal.chefId._id.toString() !== chefId.toString()) {
      throw new ApiError(403, "You are not authorized to update this meal's status");
    }

    return await mealRepository.update(mealId, { status });
  }
}

module.exports = new MealService();
