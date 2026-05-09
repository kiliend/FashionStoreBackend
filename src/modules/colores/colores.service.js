const coloresRepository = require("./colores.repository");

async function listarColores() {
  return await coloresRepository.findAllColores();
}

async function obtenerColorPorId(id_color) {
  const color = await coloresRepository.findColorById(id_color);

  if (!color) {
    const error = new Error("Color no encontrado");
    error.status = 404;
    throw error;
  }

  return color;
}

async function crearColor(data) {
  if (!data.nombre_color || data.nombre_color.trim() === "") {
    const error = new Error("El nombre del color es obligatorio");
    error.status = 400;
    throw error;
  }

  const nuevoColor = {
    nombre_color: data.nombre_color.trim(),
    codigo_hex: data.codigo_hex ? data.codigo_hex.trim() : null
  };

  const id_color = await coloresRepository.createColor(nuevoColor);

  return await coloresRepository.findColorById(id_color);
}

async function actualizarColor(id_color, data) {
  const colorActual = await coloresRepository.findColorById(id_color);

  if (!colorActual) {
    const error = new Error("Color no encontrado");
    error.status = 404;
    throw error;
  }

  if (!data.nombre_color || data.nombre_color.trim() === "") {
    const error = new Error("El nombre del color es obligatorio");
    error.status = 400;
    throw error;
  }

  const affectedRows = await coloresRepository.updateColor(id_color, {
    nombre_color: data.nombre_color.trim(),
    codigo_hex: data.codigo_hex ? data.codigo_hex.trim() : null
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el color");
    error.status = 400;
    throw error;
  }

  return await coloresRepository.findColorById(id_color);
}

async function eliminarColor(id_color) {
  const color = await coloresRepository.findColorById(id_color);

  if (!color) {
    const error = new Error("Color no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await coloresRepository.deleteColorLogical(id_color);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el color");
    error.status = 400;
    throw error;
  }

  return {
    id_color: Number(id_color),
    estado_visible: 0
  };
}

module.exports = {
  listarColores,
  obtenerColorPorId,
  crearColor,
  actualizarColor,
  eliminarColor
};