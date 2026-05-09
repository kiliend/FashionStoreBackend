const express = require("express");
const router = express.Router();

const vehiculosController = require("./vehiculos.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "despacho", "reparto"),
  vehiculosController.listarVehiculos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "despacho", "reparto"),
  vehiculosController.obtenerVehiculo
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  vehiculosController.crearVehiculo
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  vehiculosController.actualizarVehiculo
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  vehiculosController.eliminarVehiculo
);

module.exports = router;