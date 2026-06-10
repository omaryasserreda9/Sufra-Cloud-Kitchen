const Chef = require("../models/Chef");
const mongoose = require("mongoose");

class ChefRepository {
  async findById(id) {
    const chef = await Chef.findById(id).lean();
    if (!chef) return null;

    const Review = require("../models/Review");
    const stats = await Review.aggregate([
      { $match: { chefId: new mongoose.Types.ObjectId(id) } },
      { $group: { _id: "$chefId", averageRating: { $avg: "$rating" } } },
    ]);

    chef.averageRating = stats.length > 0 ? stats[0].averageRating : 0;
    return chef;
  }

  async update(id, updateData) {
    return await Chef.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async findAll() {
    return await Chef.aggregate([
      {
        $lookup: {
          from: "reviews",
          localField: "_id",
          foreignField: "chefId",
          as: "reviews",
        },
      },
      {
        $addFields: {
          averageRating: { $ifNull: [{ $avg: "$reviews.rating" }, 0] },
        },
      },
      {
        $project: {
          reviews: 0,
        },
      },
    ]);
  }
}

module.exports = new ChefRepository();

