const productosService = require("./productos.service");

async function listarProductos(req, res, next) {
  try {
    const productos = await productosService.listarProductos();

    res.json({
      ok: true,
      message: "Productos obtenidos correctamente",
      data: productos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerProducto(req, res, next) {
  try {
    const { id } = req.params;

    const producto = await productosService.obtenerProductoPorId(id);

    res.json({
      ok: true,
      message: "Producto obtenido correctamente",
      data: producto
    });
  } catch (error) {
    next(error);
  }
}

async function crearProducto(req, res, next) {
  try {
    const producto = await productosService.crearProducto(req.body);

    res.status(201).json({
      ok: true,
      message: "Producto creado correctamente",
      data: producto
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarProducto(req, res, next) {
  try {
    const { id } = req.params;

    const producto = await productosService.actualizarProducto(id, req.body);

    res.json({
      ok: true,
      message: "Producto actualizado correctamente",
      data: producto
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarProducto(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await productosService.eliminarProducto(id);

    res.json({
      ok: true,
      message: "Producto eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};