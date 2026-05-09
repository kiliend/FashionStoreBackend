const variantesRepository = require("./variantes.repository");

const ESTADOS_VARIANTE_VALIDOS = ["activo", "inactivo"];

async function listarVariantes() {
  return await variantesRepository.findAllVariantes();
}

async function obtenerVariantePorId(id_variante) {
  const variante = await variantesRepository.findVarianteById(id_variante);

  if (!variante) {
    const error = new Error("Variante no encontrada");
    error.status = 404;
    throw error;
  }

  return variante;
}

async function crearVariante(data) {
  await validarVariante(data);

  const varianteConSku = await variantesRepository.findVarianteBySku(data.sku);

  if (varianteConSku) {
    const error = new Error("El SKU ya está registrado");
    error.status = 409;
    throw error;
  }

  const nuevaVariante = {
    id_producto: Number(data.id_producto),
    id_color: Number(data.id_color),
    id_talla: Number(data.id_talla),
    sku: data.sku.trim(),
    stock_actual: Number(data.stock_actual || 0),
    stock_minimo: Number(data.stock_minimo || 0),
    estado_variante: data.estado_variante || "activo"
  };

  const id_variante = await variantesRepository.createVariante(nuevaVariante);

  return await variantesRepository.findVarianteById(id_variante);
}

async function actualizarVariante(id_variante, data) {
  const varianteActual = await variantesRepository.findVarianteById(id_variante);

  if (!varianteActual) {
    const error = new Error("Variante no encontrada");
    error.status = 404;
    throw error;
  }

  await validarVariante(data);

  const varianteConSku = await variantesRepository.findVarianteBySku(data.sku);

  if (
    varianteConSku &&
    varianteConSku.id_variante !== Number(id_variante)
  ) {
    const error = new Error("El SKU ya está registrado en otra variante");
    error.status = 409;
    throw error;
  }

  const affectedRows = await variantesRepository.updateVariante(id_variante, {
    id_producto: Number(data.id_producto),
    id_color: Number(data.id_color),
    id_talla: Number(data.id_talla),
    sku: data.sku.trim(),
    stock_actual: Number(data.stock_actual),
    stock_minimo: Number(data.stock_minimo),
    estado_variante: data.estado_variante
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la variante");
    error.status = 400;
    throw error;
  }

  return await variantesRepository.findVarianteById(id_variante);
}

async function eliminarVariante(id_variante) {
  const variante = await variantesRepository.findVarianteById(id_variante);

  if (!variante) {
    const error = new Error("Variante no encontrada");
    error.status = 404;
    throw error;
  }

  const affectedRows = await variantesRepository.deleteVarianteLogical(id_variante);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar la variante");
    error.status = 400;
    throw error;
  }

  return {
    id_variante: Number(id_variante),
    estado_visible: 0
  };
}

async function validarVariante(data) {
  if (!data.id_producto) {
    const error = new Error("El producto es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.id_color) {
    const error = new Error("El color es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.id_talla) {
    const error = new Error("La talla es obligatoria");
    error.status = 400;
    throw error;
  }

  if (!data.sku || data.sku.trim() === "") {
    const error = new Error("El SKU es obligatorio");
    error.status = 400;
    throw error;
  }

  if (data.stock_actual === undefined || Number(data.stock_actual) < 0) {
    const error = new Error("El stock actual no puede ser negativo");
    error.status = 400;
    throw error;
  }

  if (data.stock_minimo === undefined || Number(data.stock_minimo) < 0) {
    const error = new Error("El stock mínimo no puede ser negativo");
    error.status = 400;
    throw error;
  }

  if (
    data.estado_variante &&
    !ESTADOS_VARIANTE_VALIDOS.includes(data.estado_variante)
  ) {
    const error = new Error("El estado de la variante debe ser activo o inactivo");
    error.status = 400;
    throw error;
  }

  const existeProducto = await variantesRepository.productoExists(data.id_producto);
  if (!existeProducto) {
    const error = new Error("El producto seleccionado no existe");
    error.status = 400;
    throw error;
  }

  const existeColor = await variantesRepository.colorExists(data.id_color);
  if (!existeColor) {
    const error = new Error("El color seleccionado no existe");
    error.status = 400;
    throw error;
  }

  const existeTalla = await variantesRepository.tallaExists(data.id_talla);
  if (!existeTalla) {
    const error = new Error("La talla seleccionada no existe");
    error.status = 400;
    throw error;
  }
}

module.exports = {
  listarVariantes,
  obtenerVariantePorId,
  crearVariante,
  actualizarVariante,
  eliminarVariante
};