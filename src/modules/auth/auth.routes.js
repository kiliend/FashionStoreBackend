const express = require("express");
const router = express.Router();

const usuariosController = require("./usuarios.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  usuariosController.listarUsuarios
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  usuariosController.obtenerUsuario
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  usuariosController.crearUsuario
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  usuariosController.actualizarUsuario
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  usuariosController.eliminarUsuario
);

module.exports = router;