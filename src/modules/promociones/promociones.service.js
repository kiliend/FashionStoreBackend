const promocionesRepository = require("./promociones.repository");

const TIPOS_PROMOCION_VALIDOS = [
  "porcentaje",
  "monto_fijo"
];

const ESTADOS_PROMOCION_VALIDOS = [
  "activo",
  "inactivo"
];

async function listarPromociones() {
  return await promocionesRepository.findAllPromociones();
}

async function obtenerPromocionPorId(id_promocion) {
  const promocion = await promocionesRepository.findPromocionById(id_promocion);

  if (!promocion) {
    const error = new Error("Promoción no encontrada");
    error.status = 404;
    throw error;
  }

  return promocion;
}

async function crearPromocion(data) {
  await validarPromocion(data);

  const nuevaPromocion = prepararDatosPromocion(data);

  const id_promocion = await promocionesRepository.createPromocion(nuevaPromocion);

  return await promocionesRepository.findPromocionById(id_promocion);
}

async function actualizarPromocion(id_promocion, data) {
  const promocionActual = await promocionesRepository.findPromocionById(id_promocion);

  if (!promocionActual) {
    const error = new Error("Promoción no encontrada");
    error.status = 404;
    throw error;
  }

  await validarPromocion(data);

  const affectedRows = await promocionesRepository.updatePromocion(
    id_promocion,
    prepararDatosPromocion(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la promoción");
    error.status = 400;
    throw error;
  }

  return await promocionesRepository.findPromocionById(id_promocion);
}

async function eliminarPromocion(id_promocion) {
  const promocion = await promocionesRepository.findPromocionById(id_promocion);

  if (!promocion) {
    const error = new Error("Promoción no encontrada");
    error.status = 404;
    throw error;
  }

  const affectedRows = await promocionesRepository.deletePromocionLogical(id_promocion);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar la promoción");
    error.status = 400;
    throw error;
  }

  return {
    id_promocion: Number(id_promocion),
    estado_visible: 0
  };
}

async function validarPromocion(data) {
  if (!data.nombre_promocion || data.nombre_promocion.trim() === "") {
    const error = new Error("El nombre de la promoción es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.tipo_promocion || !TIPOS_PROMOCION_VALIDOS.includes(data.tipo_promocion)) {
    const error = new Error("El tipo de promoción debe ser porcentaje o monto_fijo");
    error.status = 400;
    throw error;
  }

  if (data.valor_descuento === undefined || Number(data.valor_descuento) <= 0) {
    const error = new Error("El valor de descuento debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (data.tipo_promocion === "porcentaje" && Number(data.valor_descuento) > 100) {
    const error = new Error("El porcentaje de descuento no puede superar el 100%");
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

  if (
    data.estado_promocion &&
    !ESTADOS_PROMOCION_VALIDOS.includes(data.estado_promocion)
  ) {
    const error = new Error("El estado de promoción debe ser activo o inactivo");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
    const error = new Error("La promoción debe tener al menos un producto o variante");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    if (!item.id_producto && !item.id_variante) {
      const error = new Error("Cada detalle debe tener id_producto o id_variante");
      error.status = 400;
      throw error;
    }

    if (item.id_producto) {
      const existeProducto = await promocionesRepository.productoExists(item.id_producto);

      if (!existeProducto) {
        const error = new Error(`El producto ${item.id_producto} no existe`);
        error.status = 400;
        throw error;
      }
    }

    if (item.id_variante) {
      const existeVariante = await promocionesRepository.varianteExists(item.id_variante);

      if (!existeVariante) {
        const error = new Error(`La variante ${item.id_variante} no existe`);
        error.status = 400;
        throw error;
      }
    }
  }
}

function prepararDatosPromocion(data) {
  return {
    nombre_promocion: data.nombre_promocion.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null,
    tipo_promocion: data.tipo_promocion,
    valor_descuento: Number(data.valor_descuento),
    fecha_inicio: data.fecha_inicio,
    fecha_fin: data.fecha_fin,
    estado_promocion: data.estado_promocion || "activo",
    detalles: data.detalles.map((item) => ({
      id_producto: item.id_producto ? Number(item.id_producto) : null,
      id_variante: item.id_variante ? Number(item.id_variante) : null,
      cantidad_minima: Number(item.cantidad_minima || 1)
    }))
  };
}

module.exports = {
  listarPromociones,
  obtenerPromocionPorId,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion
};