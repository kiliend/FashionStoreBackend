const sunatXmlService = require("./sunat_xml.service");

async function generarXml(req, res, next) {
  try {
    const { id_comprobante } = req.params;

    const resultado = await sunatXmlService.generarXmlComprobante(id_comprobante);

    res.json({
      ok: true,
      message: "XML generado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generarXml
};