const descuentosService = require("./descuentos.service");

async function calcularDescuento(req, res, next) {
  try {
    const resultado = descuentosService.calcularDescuento(req.body);

    res.json({
      ok: true,
      message: "Descuento calculado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  calcularDescuento
};