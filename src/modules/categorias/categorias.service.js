const categoriasRepository = require("./categorias.repository");

async function listarCategorias() {
  return await categoriasRepository.findAllCategorias();
}

async function obtenerCategoriaPorId(id_categoria) {
  const categoria = await categoriasRepository.findCategoriaById(id_categoria);

  if (!categoria) {
    const error = new Error("Categoría no encontrada");
    error.status = 404;
    throw error;
  }

  return categoria;
}

async function crearCategoria(data) {
  if (!data.nombre_categoria || data.nombre_categoria.trim() === "") {
    const error = new Error("El nombre de la categoría es obligatorio");
    error.status = 400;
    throw error;
  }

  const nuevaCategoria = {
    nombre_categoria: data.nombre_categoria.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null
  };

  const id_categoria = await categoriasRepository.createCategoria(nuevaCategoria);

  return await categoriasRepository.findCategoriaById(id_categoria);
}

async function actualizarCategoria(id_categoria, data) {
  const categoriaActual = await categoriasRepository.findCategoriaById(id_categoria);

  if (!categoriaActual) {
    const error = new Error("Categoría no encontrada");
    error.status = 404;
    throw error;
  }

  if (!data.nombre_categoria || data.nombre_categoria.trim() === "") {
    const error = new Error("El nombre de la categoría es obligatorio");
    error.status = 400;
    throw error;
  }

  const affectedRows = await categoriasRepository.updateCategoria(id_categoria, {
    nombre_categoria: data.nombre_categoria.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la categoría");
    error.status = 400;
    throw error;
  }

  return await categoriasRepository.findCategoriaById(id_categoria);
}

async function eliminarCategoria(id_categoria) {
  const categoria = await categoriasRepository.findCategoriaById(id_categoria);

  if (!categoria) {
    const error = new Error("Categoría no encontrada");
    error.status = 404;
    throw error;
  }

  const affectedRows = await categoriasRepository.deleteCategoriaLogical(id_categoria);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar la categoría");
    error.status = 400;
    throw error;
  }

  return {
    id_categoria: Number(id_categoria),
    estado_visible: 0
  };
}

module.exports = {
  listarCategorias,
  obtenerCategoriaPorId,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
};