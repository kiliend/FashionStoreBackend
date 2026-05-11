const express = require("express");
const router = express.Router();

const combosController = require("./combos.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  combosController.listarCombos
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  combosController.obtenerCombo
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  combosController.crearCombo
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  combosController.actualizarCombo
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  combosController.eliminarCombo
);

module.exports = router;