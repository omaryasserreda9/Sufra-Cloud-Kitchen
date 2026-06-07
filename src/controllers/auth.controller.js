const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class AuthController {
  register = asyncHandler(async (req, res) => {
    console.log("REGISTER START");
    const result = await authService.register(req.body);

    res.status(201).json(
      new ApiResponse(201, result, "User registered successfully")
    );
  });

  login = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    const result = await authService.login(email, password, role);

    res.status(200).json(
      new ApiResponse(200, result, "Login successful")
    );
  });

  me = asyncHandler(async (req, res) => {
    // req.user and req.role are attached by authMiddleware
    const user = await authService.getCurrentUser(req.user._id, req.user.role);

    res.status(200).json(
      new ApiResponse(200, user, "Current user retrieved successfully")
    );
  });
}

module.exports = new AuthController();
