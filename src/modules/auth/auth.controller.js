const authService = require("./auth.service");

async function login(req, res, next) {
  try {
    const { usuario, password } = req.body;

    if (!usuario || !password) {
      return res.status(400).json({
        ok: false,
        message: "Usuario y contraseña son obligatorios"
      });
    }

    const data = await authService.login(usuario, password);

    res.json({
      ok: true,
      message: "Inicio de sesión correcto",
      data
    });
  } catch (error) {
    next(error);
  }
}

async function profile(req, res) {
  res.json({
    ok: true,
    message: "Perfil obtenido correctamente",
    data: req.user
  });
}

module.exports = {
  login,
  profile
};