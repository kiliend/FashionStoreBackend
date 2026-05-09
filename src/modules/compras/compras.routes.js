const express = require("express");
const router = express.Router();

const comprasController = require("./compras.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  comprasController.listarOrdenesCompra
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  comprasController.obtenerOrdenCompra
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  comprasController.crearOrdenCompra
);

router.put(
  "/:id/recibir",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  comprasController.recibirOrdenCompra
);

router.put(
  "/:id/pagar",
  verifyToken,
  authorizeRoles("admin"),
  comprasController.pagarOrdenCompra
);

router.put(
  "/:id/cancelar",
  verifyToken,
  authorizeRoles("admin"),
  comprasController.cancelarOrdenCompra
);

module.exports = router;