const clientesRepository = require("./clientes.repository");

const TIPOS_DOCUMENTO_VALIDOS = ["DNI", "RUC", "CE", "PASAPORTE"];
const ESTADOS_CLIENTE_VALIDOS = ["activo", "inactivo"];

async function listarClientes() {
  return await clientesRepository.findAllClientes();
}

async function obtenerClientePorId(id_cliente) {
  const cliente = await clientesRepository.findClienteById(id_cliente);

  if (!cliente) {
    const error = new Error("Cliente no encontrado");
    error.status = 404;
    throw error;
  }

  return cliente;
}

async function crearCliente(data) {
  validarCliente(data);

  const clienteExistente = await clientesRepository.findClienteByDocumento(
    data.numero_documento
  );

  if (clienteExistente) {
    const error = new Error("Ya existe un cliente con ese número de documento");
    error.status = 409;
    throw error;
  }

  const nuevoCliente = prepararDatosCliente(data);

  const id_cliente = await clientesRepository.createCliente(nuevoCliente);

  return await clientesRepository.findClienteById(id_cliente);
}

async function actualizarCliente(id_cliente, data) {
  const clienteActual = await clientesRepository.findClienteById(id_cliente);

  if (!clienteActual) {
    const error = new Error("Cliente no encontrado");
    error.status = 404;
    throw error;
  }

  validarCliente(data);

  const clienteConDocumento = await clientesRepository.findClienteByDocumento(
    data.numero_documento
  );

  if (
    clienteConDocumento &&
    clienteConDocumento.id_cliente !== Number(id_cliente)
  ) {
    const error = new Error("El número de documento ya está registrado en otro cliente");
    error.status = 409;
    throw error;
  }

  const datosCliente = prepararDatosCliente(data);

  const affectedRows = await clientesRepository.updateCliente(id_cliente, datosCliente);

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el cliente");
    error.status = 400;
    throw error;
  }

  return await clientesRepository.findClienteById(id_cliente);
}

async function eliminarCliente(id_cliente) {
  const cliente = await clientesRepository.findClienteById(id_cliente);

  if (!cliente) {
    const error = new Error("Cliente no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await clientesRepository.deleteClienteLogical(id_cliente);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el cliente");
    error.status = 400;
    throw error;
  }

  return {
    id_cliente: Number(id_cliente),
    estado_visible: 0
  };
}

function validarCliente(data) {
  if (!data.tipo_documento || !TIPOS_DOCUMENTO_VALIDOS.includes(data.tipo_documento)) {
    const error = new Error("El tipo de documento debe ser DNI, RUC, CE o PASAPORTE");
    error.status = 400;
    throw error;
  }

  if (!data.numero_documento || data.numero_documento.trim() === "") {
    const error = new Error("El número de documento es obligatorio");
    error.status = 400;
    throw error;
  }

  if (
    data.estado_cliente &&
    !ESTADOS_CLIENTE_VALIDOS.includes(data.estado_cliente)
  ) {
    const error = new Error("El estado del cliente debe ser activo o inactivo");
    error.status = 400;
    throw error;
  }

  if (data.tipo_documento === "DNI" && data.numero_documento.trim().length !== 8) {
    const error = new Error("El DNI debe tener 8 dígitos");
    error.status = 400;
    throw error;
  }

  if (data.tipo_documento === "RUC" && data.numero_documento.trim().length !== 11) {
    const error = new Error("El RUC debe tener 11 dígitos");
    error.status = 400;
    throw error;
  }

  if (data.tipo_documento === "RUC") {
    if (!data.razon_social || data.razon_social.trim() === "") {
      const error = new Error("La razón social es obligatoria para clientes con RUC");
      error.status = 400;
      throw error;
    }
  } else {
    if (!data.nombres || data.nombres.trim() === "") {
      const error = new Error("Los nombres son obligatorios");
      error.status = 400;
      throw error;
    }
  }
}

function prepararDatosCliente(data) {
  return {
    id_usuario: data.id_usuario || null,
    tipo_documento: data.tipo_documento,
    numero_documento: data.numero_documento.trim(),
    nombres: data.nombres ? data.nombres.trim() : null,
    apellidos: data.apellidos ? data.apellidos.trim() : null,
    razon_social: data.razon_social ? data.razon_social.trim() : null,
    correo: data.correo ? data.correo.trim() : null,
    telefono: data.telefono ? data.telefono.trim() : null,
    direccion: data.direccion ? data.direccion.trim() : null,
    estado_cliente: data.estado_cliente || "activo"
  };
}

module.exports = {
  listarClientes,
  obtenerClientePorId,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};