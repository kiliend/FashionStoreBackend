const pool = require("../../config/db");

async function getResumenGeneral() {
  const [ventasHoy] = await pool.query(`
    SELECT 
      COUNT(*) AS cantidad_ventas_hoy,
      COALESCE(SUM(total), 0) AS total_ventas_hoy
    FROM ventas
    WHERE DATE(fecha_venta) = CURDATE()
    AND estado_venta = 'completada'
    AND estado_visible = 1
  `);

  const [ventasTotal] = await pool.query(`
    SELECT 
      COUNT(*) AS cantidad_ventas_total,
      COALESCE(SUM(total), 0) AS total_ventas_general
    FROM ventas
    WHERE estado_venta = 'completada'
    AND estado_visible = 1
  `);

  const [pedidosPendientes] = await pool.query(`
    SELECT COUNT(*) AS pedidos_pendientes
    FROM pedidos
    WHERE estado_pedido IN ('pendiente', 'validado_almacen', 'en_preparacion', 'preparado')
    AND estado_visible = 1
  `);

  const [stockBajo] = await pool.query(`
    SELECT COUNT(*) AS productos_stock_bajo
    FROM producto_variantes
    WHERE stock_actual <= stock_minimo
    AND estado_visible = 1
    AND estado_variante = 'activo'
  `);

  const [comprasPendientes] = await pool.query(`
    SELECT COUNT(*) AS compras_pendientes_pago
    FROM ordenes_compra
    WHERE estado_factura = 'pendiente'
    AND estado_visible = 1
  `);

  const [clientesActivos] = await pool.query(`
    SELECT COUNT(*) AS clientes_activos
    FROM clientes
    WHERE estado_cliente = 'activo'
    AND estado_visible = 1
  `);

  return {
    ventas_hoy: ventasHoy[0],
    ventas_general: ventasTotal[0],
    pedidos_pendientes: pedidosPendientes[0].pedidos_pendientes,
    productos_stock_bajo: stockBajo[0].productos_stock_bajo,
    compras_pendientes_pago: comprasPendientes[0].compras_pendientes_pago,
    clientes_activos: clientesActivos[0].clientes_activos
  };
}

async function getProductosMasVendidos() {
  const sql = `
    SELECT
      p.id_producto,
      p.nombre_producto,
      SUM(dv.cantidad) AS cantidad_vendida,
      SUM(dv.subtotal) AS total_vendido
    FROM detalle_ventas dv
    INNER JOIN ventas v ON dv.id_venta = v.id_venta
    INNER JOIN producto_variantes pv ON dv.id_variante = pv.id_variante
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    WHERE v.estado_venta = 'completada'
    AND v.estado_visible = 1
    AND dv.estado_visible = 1
    GROUP BY p.id_producto, p.nombre_producto
    ORDER BY cantidad_vendida DESC
    LIMIT 10
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getVentasPorMes() {
  const sql = `
    SELECT
      DATE_FORMAT(fecha_venta, '%Y-%m') AS periodo,
      COUNT(*) AS cantidad_ventas,
      COALESCE(SUM(total), 0) AS total_ventas
    FROM ventas
    WHERE estado_venta = 'completada'
    AND estado_visible = 1
    GROUP BY DATE_FORMAT(fecha_venta, '%Y-%m')
    ORDER BY periodo DESC
    LIMIT 12
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getAlertasStock() {
  const sql = `
    SELECT
      pv.id_variante,
      p.nombre_producto,
      c.nombre_color,
      t.nombre_talla,
      pv.sku,
      pv.stock_actual,
      pv.stock_minimo
    FROM producto_variantes pv
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN colores c ON pv.id_color = c.id_color
    INNER JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE pv.stock_actual <= pv.stock_minimo
    AND pv.estado_visible = 1
    AND pv.estado_variante = 'activo'
    ORDER BY pv.stock_actual ASC
    LIMIT 10
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getPedidosRecientes() {
  const sql = `
    SELECT
      p.id_pedido,
      p.id_venta,
      p.estado_pedido,
      p.tipo_entrega,
      p.fecha_pedido,
      c.nombres,
      c.apellidos,
      c.razon_social
    FROM pedidos p
    LEFT JOIN clientes c ON p.id_cliente = c.id_cliente
    WHERE p.estado_visible = 1
    ORDER BY p.id_pedido DESC
    LIMIT 10
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

module.exports = {
  getResumenGeneral,
  getProductosMasVendidos,
  getVentasPorMes,
  getAlertasStock,
  getPedidosRecientes
};