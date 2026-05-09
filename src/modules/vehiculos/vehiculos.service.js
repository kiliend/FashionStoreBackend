const vehiculosRepository = require("./vehiculos.repository");

const TIPOS_VEHICULO_VALIDOS = ["moto", "carro"];
const ESTADOS_VEHICULO_VALIDOS = [
  "disponible",
  "en_ruta",
  "mantenimiento",
  "inactivo"
];

async function listarVehiculos() {
  return await vehiculosRepository.findAllVehiculos();
}

async function obtenerVehiculoPorId(id_vehiculo) {
  const vehiculo = await vehiculosRepository.findVehiculoById(id_vehiculo);

  if (!vehiculo) {
    const error = new Error("Vehículo no encontrado");
    error.status = 404;
    throw error;
  }

  return vehiculo;
}

async function crearVehiculo(data) {
  validarVehiculo(data);

  const vehiculoExistente = await vehiculosRepository.findVehiculoByPlaca(data.placa);

  if (vehiculoExistente) {
    const error = new Error("Ya existe un vehículo con esa placa");
    error.status = 409;
    throw error;
  }

  const nuevoVehiculo = prepararDatosVehiculo(data);

  const id_vehiculo = await vehiculosRepository.createVehiculo(nuevoVehiculo);

  return await vehiculosRepository.findVehiculoById(id_vehiculo);
}

async function actualizarVehiculo(id_vehiculo, data) {
  const vehiculoActual = await vehiculosRepository.findVehiculoById(id_vehiculo);

  if (!vehiculoActual) {
    const error = new Error("Vehículo no encontrado");
    error.status = 404;
    throw error;
  }

  validarVehiculo(data);

  const vehiculoConPlaca = await vehiculosRepository.findVehiculoByPlaca(data.placa);

  if (
    vehiculoConPlaca &&
    vehiculoConPlaca.id_vehiculo !== Number(id_vehiculo)
  ) {
    const error = new Error("La placa ya está registrada en otro vehículo");
    error.status = 409;
    throw error;
  }

  const affectedRows = await vehiculosRepository.updateVehiculo(
    id_vehiculo,
    prepararDatosVehiculo(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el vehículo");
    error.status = 400;
    throw error;
  }

  return await vehiculosRepository.findVehiculoById(id_vehiculo);
}

async function eliminarVehiculo(id_vehiculo) {
  const vehiculo = await vehiculosRepository.findVehiculoById(id_vehiculo);

  if (!vehiculo) {
    const error = new Error("Vehículo no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await vehiculosRepository.deleteVehiculoLogical(id_vehiculo);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el vehículo");
    error.status = 400;
    throw error;
  }

  return {
    id_vehiculo: Number(id_vehiculo),
    estado_visible: 0
  };
}

function validarVehiculo(data) {
  if (!data.tipo_vehiculo || !TIPOS_VEHICULO_VALIDOS.includes(data.tipo_vehiculo)) {
    const error = new Error("El tipo de vehículo debe ser moto o carro");
    error.status = 400;
    throw error;
  }

  if (!data.placa || data.placa.trim() === "") {
    const error = new Error("La placa es obligatoria");
    error.status = 400;
    throw error;
  }

  if (
    data.estado_vehiculo &&
    !ESTADOS_VEHICULO_VALIDOS.includes(data.estado_vehiculo)
  ) {
    const error = new Error("Estado de vehículo no válido");
    error.status = 400;
    throw error;
  }
}

function prepararDatosVehiculo(data) {
  return {
    tipo_vehiculo: data.tipo_vehiculo,
    placa: data.placa.trim().toUpperCase(),
    marca: data.marca ? data.marca.trim() : null,
    modelo: data.modelo ? data.modelo.trim() : null,
    estado_vehiculo: data.estado_vehiculo || "disponible"
  };
}

module.exports = {
  listarVehiculos,
  obtenerVehiculoPorId,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo
};