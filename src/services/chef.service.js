const chefRepository = require("../repositories/chef.repository");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");

class ChefService {
  async toggleVerification(chefId) {
    const chef = await chefRepository.findById(chefId);

    if (!chef) {
      throw new ApiError(404, "Chef not found");
    }

    const updatedChef = await chefRepository.update(chefId, {
      isVerified: !chef.isVerified,
    });

    return updatedChef;
  }

  async toggleBlock(chefId) {
    const chef = await chefRepository.findById(chefId);

    if (!chef) {
      throw new ApiError(404, "Chef not found");
    }

    const isBlocked = chef.isBlocked === 1 ? 0 : 1;
    const status = isBlocked === 1 ? "blocked" : "active";

    const updatedChef = await chefRepository.update(chefId, {
      isBlocked,
      status,
    });

    return updatedChef;
  }

  async updateProfile(chefId, updateData) {
    // Exclude sensitive fields that should not be changed via this endpoint
    const { role, status, isVerified, isBlocked, passwordHash, ...allowedData } =
      updateData;

    // If password is being updated, hash it
    if (allowedData.password) {
      allowedData.passwordHash = await bcrypt.hash(allowedData.password, 10);
      delete allowedData.password;
    }

    const chef = await chefRepository.update(chefId, allowedData);

    if (!chef) {
      throw new ApiError(404, "Chef not found");
    }

    return chef;
  }

  async getChefById(chefId) {
    const chef = await chefRepository.findById(chefId);

    if (!chef) {
      throw new ApiError(404, "Chef not found");
    }

    return chef;
  }

  async getAllChefs() {
    return await chefRepository.findAll();
  }
}

module.exports = new ChefService();
