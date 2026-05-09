const proveedoresRepository = require("./proveedores.repository");

const ESTADOS_PROVEEDOR_VALIDOS = ["activo", "inactivo"];

async function listarProveedores() {
  return await proveedoresRepository.findAllProveedores();
}

async function obtenerProveedorPorId(id_proveedor) {
  const proveedor = await proveedoresRepository.findProveedorById(id_proveedor);

  if (!proveedor) {
    const error = new Error("Proveedor no encontrado");
    error.status = 404;
    throw error;
  }

  return proveedor;
}

async function crearProveedor(data) {
  validarProveedor(data);

  const proveedorExistente = await proveedoresRepository.findProveedorByRuc(data.ruc);

  if (proveedorExistente) {
    const error = new Error("Ya existe un proveedor con ese RUC");
    error.status = 409;
    throw error;
  }

  const nuevoProveedor = prepararDatosProveedor(data);

  const id_proveedor = await proveedoresRepository.createProveedor(nuevoProveedor);

  return await proveedoresRepository.findProveedorById(id_proveedor);
}

async function actualizarProveedor(id_proveedor, data) {
  const proveedorActual = await proveedoresRepository.findProveedorById(id_proveedor);

  if (!proveedorActual) {
    const error = new Error("Proveedor no encontrado");
    error.status = 404;
    throw error;
  }

  validarProveedor(data);

  const proveedorConRuc = await proveedoresRepository.findProveedorByRuc(data.ruc);

  if (
    proveedorConRuc &&
    proveedorConRuc.id_proveedor !== Number(id_proveedor)
  ) {
    const error = new Error("El RUC ya está registrado en otro proveedor");
    error.status = 409;
    throw error;
  }

  const affectedRows = await proveedoresRepository.updateProveedor(
    id_proveedor,
    prepararDatosProveedor(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el proveedor");
    error.status = 400;
    throw error;
  }

  return await proveedoresRepository.findProveedorById(id_proveedor);
}

async function eliminarProveedor(id_proveedor) {
  const proveedor = await proveedoresRepository.findProveedorById(id_proveedor);

  if (!proveedor) {
    const error = new Error("Proveedor no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await proveedoresRepository.deleteProveedorLogical(id_proveedor);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el proveedor");
    error.status = 400;
    throw error;
  }

  return {
    id_proveedor: Number(id_proveedor),
    estado_visible: 0
  };
}

function validarProveedor(data) {
  if (!data.razon_social || data.razon_social.trim() === "") {
    const error = new Error("La razón social es obligatoria");
    error.status = 400;
    throw error;
  }

  if (!data.ruc || data.ruc.trim().length !== 11) {
    const error = new Error("El RUC debe tener 11 dígitos");
    error.status = 400;
    throw error;
  }

  if (
    data.estado_proveedor &&
    !ESTADOS_PROVEEDOR_VALIDOS.includes(data.estado_proveedor)
  ) {
    const error = new Error("El estado del proveedor debe ser activo o inactivo");
    error.status = 400;
    throw error;
  }
}

function prepararDatosProveedor(data) {
  return {
    razon_social: data.razon_social.trim(),
    ruc: data.ruc.trim(),
    telefono: data.telefono ? data.telefono.trim() : null,
    correo: data.correo ? data.correo.trim() : null,
    direccion: data.direccion ? data.direccion.trim() : null,
    estado_proveedor: data.estado_proveedor || "activo"
  };
}

module.exports = {
  listarProveedores,
  obtenerProveedorPorId,
  crearProveedor,
  actualizarProveedor,
  eliminarProveedor
};