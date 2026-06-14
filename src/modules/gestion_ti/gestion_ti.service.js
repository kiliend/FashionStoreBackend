const repository = require("./gestion_ti.repository");

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

const obtenerIncidenciaPorId = async (id) => {
  const incidencia = await repository.obtenerIncidenciaPorId(id);

  if (!incidencia) {
    const error = new Error("Incidencia no encontrada.");
    error.statusCode = 404;
    throw error;
  }

  return incidencia;
};

const actualizarEstadoIncidencia = async (id, data, usuarioAuth) => {
  if (!data.estado) {
    const error = new Error("El estado es obligatorio.");
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

const crearCambio = async (data, usuarioAuth) => {
  if (!data.titulo || !data.descripcion || !data.justificacion || !data.tipo_cambio) {
    const error = new Error("Título, descripción, justificación y tipo de cambio son obligatorios.");
    error.statusCode = 400;
    throw error;
  }

  return repository.crearCambio(data, usuarioAuth);
};

const listarCambios = async (filtros) => {
  return repository.listarCambios(filtros);
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

const actualizarEstadoCambio = async (id, data, usuarioAuth) => {
  if (!data.estado) {
    const error = new Error("El estado es obligatorio.");
    error.statusCode = 400;
    throw error;
  }

  const actualizado = await repository.actualizarEstadoCambio(id, data, usuarioAuth);

  if (!actualizado) {
    const error = new Error("No se pudo actualizar el cambio.");
    error.statusCode = 404;
    throw error;
  }

  return { message: "Estado de cambio actualizado correctamente." };
};

const obtenerMetricas = async () => {
  return repository.obtenerMetricas();
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  obtenerIncidenciaPorId,
  actualizarEstadoIncidencia,
  crearCambio,
  listarCambios,
  obtenerCambioPorId,
  actualizarEstadoCambio,
  obtenerMetricas
};