const express = require("express");
const router = express.Router();

const productosController = require("./productos.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  productosController.listarProductos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  productosController.obtenerProducto
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  productosController.crearProducto
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  productosController.actualizarProducto
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  productosController.eliminarProducto
);

module.exports = router;