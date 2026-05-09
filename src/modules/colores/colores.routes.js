const express = require("express");
const router = express.Router();

const coloresController = require("./colores.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  coloresController.listarColores
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  coloresController.obtenerColor
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  coloresController.crearColor
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  coloresController.actualizarColor
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  coloresController.eliminarColor
);

module.exports = router;