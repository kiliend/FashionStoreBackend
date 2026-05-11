const express = require("express");
const router = express.Router();

const sunatXmlController = require("./sunat_xml.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.post(
  "/generar-xml/:id_comprobante",
  verifyToken,
  authorizeRoles("admin"),
  sunatXmlController.generarXml
);

module.exports = router;