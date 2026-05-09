const express = require("express");
const router = express.Router();

const tareasController = require("./tareas.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho", "reparto", "vendedor"),
  tareasController.listarTareas
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho", "reparto", "vendedor"),
  tareasController.obtenerTarea
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  tareasController.crearTarea
);

router.put(
  "/:id/estado",
  verifyToken,
  authorizeRoles("admin", "almacen", "despacho", "reparto", "vendedor"),
  tareasController.actualizarEstadoTarea
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  tareasController.eliminarTarea
);

module.exports = router;