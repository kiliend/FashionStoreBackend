const dashboardRepository = require("./dashboard.repository");

async function obtenerDashboard() {
  const [
    resumen,
    productosMasVendidos,
    ventasPorMes,
    alertasStock,
    pedidosRecientes
  ] = await Promise.all([
    dashboardRepository.getResumenGeneral(),
    dashboardRepository.getProductosMasVendidos(),
    dashboardRepository.getVentasPorMes(),
    dashboardRepository.getAlertasStock(),
    dashboardRepository.getPedidosRecientes()
  ]);

  return {
    resumen,
    productos_mas_vendidos: productosMasVendidos,
    ventas_por_mes: ventasPorMes,
    alertas_stock: alertasStock,
    pedidos_recientes: pedidosRecientes
  };
}

module.exports = {
  obtenerDashboard
};