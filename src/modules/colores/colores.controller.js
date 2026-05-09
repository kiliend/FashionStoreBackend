const coloresService = require("./colores.service");

async function listarColores(req, res, next) {
  try {
    const colores = await coloresService.listarColores();

    res.json({
      ok: true,
      message: "Colores obtenidos correctamente",
      data: colores
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerColor(req, res, next) {
  try {
    const { id } = req.params;

    const color = await coloresService.obtenerColorPorId(id);

    res.json({
      ok: true,
      message: "Color obtenido correctamente",
      data: color
    });
  } catch (error) {
    next(error);
  }
}

async function crearColor(req, res, next) {
  try {
    const color = await coloresService.crearColor(req.body);

    res.status(201).json({
      ok: true,
      message: "Color creado correctamente",
      data: color
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarColor(req, res, next) {
  try {
    const { id } = req.params;

    const color = await coloresService.actualizarColor(id, req.body);

    res.json({
      ok: true,
      message: "Color actualizado correctamente",
      data: color
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarColor(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await coloresService.eliminarColor(id);

    res.json({
      ok: true,
      message: "Color eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarColores,
  obtenerColor,
  crearColor,
  actualizarColor,
  eliminarColor
};