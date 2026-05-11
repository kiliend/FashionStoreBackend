const pool = require("../../config/db");

async function findAllComprobantes() {
  const sql = `
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
      c.ticket_sunat,
      c.codigo_respuesta_sunat,
      c.descripcion_respuesta_sunat
    FROM comprobantes c
    WHERE c.estado_visible = 1
    ORDER BY c.id_comprobante DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findComprobanteById(id_comprobante) {
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
      c.ticket_sunat,
      c.codigo_respuesta_sunat,
      c.descripcion_respuesta_sunat
    FROM comprobantes c
    WHERE c.id_comprobante = ?
    AND c.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      cd.id_comprobante_detalle,
      cd.id_comprobante,
      cd.id_variante,
      cd.descripcion,
      cd.cantidad,
      cd.precio_unitario,
      cd.descuento,
      cd.valor_venta,
      cd.igv,
      cd.total
    FROM comprobante_detalle cd
    WHERE cd.id_comprobante = ?
    AND cd.estado_visible = 1
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

async function findComprobanteByVenta(id_venta) {
  const sql = `
    SELECT id_comprobante
    FROM comprobantes
    WHERE id_venta = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_venta]);
  return rows[0];
}

async function findVentaCompleta(id_venta) {
  const ventaSql = `
    SELECT
      v.id_venta,
      v.id_cliente,
      v.subtotal,
      v.igv,
      v.descuento_total,
      v.total,
      v.estado_venta,
      c.tipo_documento,
      c.numero_documento,
      c.nombres,
      c.apellidos,
      c.razon_social
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    WHERE v.id_venta = ?
    AND v.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      dv.id_detalle_venta,
      dv.id_variante,
      p.nombre_producto,
      co.nombre_color,
      ta.nombre_talla,
      pv.sku,
      dv.cantidad,
      dv.precio_unitario,
      dv.descuento,
      dv.subtotal
    FROM detalle_ventas dv
    INNER JOIN producto_variantes pv ON dv.id_variante = pv.id_variante
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN colores co ON pv.id_color = co.id_color
    INNER JOIN tallas ta ON pv.id_talla = ta.id_talla
    WHERE dv.id_venta = ?
    AND dv.estado_visible = 1
  `;

  const [ventaRows] = await pool.query(ventaSql, [id_venta]);

  if (ventaRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_venta]);

  return {
    ...ventaRows[0],
    detalles: detalleRows
  };
}

async function findSerieDisponible(tipo_comprobante) {
  const sql = `
    SELECT
      s.id_serie,
      s.id_empresa,
      e.ruc,
      s.tipo_comprobante,
      s.serie,
      s.correlativo_actual
    FROM series_comprobantes s
    INNER JOIN empresa e ON s.id_empresa = e.id_empresa
    WHERE s.tipo_comprobante = ?
    AND s.estado_visible = 1
    AND e.estado_visible = 1
    ORDER BY s.id_serie ASC
    LIMIT 1
    FOR UPDATE
  `;

  const [rows] = await pool.query(sql, [tipo_comprobante]);
  return rows[0];
}

async function crearComprobanteDesdeVenta(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [serieRows] = await connection.query(
      `
      SELECT
        s.id_serie,
        s.id_empresa,
        e.ruc,
        s.tipo_comprobante,
        s.serie,
        s.correlativo_actual
      FROM series_comprobantes s
      INNER JOIN empresa e ON s.id_empresa = e.id_empresa
      WHERE s.tipo_comprobante = ?
      AND s.estado_visible = 1
      AND e.estado_visible = 1
      ORDER BY s.id_serie ASC
      LIMIT 1
      FOR UPDATE
      `,
      [data.tipo_comprobante]
    );

    if (serieRows.length === 0) {
      const error = new Error("No existe serie configurada para este tipo de comprobante");
      error.status = 400;
      throw error;
    }

    const serie = serieRows[0];
    const nuevoCorrelativo = Number(serie.correlativo_actual) + 1;

    const nombreBase = `${serie.ruc}-${data.tipo_comprobante}-${serie.serie}-${nuevoCorrelativo}`;
    const nombreXml = `${nombreBase}.XML`;
    const nombreZip = `${nombreBase}.ZIP`;

    const [comprobanteResult] = await connection.query(
      `
      INSERT INTO comprobantes
      (
        id_venta,
        id_serie,
        tipo_comprobante,
        serie,
        correlativo,
        moneda,
        subtotal,
        igv,
        descuento_total,
        total,
        estado_sunat,
        nombre_xml,
        nombre_zip,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, 'PEN', ?, ?, ?, ?, 'pendiente_envio', ?, ?, 1)
      `,
      [
        data.id_venta,
        serie.id_serie,
        data.tipo_comprobante,
        serie.serie,
        nuevoCorrelativo,
        data.subtotal,
        data.igv,
        data.descuento_total,
        data.total,
        nombreXml,
        nombreZip
      ]
    );

    const idComprobante = comprobanteResult.insertId;

    for (const item of data.detalles) {
      const cantidad = Number(item.cantidad);
      const precioUnitario = Number(item.precio_unitario);
      const descuento = Number(item.descuento || 0);

      const totalLinea = Number(((cantidad * precioUnitario) - descuento).toFixed(2));

      /*
        Para esta etapa mantenemos una separación simple:
        valor_venta = total_linea / 1.18
        igv_linea = total_linea - valor_venta

        Esto sirve si tu precio_unitario ya incluye IGV.
      */
      const valorVenta = Number((totalLinea / 1.18).toFixed(2));
      const igvLinea = Number((totalLinea - valorVenta).toFixed(2));

      const descripcion = `${item.nombre_producto} ${item.nombre_color} ${item.nombre_talla}`;

      await connection.query(
        `
        INSERT INTO comprobante_detalle
        (
          id_comprobante,
          id_variante,
          descripcion,
          cantidad,
          precio_unitario,
          descuento,
          valor_venta,
          igv,
          total,
          estado_visible
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        `,
        [
          idComprobante,
          item.id_variante,
          descripcion,
          cantidad,
          precioUnitario,
          descuento,
          valorVenta,
          igvLinea,
          totalLinea
        ]
      );
    }

    await connection.query(
      `
      UPDATE series_comprobantes
      SET correlativo_actual = ?
      WHERE id_serie = ?
      `,
      [nuevoCorrelativo, serie.id_serie]
    );

    await connection.commit();

    return idComprobante;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

module.exports = {
  findAllComprobantes,
  findComprobanteById,
  findComprobanteByVenta,
  findVentaCompleta,
  findSerieDisponible,
  crearComprobanteDesdeVenta
};