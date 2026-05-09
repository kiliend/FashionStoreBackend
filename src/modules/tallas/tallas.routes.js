const express = require("express");
const router = express.Router();

const tallasController = require("./tallas.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  tallasController.listarTallas
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "vendedor"),
  tallasController.obtenerTalla
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  tallasController.crearTalla
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  tallasController.actualizarTalla
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  tallasController.eliminarTalla
);

module.exports = router;