const repository = require("./gestion_ti.repository");

const estadosCambioPermitidos = [
  "solicitado",
  "evaluacion",
  "aprobado",
  "rechazado",
  "implementacion",
  "pruebas",
  "documentado",
  "cerrado",
  "postergado"
];

const estadosIncidenciaPermitidos = [
  "registrada",
  "en_revision",
  "en_atencion",
  "resuelta",
  "cerrada",
  "rechazada"
];

const crearIncidencia = async (data, usuarioAuth) => {
  if (!data.titulo || !data.descripcion || !data.modulo_afectado) {
    const error = new Error("Título, descripción y módulo afectado son obligatorios.");
    error.statusCode = 400;
    throw error;
  }

  return repository.crearIncidencia(data, usuarioAuth);
};

const listarIncidencias = async (filtros) => {
  return repository.listarIncidencias(filtros);
};

const listarIncidenciasTablero = async () => {
  return repository.listarIncidenciasTablero();
};

const obtenerIncidenciaPorId = async (id) => {
  const incidencia = await repository.obtenerIncidenciaPorId(id);

  if (!incidencia) {
    const error = new Error("Incidencia no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return incidencia;
};

const obtenerIncidenciaDetalle = async (id) => {
  const detalle = await repository.obtenerIncidenciaDetalle(id);

  if (!detalle) {
    const error = new Error("Incidencia no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return detalle;
};

const actualizarEstadoIncidencia = async (id, data, usuarioAuth) => {
  if (!data.estado) {
    const error = new Error("El estado es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (!estadosIncidenciaPermitidos.includes(data.estado)) {
    const error = new Error("Estado de incidencia no válido.");
    error.statusCode = 400;
    throw error;
  }

  const actualizado = await repository.actualizarEstadoIncidencia(id, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo actualizar la incidencia.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Estado de incidencia actualizado correctamente." };
};

const moverIncidencia = async (id, data, usuarioAuth) => {
  if (!data.estado) {
    const error = new Error("El estado es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (!estadosIncidenciaPermitidos.includes(data.estado)) {
    const error = new Error("Estado de incidencia no válido.");
    error.statusCode = 400;
    throw error;
  }

  const actualizado = await repository.moverIncidencia(id, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo mover la incidencia.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Incidencia movida correctamente." };
};

const editarIncidencia = async (id, data, usuarioAuth) => {
  const actualizado = await repository.editarIncidencia(id, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo editar la incidencia.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Incidencia editada correctamente." };
};

const agregarComentarioIncidencia = async (id, data, usuarioAuth) => {
  if (!data.comentario) {
    const error = new Error("El comentario es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  await repository.agregarComentarioIncidencia(id, data, usuarioAuth);
  return { message: "Comentario registrado correctamente." };
};

const crearChecklistIncidencia = async (id, data, usuarioAuth) => {
  if (!data.descripcion) {
    const error = new Error("La descripción del checklist es obligatoria.");
    error.statusCode = 400;
    throw error;
  }

  return repository.crearChecklistIncidencia(id, data, usuarioAuth);
};

const actualizarChecklistIncidencia = async (idChecklist, data, usuarioAuth) => {
  const actualizado = await repository.actualizarChecklistIncidencia(idChecklist, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo actualizar el checklist de incidencia.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Checklist de incidencia actualizado correctamente." };
};

const crearCambio = async (data, usuarioAuth) => {
  if (!data.titulo || !data.descripcion || !data.justificacion || !data.tipo_cambio || !data.modulo_afectado) {
    const error = new Error("Título, descripción, justificación, tipo de cambio y módulo afectado son obligatorios.");
    error.statusCode = 400;
    throw error;
  }

  return repository.crearCambio(data, usuarioAuth);
};

const listarCambios = async (filtros) => {
  return repository.listarCambios(filtros);
};

const listarCambiosTablero = async () => {
  return repository.listarCambiosTablero();
};

const obtenerCambioPorId = async (id) => {
  const cambio = await repository.obtenerCambioPorId(id);

  if (!cambio) {
    const error = new Error("Cambio no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return cambio;
};

const obtenerCambioDetalle = async (id) => {
  const detalle = await repository.obtenerCambioDetalle(id);

  if (!detalle) {
    const error = new Error("Cambio no encontrado.");
    error.statusCode = 404;
    throw error;
  }

  return detalle;
};

const actualizarEstadoCambio = async (id, data, usuarioAuth) => {
  return moverCambio(id, data, usuarioAuth);
};

const moverCambio = async (id, data, usuarioAuth) => {
  if (!data.estado) {
    const error = new Error("El estado es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  if (!estadosCambioPermitidos.includes(data.estado)) {
    const error = new Error("Estado de cambio no válido.");
    error.statusCode = 400;
    throw error;
  }

  const actualizado = await repository.moverCambio(id, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo mover el cambio.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Cambio movido correctamente." };
};

const editarCambio = async (id, data, usuarioAuth) => {
  const actualizado = await repository.editarCambio(id, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo editar el cambio.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Cambio editado correctamente." };
};

const agregarComentarioCambio = async (id, data, usuarioAuth) => {
  if (!data.comentario) {
    const error = new Error("El comentario es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  await repository.agregarComentarioCambio(id, data, usuarioAuth);
  return { message: "Comentario registrado correctamente." };
};

const crearChecklistCambio = async (id, data, usuarioAuth) => {
  if (!data.descripcion) {
    const error = new Error("La descripción del checklist es obligatoria.");
    error.statusCode = 400;
    throw error;
  }

  return repository.crearChecklistCambio(id, data, usuarioAuth);
};

const actualizarChecklistCambio = async (idChecklist, data, usuarioAuth) => {
  const actualizado = await repository.actualizarChecklistCambio(idChecklist, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo actualizar el checklist.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Checklist actualizado correctamente." };
};


const listarHistoricoGestionTi = async (filtros) => {
  return repository.listarHistoricoGestionTi(filtros);
};

const obtenerResumenHistoricoGestionTi = async (filtros) => {
  return repository.obtenerResumenHistoricoGestionTi(filtros);
};

const obtenerMetricas = async () => {
  return repository.obtenerMetricas();
};

const listarUsuariosAsignables = async () => {
  return repository.listarUsuariosAsignables();
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  listarIncidenciasTablero,
  obtenerIncidenciaPorId,
  obtenerIncidenciaDetalle,
  actualizarEstadoIncidencia,
  moverIncidencia,
  editarIncidencia,
  agregarComentarioIncidencia,
  crearChecklistIncidencia,
  actualizarChecklistIncidencia,
  crearCambio,
  listarCambios,
  listarCambiosTablero,
  obtenerCambioPorId,
  obtenerCambioDetalle,
  actualizarEstadoCambio,
  moverCambio,
  editarCambio,
  agregarComentarioCambio,
  crearChecklistCambio,
  actualizarChecklistCambio,
  listarHistoricoGestionTi,
  obtenerResumenHistoricoGestionTi,
  obtenerMetricas,
  listarUsuariosAsignables
};
