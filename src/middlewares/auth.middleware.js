const jwt = require("jsonwebtoken");
const { getModelByRole } = require("../utils/modelResolver");
const ApiError = require("../utils/ApiError");
const asyncHandler = require("../utils/asyncHandler");

const authMiddleware = asyncHandler(async (req, res, next) => {
  let token;

  // 1. Extract token
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    throw new ApiError(401, "Not authorized, token missing");
  }

  // 2. Verify token
  const decoded = jwt.verify(token, process.env.JWT_SECRET);

  /**
   * Support both possible token styles:
   * - { userId, role }
   * - { _id, role }
   */
  const userId = decoded.userId || decoded._id;
  const role = decoded.role;

  if (!userId || !role) {
    throw new ApiError(401, "Invalid token payload");
  }

  // 3. Get correct model from role
  const Model = getModelByRole(role);

  // 4. Find user
  const user = await Model.findById(userId);

  if (!user) {
    throw new ApiError(401, "User no longer exists");
  }

  if (user.isBlocked === 1) {
    throw new ApiError(403, "User is blocked");
  }

  // 5. Attach user info to request
  req.user = user;
  req.user.role = role; // ensure role is always available

  console.log(`Authenticated user: ${user.email} with role: ${role}`);

  next();
});

module.exports = authMiddleware;