const sunatEnvioService = require("./sunat_envio.service");

async function enviarSendBill(req, res, next) {
  try {
    const { id_comprobante } = req.params;

    const resultado = await sunatEnvioService.enviarComprobanteSendBill(id_comprobante);

    res.json({
      ok: true,
      message: "Comprobante enviado a SUNAT correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  enviarSendBill
};