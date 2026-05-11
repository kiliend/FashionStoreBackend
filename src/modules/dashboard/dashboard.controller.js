const dashboardService = require("./dashboard.service");

async function obtenerDashboard(req, res, next) {
  try {
    const data = await dashboardService.obtenerDashboard();

    res.json({
      ok: true,
      message: "Dashboard obtenido correctamente",
      data
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  obtenerDashboard
};