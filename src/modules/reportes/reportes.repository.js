const pool = require("../../config/db");

async function getReporteVentas(fecha_inicio, fecha_fin) {
  const sql = `
    SELECT
      v.id_venta,
      v.fecha_venta,
      v.origen_venta,
      v.metodo_pago,
      v.subtotal,
      v.igv,
      v.descuento_total,
      v.total,
      v.estado_venta,
      c.nombres,
      c.apellidos,
      c.razon_social,
      u.usuario AS vendedor
    FROM ventas v
    LEFT JOIN clientes c ON v.id_cliente = c.id_cliente
    LEFT JOIN usuarios u ON v.id_vendedor = u.id_usuario
    WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
    AND v.estado_visible = 1
    ORDER BY v.fecha_venta DESC
  `;

  const [rows] = await pool.query(sql, [fecha_inicio, fecha_fin]);
  return rows;
}

async function getReporteInventario() {
  const sql = `
    SELECT
      pv.id_variante,
      p.nombre_producto,
      cat.nombre_categoria,
      c.nombre_color,
      t.nombre_talla,
      pv.sku,
      pv.stock_actual,
      pv.stock_minimo,
      pv.estado_variante,
      CASE
        WHEN pv.stock_actual <= pv.stock_minimo THEN 'stock_bajo'
        ELSE 'stock_correcto'
      END AS alerta_stock
    FROM producto_variantes pv
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN categorias cat ON p.id_categoria = cat.id_categoria
    INNER JOIN colores c ON pv.id_color = c.id_color
    INNER JOIN tallas t ON pv.id_talla = t.id_talla
    WHERE pv.estado_visible = 1
    ORDER BY p.nombre_producto ASC
  `;

  const [rows] = await pool.query(sql);
  return rows;
}

async function getReporteCompras(fecha_inicio, fecha_fin) {
  const sql = `
    SELECT
      oc.id_orden_compra,
      oc.fecha_orden,
      p.razon_social,
      p.ruc,
      oc.total,
      oc.estado_orden,
      oc.estado_factura,
      oc.fecha_pago,
      ur.usuario AS usuario_registro,
      up.usuario AS usuario_pago
    FROM ordenes_compra oc
    INNER JOIN proveedores p ON oc.id_proveedor = p.id_proveedor
    LEFT JOIN usuarios ur ON oc.id_usuario_registro = ur.id_usuario
    LEFT JOIN usuarios up ON oc.id_usuario_pago = up.id_usuario
    WHERE DATE(oc.fecha_orden) BETWEEN ? AND ?
    AND oc.estado_visible = 1
    ORDER BY oc.fecha_orden DESC
  `;

  const [rows] = await pool.query(sql, [fecha_inicio, fecha_fin]);
  return rows;
}

async function getReporteProductosMasVendidos(fecha_inicio, fecha_fin) {
  const sql = `
    SELECT
      p.id_producto,
      p.nombre_producto,
      cat.nombre_categoria,
      SUM(dv.cantidad) AS cantidad_vendida,
      SUM(dv.subtotal) AS total_vendido
    FROM detalle_ventas dv
    INNER JOIN ventas v ON dv.id_venta = v.id_venta
    INNER JOIN producto_variantes pv ON dv.id_variante = pv.id_variante
    INNER JOIN productos p ON pv.id_producto = p.id_producto
    INNER JOIN categorias cat ON p.id_categoria = cat.id_categoria
    WHERE DATE(v.fecha_venta) BETWEEN ? AND ?
    AND v.estado_venta = 'completada'
    AND v.estado_visible = 1
    AND dv.estado_visible = 1
    GROUP BY p.id_producto, p.nombre_producto, cat.nombre_categoria
    ORDER BY cantidad_vendida DESC
  `;

  const [rows] = await pool.query(sql, [fecha_inicio, fecha_fin]);
  return rows;
}

module.exports = {
  getReporteVentas,
  getReporteInventario,
  getReporteCompras,
  getReporteProductosMasVendidos
};