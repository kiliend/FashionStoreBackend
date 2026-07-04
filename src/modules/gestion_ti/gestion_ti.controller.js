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

const listarIncidenciasTablero = async (req, res, next) => {
  try {
    const data = await service.listarIncidenciasTablero();
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

const obtenerIncidenciaDetalle = async (req, res, next) => {
  try {
    const data = await service.obtenerIncidenciaDetalle(req.params.id);
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

const moverIncidencia = async (req, res, next) => {
  try {
    const data = await service.moverIncidencia(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const editarIncidencia = async (req, res, next) => {
  try {
    const data = await service.editarIncidencia(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const agregarComentarioIncidencia = async (req, res, next) => {
  try {
    const data = await service.agregarComentarioIncidencia(
      req.params.id,
      req.body,
      req.user
    );
    res.status(201).json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const crearChecklistIncidencia = async (req, res, next) => {
  try {
    const data = await service.crearChecklistIncidencia(
      req.params.id,
      req.body,
      req.user
    );
    res.status(201).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const actualizarChecklistIncidencia = async (req, res, next) => {
  try {
    const data = await service.actualizarChecklistIncidencia(
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

const listarCambiosTablero = async (req, res, next) => {
  try {
    const data = await service.listarCambiosTablero();
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

const obtenerCambioDetalle = async (req, res, next) => {
  try {
    const data = await service.obtenerCambioDetalle(req.params.id);
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

const moverCambio = async (req, res, next) => {
  try {
    const data = await service.moverCambio(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const editarCambio = async (req, res, next) => {
  try {
    const data = await service.editarCambio(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const agregarComentarioCambio = async (req, res, next) => {
  try {
    const data = await service.agregarComentarioCambio(
      req.params.id,
      req.body,
      req.user
    );
    res.status(201).json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};

const crearChecklistCambio = async (req, res, next) => {
  try {
    const data = await service.crearChecklistCambio(
      req.params.id,
      req.body,
      req.user
    );
    res.status(201).json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const actualizarChecklistCambio = async (req, res, next) => {
  try {
    const data = await service.actualizarChecklistCambio(
      req.params.id,
      req.body,
      req.user
    );
    res.json({ ok: true, ...data });
  } catch (error) {
    next(error);
  }
};


const listarHistoricoGestionTi = async (req, res, next) => {
  try {
    const data = await service.listarHistoricoGestionTi(req.query);
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

const obtenerResumenHistoricoGestionTi = async (req, res, next) => {
  try {
    const data = await service.obtenerResumenHistoricoGestionTi(req.query);
    res.json({ ok: true, data });
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

const listarUsuariosAsignables = async (req, res, next) => {
  try {
    const data = await service.listarUsuariosAsignables();
    res.json({ ok: true, data });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  crearIncidencia,
  listarIncidencias,
  listarIncidenciasTablero,
  obtenerIncidenciaPorId,
  obtenerIncidenciaDetalle,
  actualizarEstadoIncidencia,
  moverIncidencia,
  editarIncidencia,
  agregarComentarioIncidencia,
  crearChecklistIncidencia,
  actualizarChecklistIncidencia,
  crearCambio,
  listarCambios,
  listarCambiosTablero,
  obtenerCambioPorId,
  obtenerCambioDetalle,
  actualizarEstadoCambio,
  moverCambio,
  editarCambio,
  agregarComentarioCambio,
  crearChecklistCambio,
  actualizarChecklistCambio,
  listarHistoricoGestionTi,
  obtenerResumenHistoricoGestionTi,
  obtenerMetricas,
  listarUsuariosAsignables
};
