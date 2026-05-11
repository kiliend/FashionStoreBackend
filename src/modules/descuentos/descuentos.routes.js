const express = require("express");
const router = express.Router();

const descuentosController = require("./descuentos.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.post(
  "/calcular",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  descuentosController.calcularDescuento
);

module.exports = router;