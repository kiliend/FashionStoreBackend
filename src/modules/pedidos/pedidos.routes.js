const express = require("express");
const router = express.Router();

const pedidosController = require("./pedidos.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho", "reparto"),
  pedidosController.listarPedidos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho", "reparto"),
  pedidosController.obtenerPedido
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  pedidosController.crearPedido
);

router.put(
  "/:id/estado",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho", "reparto"),
  pedidosController.actualizarEstadoPedido
);

router.put(
  "/:id/asignar",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho"),
  pedidosController.asignarUsuarioPedido
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  pedidosController.eliminarPedido
);

module.exports = router;