const pool = require("../../config/db");

async function findUserByUsername(usuario) {
  const sql = `
    SELECT 
      u.id_usuario,
      u.id_rol,
      u.nombres,
      u.apellidos,
      u.usuario,
      u.password_hash,
      u.correo,
      u.telefono,
      u.estado_usuario,
      r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.usuario = ?
    AND u.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [usuario]);
  return rows[0];
}

async function findAllUsers() {
  const sql = `
    SELECT 
      u.id_usuario,
      u.id_rol,
      u.nombres,
      u.apellidos,
      u.usuario,
      u.correo,
      u.telefono,
      u.estado_usuario,
      r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.estado_visible = 1
    ORDER BY u.id_usuario DESC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function findUserById(id_usuario) {
  const sql = `
    SELECT 
      u.id_usuario,
      u.id_rol,
      u.nombres,
      u.apellidos,
      u.usuario,
      u.correo,
      u.telefono,
      u.estado_usuario,
      r.nombre_rol
    FROM usuarios u
    INNER JOIN roles r ON u.id_rol = r.id_rol
    WHERE u.id_usuario = ?
    AND u.estado_visible = 1
    LIMIT 1
  `;

  const [rows] = await pool.query(sql, [id_usuario]);
  return rows[0];
}

async function createUser(data) {
  const sql = `
    INSERT INTO usuarios
    (
      id_rol,
      nombres,
      apellidos,
      usuario,
      password_hash,
      correo,
      telefono,
      estado_usuario,
      estado_visible
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1)
  `;

  const [result] = await pool.query(sql, [
    data.id_rol,
    data.nombres,
    data.apellidos,
    data.usuario,
    data.password_hash,
    data.correo,
    data.telefono,
    data.estado_usuario || "activo"
  ]);

  return result.insertId;
}

async function updateUser(id_usuario, data) {
  const sql = `
    UPDATE usuarios
    SET
      id_rol = ?,
      nombres = ?,
      apellidos = ?,
      usuario = ?,
      correo = ?,
      telefono = ?,
      estado_usuario = ?
    WHERE id_usuario = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_rol,
    data.nombres,
    data.apellidos,
    data.usuario,
    data.correo,
    data.telefono,
    data.estado_usuario,
    id_usuario
  ]);

  return result.affectedRows;
}

async function updateUserWithPassword(id_usuario, data) {
  const sql = `
    UPDATE usuarios
    SET
      id_rol = ?,
      nombres = ?,
      apellidos = ?,
      usuario = ?,
      password_hash = ?,
      correo = ?,
      telefono = ?,
      estado_usuario = ?
    WHERE id_usuario = ?
    AND estado_visible = 1
  `;

  const [result] = await pool.query(sql, [
    data.id_rol,
    data.nombres,
    data.apellidos,
    data.usuario,
    data.password_hash,
    data.correo,
    data.telefono,
    data.estado_usuario,
    id_usuario
  ]);

  return result.affectedRows;
}

async function deleteUserLogical(id_usuario) {
  const sql = `
    UPDATE usuarios
    SET estado_visible = 0
    WHERE id_usuario = ?
  `;

  const [result] = await pool.query(sql, [id_usuario]);
  return result.affectedRows;
}

module.exports = {
  findUserByUsername,
  findAllUsers,
  findUserById,
  createUser,
  updateUser,
  updateUserWithPassword,
  deleteUserLogical
};