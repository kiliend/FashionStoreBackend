const pool = require("../../config/db");

async function findAllProductos() {
  const sql = `
    SELECT
      p.id_producto,
      p.id_categoria,
      c.nombre_categoria,
      p.nombre_producto,
      p.descripcion,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.estado_visible = 1
    ORDER BY p.id_producto DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findProductoById(id_producto) {
  const sql = `
    SELECT
      p.id_producto,
      p.id_categoria,
      c.nombre_categoria,
      p.nombre_producto,
      p.descripcion,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto
    FROM productos p
    INNER JOIN categorias c ON p.id_categoria = c.id_categoria
    WHERE p.id_producto = ?
    AND p.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_producto]);
  return rows[0];
}

async function createProducto(data) {
  const sql = `
    INSERT INTO productos
    (
      id_categoria,
      nombre_producto,
      descripcion,
      precio_venta,
      imagen_url,
      estado_producto,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_categoria,
    data.nombre_producto,
    data.descripcion || null,
    data.precio_venta,
    data.imagen_url || null,
    data.estado_producto || "activo"
  ]);

  return result.insertId;
}

async function updateProducto(id_producto, data) {
  const sql = `
    UPDATE productos
    SET
      id_categoria = ?,
      nombre_producto = ?,
      descripcion = ?,
      precio_venta = ?,
      imagen_url = ?,
      estado_producto = ?
    WHERE id_producto = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_categoria,
    data.nombre_producto,
    data.descripcion || null,
    data.precio_venta,
    data.imagen_url || null,
    data.estado_producto,
    id_producto
  ]);

  return result.affectedRows;
}

async function deleteProductoLogical(id_producto) {
  const sql = `
    UPDATE productos
    SET estado_visible = 0
    WHERE id_producto = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_producto]);
  return result.affectedRows;
}

async function categoriaExists(id_categoria) {
  const sql = `
    SELECT id_categoria
    FROM categorias
    WHERE id_categoria = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_categoria]);
  return rows.length > 0;
}

module.exports = {
  findAllProductos,
  findProductoById,
  createProducto,
  updateProducto,
  deleteProductoLogical,
  categoriaExists
};