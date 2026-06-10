const Customer = require("../models/Customer");
const ApiError = require("../utils/ApiError");

class UserService {
  /**
   * Toggles the block status of a customer.
   * @param {string} customerId - ID of the customer to toggle block status for.
   * @returns {Object} - Updated customer document.
   */
  async toggleCustomerBlock(customerId) {
    const customer = await Customer.findById(customerId);

    if (!customer) {
      throw new ApiError(404, "Customer not found");
    }

    // Toggle isBlocked between 0 and 1
    customer.isBlocked = customer.isBlocked === 0 ? 1 : 0;
    
    // For consistency, update the status field as well
    if (customer.isBlocked === 1) {
      customer.status = "blocked";
    } else {
      customer.status = "active";
    }

    await customer.save();

    return customer;
  }
}

module.exports = new UserService();
