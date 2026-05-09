const devolucionesService = require("./devoluciones.service");

async function listarDevoluciones(req, res, next) {
  try {
    const devoluciones = await devolucionesService.listarDevoluciones();

    res.json({
      ok: true,
      message: "Devoluciones obtenidas correctamente",
      data: devoluciones
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerDevolucion(req, res, next) {
  try {
    const { id } = req.params;

    const devolucion = await devolucionesService.obtenerDevolucionPorId(id);

    res.json({
      ok: true,
      message: "Devolución obtenida correctamente",
      data: devolucion
    });
  } catch (error) {
    next(error);
  }
}

async function crearDevolucion(req, res, next) {
  try {
    const devolucion = await devolucionesService.crearDevolucion(req.body, req.user);

    res.status(201).json({
      ok: true,
      message: "Devolución registrada correctamente",
      data: devolucion
    });
  } catch (error) {
    next(error);
  }
}

async function procesarDevolucion(req, res, next) {
  try {
    const { id } = req.params;

    const devolucion = await devolucionesService.procesarDevolucion(id, req.user);

    res.json({
      ok: true,
      message: "Devolución procesada correctamente",
      data: devolucion
    });
  } catch (error) {
    next(error);
  }
}

async function rechazarDevolucion(req, res, next) {
  try {
    const { id } = req.params;

    const devolucion = await devolucionesService.rechazarDevolucion(id, req.user);

    res.json({
      ok: true,
      message: "Devolución rechazada correctamente",
      data: devolucion
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarDevoluciones,
  obtenerDevolucion,
  crearDevolucion,
  procesarDevolucion,
  rechazarDevolucion
};