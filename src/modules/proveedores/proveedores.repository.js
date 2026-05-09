const pool = require("../../config/db");

async function findAllProveedores() {
  const sql = `
    SELECT
      id_proveedor,
      razon_social,
      ruc,
      telefono,
      correo,
      direccion,
      estado_proveedor
    FROM proveedores
    WHERE estado_visible = 1
    ORDER BY id_proveedor DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findProveedorById(id_proveedor) {
  const sql = `
    SELECT
      id_proveedor,
      razon_social,
      ruc,
      telefono,
      correo,
      direccion,
      estado_proveedor
    FROM proveedores
    WHERE id_proveedor = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_proveedor]);
  return rows[0];
}

async function findProveedorByRuc(ruc) {
  const sql = `
    SELECT id_proveedor, ruc
    FROM proveedores
    WHERE ruc = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [ruc]);
  return rows[0];
}

async function createProveedor(data) {
  const sql = `
    INSERT INTO proveedores
    (
      razon_social,
      ruc,
      telefono,
      correo,
      direccion,
      estado_proveedor,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.razon_social,
    data.ruc,
    data.telefono,
    data.correo,
    data.direccion,
    data.estado_proveedor || "activo"
  ]);

  return result.insertId;
}

async function updateProveedor(id_proveedor, data) {
  const sql = `
    UPDATE proveedores
    SET
      razon_social = ?,
      ruc = ?,
      telefono = ?,
      correo = ?,
      direccion = ?,
      estado_proveedor = ?
    WHERE id_proveedor = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.razon_social,
    data.ruc,
    data.telefono,
    data.correo,
    data.direccion,
    data.estado_proveedor,
    id_proveedor
  ]);

  return result.affectedRows;
}

async function deleteProveedorLogical(id_proveedor) {
  const sql = `
    UPDATE proveedores
    SET estado_visible = 0
    WHERE id_proveedor = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_proveedor]);
  return result.affectedRows;
}

module.exports = {
  findAllProveedores,
  findProveedorById,
  findProveedorByRuc,
  createProveedor,
  updateProveedor,
  deleteProveedorLogical
};