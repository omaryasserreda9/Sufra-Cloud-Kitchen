const express = require("express");
const settlementController = require("../controllers/settlement.controller");
const { authMiddleware } = require("../middlewares/auth.middleware");
const authorize = require("../middlewares/role.middleware");
const ROLES = require("../constants/roles");

const router = express.Router();

router.use(authMiddleware);
router.use(authorize(ROLES.CHEF));

router.get("/wallet", settlementController.getWallet);
router.get("/earnings", settlementController.getEarnings);

module.exports = router;
