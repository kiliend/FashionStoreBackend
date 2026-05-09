const pool = require("../../config/db");

async function findAllMensajes() {
  const sql = `
    SELECT
      id_mensaje,
      nombre,
      correo,
      mensaje,
      fecha_mensaje,
      estado_mensaje
    FROM mensajes_contacto
    WHERE estado_visible = 1
    ORDER BY id_mensaje DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findMensajeById(id_mensaje) {
  const sql = `
    SELECT
      id_mensaje,
      nombre,
      correo,
      mensaje,
      fecha_mensaje,
      estado_mensaje
    FROM mensajes_contacto
    WHERE id_mensaje = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_mensaje]);
  return rows[0];
}

async function createMensaje(data) {
  const sql = `
    INSERT INTO mensajes_contacto
    (
      nombre,
      correo,
      mensaje,
      estado_mensaje,
      estado_visible
    )
    VALUES (?, ?, ?, 'nuevo', 1)
  `;

  const [result] = await pool.query(sql, [
    data.nombre,
    data.correo,
    data.mensaje
  ]);

  return result.insertId;
}

async function updateEstadoMensaje(id_mensaje, estado_mensaje) {
  const sql = `
    UPDATE mensajes_contacto
    SET estado_mensaje = ?
    WHERE id_mensaje = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [estado_mensaje, id_mensaje]);
  return result.affectedRows;
}

async function deleteMensajeLogical(id_mensaje) {
  const sql = `
    UPDATE mensajes_contacto
    SET estado_visible = 0
    WHERE id_mensaje = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_mensaje]);
  return result.affectedRows;
}

module.exports = {
  findAllMensajes,
  findMensajeById,
  createMensaje,
  updateEstadoMensaje,
  deleteMensajeLogical
};