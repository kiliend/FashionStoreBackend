const service = require("./gestion_ti.service");

const crearIncidencia = async (req, res, next) => {
  try {
    const resultado = await service.crearIncidencia(req.body, req.user);
    res.status(201).json({
      ok: true,
      message: "Incidencia registrada correctamente.",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

const listarIncidencias = async (req, res, next) => {
  try {
    const data = await service.listarIncidencias(req.query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const obtenerIncidenciaPorId = async (req, res, next) => {
  try {
    const data = await service.obtenerIncidenciaPorId(req.params.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const actualizarEstadoIncidencia = async (req, res, next) => {
  try {
    const data = await service.actualizarEstadoIncidencia(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const crearCambio = async (req, res, next) => {
  try {
    const resultado = await service.crearCambio(req.body, req.user);
    res.status(201).json({
      ok: true,
      message: "Cambio registrado correctamente.",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
};

const listarCambios = async (req, res, next) => {
  try {
    const data = await service.listarCambios(req.query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const obtenerCambioPorId = async (req, res, next) => {
  try {
    const data = await service.obtenerCambioPorId(req.params.id);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const actualizarEstadoCambio = async (req, res, next) => {
  try {
    const data = await service.actualizarEstadoCambio(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const obtenerMetricas = async (req, res, next) => {
  try {
    const data = await service.obtenerMetricas();
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  obtenerIncidenciaPorId,
  actualizarEstadoIncidencia,
  crearCambio,
  listarCambios,
  obtenerCambioPorId,
  actualizarEstadoCambio,
  obtenerMetricas
};