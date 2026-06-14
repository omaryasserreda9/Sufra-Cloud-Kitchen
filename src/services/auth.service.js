const bcrypt = require("bcryptjs");
const { getModelByRole } = require("../utils/modelResolver");
const generateToken = require("../utils/generateToken");
const ApiError = require("../utils/ApiError");
const connectDB = require("../config/database");
const googleClient = require("../config/google");
const crypto = require("crypto");
const sendEmail = require("../utils/sendEmail");
const ROLES = require("../constants/roles");

class AuthService {
  /**
   * Register a new user based on their role.
   * @param {Object} userData - Data for registration.
   * @returns {Object} - Created user and JWT token.
   */
  async register(userData) {
    const { firstName, lastName, email, password, role } = userData;

    console.log("REGISTER SERVICE START");

    if (!role || !email || !password) {
      throw new ApiError(400, "Missing required fields");
    }

    if (role === ROLES.DELIVERY) {
      throw new ApiError(403, "Delivery accounts can only be created by administrators.");
    }

    const Model = getModelByRole(role);

    if (!Model) {
      throw new ApiError(400, "Invalid role");
    }

    console.log("MODEL OK:", Model.modelName);

    const existingUser = await Model.findOne({ email });

    console.log("AFTER FINDONE");

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Model.create({
      ...userData,
      passwordHash,
    });

    // Create wallet for chef if role is chef
    if (role === "chef") {
      const settlementService = require("./settlement.service");
      await settlementService.getChefWallet(user._id);
    }

    const token = generateToken(user._id, user.role);

    const userObject = user.toObject();
    delete userObject.passwordHash;

    return { user: userObject, token };
  }

  /**
   * Authenticate a user based on their role and credentials.
   * @param {string} email - User email.
   * @param {string} password - Plain text password.
   * @param {string} role - User role.
   * @returns {Object} - Authenticated user and JWT token.
   */
  async login(email, password, role) {
    if (!role) {
      throw new ApiError(400, "Role is required for login.");
    }

    const Model = getModelByRole(role);

    // Find the user only in the specified role's collection
    const user = await Model.findOne({ email }).select("+passwordHash");

    if (!user) {
      throw new ApiError(
        401,
        "Invalid email or password for the specified role.",
      );
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password.");
    }

    if (role !== ROLES.DELIVERY && user.isBlocked === 1) {
      throw new ApiError(403, "Your account has been blocked.");
    }

    const token = generateToken(user._id, user.role);

    const userObject = user.toObject();
    delete userObject.passwordHash;

    return {
      user: userObject,
      token,
    };
  }

  /**
   * Retrieve the current authenticated user.
   * @param {string} userId - User ID from token.
   * @param {string} role - User role from token.
   * @returns {Object} - User data.
   */
  async getCurrentUser(userId, role) {
    const Model = getModelByRole(role);
    const user = await Model.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not found.");
    }
    return user;
  }

  async googleLogin(idToken, role) {
    if (!role) {
      throw new ApiError(400, "Role is required");
    }

    if (role === ROLES.DELIVERY) {
      throw new ApiError(403, "Delivery users cannot use Google login.");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();

    const { email, given_name, family_name, picture } = payload;

    const Model = getModelByRole(role);

    let user = await Model.findOne({ email });

    // Create user if not found
    if (!user) {
      user = await Model.create({
        firstName: given_name,
        lastName: family_name,
        email,
        role,
        authProvider: "google",
      });

      // Create wallet for chef
      if (role === "chef") {
        const settlementService = require("./settlement.service");
        await settlementService.getChefWallet(user._id);
      }
    }

    if (user.isBlocked === 1) {
      throw new ApiError(403, "Your account has been blocked.");
    }

    const token = generateToken(user._id, user.role);

    const userObject = user.toObject();

    delete userObject.passwordHash;

    return {
      user: userObject,
      token,
    };
  }

  async forgotPassword(email, role) {
    const Model = getModelByRole(role);

    if (!Model) {
      throw new ApiError(400, "Invalid role");
    }

    const user = await Model.findOne({ email });

    if (!user) {
      throw new ApiError(404, "No user found with this email");
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    user.resetPasswordOTP = hashedOTP;
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000;

    await user.save();

    await sendEmail(
      user.email,
      "Reset Password",
      `Your OTP is ${otp}. It is valid for 15 minutes.`,
    );

    return {
      message: "OTP sent successfully",
    };
  }

  async resetPassword(email, role, otp, newPassword) {
    const Model = getModelByRole(role);

    if (!Model) {
      throw new ApiError(400, "Invalid role");
    }

    const hashedOTP = crypto.createHash("sha256").update(otp).digest("hex");

    const user = await Model.findOne({
      email,
      resetPasswordOTP: hashedOTP,
      resetPasswordExpire: {
        $gt: Date.now(),
      },
    });

    if (!user) {
      throw new ApiError(400, "Invalid or expired OTP");
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);

    user.resetPasswordOTP = undefined;
    user.resetPasswordExpire = undefined;

    await user.save();

    return {
      message: "Password reset successfully",
    };
  }
}

module.exports = new AuthService();
