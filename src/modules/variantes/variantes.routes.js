const express = require("express");
const router = express.Router();

const variantesController = require("./variantes.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  variantesController.listarVariantes
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  variantesController.obtenerVariante
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  variantesController.crearVariante
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen"),
  variantesController.actualizarVariante
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  variantesController.eliminarVariante
);

module.exports = router;