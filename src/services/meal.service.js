const mealRepository = require("../repositories/meal.repository");
const ApiError = require("../utils/ApiError");
const MEAL_STATUS = require("../constants/mealStatus");

class MealService {
  async createMeal(chefId, mealData) {
    return await mealRepository.create({ ...mealData, chefId });
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
