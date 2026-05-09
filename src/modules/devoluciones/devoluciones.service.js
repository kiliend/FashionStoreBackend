const devolucionesRepository = require("./devoluciones.repository");

const METODOS_DEVOLUCION_VALIDOS = [
  "efectivo",
  "transferencia",
  "yape",
  "tarjeta",
  "nota_credito"
];

async function listarDevoluciones() {
  return await devolucionesRepository.findAllDevoluciones();
}

async function obtenerDevolucionPorId(id_devolucion) {
  const devolucion = await devolucionesRepository.findDevolucionById(id_devolucion);

  if (!devolucion) {
    const error = new Error("Devolución no encontrada");
    error.status = 404;
    throw error;
  }

  return devolucion;
}

async function crearDevolucion(data, usuarioAutenticado) {
  validarDevolucion(data);

  const incidencia = await devolucionesRepository.incidenciaExists(data.id_incidencia);

  if (!incidencia) {
    const error = new Error("La incidencia seleccionada no existe");
    error.status = 404;
    throw error;
  }

  if (incidencia.estado_incidencia !== "aprobada") {
    const error = new Error("Solo se puede crear devolución para una incidencia aprobada");
    error.status = 400;
    throw error;
  }

  const devolucionExistente = await devolucionesRepository.devolucionExistsByIncidencia(
    data.id_incidencia
  );

  if (devolucionExistente) {
    const error = new Error("Ya existe una devolución registrada para esta incidencia");
    error.status = 409;
    throw error;
  }

  const nuevaDevolucion = {
    id_incidencia: Number(data.id_incidencia),
    id_usuario_aprobacion: usuarioAutenticado.id_usuario,
    monto_devolucion: Number(data.monto_devolucion),
    metodo_devolucion: data.metodo_devolucion
  };

  const id_devolucion = await devolucionesRepository.createDevolucion(nuevaDevolucion);

  return await devolucionesRepository.findDevolucionById(id_devolucion);
}

async function procesarDevolucion(id_devolucion, usuarioAutenticado) {
  const devolucion = await devolucionesRepository.findDevolucionById(id_devolucion);

  if (!devolucion) {
    const error = new Error("Devolución no encontrada");
    error.status = 404;
    throw error;
  }

  if (devolucion.estado_devolucion !== "pendiente") {
    const error = new Error("Solo se puede procesar una devolución pendiente");
    error.status = 400;
    throw error;
  }

  const affectedRows = await devolucionesRepository.procesarDevolucion(id_devolucion, {
    id_usuario_proceso: usuarioAutenticado.id_usuario
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo procesar la devolución");
    error.status = 400;
    throw error;
  }

  return await devolucionesRepository.findDevolucionById(id_devolucion);
}

async function rechazarDevolucion(id_devolucion, usuarioAutenticado) {
  const devolucion = await devolucionesRepository.findDevolucionById(id_devolucion);

  if (!devolucion) {
    const error = new Error("Devolución no encontrada");
    error.status = 404;
    throw error;
  }

  if (devolucion.estado_devolucion !== "pendiente") {
    const error = new Error("Solo se puede rechazar una devolución pendiente");
    error.status = 400;
    throw error;
  }

  const affectedRows = await devolucionesRepository.rechazarDevolucion(id_devolucion, {
    id_usuario_proceso: usuarioAutenticado.id_usuario
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo rechazar la devolución");
    error.status = 400;
    throw error;
  }

  return await devolucionesRepository.findDevolucionById(id_devolucion);
}

function validarDevolucion(data) {
  if (!data.id_incidencia) {
    const error = new Error("La incidencia es obligatoria");
    error.status = 400;
    throw error;
  }

  if (!data.monto_devolucion || Number(data.monto_devolucion) <= 0) {
    const error = new Error("El monto de devolución debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (
    !data.metodo_devolucion ||
    !METODOS_DEVOLUCION_VALIDOS.includes(data.metodo_devolucion)
  ) {
    const error = new Error("Método de devolución no válido");
    error.status = 400;
    throw error;
  }
}

module.exports = {
  listarDevoluciones,
  obtenerDevolucionPorId,
  crearDevolucion,
  procesarDevolucion,
  rechazarDevolucion
};