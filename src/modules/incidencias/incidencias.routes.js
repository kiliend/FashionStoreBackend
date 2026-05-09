const express = require("express");
const router = express.Router();

const incidenciasController = require("./incidencias.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  incidenciasController.listarIncidencias
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  incidenciasController.obtenerIncidencia
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  incidenciasController.crearIncidencia
);

router.put(
  "/:id/estado",
  verifyToken,
  authorizeRoles("admin"),
  incidenciasController.actualizarEstadoIncidencia
);

module.exports = router;