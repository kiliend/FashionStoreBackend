const tareasService = require("./tareas.service");

async function listarTareas(req, res, next) {
  try {
    const tareas = await tareasService.listarTareas();

    res.json({
      ok: true,
      message: "Tareas obtenidas correctamente",
      data: tareas
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerTarea(req, res, next) {
  try {
    const { id } = req.params;

    const tarea = await tareasService.obtenerTareaPorId(id);

    res.json({
      ok: true,
      message: "Tarea obtenida correctamente",
      data: tarea
    });
  } catch (error) {
    next(error);
  }
}

async function crearTarea(req, res, next) {
  try {
    const tarea = await tareasService.crearTarea(req.body);

    res.status(201).json({
      ok: true,
      message: "Tarea creada correctamente",
      data: tarea
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarEstadoTarea(req, res, next) {
  try {
    const { id } = req.params;

    const tarea = await tareasService.actualizarEstadoTarea(id, req.body);

    res.json({
      ok: true,
      message: "Estado de tarea actualizado correctamente",
      data: tarea
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarTarea(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await tareasService.eliminarTarea(id);

    res.json({
      ok: true,
      message: "Tarea eliminada lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarTareas,
  obtenerTarea,
  crearTarea,
  actualizarEstadoTarea,
  eliminarTarea
};