const ventasRepository = require("./ventas.repository");

const ORIGENES_VALIDOS = ["presencial", "ecommerce"];
const METODOS_PAGO_VALIDOS = [
  "efectivo",
  "tarjeta",
  "yape",
  "transferencia",
  "solicitud_online"
];

const ESTADOS_VALIDOS = ["pendiente", "completada"];

async function listarVentas() {
  return await ventasRepository.findAllVentas();
}

async function obtenerVentaPorId(id_venta) {
  const venta = await ventasRepository.findVentaById(id_venta);

  if (!venta) {
    const error = new Error("Venta no encontrada");
    error.status = 404;
    throw error;
  }

  return venta;
}

async function crearVenta(data, usuarioAutenticado) {
  validarVenta(data);

  const nuevaVenta = {
    id_cliente: data.id_cliente || null,
    id_vendedor: data.id_vendedor || usuarioAutenticado.id_usuario,
    id_usuario_creacion: usuarioAutenticado.id_usuario,
    origen_venta: data.origen_venta,
    metodo_pago: data.metodo_pago || "efectivo",
    descuento_total: Number(data.descuento_total || 0),
    estado_venta: data.estado_venta || "completada",
    detalles: data.detalles.map((item) => ({
      id_variante: Number(item.id_variante),
      cantidad: Number(item.cantidad),
      precio_unitario: Number(item.precio_unitario),
      descuento: Number(item.descuento || 0),
      id_promocion: item.id_promocion || null,
      id_combo: item.id_combo || null
    }))
  };

  const id_venta = await ventasRepository.crearVentaConDetalles(nuevaVenta);

  return await ventasRepository.findVentaById(id_venta);
}

async function anularVenta(id_venta, data, usuarioAutenticado) {
  if (!data.motivo_anulacion || data.motivo_anulacion.trim() === "") {
    const error = new Error("El motivo de anulación es obligatorio");
    error.status = 400;
    throw error;
  }

  const ventaAnuladaId = await ventasRepository.anularVenta(id_venta, {
    motivo_anulacion: data.motivo_anulacion.trim(),
    id_usuario_anulacion: usuarioAutenticado.id_usuario
  });

  return await ventasRepository.findVentaById(ventaAnuladaId);
}

async function completarVenta(id_venta) {
  const resultado = await ventasRepository.completarVenta(id_venta);
  return resultado;
}

function validarVenta(data) {
  if (!data.origen_venta || !ORIGENES_VALIDOS.includes(data.origen_venta)) {
    const error = new Error("El origen de venta debe ser presencial o ecommerce");
    error.status = 400;
    throw error;
  }

  if (data.metodo_pago && !METODOS_PAGO_VALIDOS.includes(data.metodo_pago)) {
    const error = new Error("Método de pago no válido");
    error.status = 400;
    throw error;
  }

  if (data.estado_venta && !ESTADOS_VALIDOS.includes(data.estado_venta)) {
    const error = new Error("El estado de venta debe ser pendiente o completada");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
    const error = new Error("La venta debe tener al menos un producto");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    if (!item.id_variante) {
      const error = new Error("Cada detalle debe tener una variante");
      error.status = 400;
      throw error;
    }

    if (!item.cantidad || Number(item.cantidad) <= 0) {
      const error = new Error("La cantidad debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    if (item.precio_unitario === undefined || Number(item.precio_unitario) <= 0) {
      const error = new Error("El precio unitario debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    if (item.descuento && Number(item.descuento) < 0) {
      const error = new Error("El descuento no puede ser negativo");
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  listarVentas,
  obtenerVentaPorId,
  crearVenta,
  anularVenta,
  completarVenta
};