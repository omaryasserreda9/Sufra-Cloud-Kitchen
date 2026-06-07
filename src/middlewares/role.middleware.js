const authorize = (...roles) => {
  const normalizedRoles = roles.map(r => r.toLowerCase());

  return (req, res, next) => {
    const userRole = (req.user.role || "").toLowerCase();

    if (!normalizedRoles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    next();
  };
};

module.exports = authorize;