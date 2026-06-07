const bcrypt = require("bcryptjs");
const { getModelByRole } = require("../utils/modelResolver");
const generateToken = require("../utils/generateToken");
const ApiError = require("../utils/ApiError");
const connectDB = require("../config/database");

class AuthService {
  /**
   * Register a new user based on their role.
   * @param {Object} userData - Data for registration.
   * @returns {Object} - Created user and JWT token.
   */
  async register(userData) {
    const { firstName, lastName, email, password, role } = userData;

    console.log("REGISTER START");

    // ✅ FORCE DB CONNECTION HERE
    await connectDB();

    console.log("DB CONNECTED INSIDE SERVICE");

    const Model = getModelByRole(role);

    const existingUser = await Model.findOne({ email });

    if (existingUser) {
      throw new ApiError(400, "User already exists");
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await Model.create({
      ...userData,
      passwordHash,
    });

    const token = generateToken(user._id, user.role);

    return {
      user,
      token,
    };
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
}

module.exports = new AuthService();
