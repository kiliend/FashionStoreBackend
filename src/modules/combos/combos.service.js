const combosRepository = require("./combos.repository");

const ESTADOS_COMBO_VALIDOS = ["activo", "inactivo"];

async function listarCombos() {
  return await combosRepository.findAllCombos();
}

async function obtenerComboPorId(id_combo) {
  const combo = await combosRepository.findComboById(id_combo);

  if (!combo) {
    const error = new Error("Combo no encontrado");
    error.status = 404;
    throw error;
  }

  return combo;
}

async function crearCombo(data) {
  await validarCombo(data);

  const nuevoCombo = prepararDatosCombo(data);

  const id_combo = await combosRepository.createCombo(nuevoCombo);

  return await combosRepository.findComboById(id_combo);
}

async function actualizarCombo(id_combo, data) {
  const comboActual = await combosRepository.findComboById(id_combo);

  if (!comboActual) {
    const error = new Error("Combo no encontrado");
    error.status = 404;
    throw error;
  }

  await validarCombo(data);

  const affectedRows = await combosRepository.updateCombo(
    id_combo,
    prepararDatosCombo(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el combo");
    error.status = 400;
    throw error;
  }

  return await combosRepository.findComboById(id_combo);
}

async function eliminarCombo(id_combo) {
  const combo = await combosRepository.findComboById(id_combo);

  if (!combo) {
    const error = new Error("Combo no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await combosRepository.deleteComboLogical(id_combo);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el combo");
    error.status = 400;
    throw error;
  }

  return {
    id_combo: Number(id_combo),
    estado_visible: 0
  };
}

async function validarCombo(data) {
  if (!data.nombre_combo || data.nombre_combo.trim() === "") {
    const error = new Error("El nombre del combo es obligatorio");
    error.status = 400;
    throw error;
  }

  if (data.precio_combo === undefined || Number(data.precio_combo) <= 0) {
    const error = new Error("El precio del combo debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (!data.fecha_inicio || !data.fecha_fin) {
    const error = new Error("La fecha de inicio y fin son obligatorias");
    error.status = 400;
    throw error;
  }

  if (new Date(data.fecha_inicio) > new Date(data.fecha_fin)) {
    const error = new Error("La fecha de inicio no puede ser mayor que la fecha fin");
    error.status = 400;
    throw error;
  }

  if (data.estado_combo && !ESTADOS_COMBO_VALIDOS.includes(data.estado_combo)) {
    const error = new Error("El estado del combo debe ser activo o inactivo");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
    const error = new Error("El combo debe tener al menos un producto");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    if (!item.id_variante) {
      const error = new Error("Cada detalle del combo debe tener una variante");
      error.status = 400;
      throw error;
    }

    if (!item.cantidad || Number(item.cantidad) <= 0) {
      const error = new Error("La cantidad del combo debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    const existeVariante = await combosRepository.varianteExists(item.id_variante);

    if (!existeVariante) {
      const error = new Error(`La variante ${item.id_variante} no existe`);
      error.status = 400;
      throw error;
    }
  }
}

function prepararDatosCombo(data) {
  return {
    nombre_combo: data.nombre_combo.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null,
    precio_combo: Number(data.precio_combo),
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    estado_combo: data.estado_combo || "activo",
    detalles: data.detalles.map((item) => ({
      id_variante: Number(item.id_variante),
      cantidad: Number(item.cantidad),
      precio_referencial: Number(item.precio_referencial || 0)
    }))
  };
}

module.exports = {
  listarCombos,
  obtenerComboPorId,
  crearCombo,
  actualizarCombo,
  eliminarCombo
};