const sunatFirmaService = require("./sunat_firma.service");

async function firmarXml(req, res, next) {
  try {
    const { id_comprobante } = req.params;

    const resultado = await sunatFirmaService.firmarXmlComprobante(id_comprobante);

    res.json({
      ok: true,
      message: "XML firmado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  firmarXml
};