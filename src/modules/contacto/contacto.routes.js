const contactoService = require("./contacto.service");

async function listarMensajes(req, res, next) {
  try {
    const mensajes = await contactoService.listarMensajes();

    res.json({
      ok: true,
      message: "Mensajes obtenidos correctamente",
      data: mensajes
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerMensaje(req, res, next) {
  try {
    const { id } = req.params;

    const mensaje = await contactoService.obtenerMensajePorId(id);

    res.json({
      ok: true,
      message: "Mensaje obtenido correctamente",
      data: mensaje
    });
  } catch (error) {
    next(error);
  }
}

async function crearMensaje(req, res, next) {
  try {
    const mensaje = await contactoService.crearMensaje(req.body);

    res.status(201).json({
      ok: true,
      message: "Mensaje registrado correctamente",
      data: mensaje
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarEstadoMensaje(req, res, next) {
  try {
    const { id } = req.params;

    const mensaje = await contactoService.actualizarEstadoMensaje(id, req.body);

    res.json({
      ok: true,
      message: "Estado del mensaje actualizado correctamente",
      data: mensaje
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarMensaje(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await contactoService.eliminarMensaje(id);

    res.json({
      ok: true,
      message: "Mensaje eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarMensajes,
  obtenerMensaje,
  crearMensaje,
  actualizarEstadoMensaje,
  eliminarMensaje
};