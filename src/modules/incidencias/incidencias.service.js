const incidenciasRepository = require("./incidencias.repository");

const TIPOS_INCIDENCIA_VALIDOS = [
  "devolucion",
  "rechazo_producto",
  "cambio_producto",
  "producto_defectuoso",
  "reclamo"
];

const ACCIONES_VALIDAS = [
  "devolucion_dinero",
  "cambio_producto",
  "nota_credito",
  "rechazo_solicitud"
];

const ESTADOS_PRODUCTO_VALIDOS = [
  "nuevo",
  "usado",
  "defectuoso",
  "incompleto",
  "no_recibido"
];

const ESTADOS_INCIDENCIA_VALIDOS = [
  "registrada",
  "en_revision",
  "aprobada",
  "rechazada",
  "cerrada"
];

async function listarIncidencias() {
  return await incidenciasRepository.findAllIncidencias();
}

async function obtenerIncidenciaPorId(id_incidencia) {
  const incidencia = await incidenciasRepository.findIncidenciaById(id_incidencia);

  if (!incidencia) {
    const error = new Error("Incidencia no encontrada");
    error.status = 404;
    throw error;
  }

  return incidencia;
}

async function crearIncidencia(data, usuarioAutenticado) {
  await validarIncidencia(data);

  const venta = await incidenciasRepository.ventaExists(data.id_venta);

  if (!venta) {
    const error = new Error("La venta seleccionada no existe");
    error.status = 404;
    throw error;
  }

  if (venta.estado_venta === "anulada") {
    const error = new Error("No se puede registrar incidencia sobre una venta anulada");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    const detalleVenta = await incidenciasRepository.detalleVentaExists(
      item.id_detalle_venta,
      data.id_venta
    );

    if (!detalleVenta) {
      const error = new Error(`El detalle de venta ${item.id_detalle_venta} no pertenece a la venta indicada`);
      error.status = 400;
      throw error;
    }

    if (Number(item.cantidad_afectada) > Number(detalleVenta.cantidad)) {
      const error = new Error(`La cantidad afectada no puede superar la cantidad vendida en el detalle ${item.id_detalle_venta}`);
      error.status = 400;
      throw error;
    }
  }

  const nuevaIncidencia = {
    id_cliente: venta.id_cliente,
    id_venta: Number(data.id_venta),
    id_usuario_registro: usuarioAutenticado.id_usuario,
    tipo_incidencia: data.tipo_incidencia,
    motivo: data.motivo ? data.motivo.trim() : null,
    descripcion: data.descripcion ? data.descripcion.trim() : null,
    detalles: data.detalles.map((item) => ({
      id_detalle_venta: Number(item.id_detalle_venta),
      cantidad_afectada: Number(item.cantidad_afectada),
      accion_solicitada: item.accion_solicitada,
      estado_producto_recibido: item.estado_producto_recibido || null,
      observacion: item.observacion ? item.observacion.trim() : null
    }))
  };

  const id_incidencia = await incidenciasRepository.crearIncidencia(nuevaIncidencia);

  return await incidenciasRepository.findIncidenciaById(id_incidencia);
}

async function actualizarEstadoIncidencia(id_incidencia, data, usuarioAutenticado) {
  const incidencia = await incidenciasRepository.findIncidenciaById(id_incidencia);

  if (!incidencia) {
    const error = new Error("Incidencia no encontrada");
    error.status = 404;
    throw error;
  }

  if (
    !data.estado_incidencia ||
    !ESTADOS_INCIDENCIA_VALIDOS.includes(data.estado_incidencia)
  ) {
    const error = new Error("Estado de incidencia no válido");
    error.status = 400;
    throw error;
  }

  const affectedRows = await incidenciasRepository.actualizarEstadoIncidencia(id_incidencia, {
    estado_incidencia: data.estado_incidencia,
    id_usuario_resolucion: usuarioAutenticado.id_usuario
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la incidencia");
    error.status = 400;
    throw error;
  }

  return await incidenciasRepository.findIncidenciaById(id_incidencia);
}

async function validarIncidencia(data) {
  if (!data.id_venta) {
    const error = new Error("La venta es obligatoria");
    error.status = 400;
    throw error;
  }

  if (
    !data.tipo_incidencia ||
    !TIPOS_INCIDENCIA_VALIDOS.includes(data.tipo_incidencia)
  ) {
    const error = new Error("Tipo de incidencia no válido");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
    const error = new Error("La incidencia debe tener al menos un detalle");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    if (!item.id_detalle_venta) {
      const error = new Error("Cada detalle debe indicar id_detalle_venta");
      error.status = 400;
      throw error;
    }

    if (!item.cantidad_afectada || Number(item.cantidad_afectada) <= 0) {
      const error = new Error("La cantidad afectada debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    if (
      !item.accion_solicitada ||
      !ACCIONES_VALIDAS.includes(item.accion_solicitada)
    ) {
      const error = new Error("Acción solicitada no válida");
      error.status = 400;
      throw error;
    }

    if (
      item.estado_producto_recibido &&
      !ESTADOS_PRODUCTO_VALIDOS.includes(item.estado_producto_recibido)
    ) {
      const error = new Error("Estado del producto recibido no válido");
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  listarIncidencias,
  obtenerIncidenciaPorId,
  crearIncidencia,
  actualizarEstadoIncidencia
};