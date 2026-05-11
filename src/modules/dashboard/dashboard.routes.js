const express = require("express");
const router = express.Router();

const dashboardController = require("./dashboard.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  dashboardController.obtenerDashboard
);

module.exports = router;