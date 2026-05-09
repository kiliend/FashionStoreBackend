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

  const payload = {
    id_usuario: user.id_usuario,
    usuario: user.usuario,
    rol: user.nombre_rol
  };

  const token = jwt.sign(
    payload,
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES || "2h"
    }
  );

  return {
    token,
    usuario: {
      id_usuario: user.id_usuario,
      nombres: user.nombres,
      apellidos: user.apellidos,
      usuario: user.usuario,
      correo: user.correo,
      telefono: user.telefono,
      rol: user.nombre_rol
    }
  };
}

module.exports = {
  login
};