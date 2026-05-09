const pool = require("../../config/db");

async function findAllColores() {
  const sql = `
    SELECT 
      id_color,
      nombre_color,
      codigo_hex
    FROM colores
    WHERE estado_visible = 1
    ORDER BY id_color DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findColorById(id_color) {
  const sql = `
    SELECT 
      id_color,
      nombre_color,
      codigo_hex
    FROM colores
    WHERE id_color = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_color]);
  return rows[0];
}

async function createColor(data) {
  const sql = `
    INSERT INTO colores
    (nombre_color, codigo_hex, estado_visible)
    VALUES (?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.nombre_color,
    data.codigo_hex || null
  ]);

  return result.insertId;
}

async function updateColor(id_color, data) {
  const sql = `
    UPDATE colores
    SET 
      nombre_color = ?,
      codigo_hex = ?
    WHERE id_color = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.nombre_color,
    data.codigo_hex || null,
    id_color
  ]);

  return result.affectedRows;
}

async function deleteColorLogical(id_color) {
  const sql = `
    UPDATE colores
    SET estado_visible = 0
    WHERE id_color = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_color]);
  return result.affectedRows;
}

module.exports = {
  findAllColores,
  findColorById,
  createColor,
  updateColor,
  deleteColorLogical
};