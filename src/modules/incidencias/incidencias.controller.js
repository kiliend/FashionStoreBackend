const incidenciasService = require("./incidencias.service");

async function listarIncidencias(req, res, next) {
  try {
    const incidencias = await incidenciasService.listarIncidencias();

    res.json({
      ok: true,
      message: "Incidencias obtenidas correctamente",
      data: incidencias
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerIncidencia(req, res, next) {
  try {
    const { id } = req.params;

    const incidencia = await incidenciasService.obtenerIncidenciaPorId(id);

    res.json({
      ok: true,
      message: "Incidencia obtenida correctamente",
      data: incidencia
    });
  } catch (error) {
    next(error);
  }
}

async function crearIncidencia(req, res, next) {
  try {
    const incidencia = await incidenciasService.crearIncidencia(req.body, req.user);

    res.status(201).json({
      ok: true,
      message: "Incidencia registrada correctamente",
      data: incidencia
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarEstadoIncidencia(req, res, next) {
  try {
    const { id } = req.params;

    const incidencia = await incidenciasService.actualizarEstadoIncidencia(
      id,
      req.body,
      req.user
    );

    res.json({
      ok: true,
      message: "Estado de incidencia actualizado correctamente",
      data: incidencia
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarIncidencias,
  obtenerIncidencia,
  crearIncidencia,
  actualizarEstadoIncidencia
};