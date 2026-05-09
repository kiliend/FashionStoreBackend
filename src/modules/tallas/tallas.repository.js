const pool = require("../../config/db");

async function findAllTallas() {
  const sql = `
    SELECT 
      id_talla,
      nombre_talla,
      tipo_talla
    FROM tallas
    WHERE estado_visible = 1
    ORDER BY id_talla DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findTallaById(id_talla) {
  const sql = `
    SELECT 
      id_talla,
      nombre_talla,
      tipo_talla
    FROM tallas
    WHERE id_talla = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_talla]);
  return rows[0];
}

async function createTalla(data) {
  const sql = `
    INSERT INTO tallas
    (nombre_talla, tipo_talla, estado_visible)
    VALUES (?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.nombre_talla,
    data.tipo_talla
  ]);

  return result.insertId;
}

async function updateTalla(id_talla, data) {
  const sql = `
    UPDATE tallas
    SET 
      nombre_talla = ?,
      tipo_talla = ?
    WHERE id_talla = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.nombre_talla,
    data.tipo_talla,
    id_talla
  ]);

  return result.affectedRows;
}

async function deleteTallaLogical(id_talla) {
  const sql = `
    UPDATE tallas
    SET estado_visible = 0
    WHERE id_talla = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_talla]);
  return result.affectedRows;
}

module.exports = {
  findAllTallas,
  findTallaById,
  createTalla,
  updateTalla,
  deleteTallaLogical
};