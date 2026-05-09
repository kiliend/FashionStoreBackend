const comprasService = require("./compras.service");

async function listarOrdenesCompra(req, res, next) {
  try {
    const ordenes = await comprasService.listarOrdenesCompra();

    res.json({
      ok: true,
      message: "Órdenes de compra obtenidas correctamente",
      data: ordenes
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerOrdenCompra(req, res, next) {
  try {
    const { id } = req.params;

    const orden = await comprasService.obtenerOrdenCompraPorId(id);

    res.json({
      ok: true,
      message: "Orden de compra obtenida correctamente",
      data: orden
    });
  } catch (error) {
    next(error);
  }
}

async function crearOrdenCompra(req, res, next) {
  try {
    const orden = await comprasService.crearOrdenCompra(req.body, req.user);

    res.status(201).json({
      ok: true,
      message: "Orden de compra creada correctamente",
      data: orden
    });
  } catch (error) {
    next(error);
  }
}

async function recibirOrdenCompra(req, res, next) {
  try {
    const { id } = req.params;

    const orden = await comprasService.recibirOrdenCompra(id);

    res.json({
      ok: true,
      message: "Orden de compra recibida correctamente",
      data: orden
    });
  } catch (error) {
    next(error);
  }
}

async function pagarOrdenCompra(req, res, next) {
  try {
    const { id } = req.params;

    const orden = await comprasService.pagarOrdenCompra(id, req.user);

    res.json({
      ok: true,
      message: "Pago de factura registrado correctamente",
      data: orden
    });
  } catch (error) {
    next(error);
  }
}

async function cancelarOrdenCompra(req, res, next) {
  try {
    const { id } = req.params;

    const orden = await comprasService.cancelarOrdenCompra(id);

    res.json({
      ok: true,
      message: "Orden de compra cancelada correctamente",
      data: orden
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarOrdenesCompra,
  obtenerOrdenCompra,
  crearOrdenCompra,
  recibirOrdenCompra,
  pagarOrdenCompra,
  cancelarOrdenCompra
};