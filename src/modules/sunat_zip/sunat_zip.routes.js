const express = require("express");
const router = express.Router();

const sunatZipController = require("./sunat_zip.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.post(
  "/generar-zip/:id_comprobante",
  verifyToken,
  authorizeRoles("admin"),
  sunatZipController.generarZip
);

module.exports = router;