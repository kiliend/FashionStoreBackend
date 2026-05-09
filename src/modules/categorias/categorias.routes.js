const express = require("express");
const router = express.Router();

const categoriasController = require("./categorias.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  categoriasController.listarCategorias
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  categoriasController.obtenerCategoria
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  categoriasController.crearCategoria
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  categoriasController.actualizarCategoria
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  categoriasController.eliminarCategoria
);

module.exports = router;