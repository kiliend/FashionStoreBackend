const tallasService = require("./tallas.service");

async function listarTallas(req, res, next) {
  try {
    const tallas = await tallasService.listarTallas();

    res.json({
      ok: true,
      message: "Tallas obtenidas correctamente",
      data: tallas
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerTalla(req, res, next) {
  try {
    const { id } = req.params;

    const talla = await tallasService.obtenerTallaPorId(id);

    res.json({
      ok: true,
      message: "Talla obtenida correctamente",
      data: talla
    });
  } catch (error) {
    next(error);
  }
}

async function crearTalla(req, res, next) {
  try {
    const talla = await tallasService.crearTalla(req.body);

    res.status(201).json({
      ok: true,
      message: "Talla creada correctamente",
      data: talla
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarTalla(req, res, next) {
  try {
    const { id } = req.params;

    const talla = await tallasService.actualizarTalla(id, req.body);

    res.json({
      ok: true,
      message: "Talla actualizada correctamente",
      data: talla
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarTalla(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await tallasService.eliminarTalla(id);

    res.json({
      ok: true,
      message: "Talla eliminada lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarTallas,
  obtenerTalla,
  crearTalla,
  actualizarTalla,
  eliminarTalla
};