const sunatBaseRepository = require("./sunat_base.repository");

const AMBIENTES_VALIDOS = ["beta", "produccion"];
const TIPOS_COMPROBANTE_VALIDOS = ["01", "03", "07", "08"];

async function obtenerEmpresa() {
  const empresa = await sunatBaseRepository.findEmpresa();

  if (!empresa) {
    const error = new Error("No existe empresa configurada");
    error.status = 404;
    throw error;
  }

  return empresa;
}

async function crearEmpresa(data) {
  validarEmpresa(data);

  const empresaExistente = await sunatBaseRepository.findEmpresaByRuc(data.ruc);

  if (empresaExistente) {
    const error = new Error("Ya existe una empresa registrada con ese RUC");
    error.status = 409;
    throw error;
  }

  const nuevaEmpresa = prepararDatosEmpresa(data);

  const id_empresa = await sunatBaseRepository.createEmpresa(nuevaEmpresa);

  return await sunatBaseRepository.findEmpresaById(id_empresa);
}

async function actualizarEmpresa(id_empresa, data) {
  const empresaActual = await sunatBaseRepository.findEmpresaById(id_empresa);

  if (!empresaActual) {
    const error = new Error("Empresa no encontrada");
    error.status = 404;
    throw error;
  }

  validarEmpresa(data);

  const empresaConRuc = await sunatBaseRepository.findEmpresaByRuc(data.ruc);

  if (
    empresaConRuc &&
    empresaConRuc.id_empresa !== Number(id_empresa)
  ) {
    const error = new Error("El RUC ya está registrado en otra empresa");
    error.status = 409;
    throw error;
  }

  const affectedRows = await sunatBaseRepository.updateEmpresa(
    id_empresa,
    prepararDatosEmpresa(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la empresa");
    error.status = 400;
    throw error;
  }

  return await sunatBaseRepository.findEmpresaById(id_empresa);
}

function validarEmpresa(data) {
  if (!data.ruc || data.ruc.trim().length !== 11) {
    const error = new Error("El RUC debe tener 11 dígitos");
    error.status = 400;
    throw error;
  }

  if (!data.razon_social || data.razon_social.trim() === "") {
    const error = new Error("La razón social es obligatoria");
    error.status = 400;
    throw error;
  }
}

function prepararDatosEmpresa(data) {
  return {
    ruc: data.ruc.trim(),
    razon_social: data.razon_social.trim(),
    nombre_comercial: data.nombre_comercial ? data.nombre_comercial.trim() : null,
    direccion_fiscal: data.direccion_fiscal ? data.direccion_fiscal.trim() : null,
    ubigeo: data.ubigeo ? data.ubigeo.trim() : null,
    departamento: data.departamento ? data.departamento.trim() : null,
    provincia: data.provincia ? data.provincia.trim() : null,
    distrito: data.distrito ? data.distrito.trim() : null
  };
}

/* =========================
   PARAMETROS SUNAT
========================= */

async function obtenerParametros() {
  const parametros = await sunatBaseRepository.findParametros();

  if (!parametros) {
    const error = new Error("No existen parámetros SUNAT configurados");
    error.status = 404;
    throw error;
  }

  return parametros;
}

async function crearParametros(data) {
  await validarParametros(data);

  const nuevoParametro = prepararDatosParametros(data);

  const id_parametro_sunat = await sunatBaseRepository.createParametros(nuevoParametro);

  return await sunatBaseRepository.findParametrosById(id_parametro_sunat);
}

async function actualizarParametros(id_parametro_sunat, data) {
  const parametroActual = await sunatBaseRepository.findParametrosById(id_parametro_sunat);

  if (!parametroActual) {
    const error = new Error("Parámetro SUNAT no encontrado");
    error.status = 404;
    throw error;
  }

  await validarParametros(data);

  const affectedRows = await sunatBaseRepository.updateParametros(
    id_parametro_sunat,
    prepararDatosParametros(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar los parámetros SUNAT");
    error.status = 400;
    throw error;
  }

  return await sunatBaseRepository.findParametrosById(id_parametro_sunat);
}

async function validarParametros(data) {
  if (!data.id_empresa) {
    const error = new Error("La empresa es obligatoria");
    error.status = 400;
    throw error;
  }

  const empresa = await sunatBaseRepository.findEmpresaById(data.id_empresa);

  if (!empresa) {
    const error = new Error("La empresa seleccionada no existe");
    error.status = 400;
    throw error;
  }

  if (!data.ambiente || !AMBIENTES_VALIDOS.includes(data.ambiente)) {
    const error = new Error("El ambiente debe ser beta o produccion");
    error.status = 400;
    throw error;
  }

  if (!data.usuario_sol || data.usuario_sol.trim() === "") {
    const error = new Error("El usuario SOL es obligatorio");
    error.status = 400;
    throw error;
  }

  if (!data.clave_sol || data.clave_sol.trim() === "") {
    const error = new Error("La clave SOL es obligatoria");
    error.status = 400;
    throw error;
  }
}

function prepararDatosParametros(data) {
  return {
    id_empresa: Number(data.id_empresa),
    ambiente: data.ambiente,
    usuario_sol: data.usuario_sol.trim(),
    clave_sol: data.clave_sol.trim(),
    certificado_ruta: data.certificado_ruta ? data.certificado_ruta.trim() : null,
    certificado_password: data.certificado_password ? data.certificado_password.trim() : null,
    endpoint_factura: data.endpoint_factura ? data.endpoint_factura.trim() : null,
    endpoint_guia: data.endpoint_guia ? data.endpoint_guia.trim() : null,
    endpoint_consulta: data.endpoint_consulta ? data.endpoint_consulta.trim() : null
  };
}

/* =========================
   SERIES
========================= */

async function listarSeries() {
  return await sunatBaseRepository.findAllSeries();
}

async function crearSerie(data) {
  await validarSerie(data);

  const serieDuplicada = await sunatBaseRepository.findSerieDuplicada(
    data.tipo_comprobante,
    data.serie
  );

  if (serieDuplicada) {
    const error = new Error("Ya existe una serie registrada para ese tipo de comprobante");
    error.status = 409;
    throw error;
  }

  const nuevaSerie = prepararDatosSerie(data);

  const id_serie = await sunatBaseRepository.createSerie(nuevaSerie);

  return await sunatBaseRepository.findSerieById(id_serie);
}

async function actualizarSerie(id_serie, data) {
  const serieActual = await sunatBaseRepository.findSerieById(id_serie);

  if (!serieActual) {
    const error = new Error("Serie no encontrada");
    error.status = 404;
    throw error;
  }

  await validarSerie(data);

  const serieDuplicada = await sunatBaseRepository.findSerieDuplicada(
    data.tipo_comprobante,
    data.serie
  );

  if (
    serieDuplicada &&
    serieDuplicada.id_serie !== Number(id_serie)
  ) {
    const error = new Error("La serie ya está registrada en otro comprobante");
    error.status = 409;
    throw error;
  }

  const affectedRows = await sunatBaseRepository.updateSerie(
    id_serie,
    prepararDatosSerie(data)
  );

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar la serie");
    error.status = 400;
    throw error;
  }

  return await sunatBaseRepository.findSerieById(id_serie);
}

async function validarSerie(data) {
  if (!data.id_empresa) {
    const error = new Error("La empresa es obligatoria");
    error.status = 400;
    throw error;
  }

  const empresa = await sunatBaseRepository.findEmpresaById(data.id_empresa);

  if (!empresa) {
    const error = new Error("La empresa seleccionada no existe");
    error.status = 400;
    throw error;
  }

  if (
    !data.tipo_comprobante ||
    !TIPOS_COMPROBANTE_VALIDOS.includes(data.tipo_comprobante)
  ) {
    const error = new Error("Tipo de comprobante no válido");
    error.status = 400;
    throw error;
  }

  if (!data.serie || data.serie.trim().length !== 4) {
    const error = new Error("La serie debe tener 4 caracteres");
    error.status = 400;
    throw error;
  }

  if (data.tipo_comprobante === "01" && !data.serie.startsWith("F")) {
    const error = new Error("La serie de factura debe iniciar con F");
    error.status = 400;
    throw error;
  }

  if (data.tipo_comprobante === "03" && !data.serie.startsWith("B")) {
    const error = new Error("La serie de boleta debe iniciar con B");
    error.status = 400;
    throw error;
  }

  if (data.correlativo_actual !== undefined && Number(data.correlativo_actual) < 0) {
    const error = new Error("El correlativo actual no puede ser negativo");
    error.status = 400;
    throw error;
  }
}

function prepararDatosSerie(data) {
  return {
    id_empresa: Number(data.id_empresa),
    tipo_comprobante: data.tipo_comprobante,
    serie: data.serie.trim().toUpperCase(),
    correlativo_actual: Number(data.correlativo_actual || 0)
  };
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