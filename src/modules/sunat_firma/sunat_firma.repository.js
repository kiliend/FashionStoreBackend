const pool = require("../../config/db");

async function findComprobanteConParametros(id_comprobante) {
  const sql = `
    SELECT
      c.id_comprobante,
      c.nombre_xml,
      c.nombre_zip,
      c.estado_sunat,
      e.id_empresa,
      e.ruc,
      e.razon_social,
      ps.certificado_ruta,
      ps.certificado_password
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

async function actualizarXmlFirmado(id_comprobante, ruta_xml_firmado) {
  const sql = `
    UPDATE comprobantes
    SET descripcion_respuesta_sunat = ?
    WHERE id_comprobante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    `XML firmado en: ${ruta_xml_firmado}`,
    id_comprobante
  ]);

  return result.affectedRows;
}

module.exports = {
  findComprobanteConParametros,
  actualizarXmlFirmado
};