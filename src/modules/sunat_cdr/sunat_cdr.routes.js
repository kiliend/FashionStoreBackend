const express = require("express");
const router = express.Router();

const sunatCdrController = require("./sunat_cdr.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.post(
  "/procesar-cdr/:id_comprobante",
  verifyToken,
  authorizeRoles("admin"),
  sunatCdrController.procesarCdr
);

module.exports = router;