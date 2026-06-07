const ApiError = require("../utils/ApiError");

const errorMiddleware = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;

  let response = {
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || [],
  };

  res.status(statusCode).json(response);
};

module.exports = errorMiddleware;