const Customer = require("../models/Customer");
const Delivery = require("../models/Delivery");
const ApiError = require("../utils/ApiError");
const bcrypt = require("bcryptjs");

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

  /**
   * Get all customers.
   * @returns {Promise<Array>} - List of all customers.
   */
  async getAllCustomers() {
    return await Customer.find().sort({ createdAt: -1 });
  }

  /**
   * Create a new delivery user.
   * @param {Object} deliveryData - Data for the new delivery user.
   * @returns {Promise<Object>} - The created delivery user.
   */
  async createDelivery(deliveryData) {
    const { firstName, lastName, email, password, phone } = deliveryData;

    const existingDelivery = await Delivery.findOne({ email });
    if (existingDelivery) {
      throw new ApiError(400, "Delivery user with this email already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const delivery = await Delivery.create({
      firstName,
      lastName,
      email,
      passwordHash,
      phone,
      role: "delivery",
    });

    const deliveryObject = delivery.toObject();
    delete deliveryObject.passwordHash;

    return deliveryObject;
  }
}

module.exports = new UserService();
