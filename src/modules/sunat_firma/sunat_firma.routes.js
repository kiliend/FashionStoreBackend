const express = require("express");
const router = express.Router();

const sunatFirmaController = require("./sunat_firma.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.post(
  "/firmar-xml/:id_comprobante",
  verifyToken,
  authorizeRoles("admin"),
  sunatFirmaController.firmarXml
);

module.exports = router;