const tallasRepository = require("./tallas.repository");

const TIPOS_TALLA_VALIDOS = ["ropa", "calzado", "accesorio"];

async function listarTallas() {
  return await tallasRepository.findAllTallas();
}

async function obtenerTallaPorId(id_talla) {
  const talla = await tallasRepository.findTallaById(id_talla);

  if (!talla) {
    const error = new Error("Talla no encontrada");
    error.status = 404;
    throw error;
  }

  return talla;
}

async function crearTalla(data) {
  if (!data.nombre_talla || data.nombre_talla.trim() === "") {
    const error = new Error("El nombre de la talla es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!TIPOS_TALLA_VALIDOS.includes(data.tipo_talla)) {
    const error = new Error("El tipo de talla debe ser ropa, calzado o accesorio");
    error.status = 400;
    throw error;
  }

  const nuevaTalla = {
    nombre_talla: data.nombre_talla.trim(),
    tipo_talla: data.tipo_talla
  };

  const id_talla = await tallasRepository.createTalla(nuevaTalla);

  return await tallasRepository.findTallaById(id_talla);
}

async function actualizarTalla(id_talla, data) {
  const tallaActual = await tallasRepository.findTallaById(id_talla);

  if (!tallaActual) {
    const error = new Error("Talla no encontrada");
    error.status = 404;
    throw error;
  }

  if (!data.nombre_talla || data.nombre_talla.trim() === "") {
    const error = new Error("El nombre de la talla es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!TIPOS_TALLA_VALIDOS.includes(data.tipo_talla)) {
    const error = new Error("El tipo de talla debe ser ropa, calzado o accesorio");
    error.status = 400;
    throw error;
  }

  const affectedRows = await tallasRepository.updateTalla(id_talla, {
    nombre_talla: data.nombre_talla.trim(),
    tipo_talla: data.tipo_talla
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la talla");
    error.status = 400;
    throw error;
  }

  return await tallasRepository.findTallaById(id_talla);
}

async function eliminarTalla(id_talla) {
  const talla = await tallasRepository.findTallaById(id_talla);

  if (!talla) {
    const error = new Error("Talla no encontrada");
    error.status = 404;
    throw error;
  }

  const affectedRows = await tallasRepository.deleteTallaLogical(id_talla);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar la talla");
    error.status = 400;
    throw error;
  }

  return {
    id_talla: Number(id_talla),
    estado_visible: 0
  };
}

module.exports = {
  listarTallas,
  obtenerTallaPorId,
  crearTalla,
  actualizarTalla,
  eliminarTalla
};