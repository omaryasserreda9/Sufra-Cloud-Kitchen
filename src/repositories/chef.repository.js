const Chef = require("../models/Chef");

class ChefRepository {
  async findById(id) {
    return await Chef.findById(id);
  }

  async update(id, updateData) {
    return await Chef.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });
  }

  async findAll() {
    return await Chef.find();
  }
}

module.exports = new ChefRepository();
