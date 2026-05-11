const sunatCdrService = require("./sunat_cdr.service");

async function procesarCdr(req, res, next) {
  try {
    const { id_comprobante } = req.params;

    const resultado = await sunatCdrService.procesarCdrComprobante(id_comprobante);

    res.json({
      ok: true,
      message: "CDR procesado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  procesarCdr
};