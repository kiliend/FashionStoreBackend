const contactoRepository = require("./contacto.repository");

const ESTADOS_MENSAJE_VALIDOS = [
  "nuevo",
  "leido",
  "respondido",
  "cerrado"
];

async function listarMensajes() {
  return await contactoRepository.findAllMensajes();
}

async function obtenerMensajePorId(id_mensaje) {
  const mensaje = await contactoRepository.findMensajeById(id_mensaje);

  if (!mensaje) {
    const error = new Error("Mensaje no encontrado");
    error.status = 404;
    throw error;
  }

  return mensaje;
}

async function crearMensaje(data) {
  validarMensaje(data);

  const nuevoMensaje = {
    nombre: data.nombre.trim(),
    correo: data.correo.trim(),
    mensaje: data.mensaje.trim()
  };

  const id_mensaje = await contactoRepository.createMensaje(nuevoMensaje);

  return await contactoRepository.findMensajeById(id_mensaje);
}

async function actualizarEstadoMensaje(id_mensaje, data) {
  const mensaje = await contactoRepository.findMensajeById(id_mensaje);

  if (!mensaje) {
    const error = new Error("Mensaje no encontrado");
    error.status = 404;
    throw error;
  }

  if (
    !data.estado_mensaje ||
    !ESTADOS_MENSAJE_VALIDOS.includes(data.estado_mensaje)
  ) {
    const error = new Error("Estado de mensaje no válido");
    error.status = 400;
    throw error;
  }

  const affectedRows = await contactoRepository.updateEstadoMensaje(
    id_mensaje,
    data.estado_mensaje
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el estado del mensaje");
    error.status = 400;
    throw error;
  }

  return await contactoRepository.findMensajeById(id_mensaje);
}

async function eliminarMensaje(id_mensaje) {
  const mensaje = await contactoRepository.findMensajeById(id_mensaje);

  if (!mensaje) {
    const error = new Error("Mensaje no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await contactoRepository.deleteMensajeLogical(id_mensaje);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el mensaje");
    error.status = 400;
    throw error;
  }

  return {
    id_mensaje: Number(id_mensaje),
    estado_visible: 0
  };
}

function validarMensaje(data) {
  if (!data.nombre || data.nombre.trim() === "") {
    const error = new Error("El nombre es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.correo || data.correo.trim() === "") {
    const error = new Error("El correo es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.mensaje || data.mensaje.trim() === "") {
    const error = new Error("El mensaje es obligatorio");
    error.status = 400;
    throw error;
  }

  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correoRegex.test(data.correo.trim())) {
    const error = new Error("El correo no tiene un formato válido");
    error.status = 400;
    throw error;
  }
}

module.exports = {
  listarMensajes,
  obtenerMensajePorId,
  crearMensaje,
  actualizarEstadoMensaje,
  eliminarMensaje
};