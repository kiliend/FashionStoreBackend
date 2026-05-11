const sunatBaseService = require("./sunat_base.service");

/* =========================
   EMPRESA
========================= */

async function obtenerEmpresa(req, res, next) {
  try {
    const empresa = await sunatBaseService.obtenerEmpresa();

    res.json({
      ok: true,
      message: "Empresa obtenida correctamente",
      data: empresa
    });
  } catch (error) {
    next(error);
  }
}

async function crearEmpresa(req, res, next) {
  try {
    const empresa = await sunatBaseService.crearEmpresa(req.body);

    res.status(201).json({
      ok: true,
      message: "Empresa creada correctamente",
      data: empresa
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarEmpresa(req, res, next) {
  try {
    const { id } = req.params;

    const empresa = await sunatBaseService.actualizarEmpresa(id, req.body);

    res.json({
      ok: true,
      message: "Empresa actualizada correctamente",
      data: empresa
    });
  } catch (error) {
    next(error);
  }
}

/* =========================
   PARAMETROS SUNAT
========================= */

async function obtenerParametros(req, res, next) {
  try {
    const parametros = await sunatBaseService.obtenerParametros();

    res.json({
      ok: true,
      message: "Parámetros SUNAT obtenidos correctamente",
      data: parametros
    });
  } catch (error) {
    next(error);
  }
}

async function crearParametros(req, res, next) {
  try {
    const parametros = await sunatBaseService.crearParametros(req.body);

    res.status(201).json({
      ok: true,
      message: "Parámetros SUNAT creados correctamente",
      data: parametros
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarParametros(req, res, next) {
  try {
    const { id } = req.params;

    const parametros = await sunatBaseService.actualizarParametros(id, req.body);

    res.json({
      ok: true,
      message: "Parámetros SUNAT actualizados correctamente",
      data: parametros
    });
  } catch (error) {
    next(error);
  }
}

/* =========================
   SERIES
========================= */

async function listarSeries(req, res, next) {
  try {
    const series = await sunatBaseService.listarSeries();

    res.json({
      ok: true,
      message: "Series obtenidas correctamente",
      data: series
    });
  } catch (error) {
    next(error);
  }
}

async function crearSerie(req, res, next) {
  try {
    const serie = await sunatBaseService.crearSerie(req.body);

    res.status(201).json({
      ok: true,
      message: "Serie creada correctamente",
      data: serie
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarSerie(req, res, next) {
  try {
    const { id } = req.params;

    const serie = await sunatBaseService.actualizarSerie(id, req.body);

    res.json({
      ok: true,
      message: "Serie actualizada correctamente",
      data: serie
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerEmpresa,
  crearEmpresa,
  actualizarEmpresa,

  obtenerParametros,
  crearParametros,
  actualizarParametros,

  listarSeries,
  crearSerie,
  actualizarSerie
};