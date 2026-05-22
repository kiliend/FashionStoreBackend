const ecommerceRepository = require("./ecommerce.repository");

async function listarProductos() {
  return await ecommerceRepository.findProductosPublicos();
}

async function obtenerProductoPorId(id_producto) {
  const producto = await ecommerceRepository.findProductoPublicoById(id_producto);

  if (!producto) {
    const error = new Error("Producto no encontrado o no disponible");
    error.status = 404;
    throw error;
  }

  return producto;
}

async function validarCarrito(data) {
  if (!Array.isArray(data.items) || data.items.length === 0) {
    const error = new Error("El carrito está vacío");
    error.status = 400;
    throw error;
  }

  const resultado = [];
  let total = 0;

  for (const item of data.items) {
    if (!item.id_variante) {
      const error = new Error("Cada item debe tener una variante");
      error.status = 400;
      throw error;
    }

    if (!item.cantidad || Number(item.cantidad) <= 0) {
      const error = new Error("Cada item debe tener una cantidad válida");
      error.status = 400;
      throw error;
    }

    const variante = await ecommerceRepository.findVarianteParaCarrito(
      item.id_variante
    );

    if (!variante) {
      const error = new Error(`La variante ${item.id_variante} no existe`);
      error.status = 404;
      throw error;
    }

    if (variante.estado_producto !== "activo") {
      const error = new Error(`El producto ${variante.nombre_producto} no está activo`);
      error.status = 400;
      throw error;
    }

    if (variante.estado_variante !== "activo") {
      const error = new Error(`La variante ${variante.sku} no está activa`);
      error.status = 400;
      throw error;
    }

    if (Number(variante.stock_actual) < Number(item.cantidad)) {
      const error = new Error(
        `Stock insuficiente para ${variante.nombre_producto} - ${variante.sku}`
      );
      error.status = 400;
      throw error;
    }

    const precioUnitario = Number(variante.precio_venta);
    const subtotal = precioUnitario * Number(item.cantidad);

    total += subtotal;

    resultado.push({
      id_variante: variante.id_variante,
      id_producto: variante.id_producto,
      nombre_producto: variante.nombre_producto,
      descripcion_item: variante.nombre_producto,
      nombre_color: variante.nombre_color,
      nombre_talla: variante.nombre_talla,
      sku: variante.sku,
      imagen_url: variante.imagen_url,
      cantidad: Number(item.cantidad),
      stock_actual: Number(variante.stock_actual),
      precio_unitario: precioUnitario,
      subtotal: Number(subtotal.toFixed(2))
    });
  }

  const subtotalSinIgv = total / 1.18;
  const igv = total - subtotalSinIgv;

  return {
    items: resultado,
    resumen: {
      subtotal: Number(subtotalSinIgv.toFixed(2)),
      igv: Number(igv.toFixed(2)),
      total: Number(total.toFixed(2))
    }
  };
}

async function checkout(data, usuarioAutenticado) {
  if (!usuarioAutenticado?.id_usuario) {
    const error = new Error("Debe iniciar sesión para confirmar la compra");
    error.status = 401;
    throw error;
  }

let cliente = await ecommerceRepository.findClienteByUsuario(
  usuarioAutenticado.id_usuario
);

if (!cliente) {
  const idClienteCreado = await ecommerceRepository.crearClienteDesdeUsuario(
    usuarioAutenticado.id_usuario
  );

  cliente = await ecommerceRepository.findClienteById(idClienteCreado);
}

if (!cliente) {
  const error = new Error("No se pudo vincular el cliente al usuario autenticado");
  error.status = 400;
  throw error;
}

  if (!["delivery", "recojo_tienda"].includes(data.tipo_entrega)) {
    const error = new Error("El tipo de entrega debe ser delivery o recojo_tienda");
    error.status = 400;
    throw error;
  }

  if (data.tipo_entrega === "delivery" && !data.direccion_entrega) {
    const error = new Error("La dirección de entrega es obligatoria para delivery");
    error.status = 400;
    throw error;
  }

  const carritoValidado = await validarCarrito({
    items: data.items
  });

  const idVenta = await ecommerceRepository.crearVentaEcommerce({
    id_cliente: cliente.id_cliente,
    id_usuario_creacion: usuarioAutenticado.id_usuario,
    subtotal: carritoValidado.resumen.subtotal,
    igv: carritoValidado.resumen.igv,
    total: carritoValidado.resumen.total,
    detalles: carritoValidado.items
  });

  const venta = await ecommerceRepository.findVentaEcommerceById(idVenta);

  return {
    venta,
    mensaje:
      "Solicitud de compra registrada correctamente. La venta queda pendiente de confirmación."
  };
}

async function misCompras(usuarioAutenticado) {
  if (!usuarioAutenticado?.id_usuario) {
    const error = new Error("Usuario no autenticado");
    error.status = 401;
    throw error;
  }

  return await ecommerceRepository.findMisCompras(usuarioAutenticado.id_usuario);
}

async function misPedidos(usuarioAutenticado) {
  if (!usuarioAutenticado?.id_usuario) {
    const error = new Error("Usuario no autenticado");
    error.status = 401;
    throw error;
  }

  return await ecommerceRepository.findMisPedidos(usuarioAutenticado.id_usuario);
}

async function registrarCliente(data) {
  if (!data.nombres || data.nombres.trim() === "") {
    const error = new Error("Los nombres son obligatorios");
    error.status = 400;
    throw error;
  }

  if (!data.usuario || data.usuario.trim() === "") {
    const error = new Error("El usuario es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.password || data.password.length < 6) {
    const error = new Error("La contraseña debe tener al menos 6 caracteres");
    error.status = 400;
    throw error;
  }

  if (!data.correo || data.correo.trim() === "") {
    const error = new Error("El correo es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.numero_documento || data.numero_documento.trim() === "") {
    const error = new Error("El número de documento es obligatorio");
    error.status = 400;
    throw error;
  }

  const usuarioExiste = await ecommerceRepository.findUsuarioByUsernameOrCorreo(
    data.usuario.trim(),
    data.correo.trim()
  );

  if (usuarioExiste) {
    const error = new Error("El usuario o correo ya se encuentra registrado");
    error.status = 400;
    throw error;
  }

  const clienteExiste = await ecommerceRepository.findClienteByDocumento(
    data.numero_documento.trim()
  );

  if (clienteExiste) {
    const error = new Error("El documento ya se encuentra registrado");
    error.status = 400;
    throw error;
  }

  const nuevoCliente = await ecommerceRepository.registrarClienteEcommerce({
    nombres: data.nombres.trim(),
    apellidos: data.apellidos ? data.apellidos.trim() : null,
    usuario: data.usuario.trim(),
    password: data.password,
    correo: data.correo.trim(),
    telefono: data.telefono ? data.telefono.trim() : null,
    tipo_documento: data.tipo_documento || "DNI",
    numero_documento: data.numero_documento.trim(),
    direccion: data.direccion ? data.direccion.trim() : null
  });

  return nuevoCliente;
}

async function obtenerMiCuenta(usuarioAutenticado) {
  if (!usuarioAutenticado?.id_usuario) {
    const error = new Error("Usuario no autenticado");
    error.status = 401;
    throw error;
  }

  let cliente = await ecommerceRepository.findMiCuentaByUsuario(
    usuarioAutenticado.id_usuario
  );

  if (!cliente) {
    const idClienteCreado = await ecommerceRepository.crearClienteDesdeUsuario(
      usuarioAutenticado.id_usuario
    );

    cliente = await ecommerceRepository.findClienteById(idClienteCreado);
  }

  if (!cliente) {
    const error = new Error("No se pudo obtener la cuenta del cliente");
    error.status = 400;
    throw error;
  }

  return cliente;
}

async function actualizarMiCuenta(data, usuarioAutenticado) {
  if (!usuarioAutenticado?.id_usuario) {
    const error = new Error("Usuario no autenticado");
    error.status = 401;
    throw error;
  }

  let cliente = await ecommerceRepository.findMiCuentaByUsuario(
    usuarioAutenticado.id_usuario
  );

  if (!cliente) {
    const idClienteCreado = await ecommerceRepository.crearClienteDesdeUsuario(
      usuarioAutenticado.id_usuario
    );

    cliente = await ecommerceRepository.findClienteById(idClienteCreado);
  }

  if (!cliente) {
    const error = new Error("No se pudo vincular la cuenta del cliente");
    error.status = 400;
    throw error;
  }

  if (!data.nombres || data.nombres.trim() === "") {
    const error = new Error("Los nombres son obligatorios");
    error.status = 400;
    throw error;
  }

  if (!data.numero_documento || data.numero_documento.trim() === "") {
    const error = new Error("El número de documento es obligatorio");
    error.status = 400;
    throw error;
  }

  if (
    data.tipo_documento === "DNI" &&
    data.numero_documento.trim().length !== 8
  ) {
    const error = new Error("El DNI debe tener 8 dígitos");
    error.status = 400;
    throw error;
  }

  if (!data.correo || data.correo.trim() === "") {
    const error = new Error("El correo es obligatorio");
    error.status = 400;
    throw error;
  }

  const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!correoRegex.test(data.correo.trim())) {
    const error = new Error("El correo no tiene un formato válido");
    error.status = 400;
    throw error;
  }

  const documentoExiste =
    await ecommerceRepository.findClienteByDocumentoExceptSelf(
      data.numero_documento.trim(),
      cliente.id_cliente
    );

  if (documentoExiste) {
    const error = new Error("El documento ya pertenece a otro cliente");
    error.status = 400;
    throw error;
  }

  const affectedRows = await ecommerceRepository.updateMiCuentaCliente(
    cliente.id_cliente,
    {
      id_usuario: usuarioAutenticado.id_usuario,
      nombres: data.nombres.trim(),
      apellidos: data.apellidos ? data.apellidos.trim() : null,
      tipo_documento: data.tipo_documento || "DNI",
      numero_documento: data.numero_documento.trim(),
      correo: data.correo.trim(),
      telefono: data.telefono ? data.telefono.trim() : null,
      direccion: data.direccion ? data.direccion.trim() : null
    }
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la información del cliente");
    error.status = 400;
    throw error;
  }

  return await ecommerceRepository.findMiCuentaByUsuario(
    usuarioAutenticado.id_usuario
  );
}

module.exports = {
  listarProductos,
  obtenerProductoPorId,
  validarCarrito,
  checkout,
  misCompras,
  misPedidos,
  registrarCliente,
  obtenerMiCuenta,
  actualizarMiCuenta
};