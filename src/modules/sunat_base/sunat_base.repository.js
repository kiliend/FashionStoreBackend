const pool = require("../../config/db");

/* =========================
   EMPRESA
========================= */

async function findEmpresa() {
  const sql = `
    SELECT
      id_empresa,
      ruc,
      razon_social,
      nombre_comercial,
      direccion_fiscal,
      ubigeo,
      departamento,
      provincia,
      distrito
    FROM empresa
    WHERE estado_visible = 1
    ORDER BY id_empresa DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql);
  return rows[0];
}

async function findEmpresaById(id_empresa) {
  const sql = `
    SELECT
      id_empresa,
      ruc,
      razon_social,
      nombre_comercial,
      direccion_fiscal,
      ubigeo,
      departamento,
      provincia,
      distrito
    FROM empresa
    WHERE id_empresa = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_empresa]);
  return rows[0];
}

async function findEmpresaByRuc(ruc) {
  const sql = `
    SELECT id_empresa, ruc
    FROM empresa
    WHERE ruc = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [ruc]);
  return rows[0];
}

async function createEmpresa(data) {
  const sql = `
    INSERT INTO empresa
    (
      ruc,
      razon_social,
      nombre_comercial,
      direccion_fiscal,
      ubigeo,
      departamento,
      provincia,
      distrito,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.ruc,
    data.razon_social,
    data.nombre_comercial,
    data.direccion_fiscal,
    data.ubigeo,
    data.departamento,
    data.provincia,
    data.distrito
  ]);

  return result.insertId;
}

async function updateEmpresa(id_empresa, data) {
  const sql = `
    UPDATE empresa
    SET
      ruc = ?,
      razon_social = ?,
      nombre_comercial = ?,
      direccion_fiscal = ?,
      ubigeo = ?,
      departamento = ?,
      provincia = ?,
      distrito = ?
    WHERE id_empresa = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.ruc,
    data.razon_social,
    data.nombre_comercial,
    data.direccion_fiscal,
    data.ubigeo,
    data.departamento,
    data.provincia,
    data.distrito,
    id_empresa
  ]);

  return result.affectedRows;
}

/* =========================
   PARAMETROS SUNAT
========================= */

async function findParametros() {
  const sql = `
    SELECT
      ps.id_parametro_sunat,
      ps.id_empresa,
      e.ruc,
      e.razon_social,
      ps.ambiente,
      ps.usuario_sol,
      ps.clave_sol,
      ps.certificado_ruta,
      ps.certificado_password,
      ps.endpoint_factura,
      ps.endpoint_guia,
      ps.endpoint_consulta
    FROM parametros_sunat ps
    INNER JOIN empresa e ON ps.id_empresa = e.id_empresa
    WHERE ps.estado_visible = 1
    ORDER BY ps.id_parametro_sunat DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql);
  return rows[0];
}

async function findParametrosById(id_parametro_sunat) {
  const sql = `
    SELECT
      id_parametro_sunat,
      id_empresa,
      ambiente,
      usuario_sol,
      clave_sol,
      certificado_ruta,
      certificado_password,
      endpoint_factura,
      endpoint_guia,
      endpoint_consulta
    FROM parametros_sunat
    WHERE id_parametro_sunat = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_parametro_sunat]);
  return rows[0];
}

async function createParametros(data) {
  const sql = `
    INSERT INTO parametros_sunat
    (
      id_empresa,
      ambiente,
      usuario_sol,
      clave_sol,
      certificado_ruta,
      certificado_password,
      endpoint_factura,
      endpoint_guia,
      endpoint_consulta,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_empresa,
    data.ambiente,
    data.usuario_sol,
    data.clave_sol,
    data.certificado_ruta,
    data.certificado_password,
    data.endpoint_factura,
    data.endpoint_guia,
    data.endpoint_consulta
  ]);

  return result.insertId;
}

async function updateParametros(id_parametro_sunat, data) {
  const sql = `
    UPDATE parametros_sunat
    SET
      id_empresa = ?,
      ambiente = ?,
      usuario_sol = ?,
      clave_sol = ?,
      certificado_ruta = ?,
      certificado_password = ?,
      endpoint_factura = ?,
      endpoint_guia = ?,
      endpoint_consulta = ?
    WHERE id_parametro_sunat = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_empresa,
    data.ambiente,
    data.usuario_sol,
    data.clave_sol,
    data.certificado_ruta,
    data.certificado_password,
    data.endpoint_factura,
    data.endpoint_guia,
    data.endpoint_consulta,
    id_parametro_sunat
  ]);

  return result.affectedRows;
}

/* =========================
   SERIES
========================= */

async function findAllSeries() {
  const sql = `
    SELECT
      s.id_serie,
      s.id_empresa,
      e.ruc,
      e.razon_social,
      s.tipo_comprobante,
      s.serie,
      s.correlativo_actual
    FROM series_comprobantes s
    INNER JOIN empresa e ON s.id_empresa = e.id_empresa
    WHERE s.estado_visible = 1
    ORDER BY s.id_serie DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findSerieById(id_serie) {
  const sql = `
    SELECT
      id_serie,
      id_empresa,
      tipo_comprobante,
      serie,
      correlativo_actual
    FROM series_comprobantes
    WHERE id_serie = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_serie]);
  return rows[0];
}

async function findSerieDuplicada(tipo_comprobante, serie) {
  const sql = `
    SELECT id_serie
    FROM series_comprobantes
    WHERE tipo_comprobante = ?
    AND serie = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [tipo_comprobante, serie]);
  return rows[0];
}

async function createSerie(data) {
  const sql = `
    INSERT INTO series_comprobantes
    (
      id_empresa,
      tipo_comprobante,
      serie,
      correlativo_actual,
      estado_visible
    )
    VALUES (?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_empresa,
    data.tipo_comprobante,
    data.serie,
    data.correlativo_actual || 0
  ]);

  return result.insertId;
}

async function updateSerie(id_serie, data) {
  const sql = `
    UPDATE series_comprobantes
    SET
      id_empresa = ?,
      tipo_comprobante = ?,
      serie = ?,
      correlativo_actual = ?
    WHERE id_serie = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_empresa,
    data.tipo_comprobante,
    data.serie,
    data.correlativo_actual,
    id_serie
  ]);

  return result.affectedRows;
}

module.exports = {
  findEmpresa,
  findEmpresaById,
  findEmpresaByRuc,
  createEmpresa,
  updateEmpresa,

  findParametros,
  findParametrosById,
  createParametros,
  updateParametros,

  findAllSeries,
  findSerieById,
  findSerieDuplicada,
  createSerie,
  updateSerie
};