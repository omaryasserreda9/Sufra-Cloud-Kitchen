/**
 * Middleware to validate required fields in the request body.
 * @param {string[]} requiredFields - Array of field names that must be present in req.body.
 * @returns {Function} Express middleware function.
 */
const validateRequest = (requiredFields) => {
  return (req, res, next) => {
    const body = req.body || {}; // ✅ SAFE fallback

    const missingFields = requiredFields.filter((field) => {
      const value = body[field];

      return (
        value === undefined ||
        value === null ||
        (typeof value === "string" && value.trim() === "")
      );
    });

    if (missingFields.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
        missingFields,
      });
    }

    next();
  };
};

module.exports = validateRequest;
