const pool = require("../../config/db");

async function findComprobanteById(id_comprobante) {
  const sql = `
    SELECT
      id_comprobante,
      tipo_comprobante,
      serie,
      correlativo,
      estado_sunat,
      nombre_xml,
      nombre_zip,
      codigo_respuesta_sunat,
      descripcion_respuesta_sunat
    FROM comprobantes
    WHERE id_comprobante = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_comprobante]);
  return rows[0];
}

async function findUltimoEnvioByComprobante(id_comprobante) {
  const sql = `
    SELECT
      id_envio,
      id_comprobante,
      metodo_envio,
      nombre_archivo,
      fecha_envio,
      ticket_sunat,
      estado_envio,
      mensaje_error
    FROM sunat_envios
    WHERE id_comprobante = ?
    AND estado_visible = 1
    ORDER BY id_envio DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_comprobante]);
  return rows[0];
}

async function findCdrByEnvio(id_envio) {
  const sql = `
    SELECT
      id_cdr,
      id_envio,
      codigo_respuesta,
      descripcion_respuesta,
      estado_cdr,
      nombre_cdr,
      ruta_cdr,
      fecha_recepcion,
      observaciones
    FROM sunat_cdr
    WHERE id_envio = ?
    AND estado_visible = 1
    ORDER BY id_cdr DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_envio]);
  return rows[0];
}

async function updateCdr(id_cdr, data) {
  const sql = `
    UPDATE sunat_cdr
    SET
      codigo_respuesta = ?,
      descripcion_respuesta = ?,
      estado_cdr = ?,
      observaciones = ?,
      fecha_recepcion = NOW()
    WHERE id_cdr = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.codigo_respuesta,
    data.descripcion_respuesta,
    data.estado_cdr,
    data.observaciones,
    id_cdr
  ]);

  return result.affectedRows;
}

async function updateComprobanteSunat(id_comprobante, data) {
  const sql = `
    UPDATE comprobantes
    SET
      estado_sunat = ?,
      codigo_respuesta_sunat = ?,
      descripcion_respuesta_sunat = ?
    WHERE id_comprobante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.estado_sunat,
    data.codigo_respuesta_sunat,
    data.descripcion_respuesta_sunat,
    id_comprobante
  ]);

  return result.affectedRows;
}

async function updateEnvioProcesado(id_envio) {
  const sql = `
    UPDATE sunat_envios
    SET estado_envio = 'procesado'
    WHERE id_envio = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_envio]);
  return result.affectedRows;
}

module.exports = {
  findComprobanteById,
  findUltimoEnvioByComprobante,
  findCdrByEnvio,
  updateCdr,
  updateComprobanteSunat,
  updateEnvioProcesado
};