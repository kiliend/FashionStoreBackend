const reportesRepository = require("./reportes.repository");

async function reporteVentas(query) {
  const { fecha_inicio, fecha_fin } = validarFechas(query);

  return await reportesRepository.getReporteVentas(fecha_inicio, fecha_fin);
}

async function reporteInventario() {
  return await reportesRepository.getReporteInventario();
}

async function reporteCompras(query) {
  const { fecha_inicio, fecha_fin } = validarFechas(query);

  return await reportesRepository.getReporteCompras(fecha_inicio, fecha_fin);
}

async function reporteProductosMasVendidos(query) {
  const { fecha_inicio, fecha_fin } = validarFechas(query);

  return await reportesRepository.getReporteProductosMasVendidos(
    fecha_inicio,
    fecha_fin
  );
}

function validarFechas(query) {
  const { fecha_inicio, fecha_fin } = query;

  if (!fecha_inicio || !fecha_fin) {
    const error = new Error("Debe enviar fecha_inicio y fecha_fin");
    error.status = 400;
    throw error;
  }

  if (new Date(fecha_inicio) > new Date(fecha_fin)) {
    const error = new Error("La fecha de inicio no puede ser mayor a la fecha fin");
    error.status = 400;
    throw error;
  }

  return {
    fecha_inicio,
    fecha_fin
  };
}

module.exports = {
  reporteVentas,
  reporteInventario,
  reporteCompras,
  reporteProductosMasVendidos
};