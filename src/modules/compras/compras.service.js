const comprasRepository = require("./compras.repository");

async function listarOrdenesCompra() {
  return await comprasRepository.findAllOrdenesCompra();
}

async function obtenerOrdenCompraPorId(id_orden_compra) {
  const orden = await comprasRepository.findOrdenCompraById(id_orden_compra);

  if (!orden) {
    const error = new Error("Orden de compra no encontrada");
    error.status = 404;
    throw error;
  }

  return orden;
}

async function crearOrdenCompra(data, usuarioAutenticado) {
  validarOrdenCompra(data);

  const existeProveedor = await comprasRepository.proveedorExists(data.id_proveedor);

  if (!existeProveedor) {
    const error = new Error("El proveedor seleccionado no existe o no está activo");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    if (item.id_variante) {
      const existeVariante = await comprasRepository.varianteExists(item.id_variante);

      if (!existeVariante) {
        const error = new Error(`La variante ${item.id_variante} no existe`);
        error.status = 400;
        throw error;
      }
    }
  }

  const nuevaOrden = {
    id_proveedor: Number(data.id_proveedor),
    id_usuario_registro: usuarioAutenticado.id_usuario,
    detalles: data.detalles.map((item) => ({
      id_variante: item.id_variante ? Number(item.id_variante) : null,
      descripcion_producto: item.descripcion_producto.trim(),
      cantidad: Number(item.cantidad),
      costo_unitario: Number(item.costo_unitario)
    }))
  };

  const id_orden_compra = await comprasRepository.crearOrdenCompra(nuevaOrden);

  return await comprasRepository.findOrdenCompraById(id_orden_compra);
}

async function recibirOrdenCompra(id_orden_compra) {
  const orden = await comprasRepository.findOrdenCompraById(id_orden_compra);

  if (!orden) {
    const error = new Error("Orden de compra no encontrada");
    error.status = 404;
    throw error;
  }

  const idOrden = await comprasRepository.recibirOrdenCompra(id_orden_compra);

  return await comprasRepository.findOrdenCompraById(idOrden);
}

async function pagarOrdenCompra(id_orden_compra, usuarioAutenticado) {
  const orden = await comprasRepository.findOrdenCompraById(id_orden_compra);

  if (!orden) {
    const error = new Error("Orden de compra no encontrada");
    error.status = 404;
    throw error;
  }

  if (orden.estado_factura === "pagada") {
    const error = new Error("La factura de esta orden ya está pagada");
    error.status = 400;
    throw error;
  }

  const affectedRows = await comprasRepository.pagarOrdenCompra(id_orden_compra, {
    id_usuario_pago: usuarioAutenticado.id_usuario
  });

  if (affectedRows === 0) {
    const error = new Error("No se pudo registrar el pago de la orden");
    error.status = 400;
    throw error;
  }

  return await comprasRepository.findOrdenCompraById(id_orden_compra);
}

async function cancelarOrdenCompra(id_orden_compra) {
  const orden = await comprasRepository.findOrdenCompraById(id_orden_compra);

  if (!orden) {
    const error = new Error("Orden de compra no encontrada");
    error.status = 404;
    throw error;
  }

  if (orden.estado_orden !== "registrada") {
    const error = new Error("Solo se pueden cancelar órdenes registradas");
    error.status = 400;
    throw error;
  }

  const affectedRows = await comprasRepository.cancelarOrdenCompra(id_orden_compra);

  if (affectedRows === 0) {
    const error = new Error("No se pudo cancelar la orden");
    error.status = 400;
    throw error;
  }

  return await comprasRepository.findOrdenCompraById(id_orden_compra);
}

function validarOrdenCompra(data) {
  if (!data.id_proveedor) {
    const error = new Error("El proveedor es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!Array.isArray(data.detalles) || data.detalles.length === 0) {
    const error = new Error("La orden de compra debe tener al menos un producto");
    error.status = 400;
    throw error;
  }

  for (const item of data.detalles) {
    if (!item.descripcion_producto || item.descripcion_producto.trim() === "") {
      const error = new Error("Cada producto debe tener una descripción");
      error.status = 400;
      throw error;
    }

    if (!item.cantidad || Number(item.cantidad) <= 0) {
      const error = new Error("La cantidad debe ser mayor a 0");
      error.status = 400;
      throw error;
    }

    if (item.costo_unitario === undefined || Number(item.costo_unitario) <= 0) {
      const error = new Error("El costo unitario debe ser mayor a 0");
      error.status = 400;
      throw error;
    }
  }
}

module.exports = {
  listarOrdenesCompra,
  obtenerOrdenCompraPorId,
  crearOrdenCompra,
  recibirOrdenCompra,
  pagarOrdenCompra,
  cancelarOrdenCompra
};