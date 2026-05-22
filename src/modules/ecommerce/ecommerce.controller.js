const ecommerceService = require("./ecommerce.service");

async function listarProductos(req, res, next) {
  try {
    const productos = await ecommerceService.listarProductos();

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

    const producto = await ecommerceService.obtenerProductoPorId(id);

    res.json({
      ok: true,
      message: "Producto obtenido correctamente",
      data: producto
    });
  } catch (error) {
    next(error);
  }
}

async function validarCarrito(req, res, next) {
  try {
    const resultado = await ecommerceService.validarCarrito(req.body);

    res.json({
      ok: true,
      message: "Carrito validado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

async function checkout(req, res, next) {
  try {
    const resultado = await ecommerceService.checkout(req.body, req.user);

    res.status(201).json({
      ok: true,
      message: "Checkout registrado correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

async function misCompras(req, res, next) {
  try {
    const compras = await ecommerceService.misCompras(req.user);

    res.json({
      ok: true,
      message: "Compras obtenidas correctamente",
      data: compras
    });
  } catch (error) {
    next(error);
  }
}

async function misPedidos(req, res, next) {
  try {
    const pedidos = await ecommerceService.misPedidos(req.user);

    res.json({
      ok: true,
      message: "Pedidos obtenidos correctamente",
      data: pedidos
    });
  } catch (error) {
    next(error);
  }
}

async function registrarCliente(req, res, next) {
  try {
    const data = await ecommerceService.registrarCliente(req.body);

    res.status(201).json({
      ok: true,
      message: "Cliente e-commerce registrado correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerMiCuenta(req, res, next) {
  try {
    const cuenta = await ecommerceService.obtenerMiCuenta(req.user);

    res.json({
      ok: true,
      message: "Cuenta obtenida correctamente",
      data: cuenta
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarMiCuenta(req, res, next) {
  try {
    const cuenta = await ecommerceService.actualizarMiCuenta(req.body, req.user);

    res.json({
      ok: true,
      message: "Cuenta actualizada correctamente",
      data: cuenta
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarProductos,
  obtenerProducto,
  validarCarrito,
  checkout,
  misCompras,
  misPedidos,
  registrarCliente,
  obtenerMiCuenta,
  actualizarMiCuenta
};