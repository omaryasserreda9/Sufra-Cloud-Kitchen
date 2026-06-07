const mealService = require("../services/meal.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const {
  uploadMultipleImages,
} = require("../utils/cloudinaryUpload");

class MealController {
  _formatMealResponse = (req, meal) => {
    const mealObj = meal.toObject ? meal.toObject() : meal;
    return {
      ...mealObj,
      images: mealObj.images,
    };
  };

  createMeal = asyncHandler(async (req, res) => {
    const chefId = req.user._id;

    const imageUrls = await uploadMultipleImages(
      req.files?.mealImages,
      "cloudkitchen/meals"
    );

    const mealData = {
      ...req.body,
      images: imageUrls,
      ingredients:
        typeof req.body.ingredients === "string"
          ? JSON.parse(req.body.ingredients)
          : req.body.ingredients,
      categories:
        typeof req.body.categories === "string"
          ? JSON.parse(req.body.categories)
          : req.body.categories,
    };

    const meal = await mealService.createMeal(chefId, mealData);

    res.status(201).json(
      new ApiResponse(201, this._formatMealResponse(req, meal), "Meal created successfully")
    );
  });

  getAllMeals = asyncHandler(async (req, res) => {
    const meals = await mealService.getAllMeals(req.query);
    const formattedMeals = meals.map((meal) => this._formatMealResponse(req, meal));

    res.status(200).json(
      new ApiResponse(200, formattedMeals, "Meals retrieved successfully")
    );
  });

  getActiveMeals = asyncHandler(async (req, res) => {
    const { categories, search } = req.query;
    let categoryIds = [];

    if (categories) {
      categoryIds = Array.isArray(categories)
        ? categories
        : categories.split(",");
    }

    const meals = await mealService.getActiveMeals(categoryIds, search);
    const formattedMeals = meals.map((meal) =>
      this._formatMealResponse(req, meal)
    );

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          formattedMeals,
          "Active meals retrieved successfully"
        )
      );
  });

  getMealById = asyncHandler(async (req, res) => {
    const meal = await mealService.getMealById(req.params.id);

    res.status(200).json(
      new ApiResponse(200, this._formatMealResponse(req, meal), "Meal retrieved successfully")
    );
  });

  updateMeal = asyncHandler(async (req, res) => {
    const mealId = req.params.id;
    const chefId = req.user._id;
    let updateData = { ...req.body };

    if (req.files && req.files.mealImages) {
      updateData.images = await uploadMultipleImages(
        req.files.mealImages,
        "cloudkitchen/meals"
      );
    }

    if (updateData.ingredients && typeof updateData.ingredients === "string") {
      updateData.ingredients = JSON.parse(updateData.ingredients);
    }

    if (updateData.categories && typeof updateData.categories === "string") {
      updateData.categories = JSON.parse(updateData.categories);
    }

    const meal = await mealService.updateMeal(mealId, chefId, updateData);

    res.status(200).json(
      new ApiResponse(200, this._formatMealResponse(req, meal), "Meal updated successfully")
    );
  });

  deleteMeal = asyncHandler(async (req, res) => {
    const mealId = req.params.id;
    const chefId = req.user._id;

    await mealService.deleteMeal(mealId, chefId);

    res.status(200).json(
      new ApiResponse(200, null, "Meal deleted successfully")
    );
  });

  updateStatus = asyncHandler(async (req, res) => {
    const mealId = req.params.id;
    const chefId = req.user._id;
    const { status } = req.body;

    const meal = await mealService.updateMealStatus(mealId, chefId, status);

    res.status(200).json(
      new ApiResponse(200, this._formatMealResponse(req, meal), "Meal status updated successfully")
    );
  });
}

module.exports = new MealController();
