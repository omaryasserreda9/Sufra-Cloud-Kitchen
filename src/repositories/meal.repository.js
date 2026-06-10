const Meal = require("../models/Meal");
const mongoose = require("mongoose");

class MealRepository {
  _getReviewLookupStages() {
    return [
      {
        $lookup: {
          from: "reviews",
          let: { mealId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$mealId", "$$mealId"] } } },
            { $sort: { createdAt: -1 } },
            { $limit: 2 },
            {
              $lookup: {
                from: "customers",
                localField: "customerId",
                foreignField: "_id",
                as: "customer",
              },
            },
            {
              $unwind: { path: "$customer", preserveNullAndEmptyArrays: true },
            },
            {
              $project: {
                rating: 1,
                comment: 1,
                createdAt: 1,
                customer: { firstName: 1, lastName: 1 },
              },
            },
          ],
          as: "recentReviews",
        },
      },
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "mealId",
          as: "allReviews",
        },
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: "$allReviews.rating" }, 0] },
        },
      },
      { $project: { allReviews: 0 } },
    ];
  }

  async create(mealData) {
    return await Meal.create(mealData);
  }

  async findById(id) {
    const pipeline = [
      { $match: { _id: new mongoose.Types.ObjectId(id) } },
      ...this._getReviewLookupStages(),
    ];

    const meals = await Meal.aggregate(pipeline);
    if (meals.length === 0) return null;

    return await Meal.populate(meals[0], [
      { path: "chefId", select: "firstName lastName kitchenName" },
      { path: "categories" },
    ]);
  }

  async findAll(filter = {}) {
    const match = { ...filter };

    if (match.chefId) {
      match.chefId = new mongoose.Types.ObjectId(match.chefId);
    }

    const pipeline = [{ $match: match }, ...this._getReviewLookupStages()];

    const meals = await Meal.aggregate(pipeline);

    return await Meal.populate(meals, [
      { path: "chefId", select: "firstName lastName kitchenName" },
      { path: "categories" },
    ]);
  }

  async update(id, updateData) {
    return await Meal.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async delete(id) {
    return await Meal.findByIdAndDelete(id);
  }

  async findActiveWithRanking(categoryIds = [], search = "") {
    const objectCategoryIds = categoryIds.map(
      (id) => new mongoose.Types.ObjectId(id),
    );

    const pipeline = [
      {
        $match: {
          status: "active",
        },
      },
    ];

    if (search) {
      pipeline.push(
        {
          $lookup: {
            from: "chefs",
            localField: "chefId",
            foreignField: "_id",
            as: "chef",
          },
        },
        {
          $unwind: "$chef",
        },
        {
          $match: {
            $or: [
              { name: { $regex: search, $options: "i" } },
              { "chef.kitchenName": { $regex: search, $options: "i" } },
              { "chef.firstName": { $regex: search, $options: "i" } },
              { "chef.lastName": { $regex: search, $options: "i" } },
            ],
          },
        },
      );
    }

    if (objectCategoryIds.length > 0) {
      pipeline.push({
        $match: {
          categories: { $in: objectCategoryIds },
        },
      });

      pipeline.push({
        $addFields: {
          matchCount: {
            $size: {
              $setIntersection: ["$categories", objectCategoryIds],
            },
          },
        },
      });

      pipeline.push({
        $sort: { matchCount: -1, createdAt: -1 },
      });
    } else {
      pipeline.push({
        $sort: { createdAt: -1 },
      });
    }

    // Add reviews lookup to active meals as well
    pipeline.push(...this._getReviewLookupStages());

    const meals = await Meal.aggregate(pipeline);

    return await Meal.populate(meals, [
      { path: "chefId", select: "firstName lastName kitchenName" },
      { path: "categories" },
    ]);
  }
}

module.exports = new MealRepository();
