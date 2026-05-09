const usuariosService = require("./usuarios.service");

async function listarUsuarios(req, res, next) {
  try {
    const usuarios = await usuariosService.listarUsuarios();

    res.json({
      ok: true,
      message: "Usuarios obtenidos correctamente",
      data: usuarios
    });
  } catch (error) {
    next(error);
  }
}

async function obtenerUsuario(req, res, next) {
  try {
    const { id } = req.params;

    const usuario = await usuariosService.obtenerUsuarioPorId(id);

    res.json({
      ok: true,
      message: "Usuario obtenido correctamente",
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function crearUsuario(req, res, next) {
  try {
    const usuario = await usuariosService.crearUsuario(req.body);

    res.status(201).json({
      ok: true,
      message: "Usuario creado correctamente",
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function actualizarUsuario(req, res, next) {
  try {
    const { id } = req.params;

    const usuario = await usuariosService.actualizarUsuario(id, req.body);

    res.json({
      ok: true,
      message: "Usuario actualizado correctamente",
      data: usuario
    });
  } catch (error) {
    next(error);
  }
}

async function eliminarUsuario(req, res, next) {
  try {
    const { id } = req.params;

    const resultado = await usuariosService.eliminarUsuario(id);

    res.json({
      ok: true,
      message: "Usuario eliminado lógicamente correctamente",
      data: resultado
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  listarUsuarios,
  obtenerUsuario,
  crearUsuario,
  actualizarUsuario,
  eliminarUsuario
};