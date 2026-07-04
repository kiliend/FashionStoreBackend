const express = require("express");
const controller = require("./gestion_ti.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

const router = express.Router();

router.use(verifyToken);

const rolesGestionTi = [
  "admin",
  "desarrollador",
  "vendedor",
  "almacen",
  "despacho",
  "reparto"
];

const rolesTecnicos = [
  "admin",
  "desarrollador"
];

router.get(
  "/metricas",
  authorizeRoles(...rolesGestionTi),
  controller.obtenerMetricas
);

router.get(
  "/usuarios-asignables",
  authorizeRoles(...rolesGestionTi),
  controller.listarUsuariosAsignables
);

router.get(
  "/historico/resumen",
  authorizeRoles(...rolesGestionTi),
  controller.obtenerResumenHistoricoGestionTi
);

router.get(
  "/historico",
  authorizeRoles(...rolesGestionTi),
  controller.listarHistoricoGestionTi
);

router.get(
  "/incidencias/tablero",
  authorizeRoles(...rolesGestionTi),
  controller.listarIncidenciasTablero
);

router.patch(
  "/incidencias/checklist/:id",
  authorizeRoles(...rolesTecnicos),
  controller.actualizarChecklistIncidencia
);

router.get(
  "/incidencias/:id/detalle",
  authorizeRoles(...rolesGestionTi),
  controller.obtenerIncidenciaDetalle
);

router.patch(
  "/incidencias/:id/mover",
  authorizeRoles(...rolesTecnicos),
  controller.moverIncidencia
);

router.patch(
  "/incidencias/:id/editar",
  authorizeRoles(...rolesTecnicos),
  controller.editarIncidencia
);

router.post(
  "/incidencias/:id/comentarios",
  authorizeRoles(...rolesGestionTi),
  controller.agregarComentarioIncidencia
);

router.post(
  "/incidencias/:id/checklist",
  authorizeRoles(...rolesTecnicos),
  controller.crearChecklistIncidencia
);

router.get(
  "/incidencias",
  authorizeRoles(...rolesGestionTi),
  controller.listarIncidencias
);

router.post(
  "/incidencias",
  authorizeRoles(...rolesGestionTi),
  controller.crearIncidencia
);

router.get(
  "/incidencias/:id",
  authorizeRoles(...rolesGestionTi),
  controller.obtenerIncidenciaPorId
);

router.patch(
  "/incidencias/:id/estado",
  authorizeRoles(...rolesTecnicos),
  controller.actualizarEstadoIncidencia
);

router.get(
  "/cambios/tablero",
  authorizeRoles(...rolesGestionTi),
  controller.listarCambiosTablero
);

router.patch(
  "/cambios/checklist/:id",
  authorizeRoles(...rolesTecnicos),
  controller.actualizarChecklistCambio
);

router.get(
  "/cambios/:id/detalle",
  authorizeRoles(...rolesGestionTi),
  controller.obtenerCambioDetalle
);

router.patch(
  "/cambios/:id/mover",
  authorizeRoles(...rolesTecnicos),
  controller.moverCambio
);

router.patch(
  "/cambios/:id/editar",
  authorizeRoles(...rolesTecnicos),
  controller.editarCambio
);

router.post(
  "/cambios/:id/comentarios",
  authorizeRoles(...rolesGestionTi),
  controller.agregarComentarioCambio
);

router.post(
  "/cambios/:id/checklist",
  authorizeRoles(...rolesTecnicos),
  controller.crearChecklistCambio
);

router.get(
  "/cambios",
  authorizeRoles(...rolesGestionTi),
  controller.listarCambios
);

router.post(
  "/cambios",
  authorizeRoles(...rolesGestionTi),
  controller.crearCambio
);

router.get(
  "/cambios/:id",
  authorizeRoles(...rolesGestionTi),
  controller.obtenerCambioPorId
);

router.patch(
  "/cambios/:id/estado",
  authorizeRoles(...rolesTecnicos),
  controller.actualizarEstadoCambio
);

module.exports = router;
