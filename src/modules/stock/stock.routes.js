const express = require("express");
const router = express.Router();

const stockController = require("./stock.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/movimientos",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  stockController.listarMovimientos
);

router.get(
  "/movimientos/:id",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  stockController.obtenerMovimiento
);

router.post(
  "/movimientos",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  stockController.crearMovimiento
);

module.exports = router;