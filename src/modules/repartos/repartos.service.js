const repartosRepository = require("./repartos.repository");

async function listarRepartos() {
  return await repartosRepository.findAllRepartos();
}

async function obtenerRepartoPorId(id_reparto) {
  const reparto = await repartosRepository.findRepartoById(id_reparto);

  if (!reparto) {
    const error = new Error("Reparto no encontrado");
    error.status = 404;
    throw error;
  }

  return reparto;
}

async function crearReparto(data) {
  if (!data.id_pedido) {
    const error = new Error("El pedido es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.id_repartidor) {
    const error = new Error("El repartidor es obligatorio");
    error.status = 400;
    throw error;
  }

  const pedido = await repartosRepository.pedidoExists(data.id_pedido);

  if (!pedido) {
    const error = new Error("El pedido seleccionado no existe");
    error.status = 404;
    throw error;
  }

  if (!["preparado", "asignado_reparto"].includes(pedido.estado_pedido)) {
    const error = new Error("El pedido debe estar preparado o asignado a reparto");
    error.status = 400;
    throw error;
  }

  const repartoExistente = await repartosRepository.repartoExistsByPedido(data.id_pedido);

  if (repartoExistente) {
    const error = new Error("Ya existe un reparto para este pedido");
    error.status = 409;
    throw error;
  }

  const repartidor = await repartosRepository.usuarioRepartidorExists(data.id_repartidor);

  if (!repartidor) {
    const error = new Error("El usuario seleccionado no existe o no tiene rol reparto");
    error.status = 400;
    throw error;
  }

  if (data.id_vehiculo) {
    const vehiculo = await repartosRepository.vehiculoDisponible(data.id_vehiculo);

    if (!vehiculo) {
      const error = new Error("El vehículo seleccionado no existe o no está disponible");
      error.status = 400;
      throw error;
    }
  }

  const id_reparto = await repartosRepository.crearReparto({
    id_pedido: Number(data.id_pedido),
    id_repartidor: Number(data.id_repartidor),
    id_vehiculo: data.id_vehiculo ? Number(data.id_vehiculo) : null
  });

  return await repartosRepository.findRepartoById(id_reparto);
}

async function marcarSalida(id_reparto) {
  const idReparto = await repartosRepository.marcarSalida(id_reparto);
  return await repartosRepository.findRepartoById(idReparto);
}

async function entregarReparto(id_reparto, data) {
  const idReparto = await repartosRepository.entregarReparto(id_reparto, {
    observacion_entrega: data.observacion_entrega
      ? data.observacion_entrega.trim()
      : null,
    evidencia_entrega: data.evidencia_entrega
      ? data.evidencia_entrega.trim()
      : null
  });

  return await repartosRepository.findRepartoById(idReparto);
}

async function marcarFallido(id_reparto, data) {
  const idReparto = await repartosRepository.marcarFallido(id_reparto, {
    observacion_entrega: data.observacion_entrega
      ? data.observacion_entrega.trim()
      : "Entrega fallida"
  });

  return await repartosRepository.findRepartoById(idReparto);
}

module.exports = {
  listarRepartos,
  obtenerRepartoPorId,
  crearReparto,
  marcarSalida,
  entregarReparto,
  marcarFallido
};