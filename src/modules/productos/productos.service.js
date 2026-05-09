const productosRepository = require("./productos.repository");

const ESTADOS_PRODUCTO_VALIDOS = ["activo", "inactivo"];

async function listarProductos() {
  return await productosRepository.findAllProductos();
}

async function obtenerProductoPorId(id_producto) {
  const producto = await productosRepository.findProductoById(id_producto);

  if (!producto) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  return producto;
}

async function crearProducto(data) {
  validarProducto(data);

  const existeCategoria = await productosRepository.categoriaExists(data.id_categoria);

  if (!existeCategoria) {
    const error = new Error("La categoría seleccionada no existe");
    error.status = 400;
    throw error;
  }

  const nuevoProducto = {
    id_categoria: Number(data.id_categoria),
    nombre_producto: data.nombre_producto.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null,
    precio_venta: Number(data.precio_venta),
    imagen_url: data.imagen_url ? data.imagen_url.trim() : null,
    estado_producto: data.estado_producto || "activo"
  };

  const id_producto = await productosRepository.createProducto(nuevoProducto);

  return await productosRepository.findProductoById(id_producto);
}

async function actualizarProducto(id_producto, data) {
  const productoActual = await productosRepository.findProductoById(id_producto);

  if (!productoActual) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  validarProducto(data);

  const existeCategoria = await productosRepository.categoriaExists(data.id_categoria);

  if (!existeCategoria) {
    const error = new Error("La categoría seleccionada no existe");
    error.status = 400;
    throw error;
  }

  const affectedRows = await productosRepository.updateProducto(id_producto, {
    id_categoria: Number(data.id_categoria),
    nombre_producto: data.nombre_producto.trim(),
    descripcion: data.descripcion ? data.descripcion.trim() : null,
    precio_venta: Number(data.precio_venta),
    imagen_url: data.imagen_url ? data.imagen_url.trim() : null,
    estado_producto: data.estado_producto
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el producto");
    error.status = 400;
    throw error;
  }

  return await productosRepository.findProductoById(id_producto);
}

async function eliminarProducto(id_producto) {
  const producto = await productosRepository.findProductoById(id_producto);

  if (!producto) {
    const error = new Error("Producto no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await productosRepository.deleteProductoLogical(id_producto);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el producto");
    error.status = 400;
    throw error;
  }

  return {
    id_producto: Number(id_producto),
    estado_visible: 0
  };
}

function validarProducto(data) {
  if (!data.id_categoria) {
    const error = new Error("La categoría es obligatoria");
    error.status = 400;
    throw error;
  }

  if (!data.nombre_producto || data.nombre_producto.trim() === "") {
    const error = new Error("El nombre del producto es obligatorio");
    error.status = 400;
    throw error;
  }

  if (data.precio_venta === undefined || Number(data.precio_venta) <= 0) {
    const error = new Error("El precio de venta debe ser mayor a 0");
    error.status = 400;
    throw error;
  }

  if (
    data.estado_producto &&
    !ESTADOS_PRODUCTO_VALIDOS.includes(data.estado_producto)
  ) {
    const error = new Error("El estado del producto debe ser activo o inactivo");
    error.status = 400;
    throw error;
  }
}

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  crearProducto,
  actualizarProducto,
  eliminarProducto
};