const reportesService = require("./reportes.service");

async function reporteVentas(req, res, next) {
  try {
    const data = await reportesService.reporteVentas(req.query);

    res.json({
      ok: true,
      message: "Reporte de ventas obtenido correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function reporteInventario(req, res, next) {
  try {
    const data = await reportesService.reporteInventario(req.query);

    res.json({
      ok: true,
      message: "Reporte de inventario obtenido correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function reporteCompras(req, res, next) {
  try {
    const data = await reportesService.reporteCompras(req.query);

    res.json({
      ok: true,
      message: "Reporte de compras obtenido correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function reporteProductosMasVendidos(req, res, next) {
  try {
    const data = await reportesService.reporteProductosMasVendidos(req.query);

    res.json({
      ok: true,
      message: "Reporte de productos más vendidos obtenido correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function resumenGerencial(req, res, next) {
  try {
    const data = await reportesService.resumenGerencial(req.query);

    res.json({
      ok: true,
      message: "Resumen gerencial obtenido correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  reporteVentas,
  reporteInventario,
  reporteCompras,
  reporteProductosMasVendidos,
  resumenGerencial
};