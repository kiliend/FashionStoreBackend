const pool = require("../../config/db");

async function findAllCategorias() {
  const sql = `
    SELECT 
      id_categoria,
      nombre_categoria,
      descripcion
    FROM categorias
    WHERE estado_visible = 1
    ORDER BY id_categoria DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findCategoriaById(id_categoria) {
  const sql = `
    SELECT 
      id_categoria,
      nombre_categoria,
      descripcion
    FROM categorias
    WHERE id_categoria = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_categoria]);
  return rows[0];
}

async function createCategoria(data) {
  const sql = `
    INSERT INTO categorias
    (nombre_categoria, descripcion, estado_visible)
    VALUES (?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.nombre_categoria,
    data.descripcion || null
  ]);

  return result.insertId;
}

async function updateCategoria(id_categoria, data) {
  const sql = `
    UPDATE categorias
    SET 
      nombre_categoria = ?,
      descripcion = ?
    WHERE id_categoria = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.nombre_categoria,
    data.descripcion || null,
    id_categoria
  ]);

  return result.affectedRows;
}

async function deleteCategoriaLogical(id_categoria) {
  const sql = `
    UPDATE categorias
    SET estado_visible = 0
    WHERE id_categoria = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_categoria]);
  return result.affectedRows;
}

module.exports = {
  findAllCategorias,
  findCategoriaById,
  createCategoria,
  updateCategoria,
  deleteCategoriaLogical
};