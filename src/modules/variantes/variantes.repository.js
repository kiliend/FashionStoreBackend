const pool = require("../../config/db");

async function findAllVariantes() {
  const sql = `
    SELECT
      pv.id_variante,
      pv.id_producto,
      p.nombre_producto,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto,
      pv.id_color,
      c.nombre_color,
      c.codigo_hex,
      pv.id_talla,
      t.nombre_talla,
      t.tipo_talla,
      pv.sku,
      pv.stock_actual,
      pv.stock_minimo,
      pv.estado_variante,
      CASE
        WHEN pv.stock_actual <= pv.stock_minimo THEN 'stock_bajo'
        ELSE 'stock_correcto'
      END AS alerta_stock
    FROM producto_variantes pv
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN colores c ON pv.id_color = c.id_color
    LEFT JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE pv.estado_visible = 1
    ORDER BY pv.id_variante DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findVarianteById(id_variante) {
  const sql = `
    SELECT
      pv.id_variante,
      pv.id_producto,
      p.nombre_producto,
      p.precio_venta,
      p.imagen_url,
      p.estado_producto,
      pv.id_color,
      c.nombre_color,
      c.codigo_hex,
      pv.id_talla,
      t.nombre_talla,
      t.tipo_talla,
      pv.sku,
      pv.stock_actual,
      pv.stock_minimo,
      pv.estado_variante,
      CASE
        WHEN pv.stock_actual <= pv.stock_minimo THEN 'stock_bajo'
        ELSE 'stock_correcto'
      END AS alerta_stock
    FROM producto_variantes pv
    LEFT JOIN productos p ON pv.id_producto = p.id_producto
    LEFT JOIN colores c ON pv.id_color = c.id_color
    LEFT JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE pv.id_variante = ?
    AND pv.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_variante]);
  return rows[0];
}

async function findVarianteBySku(sku) {
  const sql = `
    SELECT id_variante, sku
    FROM producto_variantes
    WHERE sku = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [sku]);
  return rows[0];
}

async function createVariante(data) {
  const sql = `
    INSERT INTO producto_variantes
    (
      id_producto,
      id_color,
      id_talla,
      sku,
      stock_actual,
      stock_minimo,
      estado_variante,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_producto,
    data.id_color,
    data.id_talla,
    data.sku,
    data.stock_actual,
    data.stock_minimo,
    data.estado_variante || "activo"
  ]);

  return result.insertId;
}

async function updateVariante(id_variante, data) {
  const sql = `
    UPDATE producto_variantes
    SET
      id_producto = ?,
      id_color = ?,
      id_talla = ?,
      sku = ?,
      stock_actual = ?,
      stock_minimo = ?,
      estado_variante = ?
    WHERE id_variante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_producto,
    data.id_color,
    data.id_talla,
    data.sku,
    data.stock_actual,
    data.stock_minimo,
    data.estado_variante,
    id_variante
  ]);

  return result.affectedRows;
}

async function deleteVarianteLogical(id_variante) {
  const sql = `
    UPDATE producto_variantes
    SET estado_visible = 0
    WHERE id_variante = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_variante]);
  return result.affectedRows;
}

async function productoExists(id_producto) {
  const sql = `
    SELECT id_producto
    FROM productos
    WHERE id_producto = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_producto]);
  return rows.length > 0;
}

async function colorExists(id_color) {
  const sql = `
    SELECT id_color
    FROM colores
    WHERE id_color = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_color]);
  return rows.length > 0;
}

async function tallaExists(id_talla) {
  const sql = `
    SELECT id_talla
    FROM tallas
    WHERE id_talla = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_talla]);
  return rows.length > 0;
}

module.exports = {
  findAllVariantes,
  findVarianteById,
  findVarianteBySku,
  createVariante,
  updateVariante,
  deleteVarianteLogical,
  productoExists,
  colorExists,
  tallaExists
};