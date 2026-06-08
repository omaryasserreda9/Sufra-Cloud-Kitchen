const settlementService = require("../services/settlement.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class SettlementController {
  getWallet = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const wallet = await settlementService.getChefWallet(chefId);
    res
      .status(200)
      .json(new ApiResponse(200, wallet, "Wallet retrieved successfully"));
  });

  getEarnings = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const earnings = await settlementService.getChefEarnings(chefId);
    res
      .status(200)
      .json(new ApiResponse(200, earnings, "Earnings history retrieved successfully"));
  });
}

module.exports = new SettlementController();
