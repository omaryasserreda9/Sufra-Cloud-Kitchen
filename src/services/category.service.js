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
