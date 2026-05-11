const sunatZipService = require("./sunat_zip.service");

async function generarZip(req, res, next) {
  try {
    const { id_comprobante } = req.params;

    const resultado = await sunatZipService.generarZipComprobante(id_comprobante);

    res.json({
      ok: true,
      message: "ZIP generado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  generarZip
};