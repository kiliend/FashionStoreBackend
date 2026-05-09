const bcrypt = require("bcrypt");
const usuariosRepository = require("./usuarios.repository");

async function listarUsuarios() {
  return await usuariosRepository.findAllUsers();
}

async function obtenerUsuarioPorId(id_usuario) {
  const usuario = await usuariosRepository.findUserById(id_usuario);

  if (!usuario) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  return usuario;
}

async function crearUsuario(data) {
  const usuarioExistente = await usuariosRepository.findUserByUsername(data.usuario);

  if (usuarioExistente) {
    const error = new Error("El nombre de usuario ya existe");
    error.status = 409;
    throw error;
  }

  const password_hash = await bcrypt.hash(data.password, 10);

  const nuevoUsuario = {
    id_rol: data.id_rol,
    nombres: data.nombres,
    apellidos: data.apellidos || null,
    usuario: data.usuario,
    password_hash,
    correo: data.correo || null,
    telefono: data.telefono || null,
    estado_usuario: data.estado_usuario || "activo"
  };

  const id_usuario = await usuariosRepository.createUser(nuevoUsuario);

  return await usuariosRepository.findUserById(id_usuario);
}

async function actualizarUsuario(id_usuario, data) {
  const usuarioActual = await usuariosRepository.findUserById(id_usuario);

  if (!usuarioActual) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  const usuarioConMismoNombre = await usuariosRepository.findUserByUsername(data.usuario);

  if (
    usuarioConMismoNombre &&
    usuarioConMismoNombre.id_usuario !== Number(id_usuario)
  ) {
    const error = new Error("El nombre de usuario ya está en uso");
    error.status = 409;
    throw error;
  }

  let affectedRows;

  if (data.password && data.password.trim() !== "") {
    const password_hash = await bcrypt.hash(data.password, 10);

    affectedRows = await usuariosRepository.updateUserWithPassword(id_usuario, {
      id_rol: data.id_rol,
      nombres: data.nombres,
      apellidos: data.apellidos || null,
      usuario: data.usuario,
      password_hash,
      correo: data.correo || null,
      telefono: data.telefono || null,
      estado_usuario: data.estado_usuario
    });
  } else {
    affectedRows = await usuariosRepository.updateUser(id_usuario, {
      id_rol: data.id_rol,
      nombres: data.nombres,
      apellidos: data.apellidos || null,
      usuario: data.usuario,
      correo: data.correo || null,
      telefono: data.telefono || null,
      estado_usuario: data.estado_usuario
    });
  }

  if (affectedRows === 0) {
    const error = new Error("No se pudo actualizar el usuario");
    error.status = 400;
    throw error;
  }

  return await usuariosRepository.findUserById(id_usuario);
}

async function eliminarUsuario(id_usuario) {
  const usuario = await usuariosRepository.findUserById(id_usuario);

  if (!usuario) {
    const error = new Error("Usuario no encontrado");
    error.status = 404;
    throw error;
  }

  const affectedRows = await usuariosRepository.deleteUserLogical(id_usuario);

  if (affectedRows === 0) {
    const error = new Error("No se pudo eliminar el usuario");
    error.status = 400;
    throw error;
  }

  return {
    id_usuario,
    estado_visible: 0
  };
}

module.exports = {
  listarUsuarios,
  obtenerUsuarioPorId,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};