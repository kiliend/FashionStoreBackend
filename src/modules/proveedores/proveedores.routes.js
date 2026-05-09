const express = require("express");
const router = express.Router();

const proveedoresController = require("./proveedores.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  proveedoresController.listarProveedores
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  proveedoresController.obtenerProveedor
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  proveedoresController.crearProveedor
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  proveedoresController.actualizarProveedor
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  proveedoresController.eliminarProveedor
);

module.exports = router;