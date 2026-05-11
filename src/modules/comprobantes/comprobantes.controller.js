const comprobantesService = require("./comprobantes.service");

async function listarComprobantes(req, res, next) {
  try {
    const comprobantes = await comprobantesService.listarComprobantes();

    res.json({
      ok: true,
      message: "Comprobantes obtenidos correctamente",
      data: comprobantes
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerComprobante(req, res, next) {
  try {
    const { id } = req.params;

    const comprobante = await comprobantesService.obtenerComprobantePorId(id);

    res.json({
      ok: true,
      message: "Comprobante obtenido correctamente",
      data: comprobante
    });
  } catch (error) {
    next(error);
  }
}

async function generarComprobante(req, res, next) {
  try {
    const { id_venta } = req.params;

    const comprobante = await comprobantesService.generarComprobanteDesdeVenta(
      id_venta,
      req.body
    );

    res.status(201).json({
      ok: true,
      message: "Comprobante generado correctamente",
      data: comprobante
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarComprobantes,
  obtenerComprobante,
  generarComprobante
};