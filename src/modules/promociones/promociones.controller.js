const promocionesService = require("./promociones.service");

async function listarPromociones(req, res, next) {
  try {
    const promociones = await promocionesService.listarPromociones();

    res.json({
      ok: true,
      message: "Promociones obtenidas correctamente",
      data: promociones
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerPromocion(req, res, next) {
  try {
    const { id } = req.params;

    const promocion = await promocionesService.obtenerPromocionPorId(id);

    res.json({
      ok: true,
      message: "Promoción obtenida correctamente",
      data: promocion
    });
  } catch (error) {
    next(error);
  }
}

async function crearPromocion(req, res, next) {
  try {
    const promocion = await promocionesService.crearPromocion(req.body);

    res.status(201).json({
      ok: true,
      message: "Promoción creada correctamente",
      data: promocion
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarPromocion(req, res, next) {
  try {
    const { id } = req.params;

    const promocion = await promocionesService.actualizarPromocion(id, req.body);

    res.json({
      ok: true,
      message: "Promoción actualizada correctamente",
      data: promocion
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarPromocion(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await promocionesService.eliminarPromocion(id);

    res.json({
      ok: true,
      message: "Promoción eliminada lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarPromociones,
  obtenerPromocion,
  crearPromocion,
  actualizarPromocion,
  eliminarPromocion
};