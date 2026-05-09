const tareasRepository = require("./tareas.repository");

const ESTADOS_TAREA_VALIDOS = [
  "pendiente",
  "en_proceso",
  "finalizada",
  "observada",
  "cancelada"
];

async function listarTareas() {
  return await tareasRepository.findAllTareas();
}

async function obtenerTareaPorId(id_tarea) {
  const tarea = await tareasRepository.findTareaById(id_tarea);

  if (!tarea) {
    const error = new Error("Tarea no encontrada");
    error.status = 404;
    throw error;
  }

  return tarea;
}

async function crearTarea(data) {
  validarTarea(data);

  const existeUsuario = await tareasRepository.usuarioExists(data.id_usuario);

  if (!existeUsuario) {
    const error = new Error("El usuario asignado no existe o no está activo");
    error.status = 400;
    throw error;
  }

  const nuevaTarea = {
    id_usuario: Number(data.id_usuario),
    modulo: data.modulo.trim(),
    referencia_tipo: data.referencia_tipo.trim(),
    referencia_id: Number(data.referencia_id),
    accion: data.accion.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null,
    observacion: data.observacion ? data.observacion.trim() : null
  };

  const id_tarea = await tareasRepository.createTarea(nuevaTarea);

  return await tareasRepository.findTareaById(id_tarea);
}

async function actualizarEstadoTarea(id_tarea, data) {
  const tarea = await tareasRepository.findTareaById(id_tarea);

  if (!tarea) {
    const error = new Error("Tarea no encontrada");
    error.status = 404;
    throw error;
  }

  if (
    !data.estado_tarea ||
    !ESTADOS_TAREA_VALIDOS.includes(data.estado_tarea)
  ) {
    const error = new Error("Estado de tarea no válido");
    error.status = 400;
    throw error;
  }

  const affectedRows = await tareasRepository.updateEstadoTarea(id_tarea, {
    estado_tarea: data.estado_tarea,
    observacion: data.observacion ? data.observacion.trim() : null
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la tarea");
    error.status = 400;
    throw error;
  }

  return await tareasRepository.findTareaById(id_tarea);
}

async function eliminarTarea(id_tarea) {
  const tarea = await tareasRepository.findTareaById(id_tarea);

  if (!tarea) {
    const error = new Error("Tarea no encontrada");
    error.status = 404;
    throw error;
  }

  const affectedRows = await tareasRepository.deleteTareaLogical(id_tarea);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar la tarea");
    error.status = 400;
    throw error;
  }

  return {
    id_tarea: Number(id_tarea),
    estado_visible: 0
  };
}

function validarTarea(data) {
  if (!data.id_usuario) {
    const error = new Error("El usuario asignado es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.modulo || data.modulo.trim() === "") {
    const error = new Error("El módulo es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.referencia_tipo || data.referencia_tipo.trim() === "") {
    const error = new Error("El tipo de referencia es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.referencia_id || Number(data.referencia_id) <= 0) {
    const error = new Error("El ID de referencia debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (!data.accion || data.accion.trim() === "") {
    const error = new Error("La acción es obligatoria");
    error.status = 400;
    throw error;
  }
}

module.exports = {
  listarTareas,
  obtenerTareaPorId,
  crearTarea,
  actualizarEstadoTarea,
  eliminarTarea
};