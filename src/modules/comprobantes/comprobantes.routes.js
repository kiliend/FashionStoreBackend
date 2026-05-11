const express = require("express");
const router = express.Router();

const comprobantesController = require("./comprobantes.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  comprobantesController.listarComprobantes
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  comprobantesController.obtenerComprobante
);

router.post(
  "/generar/:id_venta",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  comprobantesController.generarComprobante
);

module.exports = router;