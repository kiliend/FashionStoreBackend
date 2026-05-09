const pool = require("../../config/db");

async function findAllTareas() {
  const sql = `
    SELECT
      t.id_tarea,
      t.id_usuario,
      u.usuario,
      t.modulo,
      t.referencia_tipo,
      t.referencia_id,
      t.accion,
      t.descripcion,
      t.fecha_inicio,
      t.fecha_fin,
      t.estado_tarea,
      t.observacion
    FROM tareas_operativas t
    INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
    WHERE t.estado_visible = 1
    ORDER BY t.id_tarea DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findTareaById(id_tarea) {
  const sql = `
    SELECT
      t.id_tarea,
      t.id_usuario,
      u.usuario,
      t.modulo,
      t.referencia_tipo,
      t.referencia_id,
      t.accion,
      t.descripcion,
      t.fecha_inicio,
      t.fecha_fin,
      t.estado_tarea,
      t.observacion
    FROM tareas_operativas t
    INNER JOIN usuarios u ON t.id_usuario = u.id_usuario
    WHERE t.id_tarea = ?
    AND t.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_tarea]);
  return rows[0];
}

async function usuarioExists(id_usuario) {
  const sql = `
    SELECT id_usuario
    FROM usuarios
    WHERE id_usuario = ?
    AND estado_visible = 1
    AND estado_usuario = 'activo'
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows.length > 0;
}

async function createTarea(data) {
  const sql = `
    INSERT INTO tareas_operativas
    (
      id_usuario,
      modulo,
      referencia_tipo,
      referencia_id,
      accion,
      descripcion,
      estado_tarea,
      observacion,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, 'pendiente', ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_usuario,
    data.modulo,
    data.referencia_tipo,
    data.referencia_id,
    data.accion,
    data.descripcion,
    data.observacion
  ]);

  return result.insertId;
}

async function updateEstadoTarea(id_tarea, data) {
  const sql = `
    UPDATE tareas_operativas
    SET
      estado_tarea = ?,
      observacion = ?,
      fecha_fin = CASE
        WHEN ? IN ('finalizada', 'cancelada') THEN NOW()
        ELSE fecha_fin
      END
    WHERE id_tarea = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.estado_tarea,
    data.observacion || null,
    data.estado_tarea,
    id_tarea
  ]);

  return result.affectedRows;
}

async function deleteTareaLogical(id_tarea) {
  const sql = `
    UPDATE tareas_operativas
    SET estado_visible = 0
    WHERE id_tarea = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_tarea]);
  return result.affectedRows;
}

module.exports = {
  findAllTareas,
  findTareaById,
  usuarioExists,
  createTarea,
  updateEstadoTarea,
  deleteTareaLogical
};