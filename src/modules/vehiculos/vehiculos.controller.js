const vehiculosService = require("./vehiculos.service");

async function listarVehiculos(req, res, next) {
  try {
    const vehiculos = await vehiculosService.listarVehiculos();

    res.json({
      ok: true,
      message: "Vehículos obtenidos correctamente",
      data: vehiculos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerVehiculo(req, res, next) {
  try {
    const { id } = req.params;

    const vehiculo = await vehiculosService.obtenerVehiculoPorId(id);

    res.json({
      ok: true,
      message: "Vehículo obtenido correctamente",
      data: vehiculo
    });
  } catch (error) {
    next(error);
  }
}

async function crearVehiculo(req, res, next) {
  try {
    const vehiculo = await vehiculosService.crearVehiculo(req.body);

    res.status(201).json({
      ok: true,
      message: "Vehículo creado correctamente",
      data: vehiculo
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarVehiculo(req, res, next) {
  try {
    const { id } = req.params;

    const vehiculo = await vehiculosService.actualizarVehiculo(id, req.body);

    res.json({
      ok: true,
      message: "Vehículo actualizado correctamente",
      data: vehiculo
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarVehiculo(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await vehiculosService.eliminarVehiculo(id);

    res.json({
      ok: true,
      message: "Vehículo eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarVehiculos,
  obtenerVehiculo,
  crearVehiculo,
  actualizarVehiculo,
  eliminarVehiculo
};