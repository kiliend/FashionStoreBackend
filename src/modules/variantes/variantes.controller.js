const variantesService = require("./variantes.service");

async function listarVariantes(req, res, next) {
  try {
    const variantes = await variantesService.listarVariantes();

    res.json({
      ok: true,
      message: "Variantes obtenidas correctamente",
      data: variantes
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerVariante(req, res, next) {
  try {
    const { id } = req.params;

    const variante = await variantesService.obtenerVariantePorId(id);

    res.json({
      ok: true,
      message: "Variante obtenida correctamente",
      data: variante
    });
  } catch (error) {
    next(error);
  }
}

async function crearVariante(req, res, next) {
  try {
    const variante = await variantesService.crearVariante(req.body);

    res.status(201).json({
      ok: true,
      message: "Variante creada correctamente",
      data: variante
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarVariante(req, res, next) {
  try {
    const { id } = req.params;

    const variante = await variantesService.actualizarVariante(id, req.body);

    res.json({
      ok: true,
      message: "Variante actualizada correctamente",
      data: variante
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarVariante(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await variantesService.eliminarVariante(id);

    res.json({
      ok: true,
      message: "Variante eliminada lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarVariantes,
  obtenerVariante,
  crearVariante,
  actualizarVariante,
  eliminarVariante
};