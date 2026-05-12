const express = require("express");
const router = express.Router();

const ventasController = require("./ventas.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  ventasController.listarVentas
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  ventasController.obtenerVenta
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  ventasController.crearVenta
);

router.put(
  "/:id/anular",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  ventasController.anularVenta
);

router.put(
  "/:id/completar",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  ventasController.completarVenta
);

module.exports = router;