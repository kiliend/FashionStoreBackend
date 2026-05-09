const pool = require("../../config/db");

async function findAllDevoluciones() {
  const sql = `
    SELECT
      d.id_devolucion,
      d.id_incidencia,
      d.id_usuario_aprobacion,
      ua.usuario AS usuario_aprobacion,
      d.id_usuario_proceso,
      up.usuario AS usuario_proceso,
      d.fecha_devolucion,
      d.monto_devolucion,
      d.metodo_devolucion,
      d.estado_devolucion
    FROM devoluciones d
    LEFT JOIN usuarios ua ON d.id_usuario_aprobacion = ua.id_usuario
    LEFT JOIN usuarios up ON d.id_usuario_proceso = up.id_usuario
    WHERE d.estado_visible = 1
    ORDER BY d.id_devolucion DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findDevolucionById(id_devolucion) {
  const sql = `
    SELECT
      d.id_devolucion,
      d.id_incidencia,
      d.id_usuario_aprobacion,
      ua.usuario AS usuario_aprobacion,
      d.id_usuario_proceso,
      up.usuario AS usuario_proceso,
      d.fecha_devolucion,
      d.monto_devolucion,
      d.metodo_devolucion,
      d.estado_devolucion
    FROM devoluciones d
    LEFT JOIN usuarios ua ON d.id_usuario_aprobacion = ua.id_usuario
    LEFT JOIN usuarios up ON d.id_usuario_proceso = up.id_usuario
    WHERE d.id_devolucion = ?
    AND d.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_devolucion]);
  return rows[0];
}

async function incidenciaExists(id_incidencia) {
  const sql = `
    SELECT id_incidencia, estado_incidencia
    FROM incidencias_cliente
    WHERE id_incidencia = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_incidencia]);
  return rows[0];
}

async function devolucionExistsByIncidencia(id_incidencia) {
  const sql = `
    SELECT id_devolucion
    FROM devoluciones
    WHERE id_incidencia = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_incidencia]);
  return rows[0];
}

async function createDevolucion(data) {
  const sql = `
    INSERT INTO devoluciones
    (
      id_incidencia,
      id_usuario_aprobacion,
      id_usuario_proceso,
      monto_devolucion,
      metodo_devolucion,
      estado_devolucion,
      estado_visible
    )
    VALUES (?, ?, NULL, ?, ?, 'pendiente', 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_incidencia,
    data.id_usuario_aprobacion || null,
    data.monto_devolucion,
    data.metodo_devolucion
  ]);

  return result.insertId;
}

async function procesarDevolucion(id_devolucion, data) {
  const sql = `
    UPDATE devoluciones
    SET
      estado_devolucion = 'procesada',
      id_usuario_proceso = ?
    WHERE id_devolucion = ?
    AND estado_visible = 1
    AND estado_devolucion = 'pendiente'
  `;

  const [result] = await pool.query(sql, [
    data.id_usuario_proceso || null,
    id_devolucion
  ]);

  return result.affectedRows;
}

async function rechazarDevolucion(id_devolucion, data) {
  const sql = `
    UPDATE devoluciones
    SET
      estado_devolucion = 'rechazada',
      id_usuario_proceso = ?
    WHERE id_devolucion = ?
    AND estado_visible = 1
    AND estado_devolucion = 'pendiente'
  `;

  const [result] = await pool.query(sql, [
    data.id_usuario_proceso || null,
    id_devolucion
  ]);

  return result.affectedRows;
}

module.exports = {
  findAllDevoluciones,
  findDevolucionById,
  incidenciaExists,
  devolucionExistsByIncidencia,
  createDevolucion,
  procesarDevolucion,
  rechazarDevolucion
};