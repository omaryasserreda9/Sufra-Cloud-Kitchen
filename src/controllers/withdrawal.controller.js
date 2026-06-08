const withdrawalService = require("../services/withdrawal.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class WithdrawalController {
  /**
   * Chef requests a withdrawal
   */
  requestWithdrawal = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const { amount, notes } = req.body;

    const withdrawal = await withdrawalService.requestWithdrawal(chefId, amount, notes);

    res
      .status(201)
      .json(new ApiResponse(201, withdrawal, "Withdrawal request created successfully"));
  });

  /**
   * Chef views their withdrawal history
   */
  getChefHistory = asyncHandler(async (req, res) => {
    const chefId = req.user._id;
    const history = await withdrawalService.getChefWithdrawalHistory(chefId);

    res
      .status(200)
      .json(new ApiResponse(200, history, "Withdrawal history retrieved successfully"));
  });

  /**
   * Admin lists all withdrawal requests
   */
  getAllRequests = asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const requests = await withdrawalService.getAllWithdrawalRequests(filter);

    res
      .status(200)
      .json(new ApiResponse(200, requests, "Withdrawal requests retrieved successfully"));
  });

  /**
   * Admin approves a request
   */
  approveRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;
    const { notes } = req.body;

    const withdrawal = await withdrawalService.approveWithdrawal(id, adminId, notes);

    res
      .status(200)
      .json(new ApiResponse(200, withdrawal, "Withdrawal request approved successfully"));
  });

  /**
   * Admin rejects a request
   */
  rejectRequest = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const adminId = req.user._id;
    const { notes } = req.body;

    const withdrawal = await withdrawalService.rejectWithdrawal(id, adminId, notes);

    res
      .status(200)
      .json(new ApiResponse(200, withdrawal, "Withdrawal request rejected successfully"));
  });
}

module.exports = new WithdrawalController();
