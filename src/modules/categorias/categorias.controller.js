const categoriasService = require("./categorias.service");

async function listarCategorias(req, res, next) {
  try {
    const categorias = await categoriasService.listarCategorias();

    res.json({
      ok: true,
      message: "Categorías obtenidas correctamente",
      data: categorias
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerCategoria(req, res, next) {
  try {
    const { id } = req.params;

    const categoria = await categoriasService.obtenerCategoriaPorId(id);

    res.json({
      ok: true,
      message: "Categoría obtenida correctamente",
      data: categoria
    });
  } catch (error) {
    next(error);
  }
}

async function crearCategoria(req, res, next) {
  try {
    const categoria = await categoriasService.crearCategoria(req.body);

    res.status(201).json({
      ok: true,
      message: "Categoría creada correctamente",
      data: categoria
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarCategoria(req, res, next) {
  try {
    const { id } = req.params;

    const categoria = await categoriasService.actualizarCategoria(id, req.body);

    res.json({
      ok: true,
      message: "Categoría actualizada correctamente",
      data: categoria
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarCategoria(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await categoriasService.eliminarCategoria(id);

    res.json({
      ok: true,
      message: "Categoría eliminada lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarCategorias,
  obtenerCategoria,
  crearCategoria,
  actualizarCategoria,
  eliminarCategoria
};