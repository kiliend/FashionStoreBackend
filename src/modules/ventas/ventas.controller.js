const ventasService = require("./ventas.service");

async function listarVentas(req, res, next) {
  try {
    const ventas = await ventasService.listarVentas();

    res.json({
      ok: true,
      message: "Ventas obtenidas correctamente",
      data: ventas
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerVenta(req, res, next) {
  try {
    const { id } = req.params;

    const venta = await ventasService.obtenerVentaPorId(id);

    res.json({
      ok: true,
      message: "Venta obtenida correctamente",
      data: venta
    });
  } catch (error) {
    next(error);
  }
}

async function crearVenta(req, res, next) {
  try {
    const venta = await ventasService.crearVenta(req.body, req.user);

    res.status(201).json({
      ok: true,
      message: "Venta creada correctamente",
      data: venta
    });
  } catch (error) {
    next(error);
  }
}

async function anularVenta(req, res, next) {
  try {
    const { id } = req.params;

    const venta = await ventasService.anularVenta(id, req.body, req.user);

    res.json({
      ok: true,
      message: "Venta anulada correctamente",
      data: venta
    });
  } catch (error) {
    next(error);
  }
}

async function completarVenta(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await ventasService.completarVenta(id);

    res.json({
      ok: true,
      message: "Venta completada correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarVentas,
  obtenerVenta,
  crearVenta,
  anularVenta,
  completarVenta
};