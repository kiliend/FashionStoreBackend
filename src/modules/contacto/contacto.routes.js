const express = require("express");
const router = express.Router();

const contactoController = require("./contacto.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  contactoController.listarMensajes
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  contactoController.obtenerMensaje
);

router.post(
  "/",
  contactoController.crearMensaje
);

router.put(
  "/:id/estado",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  contactoController.actualizarEstadoMensaje
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  contactoController.eliminarMensaje
);

module.exports = router;