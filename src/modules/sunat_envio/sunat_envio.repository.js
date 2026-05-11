const pool = require("../../config/db");

async function findComprobanteParaEnvio(id_comprobante) {
  const sql = `
    SELECT
      c.id_comprobante,
      c.tipo_comprobante,
      c.serie,
      c.correlativo,
      c.estado_sunat,
      c.nombre_xml,
      c.nombre_zip,

      e.id_empresa,
      e.ruc,
      e.razon_social,

      ps.ambiente,
      ps.usuario_sol,
      ps.clave_sol,
      ps.endpoint_factura
    FROM comprobantes c
    INNER JOIN series_comprobantes s ON c.id_serie = s.id_serie
    INNER JOIN empresa e ON s.id_empresa = e.id_empresa
    INNER JOIN parametros_sunat ps ON ps.id_empresa = e.id_empresa
    WHERE c.id_comprobante = ?
    AND c.estado_visible = 1
    AND ps.estado_visible = 1
    ORDER BY ps.id_parametro_sunat DESC
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_comprobante]);
  return rows[0];
}

async function crearEnvio(data) {
  const sql = `
    INSERT INTO sunat_envios
    (
      id_comprobante,
      metodo_envio,
      nombre_archivo,
      ticket_sunat,
      estado_envio,
      mensaje_error,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_comprobante,
    data.metodo_envio,
    data.nombre_archivo,
    data.ticket_sunat || null,
    data.estado_envio || "pendiente",
    data.mensaje_error || null
  ]);

  return result.insertId;
}

async function actualizarEnvio(id_envio, data) {
  const sql = `
    UPDATE sunat_envios
    SET
      estado_envio = ?,
      ticket_sunat = ?,
      mensaje_error = ?
    WHERE id_envio = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.estado_envio,
    data.ticket_sunat || null,
    data.mensaje_error || null,
    id_envio
  ]);

  return result.affectedRows;
}

async function crearCdr(data) {
  const sql = `
    INSERT INTO sunat_cdr
    (
      id_envio,
      codigo_respuesta,
      descripcion_respuesta,
      estado_cdr,
      nombre_cdr,
      ruta_cdr,
      fecha_recepcion,
      observaciones,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, NOW(), ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_envio,
    data.codigo_respuesta || null,
    data.descripcion_respuesta || null,
    data.estado_cdr || "observado",
    data.nombre_cdr || null,
    data.ruta_cdr || null,
    data.observaciones || null
  ]);

  return result.insertId;
}

async function actualizarComprobanteSunat(id_comprobante, data) {
  const sql = `
    UPDATE comprobantes
    SET
      estado_sunat = ?,
      ticket_sunat = ?,
      codigo_respuesta_sunat = ?,
      descripcion_respuesta_sunat = ?
    WHERE id_comprobante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.estado_sunat,
    data.ticket_sunat || null,
    data.codigo_respuesta_sunat || null,
    data.descripcion_respuesta_sunat || null,
    id_comprobante
  ]);

  return result.affectedRows;
}

module.exports = {
  findComprobanteParaEnvio,
  crearEnvio,
  actualizarEnvio,
  crearCdr,
  actualizarComprobanteSunat
};