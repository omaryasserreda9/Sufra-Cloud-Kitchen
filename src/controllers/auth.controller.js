const authService = require("../services/auth.service");
const ApiResponse = require("../utils/ApiResponse");
const asyncHandler = require("../utils/asyncHandler");

class AuthController {
  register = asyncHandler(async (req, res) => {
    console.log("REGISTER START");
    const result = await authService.register(req.body);

    res
      .status(201)
      .json(new ApiResponse(201, result, "User registered successfully"));
  });

  login = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    const result = await authService.login(email, password, role);

    res.status(200).json(new ApiResponse(200, result, "Login successful"));
  });

  googleLogin = asyncHandler(async (req, res) => {
    const { token, role } = req.body;

    const result = await authService.googleLogin(token, role);

    res
      .status(200)
      .json(new ApiResponse(200, result, "Google login successful"));
  });

  me = asyncHandler(async (req, res) => {
    // req.user and req.role are attached by authMiddleware
    const user = await authService.getCurrentUser(req.user._id, req.user.role);

    res
      .status(200)
      .json(new ApiResponse(200, user, "Current user retrieved successfully"));
  });

  forgotPassword = asyncHandler(async (req, res) => {
    const { email, role } = req.body;

    const result = await authService.forgotPassword(email, role);

    res.status(200).json(new ApiResponse(200, result, "OTP sent successfully"));
  });

  resetPassword = asyncHandler(async (req, res) => {
    console.log(req.body);
    const { email, role, otp, newPassword } = req.body;

    const result = await authService.resetPassword(
      email,
      role,
      otp,
      newPassword,
    );

    res
      .status(200)
      .json(new ApiResponse(200, result, "Password reset successfully"));
  });
}

module.exports = new AuthController();
