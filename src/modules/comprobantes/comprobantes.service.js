const comprobantesRepository = require("./comprobantes.repository");

const TIPOS_COMPROBANTE_VALIDOS = ["01", "03"];

async function listarComprobantes() {
  return await comprobantesRepository.findAllComprobantes();
}

async function obtenerComprobantePorId(id_comprobante) {
  const comprobante = await comprobantesRepository.findComprobanteById(id_comprobante);

  if (!comprobante) {
    const error = new Error("Comprobante no encontrado");
    error.status = 404;
    throw error;
  }

  return comprobante;
}

async function generarComprobanteDesdeVenta(id_venta, data) {
  if (!data.tipo_comprobante || !TIPOS_COMPROBANTE_VALIDOS.includes(data.tipo_comprobante)) {
    const error = new Error("El tipo de comprobante debe ser 01 factura o 03 boleta");
    error.status = 400;
    throw error;
  }

  const venta = await comprobantesRepository.findVentaCompleta(id_venta);

  if (!venta) {
    const error = new Error("Venta no encontrada");
    error.status = 404;
    throw error;
  }

  if (venta.estado_venta !== "completada") {
    const error = new Error("Solo se puede generar comprobante para ventas completadas");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(venta.detalles) || venta.detalles.length === 0) {
    const error = new Error("La venta no tiene detalles");
    error.status = 400;
    throw error;
  }

  const comprobanteExistente = await comprobantesRepository.findComprobanteByVenta(id_venta);

  if (comprobanteExistente) {
    const error = new Error("Esta venta ya tiene un comprobante generado");
    error.status = 409;
    throw error;
  }

  validarTipoComprobanteCliente(data.tipo_comprobante, venta);

  const id_comprobante = await comprobantesRepository.crearComprobanteDesdeVenta({
    id_venta: Number(id_venta),
    tipo_comprobante: data.tipo_comprobante,
    subtotal: Number(venta.subtotal),
    igv: Number(venta.igv),
    descuento_total: Number(venta.descuento_total || 0),
    total: Number(venta.total),
    detalles: venta.detalles
  });

  return await comprobantesRepository.findComprobanteById(id_comprobante);
}

function validarTipoComprobanteCliente(tipo_comprobante, venta) {
  if (tipo_comprobante === "01") {
    if (venta.tipo_documento !== "RUC") {
      const error = new Error("Para factura electrónica el cliente debe tener RUC");
      error.status = 400;
      throw error;
    }

    if (!venta.numero_documento || venta.numero_documento.length !== 11) {
      const error = new Error("El RUC del cliente debe tener 11 dígitos");
      error.status = 400;
      throw error;
    }
  }

  if (tipo_comprobante === "03") {
    if (!venta.id_cliente) {
      return;
    }

    if (!["DNI", "RUC", "CE", "PASAPORTE"].includes(venta.tipo_documento)) {
      const error = new Error("Tipo de documento del cliente no válido para boleta");
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  listarComprobantes,
  obtenerComprobantePorId,
  generarComprobanteDesdeVenta
};