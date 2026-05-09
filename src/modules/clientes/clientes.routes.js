const express = require("express");
const router = express.Router();

const clientesController = require("./clientes.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  clientesController.listarClientes
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  clientesController.obtenerCliente
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  clientesController.crearCliente
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  clientesController.actualizarCliente
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  clientesController.eliminarCliente
);

module.exports = router;