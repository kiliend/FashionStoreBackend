const repartosService = require("./repartos.service");

async function listarRepartos(req, res, next) {
  try {
    const repartos = await repartosService.listarRepartos();

    res.json({
      ok: true,
      message: "Repartos obtenidos correctamente",
      data: repartos
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerReparto(req, res, next) {
  try {
    const { id } = req.params;

    const reparto = await repartosService.obtenerRepartoPorId(id);

    res.json({
      ok: true,
      message: "Reparto obtenido correctamente",
      data: reparto
    });
  } catch (error) {
    next(error);
  }
}

async function crearReparto(req, res, next) {
  try {
    const reparto = await repartosService.crearReparto(req.body);

    res.status(201).json({
      ok: true,
      message: "Reparto creado correctamente",
      data: reparto
    });
  } catch (error) {
    next(error);
  }
}

async function marcarSalida(req, res, next) {
  try {
    const { id } = req.params;

    const reparto = await repartosService.marcarSalida(id);

    res.json({
      ok: true,
      message: "Salida de reparto registrada correctamente",
      data: reparto
    });
  } catch (error) {
    next(error);
  }
}

async function entregarReparto(req, res, next) {
  try {
    const { id } = req.params;

    const reparto = await repartosService.entregarReparto(id, req.body);

    res.json({
      ok: true,
      message: "Entrega registrada correctamente",
      data: reparto
    });
  } catch (error) {
    next(error);
  }
}

async function marcarFallido(req, res, next) {
  try {
    const { id } = req.params;

    const reparto = await repartosService.marcarFallido(id, req.body);

    res.json({
      ok: true,
      message: "Reparto marcado como fallido correctamente",
      data: reparto
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarRepartos,
  obtenerReparto,
  crearReparto,
  marcarSalida,
  entregarReparto,
  marcarFallido
};