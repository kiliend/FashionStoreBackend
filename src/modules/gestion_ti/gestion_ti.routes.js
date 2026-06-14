const express = require("express");
const controller = require("./gestion_ti.controller");
const { verifyToken} = require("../auth/auth.middleware");
const { authorizeRoles} = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(verifyToken);

router.get(
  "/metricas",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.obtenerMetricas
);

router.get(
  "/incidencias",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.listarIncidencias
);

router.post(
  "/incidencias",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.crearIncidencia
);

router.get(
  "/incidencias/:id",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.obtenerIncidenciaPorId
);

router.patch(
  "/incidencias/:id/estado",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.actualizarEstadoIncidencia
);

router.get(
  "/cambios",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.listarCambios
);

router.post(
  "/cambios",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.crearCambio
);

router.get(
  "/cambios/:id",
  authorizeRoles("admin", "vendedor", "almacen", "despacho", "reparto"),
  controller.obtenerCambioPorId
);

router.patch(
  "/cambios/:id/estado",
  authorizeRoles("admin"),
  controller.actualizarEstadoCambio
);

module.exports = router;