const Category = require("../models/Category");
const ApiError = require("../utils/ApiError");

class CategoryService {
  async createCategory(categoryData) {
    const existingCategory = await Category.findOne({ name: categoryData.name });
    if (existingCategory) {
      throw new ApiError(400, "Category with this name already exists");
    }
    return await Category.create(categoryData);
  }

  async getAllCategories(query = {}) {
    return await Category.find(query);
  }

  async getActiveCategories() {
    return await Category.find({ status: "active" });
  }

  async getActiveCategoriesWithMeals(mealsLimit = 5) {
    const categories = await Category.find({ status: "active" });
    const Meal = require("../models/Meal");

    const result = await Promise.all(
      categories.map(async (category) => {
        const meals = await Meal.aggregate([
          {
            $match: {
              status: "active",
              categories: category._id,
            },
          },
          { $sample: { size: mealsLimit } },
        ]);

        const populatedMeals = await Meal.populate(meals, [
          { path: "chefId", select: "firstName lastName kitchenName" },
          { path: "categories" },
        ]);

        return {
          ...category.toObject(),
          meals: populatedMeals,
        };
      })
    );

    return result;
  }

  async getCategoryById(id) {
    const category = await Category.findById(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }

  async updateCategory(id, updateData) {
    const category = await Category.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }

  async deleteCategory(id) {
    const category = await Category.findByIdAndDelete(id);
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }

  async updateCategoryStatus(id, status) {
    const category = await Category.findByIdAndUpdate(
      id,
      { status },
      { new: true, runValidators: true }
    );
    if (!category) {
      throw new ApiError(404, "Category not found");
    }
    return category;
  }
}

module.exports = new CategoryService();
