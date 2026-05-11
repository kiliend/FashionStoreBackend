const pool = require("../../config/db");

async function findComprobanteCompleto(id_comprobante) {
  const comprobanteSql = `
    SELECT
      c.id_comprobante,
      c.id_venta,
      c.id_serie,
      c.tipo_comprobante,
      c.serie,
      c.correlativo,
      c.fecha_emision,
      c.moneda,
      c.subtotal,
      c.igv,
      c.descuento_total,
      c.total,
      c.estado_sunat,
      c.nombre_xml,
      c.nombre_zip,

      e.ruc AS empresa_ruc,
      e.razon_social AS empresa_razon_social,
      e.nombre_comercial AS empresa_nombre_comercial,
      e.direccion_fiscal AS empresa_direccion_fiscal,
      e.ubigeo AS empresa_ubigeo,
      e.departamento AS empresa_departamento,
      e.provincia AS empresa_provincia,
      e.distrito AS empresa_distrito,

      cli.tipo_documento AS cliente_tipo_documento,
      cli.numero_documento AS cliente_numero_documento,
      cli.nombres AS cliente_nombres,
      cli.apellidos AS cliente_apellidos,
      cli.razon_social AS cliente_razon_social

    FROM comprobantes c
    INNER JOIN series_comprobantes s ON c.id_serie = s.id_serie
    INNER JOIN empresa e ON s.id_empresa = e.id_empresa
    INNER JOIN ventas v ON c.id_venta = v.id_venta
    LEFT JOIN clientes cli ON v.id_cliente = cli.id_cliente
    WHERE c.id_comprobante = ?
    AND c.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      id_comprobante_detalle,
      id_variante,
      descripcion,
      cantidad,
      precio_unitario,
      descuento,
      valor_venta,
      igv,
      total
    FROM comprobante_detalle
    WHERE id_comprobante = ?
    AND estado_visible = 1
  `;

  const [comprobanteRows] = await pool.query(comprobanteSql, [id_comprobante]);

  if (comprobanteRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_comprobante]);

  return {
    ...comprobanteRows[0],
    detalles: detalleRows
  };
}

async function actualizarRutaXml(id_comprobante, ruta_xml) {
  const sql = `
    UPDATE comprobantes
    SET descripcion_respuesta_sunat = ?
    WHERE id_comprobante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    `XML generado en: ${ruta_xml}`,
    id_comprobante
  ]);

  return result.affectedRows;
}

module.exports = {
  findComprobanteCompleto,
  actualizarRutaXml
};