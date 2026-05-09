const express = require("express");
const router = express.Router();

const repartosController = require("./repartos.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "despacho", "reparto"),
  repartosController.listarRepartos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "despacho", "reparto"),
  repartosController.obtenerReparto
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "despacho"),
  repartosController.crearReparto
);

router.put(
  "/:id/salida",
  verifyToken,
  authorizeRoles("admin", "reparto"),
  repartosController.marcarSalida
);

router.put(
  "/:id/entregar",
  verifyToken,
  authorizeRoles("admin", "reparto"),
  repartosController.entregarReparto
);

router.put(
  "/:id/fallido",
  verifyToken,
  authorizeRoles("admin", "reparto"),
  repartosController.marcarFallido
);

module.exports = router;