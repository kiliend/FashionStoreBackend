const express = require("express");
const router = express.Router();

const devolucionesController = require("./devoluciones.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  devolucionesController.listarDevoluciones
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  devolucionesController.obtenerDevolucion
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  devolucionesController.crearDevolucion
);

router.put(
  "/:id/procesar",
  verifyToken,
  authorizeRoles("admin"),
  devolucionesController.procesarDevolucion
);

router.put(
  "/:id/rechazar",
  verifyToken,
  authorizeRoles("admin"),
  devolucionesController.rechazarDevolucion
);

module.exports = router;