const combosService = require("./combos.service");

async function listarCombos(req, res, next) {
  try {
    const combos = await combosService.listarCombos();

    res.json({
      ok: true,
      message: "Combos obtenidos correctamente",
      data: combos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerCombo(req, res, next) {
  try {
    const { id } = req.params;

    const combo = await combosService.obtenerComboPorId(id);

    res.json({
      ok: true,
      message: "Combo obtenido correctamente",
      data: combo
    });
  } catch (error) {
    next(error);
  }
}

async function crearCombo(req, res, next) {
  try {
    const combo = await combosService.crearCombo(req.body);

    res.status(201).json({
      ok: true,
      message: "Combo creado correctamente",
      data: combo
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarCombo(req, res, next) {
  try {
    const { id } = req.params;

    const combo = await combosService.actualizarCombo(id, req.body);

    res.json({
      ok: true,
      message: "Combo actualizado correctamente",
      data: combo
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarCombo(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await combosService.eliminarCombo(id);

    res.json({
      ok: true,
      message: "Combo eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarCombos,
  obtenerCombo,
  crearCombo,
  actualizarCombo,
  eliminarCombo
};