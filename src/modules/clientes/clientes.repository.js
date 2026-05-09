const pool = require("../../config/db");

async function findAllClientes() {
  const sql = `
    SELECT
      id_cliente,
      id_usuario,
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      correo,
      telefono,
      direccion,
      estado_cliente
    FROM clientes
    WHERE estado_visible = 1
    ORDER BY id_cliente DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findClienteById(id_cliente) {
  const sql = `
    SELECT
      id_cliente,
      id_usuario,
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      correo,
      telefono,
      direccion,
      estado_cliente
    FROM clientes
    WHERE id_cliente = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_cliente]);
  return rows[0];
}

async function findClienteByDocumento(numero_documento) {
  const sql = `
    SELECT
      id_cliente,
      numero_documento
    FROM clientes
    WHERE numero_documento = ?
    AND estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [numero_documento]);
  return rows[0];
}

async function createCliente(data) {
  const sql = `
    INSERT INTO clientes
    (
      id_usuario,
      tipo_documento,
      numero_documento,
      nombres,
      apellidos,
      razon_social,
      correo,
      telefono,
      direccion,
      estado_cliente,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_usuario,
    data.tipo_documento,
    data.numero_documento,
    data.nombres,
    data.apellidos,
    data.razon_social,
    data.correo,
    data.telefono,
    data.direccion,
    data.estado_cliente || "activo"
  ]);

  return result.insertId;
}

async function updateCliente(id_cliente, data) {
  const sql = `
    UPDATE clientes
    SET
      id_usuario = ?,
      tipo_documento = ?,
      numero_documento = ?,
      nombres = ?,
      apellidos = ?,
      razon_social = ?,
      correo = ?,
      telefono = ?,
      direccion = ?,
      estado_cliente = ?
    WHERE id_cliente = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_usuario,
    data.tipo_documento,
    data.numero_documento,
    data.nombres,
    data.apellidos,
    data.razon_social,
    data.correo,
    data.telefono,
    data.direccion,
    data.estado_cliente,
    id_cliente
  ]);

  return result.affectedRows;
}

async function deleteClienteLogical(id_cliente) {
  const sql = `
    UPDATE clientes
    SET estado_visible = 0
    WHERE id_cliente = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [id_cliente]);
  return result.affectedRows;
}

module.exports = {
  findAllClientes,
  findClienteById,
  findClienteByDocumento,
  createCliente,
  updateCliente,
  deleteClienteLogical
};