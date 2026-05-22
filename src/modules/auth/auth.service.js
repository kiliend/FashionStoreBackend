const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const usuariosRepository = require("../usuarios/usuarios.repository");

async function login(usuario, password) {
  const user = await usuariosRepository.findUserByUsername(usuario);

  if (!user) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  if (user.estado_usuario !== "activo") {
    const error = new Error("El usuario no está activo");
    error.status = 403;
    throw error;
  }

  const passwordValida = await bcrypt.compare(password, user.password_hash);

  if (!passwordValida) {
    const error = new Error("Contraseña incorrecta");
    error.status = 401;
    throw error;
  }

  const rolUsuario = String(user.nombre_rol || "").trim().toLowerCase();

  const payload = {
    id_usuario: user.id_usuario,
    id_rol: user.id_rol,
    usuario: user.usuario,
    rol: rolUsuario,
    nombre_rol: rolUsuario
  };

  const token = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES || "2h"
  });

  return {
    token,
    usuario: {
      id_usuario: user.id_usuario,
      id_rol: user.id_rol,
      nombres: user.nombres,
      apellidos: user.apellidos,
      usuario: user.usuario,
      correo: user.correo,
      telefono: user.telefono,
      rol: rolUsuario,
      nombre_rol: rolUsuario
    }
  };
}

module.exports = {
  login
};