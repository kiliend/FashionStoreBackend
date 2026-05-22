const reportesRepository = require("./reportes.repository");

async function reporteVentas(query) {
  const filtros = normalizarFiltros(query);
  return await reportesRepository.getReporteVentas(filtros);
}

async function reporteInventario(query) {
  const filtros = normalizarFiltros(query);
  return await reportesRepository.getReporteInventario(filtros);
}

async function reporteCompras(query) {
  const filtros = normalizarFiltros(query);
  return await reportesRepository.getReporteCompras(filtros);
}

async function reporteProductosMasVendidos(query) {
  const filtros = normalizarFiltros(query);
  return await reportesRepository.getReporteProductosMasVendidos(filtros);
}

async function resumenGerencial(query) {
  const filtros = normalizarFiltros(query);
  return await reportesRepository.getResumenGerencial(filtros);
}

function normalizarFiltros(query) {
  const filtros = {
    fecha_inicio: query.fecha_inicio || null,
    fecha_fin: query.fecha_fin || null,
    estado_venta: query.estado_venta || null,
    metodo_pago: query.metodo_pago || null,
    origen_venta: query.origen_venta || null,
    estado_variante: query.estado_variante || null,
    alerta_stock: query.alerta_stock || null,
    estado_orden: query.estado_orden || null,
    estado_factura: query.estado_factura || null,
    id_categoria: query.id_categoria || null
  };

  if (filtros.fecha_inicio && filtros.fecha_fin) {
    if (new Date(filtros.fecha_inicio) > new Date(filtros.fecha_fin)) {
      const error = new Error("La fecha de inicio no puede ser mayor a la fecha fin");
      error.status = 400;
      throw error;
    }
  }

  return filtros;
}

module.exports = {
  reporteVentas,
  reporteInventario,
  reporteCompras,
  reporteProductosMasVendidos,
  resumenGerencial
};