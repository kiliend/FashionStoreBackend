const express = require("express");
const router = express.Router();

const sunatBaseController = require("./sunat_base.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

/* =========================
   EMPRESA
========================= */

router.get(
  "/empresa",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.obtenerEmpresa
);

router.post(
  "/empresa",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.crearEmpresa
);

router.put(
  "/empresa/:id",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.actualizarEmpresa
);

/* =========================
   PARAMETROS SUNAT
========================= */

router.get(
  "/parametros",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.obtenerParametros
);

router.post(
  "/parametros",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.crearParametros
);

router.put(
  "/parametros/:id",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.actualizarParametros
);

/* =========================
   SERIES
========================= */

router.get(
  "/series",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.listarSeries
);

router.post(
  "/series",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.crearSerie
);

router.put(
  "/series/:id",
  verifyToken,
  authorizeRoles("admin"),
  sunatBaseController.actualizarSerie
);

module.exports = router;