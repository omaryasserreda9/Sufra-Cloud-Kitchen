const categoryService = require("../services/category.service");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");
const { uploadSingleImage } = require("../utils/cloudinaryUpload");

class CategoryController {
  createCategory = asyncHandler(async (req, res) => {
    const { name } = req.body;
    const imageFile = req.file;

    if (!name || !imageFile) {
      throw new ApiError(400, "Category name and image are required");
    }

    const imageUrl = await uploadSingleImage(imageFile, "cloudkitchen/categories");

    const category = await categoryService.createCategory({
      name,
      image: imageUrl,
    });

    res
      .status(201)
      .json(new ApiResponse(201, category, "Category created successfully"));
  });

  getAllCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getAllCategories();
    res
      .status(200)
      .json(
        new ApiResponse(200, categories, "Categories retrieved successfully")
      );
  });

  getActiveCategories = asyncHandler(async (req, res) => {
    const categories = await categoryService.getActiveCategories();
    res
      .status(200)
      .json(
        new ApiResponse(200, categories, "Active categories retrieved successfully")
      );
  });

  getActiveCategoriesWithMeals = asyncHandler(async (req, res) => {
    const { limit } = req.query;
    const categories = await categoryService.getActiveCategoriesWithMeals(Number(limit) || 5);
    res
      .status(200)
      .json(
        new ApiResponse(200, categories, "Active categories with random meals retrieved successfully")
      );
  });

  getCategoryById = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const category = await categoryService.getCategoryById(id);
    res
      .status(200)
      .json(
        new ApiResponse(200, category, "Category retrieved successfully")
      );
  });

  updateCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const imageFile = req.file;

    const updateData = {};
    if (name) updateData.name = name;
    if (imageFile) {
      updateData.image = await uploadSingleImage(imageFile, "cloudkitchen/categories");
    }

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(400, "At least one field (name or image) must be provided for update");
    }

    const category = await categoryService.updateCategory(id, updateData);

    res
      .status(200)
      .json(new ApiResponse(200, category, "Category updated successfully"));
  });

  deleteCategory = asyncHandler(async (req, res) => {
    const { id } = req.params;
    await categoryService.deleteCategory(id);
    res
      .status(200)
      .json(new ApiResponse(200, null, "Category deleted successfully"));
  });

  updateStatus = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["active", "inactive"].includes(status)) {
      throw new ApiError(400, "Valid status (active/inactive) is required");
    }

    const category = await categoryService.updateCategoryStatus(id, status);

    res
      .status(200)
      .json(new ApiResponse(200, category, "Category status updated successfully"));
  });
}

module.exports = new CategoryController();
