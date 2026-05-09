const pedidosService = require("./pedidos.service");

async function listarPedidos(req, res, next) {
  try {
    const pedidos = await pedidosService.listarPedidos();

    res.json({
      ok: true,
      message: "Pedidos obtenidos correctamente",
      data: pedidos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerPedido(req, res, next) {
  try {
    const { id } = req.params;

    const pedido = await pedidosService.obtenerPedidoPorId(id);

    res.json({
      ok: true,
      message: "Pedido obtenido correctamente",
      data: pedido
    });
  } catch (error) {
    next(error);
  }
}

async function crearPedido(req, res, next) {
  try {
    const pedido = await pedidosService.crearPedido(req.body);

    res.status(201).json({
      ok: true,
      message: "Pedido creado correctamente",
      data: pedido
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarEstadoPedido(req, res, next) {
  try {
    const { id } = req.params;

    const pedido = await pedidosService.actualizarEstadoPedido(id, req.body);

    res.json({
      ok: true,
      message: "Estado del pedido actualizado correctamente",
      data: pedido
    });
  } catch (error) {
    next(error);
  }
}

async function asignarUsuarioPedido(req, res, next) {
  try {
    const { id } = req.params;

    const pedido = await pedidosService.asignarUsuarioPedido(id, req.body);

    res.json({
      ok: true,
      message: "Usuario asignado al pedido correctamente",
      data: pedido
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarPedido(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await pedidosService.eliminarPedido(id);

    res.json({
      ok: true,
      message: "Pedido eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarPedidos,
  obtenerPedido,
  crearPedido,
  actualizarEstadoPedido,
  asignarUsuarioPedido,
  eliminarPedido
};