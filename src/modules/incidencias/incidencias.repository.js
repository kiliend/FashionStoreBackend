const pool = require("../../config/db");

async function findAllIncidencias() {
  const sql = `
    SELECT
      i.id_incidencia,
      i.id_cliente,
      CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
      c.razon_social,
      i.id_venta,
      i.id_usuario_registro,
      ur.usuario AS usuario_registro,
      i.id_usuario_resolucion,
      us.usuario AS usuario_resolucion,
      i.tipo_incidencia,
      i.motivo,
      i.descripcion,
      i.fecha_registro,
      i.estado_incidencia
    FROM incidencias_cliente i
    INNER JOIN clientes c ON i.id_cliente = c.id_cliente
    INNER JOIN ventas v ON i.id_venta = v.id_venta
    LEFT JOIN usuarios ur ON i.id_usuario_registro = ur.id_usuario
    LEFT JOIN usuarios us ON i.id_usuario_resolucion = us.id_usuario
    WHERE i.estado_visible = 1
    ORDER BY i.id_incidencia DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findIncidenciaById(id_incidencia) {
  const incidenciaSql = `
    SELECT
      i.id_incidencia,
      i.id_cliente,
      CONCAT(c.nombres, ' ', c.apellidos) AS cliente_nombre,
      c.razon_social,
      i.id_venta,
      i.id_usuario_registro,
      ur.usuario AS usuario_registro,
      i.id_usuario_resolucion,
      us.usuario AS usuario_resolucion,
      i.tipo_incidencia,
      i.motivo,
      i.descripcion,
      i.fecha_registro,
      i.estado_incidencia
    FROM incidencias_cliente i
    INNER JOIN clientes c ON i.id_cliente = c.id_cliente
    INNER JOIN ventas v ON i.id_venta = v.id_venta
    LEFT JOIN usuarios ur ON i.id_usuario_registro = ur.id_usuario
    LEFT JOIN usuarios us ON i.id_usuario_resolucion = us.id_usuario
    WHERE i.id_incidencia = ?
    AND i.estado_visible = 1
    LIMIT 1
  `;

  const detalleSql = `
    SELECT
      id_incidencia_detalle,
      id_incidencia,
      id_detalle_venta,
      cantidad_afectada,
      accion_solicitada,
      estado_producto_recibido,
      observacion
    FROM incidencia_detalle
    WHERE id_incidencia = ?
    AND estado_visible = 1
  `;

  const [incidenciaRows] = await pool.query(incidenciaSql, [id_incidencia]);

  if (incidenciaRows.length === 0) {
    return null;
  }

  const [detalleRows] = await pool.query(detalleSql, [id_incidencia]);

  return {
    ...incidenciaRows[0],
    detalles: detalleRows
  };
}

async function ventaExists(id_venta) {
  const sql = `
    SELECT id_venta, id_cliente, estado_venta
    FROM ventas
    WHERE id_venta = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_venta]);
  return rows[0];
}

async function detalleVentaExists(id_detalle_venta, id_venta) {
  const sql = `
    SELECT
      id_detalle_venta,
      id_venta,
      cantidad
    FROM detalle_ventas
    WHERE id_detalle_venta = ?
    AND id_venta = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_detalle_venta, id_venta]);
  return rows[0];
}

async function crearIncidencia(data) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [incidenciaResult] = await connection.query(
      `
      INSERT INTO incidencias_cliente
      (
        id_cliente,
        id_venta,
        id_usuario_registro,
        tipo_incidencia,
        motivo,
        descripcion,
        estado_incidencia,
        estado_visible
      )
      VALUES (?, ?, ?, ?, ?, ?, 'registrada', 1)
      `,
      [
        data.id_cliente,
        data.id_venta,
        data.id_usuario_registro || null,
        data.tipo_incidencia,
        data.motivo || null,
        data.descripcion || null
      ]
    );

    const idIncidencia = incidenciaResult.insertId;

    for (const item of data.detalles) {
      await connection.query(
        `
        INSERT INTO incidencia_detalle
        (
          id_incidencia,
          id_detalle_venta,
          cantidad_afectada,
          accion_solicitada,
          estado_producto_recibido,
          observacion,
          estado_visible
        )
        VALUES (?, ?, ?, ?, ?, ?, 1)
        `,
        [
          idIncidencia,
          item.id_detalle_venta,
          item.cantidad_afectada,
          item.accion_solicitada,
          item.estado_producto_recibido || null,
          item.observacion || null
        ]
      );
    }

    await connection.commit();
    return idIncidencia;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function actualizarEstadoIncidencia(id_incidencia, data) {
  const sql = `
    UPDATE incidencias_cliente
    SET
      estado_incidencia = ?,
      id_usuario_resolucion = ?
    WHERE id_incidencia = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.estado_incidencia,
    data.id_usuario_resolucion || null,
    id_incidencia
  ]);

  return result.affectedRows;
}

module.exports = {
  findAllIncidencias,
  findIncidenciaById,
  ventaExists,
  detalleVentaExists,
  crearIncidencia,
  actualizarEstadoIncidencia
};