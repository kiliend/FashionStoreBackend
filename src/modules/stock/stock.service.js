const stockRepository = require("./stock.repository");

const TIPOS_MOVIMIENTO_VALIDOS = [
  "entrada",
  "salida",
  "ajuste",
  "devolucion"
];

async function listarMovimientos() {
  return await stockRepository.findAllMovimientos();
}

async function obtenerMovimientoPorId(id_movimiento) {
  const movimiento = await stockRepository.findMovimientoById(id_movimiento);

  if (!movimiento) {
    const error = new Error("Movimiento de stock no encontrado");
    error.status = 404;
    throw error;
  }

  return movimiento;
}

async function crearMovimiento(data) {
  validarMovimiento(data);

  const nuevoMovimiento = {
    id_variante: Number(data.id_variante),
    tipo_movimiento: data.tipo_movimiento,
    cantidad: Number(data.cantidad),
    motivo: data.motivo ? data.motivo.trim() : null,
    referencia_tipo: data.referencia_tipo ? data.referencia_tipo.trim() : null,
    referencia_id: data.referencia_id ? Number(data.referencia_id) : null
  };

  const id_movimiento = await stockRepository.registrarMovimientoConStock(nuevoMovimiento);

  return await stockRepository.findMovimientoById(id_movimiento);
}

function validarMovimiento(data) {
  if (!data.id_variante) {
    const error = new Error("La variante es obligatoria");
    error.status = 400;
    throw error;
  }

  if (!data.tipo_movimiento || !TIPOS_MOVIMIENTO_VALIDOS.includes(data.tipo_movimiento)) {
    const error = new Error("El tipo de movimiento debe ser entrada, salida, ajuste o devolucion");
    error.status = 400;
    throw error;
  }

  if (!data.cantidad || Number(data.cantidad) <= 0) {
    const error = new Error("La cantidad debe ser mayor a 0");
    error.status = 400;
    throw error;
  }
}

module.exports = {
  listarMovimientos,
  obtenerMovimientoPorId,
  crearMovimiento
};