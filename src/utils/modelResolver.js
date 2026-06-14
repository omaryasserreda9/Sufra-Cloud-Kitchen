const Chef = require("../models/Chef");
const Customer = require("../models/Customer");
const Admin = require("../models/Admin");
const Delivery = require("../models/Delivery");
const ApiError = require("./ApiError");
const ROLES = require("../constants/roles");

/**
 * Returns the correct Mongoose model based on the provided role.
 * @param {string} role - The user role (chef, customer, or admin).
 * @returns {mongoose.Model} - The corresponding Mongoose model.
 * @throws {ApiError} - If the role is invalid.
 */
const getModelByRole = (role) => {
  switch (role?.toLowerCase()) {
    case ROLES.CHEF:
      return Chef;
    case ROLES.CUSTOMER:
      return Customer;
    case ROLES.ADMIN:
      return Admin;
    case ROLES.DELIVERY:
      return Delivery;
    default:
      throw new ApiError(
        400,
        `Invalid role: ${role}. Supported roles are ${Object.values(ROLES).join(", ")}.`
      );
  }
};

module.exports = { getModelByRole };
