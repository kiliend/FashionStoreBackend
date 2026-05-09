const pedidosRepository = require("./pedidos.repository");

const TIPOS_ENTREGA_VALIDOS = ["recojo_tienda", "delivery"];

const ESTADOS_PEDIDO_VALIDOS = [
  "pendiente",
  "validado_almacen",
  "en_preparacion",
  "preparado",
  "asignado_reparto",
  "en_ruta",
  "entregado",
  "rechazado",
  "cancelado"
];

const ROLES_OPERATIVOS_VALIDOS = ["almacen", "despacho", "reparto"];

async function listarPedidos() {
  return await pedidosRepository.findAllPedidos();
}

async function obtenerPedidoPorId(id_pedido) {
  const pedido = await pedidosRepository.findPedidoById(id_pedido);

  if (!pedido) {
    const error = new Error("Pedido no encontrado");
    error.status = 404;
    throw error;
  }

  return pedido;
}

async function crearPedido(data) {
  if (!data.id_venta) {
    const error = new Error("La venta es obligatoria para crear un pedido");
    error.status = 400;
    throw error;
  }

  if (
    data.tipo_entrega &&
    !TIPOS_ENTREGA_VALIDOS.includes(data.tipo_entrega)
  ) {
    const error = new Error("El tipo de entrega debe ser recojo_tienda o delivery");
    error.status = 400;
    throw error;
  }

  const venta = await pedidosRepository.findVentaParaPedido(data.id_venta);

  if (!venta) {
    const error = new Error("La venta seleccionada no existe");
    error.status = 404;
    throw error;
  }

  if (venta.estado_venta === "anulada") {
    const error = new Error("No se puede crear pedido para una venta anulada");
    error.status = 400;
    throw error;
  }

  const pedidoExistente = await pedidosRepository.pedidoExistsByVenta(data.id_venta);

  if (pedidoExistente) {
    const error = new Error("Ya existe un pedido para esta venta");
    error.status = 409;
    throw error;
  }

  const nuevoPedido = {
    id_venta: Number(data.id_venta),
    id_cliente: venta.id_cliente,
    tipo_entrega: data.tipo_entrega || "delivery",
    direccion_entrega: data.direccion_entrega ? data.direccion_entrega.trim() : null,
    referencia_entrega: data.referencia_entrega ? data.referencia_entrega.trim() : null
  };

  const id_pedido = await pedidosRepository.crearPedidoDesdeVenta(nuevoPedido);

  return await pedidosRepository.findPedidoById(id_pedido);
}

async function actualizarEstadoPedido(id_pedido, data) {
  const pedido = await pedidosRepository.findPedidoById(id_pedido);

  if (!pedido) {
    const error = new Error("Pedido no encontrado");
    error.status = 404;
    throw error;
  }

  if (
    !data.estado_pedido ||
    !ESTADOS_PEDIDO_VALIDOS.includes(data.estado_pedido)
  ) {
    const error = new Error("Estado de pedido no válido");
    error.status = 400;
    throw error;
  }

  const affectedRows = await pedidosRepository.updateEstadoPedido(
    id_pedido,
    data.estado_pedido
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el estado del pedido");
    error.status = 400;
    throw error;
  }

  return await pedidosRepository.findPedidoById(id_pedido);
}

async function asignarUsuarioPedido(id_pedido, data) {
  const pedido = await pedidosRepository.findPedidoById(id_pedido);

  if (!pedido) {
    const error = new Error("Pedido no encontrado");
    error.status = 404;
    throw error;
  }

  if (!data.id_usuario) {
    const error = new Error("El usuario asignado es obligatorio");
    error.status = 400;
    throw error;
  }

  if (
    !data.rol_operativo ||
    !ROLES_OPERATIVOS_VALIDOS.includes(data.rol_operativo)
  ) {
    const error = new Error("El rol operativo debe ser almacen, despacho o reparto");
    error.status = 400;
    throw error;
  }

  const existeUsuario = await pedidosRepository.usuarioExists(data.id_usuario);

  if (!existeUsuario) {
    const error = new Error("El usuario asignado no existe o no está activo");
    error.status = 400;
    throw error;
  }

  const idPedido = await pedidosRepository.asignarUsuarioPedido(id_pedido, {
    id_usuario: Number(data.id_usuario),
    rol_operativo: data.rol_operativo,
    observacion: data.observacion ? data.observacion.trim() : null
  });

  return await pedidosRepository.findPedidoById(idPedido);
}

async function eliminarPedido(id_pedido) {
  const pedido = await pedidosRepository.findPedidoById(id_pedido);

  if (!pedido) {
    const error = new Error("Pedido no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await pedidosRepository.deletePedidoLogical(id_pedido);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el pedido");
    error.status = 400;
    throw error;
  }

  return {
    id_pedido: Number(id_pedido),
    estado_visible: 0
  };
}

module.exports = {
  listarPedidos,
  obtenerPedidoPorId,
  crearPedido,
  actualizarEstadoPedido,
  asignarUsuarioPedido,
  eliminarPedido
};