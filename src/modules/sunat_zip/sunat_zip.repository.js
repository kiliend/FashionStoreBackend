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
      descripcion_respuesta_sunat
    FROM comprobantes
    WHERE id_comprobante = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_comprobante]);
  return rows[0];
}

async function actualizarRutaZip(id_comprobante, ruta_zip) {
  const sql = `
    UPDATE comprobantes
    SET descripcion_respuesta_sunat = ?
    WHERE id_comprobante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    `ZIP generado en: ${ruta_zip}`,
    id_comprobante
  ]);

  return result.affectedRows;
}

module.exports = {
  findComprobanteById,
  actualizarRutaZip
};