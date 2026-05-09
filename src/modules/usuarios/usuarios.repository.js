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

module.exports = {
  findUserByUsername
};