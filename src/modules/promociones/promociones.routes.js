const express = require("express");
const router = express.Router();

const promocionesController = require("./promociones.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.get(
  "/",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  promocionesController.listarPromociones
);

router.get(
  "/:id",
  verifyToken,
  authorizeRoles("admin", "vendedor"),
  promocionesController.obtenerPromocion
);

router.post(
  "/",
  verifyToken,
  authorizeRoles("admin"),
  promocionesController.crearPromocion
);

router.put(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  promocionesController.actualizarPromocion
);

router.delete(
  "/:id",
  verifyToken,
  authorizeRoles("admin"),
  promocionesController.eliminarPromocion
);

module.exports = router;