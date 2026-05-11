const express = require("express");
const router = express.Router();

const sunatEnvioController = require("./sunat_envio.controller");
const { verifyToken } = require("../auth/auth.middleware");
const { authorizeRoles } = require("../../middlewares/role.middleware");

router.post(
  "/enviar/:id_comprobante",
  verifyToken,
  authorizeRoles("admin"),
  sunatEnvioController.enviarSendBill
);

module.exports = router;