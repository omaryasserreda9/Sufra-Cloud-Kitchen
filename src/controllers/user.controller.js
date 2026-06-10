const userService = require("../services/user.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class UserController {
  /**
   * Toggle block status of a customer (Admin only).
   */
  toggleCustomerBlock = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const customer = await userService.toggleCustomerBlock(id);

    res.status(200).json(
      new ApiResponse(
        200,
        customer,
        `Customer ${customer.isBlocked === 1 ? "blocked" : "unblocked"} successfully`
      )
    );
  });
}

module.exports = new UserController();
