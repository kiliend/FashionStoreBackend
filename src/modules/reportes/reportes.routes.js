const express = require("express");
const router = express.Router();

const reportesController = require("./reportes.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/resumen-gerencial",
  verifyToken,
  authorizeRoles("admin"),
  reportesController.resumenGerencial
);

router.get(
  "/ventas",
  verifyToken,
  authorizeRoles("admin"),
  reportesController.reporteVentas
);

router.get(
  "/inventario",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  reportesController.reporteInventario
);

router.get(
  "/compras",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  reportesController.reporteCompras
);

router.get(
  "/productos-mas-vendidos",
  verifyToken,
  authorizeRoles("admin"),
  reportesController.reporteProductosMasVendidos
);

module.exports = router;