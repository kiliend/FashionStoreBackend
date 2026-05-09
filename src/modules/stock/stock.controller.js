const stockService = require("./stock.service");

async function listarMovimientos(req, res, next) {
  try {
    const movimientos = await stockService.listarMovimientos();

    res.json({
      ok: true,
      message: "Movimientos de stock obtenidos correctamente",
      data: movimientos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerMovimiento(req, res, next) {
  try {
    const { id } = req.params;

    const movimiento = await stockService.obtenerMovimientoPorId(id);

    res.json({
      ok: true,
      message: "Movimiento de stock obtenido correctamente",
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
}

async function crearMovimiento(req, res, next) {
  try {
    const movimiento = await stockService.crearMovimiento(req.body);

    res.status(201).json({
      ok: true,
      message: "Movimiento de stock registrado correctamente",
      data: movimiento
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarMovimientos,
  obtenerMovimiento,
  crearMovimiento
};